// utils/gamification.js
// Central gamification logic: XP -> Level curve, streak updates, achievement checks.

const User = require("../models/User");

const LEVEL_THRESHOLDS = [0, 50, 150, 300, 500, 750, 1050, 1400, 1800, 2250, 2750];

const LEVEL_NAMES = {
  1: "Beginner",
  2: "Cyber Explorer",
  3: "Security Learner",
  4: "Cyber Defender",
  5: "Security Specialist",
  6: "Threat Analyst",
  7: "Security Engineer",
  8: "Cyber Guardian",
  9: "Security Architect",
  10: "Cyber Expert",
};

function calculateLevel(xp) {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return Math.min(level, 10);
}

function xpForNextLevel(level) {
  return LEVEL_THRESHOLDS[level] ?? null; // null = max level reached
}

// Achievement definitions: id -> { name, description, check(user, context) }
// `context` carries event-specific info passed in from whichever controller
// triggered the check (e.g. the assessment % just scored, or a module category
// just completed) so achievements can react to the triggering event, not just
// persisted user state.
const ACHIEVEMENTS = {
  first_defender: {
    name: "🛡️ First Defender",
    description: "Complete your first lesson",
    check: (user) => user.completedModules.length >= 1,
  },
  perfect_score: {
    name: "🎯 Perfect Score",
    description: "Score 100% in an assessment",
    check: (user, ctx) => ctx?.assessmentPercent === 100,
  },
  week_warrior: {
    name: "🔥 Week Warrior",
    description: "Maintain a 7-day streak",
    check: (user) => user.currentStreak >= 7,
  },
  phishing_hunter: {
    name: "🎣 Phishing Hunter",
    description: "Correctly identify 10 phishing scenarios",
    check: (user, ctx) => ctx?.correctPhishingTotal >= 10,
  },
  password_guardian: {
    name: "🔐 Password Guardian",
    description: "Complete the Password Security module",
    check: (user, ctx) => ctx?.completedModuleCategory === "password_security",
  },
  cyber_expert: {
    name: "🧠 Cyber Expert",
    description: "Reach Level 10",
    check: (user) => user.level >= 10,
  },
};

async function awardXP(userId, amount) {
  const user = await User.findById(userId);
  if (!user) return null;

  const oldLevel = user.level;
  user.xp += amount;
  user.level = calculateLevel(user.xp);
  await user.save();

  return {
    xpAwarded: amount,
    totalXp: user.xp,
    level: user.level,
    levelName: LEVEL_NAMES[user.level],
    leveledUp: user.level > oldLevel,
    xpForNextLevel: xpForNextLevel(user.level),
  };
}

async function updateStreak(userId) {
  const user = await User.findById(userId);
  if (!user) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!user.lastActivityDate) {
    user.currentStreak = 1;
  } else {
    const last = new Date(user.lastActivityDate);
    last.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today - last) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // already active today, streak unchanged
    } else if (diffDays === 1) {
      user.currentStreak += 1;
    } else {
      user.currentStreak = 1;
    }
  }

  user.longestStreak = Math.max(user.longestStreak, user.currentStreak);
  user.lastActivityDate = today;
  await user.save();

  return {
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
  };
}

// context: { assessmentPercent?, correctPhishingTotal?, completedModuleCategory? }
async function checkAchievements(userId, context = {}) {
  const user = await User.findById(userId);
  if (!user) return [];

  const newlyUnlocked = [];

  for (const [id, def] of Object.entries(ACHIEVEMENTS)) {
    if (user.achievements.includes(id)) continue;

    let earned = false;
    try {
      earned = def.check(user, context);
    } catch {
      earned = false;
    }

    if (earned) {
      user.achievements.push(id);
      newlyUnlocked.push({ id, name: def.name, description: def.description });
    }
  }

  if (newlyUnlocked.length > 0) await user.save();
  return newlyUnlocked;
}

module.exports = {
  LEVEL_THRESHOLDS,
  LEVEL_NAMES,
  ACHIEVEMENTS,
  calculateLevel,
  xpForNextLevel,
  awardXP,
  updateStreak,
  checkAchievements,
};