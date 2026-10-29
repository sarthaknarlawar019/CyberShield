const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return next();

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "cybershield-secret");
    const user = await User.findById(decoded.id).select("name email role status");
    if (user?.status === "ACTIVE") {
      req.user = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      };
    }
    next();
  } catch {
    next();
  }
};
