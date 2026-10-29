// routes/learnRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getModules, getModuleById, completeModule } = require("../controllers/learnController");

router.get("/", getModules);
router.get("/:id", getModuleById);
router.post("/:id/complete", auth, completeModule);

module.exports = router;