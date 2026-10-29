// routes/dailyChallengeRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getTodayChallenge, submitTodayChallenge } = require("../controllers/dailyChallengeController");

router.get("/today", auth, getTodayChallenge);
router.post("/today/submit", auth, submitTodayChallenge);

module.exports = router;