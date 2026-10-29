const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    affectedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    actorName: { type: String, default: "" },
    actorEmail: { type: String, default: "" },
    affectedUserName: { type: String, default: "" },
    affectedUserEmail: { type: String, default: "" },
    email: { type: String, default: "" },
    action: { type: String, required: true },
    status: { type: String, enum: ["SUCCESS", "FAILED"], required: true },
    details: { type: String, default: "" },
    previousValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue: { type: mongoose.Schema.Types.Mixed, default: null },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
