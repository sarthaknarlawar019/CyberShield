// routes/toolkitRoutes.js
const express = require("express");
const router = express.Router();
const optionalAuth = require("../middleware/optionalAuth");
const { checkUrl, checkEmail } = require("../controllers/toolkitController");

router.post("/url-check", optionalAuth, checkUrl);
router.post("/email-check", optionalAuth, checkEmail);

module.exports = router;
