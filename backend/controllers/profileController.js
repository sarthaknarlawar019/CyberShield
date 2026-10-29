// controllers/profileController.js
const User = require("../models/User");
const { LEVEL_NAMES, xpForNextLevel, ACHIEVEMENTS } = require("../utils/gamification");
const AssessmentResult = require("../models/AssessmentResult");
const PhishingAttempt = require("../models/PhishingAttempt");
const RiskScore = require("../models/RiskScore");
const { ensureDatabase } = require("../utils/database");

// GET /api/profile/me -> full gamified profile for the logged-in user
exports.getMyProfile = async (req, res) => {
  if (!ensureDatabase(res)) return;
  const user = await User.findById(req.user.id).select("-passwordHash");
  if (!user) return res.status(404).json({ message: "User not found" });

  const latestRisk = await RiskScore.findOne({ user: user._id }).sort({ createdAt: -1 });
  const phishingAttempts = await PhishingAttempt.find({ user: user._id });
  const phishingCorrect = phishingAttempts.filter((a) => a.correct).length;

  const unlockedAchievements = user.achievements.map((id) => ({
    id,
    ...ACHIEVEMENTS[id],
  }));

  res.json({
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
    failedLoginAttempts: user.failedLoginAttempts || 0,
    xp: user.xp,
    level: user.level,
    levelName: LEVEL_NAMES[user.level],
    xpForNextLevel: xpForNextLevel(user.level),
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    modulesCompleted: user.completedModules.length,
    phishingAccuracy: phishingAttempts.length > 0 ? Math.round((phishingCorrect / phishingAttempts.length) * 100) : null,
    riskScore: latestRisk?.score ?? null,
    riskLevel: latestRisk?.riskLevel ?? null,
    achievements: unlockedAchievements,
  });
};

// GET /api/profile/leaderboard -> top users by XP (public info only)
exports.getLeaderboard = async (req, res) => {
  if (!ensureDatabase(res)) return;
  const topUsers = await User.find({ status: { $ne: "DELETED" } })
    .select("name xp level achievements")
    .sort({ xp: -1 })
    .limit(20);

  const leaderboard = topUsers.map((u, i) => ({
    rank: i + 1,
    name: u.name,
    level: u.level,
    xp: u.xp,
    achievementCount: u.achievements.length,
  }));

  res.json(leaderboard);
};
