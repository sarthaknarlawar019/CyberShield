// controllers/assessmentController.js
const Assessment = require("../models/Assessment");
const AssessmentResult = require("../models/AssessmentResult");
const { awardXP, updateStreak, checkAchievements } = require("../utils/gamification");
const defaultAssessments = require("../data/defaultAssessments");
const { ensureDatabase } = require("../utils/database");

async function ensureAssessments() {
  const count = await Assessment.countDocuments();
  if (count === 0) {
    await Assessment.insertMany(defaultAssessments);
  }
}

exports.getAssessments = async (req, res) => {
  if (!ensureDatabase(res)) return;
  await ensureAssessments();
  const assessments = await Assessment.find().select("title description questions.category questions.questionText questions._id");
  res.json(assessments);
};

exports.getAssessmentById = async (req, res) => {
  if (!ensureDatabase(res)) return;
  await ensureAssessments();
  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) return res.status(404).json({ message: "Assessment not found" });

  const sanitized = {
    _id: assessment._id,
    title: assessment.title,
    description: assessment.description,
    questions: assessment.questions.map((q) => ({
      _id: q._id,
      category: q.category,
      questionText: q.questionText,
      options: q.options,
    })),
  };
  res.json(sanitized);
};

exports.submitAssessment = async (req, res) => {
  if (!ensureDatabase(res)) return;
  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) return res.status(404).json({ message: "Assessment not found" });

  const { answers = [], timeTakenSeconds = 0 } = req.body;

  const categoryTally = {};
  let totalCorrect = 0;

  assessment.questions.forEach((q) => {
    const cat = q.category;
    if (!categoryTally[cat]) categoryTally[cat] = { correct: 0, total: 0 };
    categoryTally[cat].total += 1;

    const userAnswer = answers.find((a) => a.questionId === q._id.toString());
    const isCorrect = userAnswer && userAnswer.selectedOptionIndex === q.correctOptionIndex;
    if (isCorrect) {
      categoryTally[cat].correct += 1;
      totalCorrect += 1;
    }
  });

  const categoryScores = Object.entries(categoryTally).map(([category, v]) => ({
    category,
    correct: v.correct,
    total: v.total,
  }));

  const result = await AssessmentResult.create({
    user: req.user.id,
    assessment: assessment._id,
    categoryScores,
    totalCorrect,
    totalQuestions: assessment.questions.length,
    timeTakenSeconds,
  });

  // --- Gamification: XP scales with performance, min 10, max 50 ---
  const percent = Math.round((totalCorrect / assessment.questions.length) * 100);
  const xpEarned = Math.max(10, Math.round((percent / 100) * 50));

  const xpResult = await awardXP(req.user.id, xpEarned);
  const streakResult = await updateStreak(req.user.id);
  const newAchievements = await checkAchievements(req.user.id, { assessmentPercent: percent });

  res.status(201).json({
    message: "Assessment submitted",
    resultId: result._id,
    totalCorrect,
    totalQuestions: assessment.questions.length,
    categoryScores,
    percent,
    xp: xpResult,
    streak: streakResult,
    newAchievements,
  });
};
