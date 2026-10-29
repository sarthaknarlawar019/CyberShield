const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function ensureDefaultAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn("Default admin seed skipped: set ADMIN_EMAIL and ADMIN_PASSWORD.");
    return;
  }

  await User.updateMany({ role: "learner" }, { role: "USER" });
  await User.updateMany({ role: "admin" }, { role: "ADMIN" });
  await User.updateMany({ status: { $exists: false } }, { status: "ACTIVE" });
  await User.updateMany({ failedLoginAttempts: { $exists: false } }, { failedLoginAttempts: 0 });

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ email });

  if (existing) {
    existing.name = existing.name || "CyberShield Admin";
    existing.passwordHash = existing.passwordHash || passwordHash;
    existing.role = "ADMIN";
    existing.status = "ACTIVE";
    await existing.save();
    console.log(`Default admin verified: ${email}`);
    return;
  }

  await User.create({
    name: "CyberShield Admin",
    email,
    passwordHash,
    role: "ADMIN",
    status: "ACTIVE",
  });

  console.log(`Default admin created: ${email}`);
}

module.exports = ensureDefaultAdmin;
