const LearnModule = require("../models/LearnModule");
const User = require("../models/User");
const { ensureDatabase } = require("../utils/database");

exports.getMyProgress = async (req, res) => {
  if (!ensureDatabase(res)) return;
  try {
    const [user, moduleCount] = await Promise.all([
      User.findById(req.user.id).select("xp level currentStreak longestStreak completedModules achievements"),
      LearnModule.countDocuments(),
    ]);
    if (!user) return res.status(404).json({ message: "User not found" });
    const completed = user.completedModules.length;
    res.json({
      xp: user.xp,
      level: user.level,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      completedModules: user.completedModules,
      modulesCompleted: completed,
      totalModules: moduleCount,
      progressPercent: moduleCount ? Math.round((completed / moduleCount) * 100) : 0,
      achievements: user.achievements,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load learning progress" });
  }
};
