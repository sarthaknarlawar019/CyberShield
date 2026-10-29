const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "cybershield-secret"
        );

        const user = await User.findById(decoded.id).select("name email role status");
        if (!user) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        if (user.status !== "ACTIVE") {
            return res.status(403).json({ message: `Account is ${user.status.toLowerCase()}` });
        }

        req.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status
        };

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};
