// controllers/learnController.js
const LearningModule = require("../models/LearnModule");
const User = require("../models/User");
const { awardXP, updateStreak, checkAchievements } = require("../utils/gamification");
const defaultLearnModules = require("../data/defaultLearnModules");
const { ensureDatabase } = require("../utils/database");

async function ensureLearnModules() {
  await Promise.all(defaultLearnModules.map((module) => (
    LearningModule.updateOne(
      { title: module.title },
      { $set: module },
      { upsert: true }
    )
  )));
}

exports.getModules = async (req, res) => {
  if (!ensureDatabase(res)) return;
  await ensureLearnModules();
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  const modules = await LearningModule.find(filter).sort({ order: 1, createdAt: 1 });
  res.json(modules);
};

exports.getModuleById = async (req, res) => {
  if (!ensureDatabase(res)) return;
  const module = await LearningModule.findById(req.params.id);
  if (!module) return res.status(404).json({ message: "Module not found" });
  res.json(module);
};

exports.completeModule = async (req, res) => {
  if (!ensureDatabase(res)) return;
  const module = await LearningModule.findById(req.params.id);
  if (!module) return res.status(404).json({ message: "Module not found" });

  const user = await User.findById(req.user.id);
  const alreadyDone = user.completedModules.includes(module._id.toString());

  await User.findByIdAndUpdate(req.user.id, {
    $addToSet: { completedModules: module._id.toString() },
  });

  let xpResult = null;
  let newAchievements = [];
  let streakResult = null;

  // Only award XP/streak/achievements the first time this module is completed
  if (!alreadyDone) {
    xpResult = await awardXP(req.user.id, 25);
    streakResult = await updateStreak(req.user.id);
    newAchievements = await checkAchievements(req.user.id, {
      completedModuleCategory: module.category,
    });
  }

  res.json({
    message: "Module marked as completed",
    xp: xpResult,
    streak: streakResult,
    newAchievements,
  });
};
