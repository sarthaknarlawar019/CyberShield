const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { getUsers, getUserDetails, updateUser, updateUserRole, updateUserStatus, deleteUser, getAuditLogs } = require("../controllers/userController");

router.use(auth, authorize("ADMIN"));

router.get("/", getUsers);
router.get("/audit-logs", getAuditLogs);
router.get("/:id", getUserDetails);
router.patch("/:id", updateUser);
router.patch("/:id/role", updateUserRole);
router.patch("/:id/status", updateUserStatus);
router.delete("/:id", deleteUser);

module.exports = router;
