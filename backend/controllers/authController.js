const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const History = require("../models/History");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const createToken = (user) => jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || "cybershield-secret",
    { expiresIn: "7d" }
);

const isStrongPassword = (password) =>
    typeof password === "string" &&
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

const userPayload = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    lastLogin: user.lastLogin
});

const logAuth = async (req, { actor = null, email = "", action, status, details = "" }) => {
    try {
        await AuditLog.create({
            actor,
            email,
            action,
            status,
            details,
            ip: req.ip,
            userAgent: req.get("user-agent") || ""
        });
    } catch (error) {
        console.error("Audit log failed:", error.message);
    }
};

const ensureDatabase = (res) => {
    if (mongoose.connection.readyState !== 1) {
        res.status(503).json({
            message: "Database unavailable. Start MongoDB and check backend/.env MONGO_URI."
        });
        return false;
    }
    return true;
};

exports.register = async (req, res) => {
    try {
        if (!ensureDatabase(res)) return;

        const { name, email, password } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        if (!name?.trim() || !normalizedEmail || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        if (!isStrongPassword(password)) {
            return res.status(400).json({
                message: "Use at least 8 characters with uppercase, lowercase, number, and symbol."
            });
        }

        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            passwordHash: hashedPassword,
            role: "USER",
            status: "ACTIVE"
        });

        res.status(201).json({
            message: "Registration successful",
            token: createToken(user),
            user: userPayload(user)
        });

    } catch (error) {
        console.error("Register error:", error);

        res.status(500).json({
            message: "Registration failed",
            error: error.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        if (!ensureDatabase(res)) return;

        const { email, password } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        if (!normalizedEmail || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email: normalizedEmail }).select("+password");

        if (!user) {
            await logAuth(req, {
                email: normalizedEmail,
                action: "LOGIN",
                status: "FAILED",
                details: "Unknown email"
            });
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        if (user.status !== "ACTIVE") {
            await logAuth(req, {
                actor: user._id,
                email: user.email,
                action: "LOGIN",
                status: "FAILED",
                details: `Account status ${user.status}`
            });
            return res.status(403).json({
                message: `Account is ${user.status.toLowerCase()}`
            });
        }

        const storedHash = user.passwordHash || user.password;
        const validPassword = storedHash
            ? await bcrypt.compare(password, storedHash)
            : false;

        if (!validPassword) {
            const failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
            const status = failedLoginAttempts >= 10 ? "BLOCKED" : user.status;
            await User.updateOne(
                { _id: user._id },
                { failedLoginAttempts, status },
                { runValidators: true }
            );
            await logAuth(req, {
                actor: user._id,
                email: user.email,
                action: "LOGIN",
                status: "FAILED",
                details: `${failedLoginAttempts} failed attempt(s)`
            });
            return res.status(401).json({
                message: status === "BLOCKED"
                    ? "Account blocked after too many failed login attempts"
                    : "Invalid email or password"
            });
        }

        user.failedLoginAttempts = 0;
        user.lastLogin = new Date();
        if (!user.passwordHash && user.password) {
            user.passwordHash = user.password;
            user.password = undefined;
        }
        if (!["USER", "ADMIN"].includes(user.role)) {
            user.role = user.role === "admin" ? "ADMIN" : "USER";
        }
        if (!["ACTIVE", "INACTIVE", "BLOCKED"].includes(user.status)) {
            user.status = "ACTIVE";
        }
        await user.save();
        await logAuth(req, {
            actor: user._id,
            email: user.email,
            action: "LOGIN",
            status: "SUCCESS",
            details: `${user.role} login`
        });
        await History.create({
            user: user._id,
            userName: user.name,
            userEmail: user.email,
            activityType: "Login",
            target: "CyberShield",
            result: "Login successful",
            riskLevel: "Info",
            metadata: { role: user.role, ip: req.ip }
        });

        const token = createToken(user);

        res.json({
            message: "Login successful",
            token,
            user: userPayload(user),
            redirectTo: user.role === "ADMIN" ? "/admin/dashboard" : "/dashboard"
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
};

exports.getMe = async (req, res) => {
    try {
        if (!ensureDatabase(res)) return;

        const user = await User.findById(req.user.id).select("name email role status lastLogin createdAt");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({
            ...userPayload(user),
            createdAt: user.createdAt
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to load profile" });
    }
};
