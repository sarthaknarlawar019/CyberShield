// controllers/dailyChallengeController.js
const challenges = require("../data/dailyChallenges");
const DailyChallengeCompletion = require("../models/DailyChallengeCompletion");
const { awardXP, updateStreak, checkAchievements } = require("../utils/gamification");

function getTodayChallenge() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = new Date() - start;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return challenges[dayOfYear % challenges.length];
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

exports.getTodayChallenge = async (req, res) => {
  const challenge = getTodayChallenge();

  const existing = await DailyChallengeCompletion.findOne({
    user: req.user.id,
    date: todayString(),
  });

  res.json({
    id: challenge.id,
    category: challenge.category,
    question: challenge.question,
    options: challenge.options,
    alreadyCompleted: !!existing,
  });
};

exports.submitTodayChallenge = async (req, res) => {
  const challenge = getTodayChallenge();
  const date = todayString();

  const existing = await DailyChallengeCompletion.findOne({ user: req.user.id, date });
  if (existing) {
    return res.status(409).json({ message: "You already completed today's challenge" });
  }

  const { selectedIndex } = req.body;
  const correct = selectedIndex === challenge.correctIndex;

  await DailyChallengeCompletion.create({
    user: req.user.id,
    date,
    challengeId: challenge.id,
    correct,
  });

  let xpResult = null;
  let streakResult = null;
  let newAchievements = [];

  if (correct) {
    xpResult = await awardXP(req.user.id, 25);
    streakResult = await updateStreak(req.user.id);
    newAchievements = await checkAchievements(req.user.id, {});
  }

  res.json({
    correct,
    correctIndex: challenge.correctIndex,
    explanation: challenge.explanation,
    xp: xpResult,
    streak: streakResult,
    newAchievements,
  });
};