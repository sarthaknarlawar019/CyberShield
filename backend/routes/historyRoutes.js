const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getHistory } = require("../controllers/historyController");

router.get("/", auth, getHistory);

module.exports = router;
