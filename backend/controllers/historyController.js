const History = require("../models/History");
const mongoose = require("mongoose");

const ensureDatabase = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ message: "Database unavailable. Start MongoDB and check backend/.env MONGO_URI." });
    return false;
  }
  return true;
};

exports.getHistory = async (req, res) => {
  if (!ensureDatabase(res)) return;

  const search = req.query.search?.trim();
  const activityType = req.query.activityType?.trim();
  const riskLevel = req.query.riskLevel?.trim();
  const userId = req.query.user?.trim();
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 12)));

  const query = req.user.role === "ADMIN" ? {} : { user: req.user.id };
  if (activityType) query.activityType = activityType;
  if (riskLevel) query.riskLevel = riskLevel;
  if (req.user.role === "ADMIN" && userId) query.user = userId;
  if (search) {
    query.$or = [
      { userName: { $regex: search, $options: "i" } },
      { userEmail: { $regex: search, $options: "i" } },
      { activityType: { $regex: search, $options: "i" } },
      { target: { $regex: search, $options: "i" } },
      { result: { $regex: search, $options: "i" } },
      { riskLevel: { $regex: search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    History.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    History.countDocuments(query),
  ]);

  res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
};
