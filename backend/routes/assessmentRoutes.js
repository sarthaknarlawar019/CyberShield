// routes/assessmentRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getAssessments,
  getAssessmentById,
  submitAssessment,
} = require("../controllers/assessmentController");

router.get("/", getAssessments);
router.get("/:id", getAssessmentById);
router.post("/:id/submit", auth, submitAssessment);

module.exports = router;