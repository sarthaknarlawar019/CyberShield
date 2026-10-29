const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    password: { type: String, select: false },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
    status: { type: String, enum: ["ACTIVE", "INACTIVE", "BLOCKED", "DELETED"], default: "ACTIVE" },
    deletedAt: { type: Date, default: null },
    lastLogin: { type: Date, default: null },
    failedLoginAttempts: { type: Number, default: 0 },

    completedModules: [{ type: String }],

    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    achievements: [{ type: String }],

    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActivityDate: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
