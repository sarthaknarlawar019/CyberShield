// models/DailyChallengeCompletion.js
const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    challengeId: { type: String, required: true },
    correct: { type: Boolean, required: true },
  },
  { timestamps: true }
);

schema.index({ user: 1, date: 1 }, { unique: true }); // one attempt per user per day

module.exports = mongoose.model("DailyChallengeCompletion", schema);