// controllers/phishingController.js
const PhishingScenario = require("../models/PhishingScenario");
const PhishingAttempt = require("../models/PhishingAttempt");
const { awardXP, updateStreak, checkAchievements } = require("../utils/gamification");

exports.getRandomScenario = async (req, res) => {
  const count = await PhishingScenario.countDocuments();
  if (count === 0) return res.status(404).json({ message: "No scenarios available" });

  const random = Math.floor(Math.random() * count);
  const scenario = await PhishingScenario.findOne().skip(random);

  res.json({
    _id: scenario._id,
    subject: scenario.subject,
    senderName: scenario.senderName,
    senderEmail: scenario.senderEmail,
    bodyHtml: scenario.bodyHtml,
    difficulty: scenario.difficulty,
  });
};

exports.respondToScenario = async (req, res) => {
  const scenario = await PhishingScenario.findById(req.params.id);
  if (!scenario) return res.status(404).json({ message: "Scenario not found" });

  const { answer, userAction } = req.body;
  const selectedAnswer = answer || (userAction === "reported" ? "phishing" : "safe");

  const wasCorrect = selectedAnswer === scenario.correctAnswer;

  await PhishingAttempt.create({
    user: req.user.id,
    scenario: scenario._id,
    answer: selectedAnswer,
    correct: wasCorrect,
  });

  let xpResult = null;
  let newAchievements = [];
  let streakResult = null;

  if (wasCorrect) {
    xpResult = await awardXP(req.user.id, 15);
    streakResult = await updateStreak(req.user.id);

    const correctTotal = await PhishingAttempt.countDocuments({
      user: req.user.id,
      correct: true,
    });
    newAchievements = await checkAchievements(req.user.id, { correctPhishingTotal: correctTotal });
  }

  res.json({
    wasCorrect,
    isPhishing: scenario.isPhishing,
    redFlags: scenario.redFlags,
    explanation: scenario.isPhishing
      ? "This was a phishing attempt. Here's what gave it away:"
      : "This was a legitimate message — no action needed.",
    xp: xpResult,
    streak: streakResult,
    newAchievements,
  });
};

exports.getMyPhishingStats = async (req, res) => {
  const attempts = await PhishingAttempt.find({ user: req.user.id });
  const total = attempts.length;
  const correct = attempts.filter((a) => a.correct).length;
  res.json({
    total,
    correct,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : null,
  });
};
