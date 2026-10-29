const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    userName: { type: String, default: "Guest" },
    userEmail: { type: String, default: "" },
    activityType: { type: String, required: true },
    target: { type: String, default: "" },
    result: { type: String, default: "" },
    riskLevel: { type: String, enum: ["Low", "Medium", "High", "Critical", "Info"], default: "Info" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("History", historySchema);
