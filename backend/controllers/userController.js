const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const RiskScore = require("../models/RiskScore");
const History = require("../models/History");
const mongoose = require("mongoose");

const publicFields = "name email role status lastLogin failedLoginAttempts createdAt updatedAt";

const normalizeUser = (user) => {
  const data = user.toObject ? user.toObject() : user;
  return {
    ...data,
    role: data.role === "admin" ? "ADMIN" : data.role === "learner" ? "USER" : data.role,
    status: data.status || "ACTIVE",
    failedLoginAttempts: data.failedLoginAttempts || 0,
  };
};

const writeAudit = async (req, { action, affectedUser, previousValue = null, newValue = null, details = "" }) => {
  await AuditLog.create({
    actor: req.user.id,
    affectedUser: affectedUser?._id,
    actorName: req.user.name,
    actorEmail: req.user.email,
    affectedUserName: affectedUser?.name || "",
    affectedUserEmail: affectedUser?.email || "",
    email: affectedUser?.email || "",
    action,
    status: "SUCCESS",
    details,
    previousValue,
    newValue,
    ip: req.ip,
    userAgent: req.get("user-agent") || "",
  });

  await History.create({
    user: affectedUser?._id,
    userName: affectedUser?.name || "",
    userEmail: affectedUser?.email || "",
    activityType: "Admin Action",
    target: affectedUser?.email || "",
    result: action,
    riskLevel: "Info",
    metadata: {
      adminName: req.user.name,
      adminEmail: req.user.email,
      previousValue,
      newValue,
      details,
    },
  });
};

const ensureDatabase = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      message: "Database unavailable. Start MongoDB and check backend/.env MONGO_URI.",
    });
    return false;
  }
  return true;
};

exports.getUsers = async (req, res) => {
  if (!ensureDatabase(res)) return;

  const search = req.query.search?.trim();
  const status = req.query.status?.trim();
  const role = req.query.role?.trim();
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 50)));

  const query = { status: { $ne: "DELETED" } };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { role: { $regex: search, $options: "i" } },
      { status: { $regex: search, $options: "i" } },
    ];
  }
  if (["ACTIVE", "INACTIVE", "BLOCKED", "DELETED"].includes(status)) query.status = status;
  if (["USER", "ADMIN"].includes(role)) query.role = role;

  const [items, total] = await Promise.all([
    User.find(query).select(publicFields).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(query),
  ]);

  res.json({ items: items.map(normalizeUser), total, page, pages: Math.ceil(total / limit) || 1 });
};

exports.getUserDetails = async (req, res) => {
  if (!ensureDatabase(res)) return;

  const user = await User.findById(req.params.id).select(publicFields);
  if (!user || user.status === "DELETED") return res.status(404).json({ message: "User not found" });

  const [latestRisk, recentActivity, urlScans, emailScans, alerts] = await Promise.all([
    RiskScore.findOne({ user: user._id }).sort({ createdAt: -1 }),
    History.find({ user: user._id }).sort({ createdAt: -1 }).limit(10),
    History.find({ user: user._id, activityType: "URL Scan" }).sort({ createdAt: -1 }).limit(5),
    History.find({ user: user._id, activityType: "Email Scan" }).sort({ createdAt: -1 }).limit(5),
    History.find({ user: user._id, riskLevel: { $in: ["High", "Critical"] } }).sort({ createdAt: -1 }).limit(5),
  ]);

  res.json({
    user: normalizeUser(user),
    riskScore: latestRisk,
    recentActivity,
    urlScans,
    emailScans,
    alerts,
  });
};

exports.updateUser = async (req, res) => {
  if (!ensureDatabase(res)) return;

  const current = await User.findById(req.params.id).select(publicFields);
  if (!current || current.status === "DELETED") return res.status(404).json({ message: "User not found" });

  const patch = {};
  if (req.body.name?.trim()) patch.name = req.body.name.trim();
  if (["USER", "ADMIN"].includes(req.body.role)) patch.role = req.body.role;
  if (["ACTIVE", "INACTIVE", "BLOCKED"].includes(req.body.status)) patch.status = req.body.status;

  const updated = await User.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true }).select(publicFields);
  await writeAudit(req, {
    action: "EDIT_USER",
    affectedUser: updated,
    previousValue: normalizeUser(current),
    newValue: normalizeUser(updated),
    details: "Edited user profile",
  });

  res.json(normalizeUser(updated));
};

exports.updateUserRole = async (req, res) => {
  if (!ensureDatabase(res)) return;

  const { role } = req.body;
  if (!["USER", "ADMIN"].includes(role)) {
    return res.status(400).json({ message: "Role must be USER or ADMIN" });
  }

  const current = await User.findById(req.params.id).select(publicFields);
  if (!current || current.status === "DELETED") return res.status(404).json({ message: "User not found" });
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  ).select(publicFields);

  if (!user) return res.status(404).json({ message: "User not found" });
  await writeAudit(req, {
    action: "CHANGE_ROLE",
    affectedUser: user,
    previousValue: { role: current.role },
    newValue: { role },
    details: `Changed role to ${role}`,
  });
  res.json(normalizeUser(user));
};

exports.updateUserStatus = async (req, res) => {
  if (!ensureDatabase(res)) return;

  const { status } = req.body;
  if (!["ACTIVE", "INACTIVE", "BLOCKED"].includes(status)) {
    return res.status(400).json({ message: "Status must be ACTIVE, INACTIVE, or BLOCKED" });
  }

  const current = await User.findById(req.params.id).select(publicFields);
  if (!current) return res.status(404).json({ message: "User not found" });
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  ).select(publicFields);

  await writeAudit(req, {
    action: status === "BLOCKED" ? "BLOCK_USER" : status === "ACTIVE" && current.status === "BLOCKED" ? "UNBLOCK_USER" : status === "ACTIVE" ? "ACTIVATE_USER" : "DEACTIVATE_USER",
    affectedUser: user,
    previousValue: { status: current.status },
    newValue: { status },
    details: `Changed status from ${current.status} to ${status}`,
  });
  res.json(normalizeUser(user));
};

exports.deleteUser = async (req, res) => {
  if (!ensureDatabase(res)) return;

  if (String(req.user.id) === String(req.params.id)) {
    return res.status(400).json({ message: "You cannot delete your own admin account" });
  }

  const user = await User.findById(req.params.id).select(publicFields);
  if (!user) return res.status(404).json({ message: "User not found" });

  await User.updateOne({ _id: user._id }, { status: "DELETED", deletedAt: new Date() }, { runValidators: true });
  await writeAudit(req, {
    action: "DELETE_USER",
    affectedUser: user,
    previousValue: { status: user.status },
    newValue: { status: "DELETED" },
    details: `Soft deleted ${user.email}`,
  });

  res.json({ message: "User deleted", user: normalizeUser(user) });
};

exports.getAuditLogs = async (req, res) => {
  if (!ensureDatabase(res)) return;

  const logs = await AuditLog.find()
    .populate("actor", "name email role")
    .populate("affectedUser", "name email role status")
    .sort({ createdAt: -1 })
    .limit(100);

  res.json(logs);
};
