const express = require("express");
const auth = require("../middleware/auth");
const { getMyProgress } = require("../controllers/progressController");

const router = express.Router();
router.get("/", auth, getMyProgress);
module.exports = router;
