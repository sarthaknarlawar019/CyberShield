// routes/profileRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getMyProfile, getLeaderboard } = require("../controllers/profileController");

router.get("/me", auth, getMyProfile);
router.get("/leaderboard", getLeaderboard); // public, no auth needed

module.exports = router;