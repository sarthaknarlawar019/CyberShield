// controllers/riskController.js
// Steps 3-6 of the flow:
//   "ML analyzes performance" -> "Cybersecurity Risk Score"
//   -> "Identify weak areas" -> "Personalized recommendations"
//
// Node doesn't do the ML math itself — it gathers the user's history,
// sends it to the Python ML microservice, and stores/returns what comes back.

const axios = require("axios");
const AssessmentResult = require("../models/AssessmentResult");
const PhishingAttempt = require("../models/PhishingAttempt");
const RiskScore = require("../models/RiskScore");
const History = require("../models/History");
const { ensureDatabase } = require("../utils/database");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

function localRiskPrediction(payload) {
  const categoryScores = payload.categoryScores || [];
  const totalQuestions = payload.totalQuestions || 1;
  const totalCorrect = payload.totalCorrect || 0;
  const accuracy = totalCorrect / totalQuestions;
  const avgTime = totalQuestions ? (payload.timeTakenSeconds || 0) / totalQuestions : 0;
  const phishingAccuracy = payload.phishingAccuracy;

  const weakAreas = categoryScores
    .filter((item) => item.total && item.correct / item.total < 0.75)
    .sort((a, b) => (a.correct / a.total) - (b.correct / b.total))
    .map((item) => item.category);

  let score = Math.round((1 - accuracy) * 70);
  if (phishingAccuracy !== null && phishingAccuracy !== undefined) {
    score += Math.round((1 - phishingAccuracy) * 20);
  }
  if (avgTime < 8 && accuracy < 0.8) score += 8;
  if (weakAreas.length >= 3) score += 8;

  score = Math.max(5, Math.min(100, score));

  const riskLevel = score >= 70 ? "High" : score >= 35 ? "Medium" : "Low";
  const recommendations = [
    weakAreas.includes("phishing") && "Review phishing indicators and scan suspicious URLs before clicking.",
    weakAreas.includes("password_security") && "Use unique passwords and enable multi-factor authentication.",
    weakAreas.includes("malware") && "Avoid untrusted downloads and keep software updated.",
    weakAreas.includes("social_engineering") && "Verify urgent requests through a trusted second channel.",
    weakAreas.includes("network_security") && "Avoid sensitive logins on unknown Wi-Fi and secure your router.",
    weakAreas.includes("data_privacy") && "Review app permissions and reduce public sharing of sensitive information.",
    weakAreas.length === 0 && "Keep practicing weekly and monitor scan history for unusual changes.",
  ].filter(Boolean);

  return {
    score,
    riskLevel,
    weakAreas,
    recommendations,
    source: "local-fallback",
  };
}

// POST /api/risk/calculate/:resultId
// Triggered right after a user submits an assessment.
exports.calculateRisk = async (req, res) => {
  if (!ensureDatabase(res)) return;
  try {
    const result = await AssessmentResult.findById(req.params.resultId);
    if (!result) return res.status(404).json({ message: "Assessment result not found" });
    if (result.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "You cannot calculate risk for another user" });
    }

    // Pull the user's phishing-simulation history too — the model uses it
    // as an extra signal (real-world behavior, not just quiz knowledge).
    const phishingAttempts = await PhishingAttempt.find({ user: result.user });
    const phishingTotal = phishingAttempts.length;
    const phishingCorrect = phishingAttempts.filter((a) => a.correct).length;

    // Build the feature payload the ML model expects.
    const payload = {
      categoryScores: result.categoryScores, // [{category, correct, total}]
      timeTakenSeconds: result.timeTakenSeconds,
      totalQuestions: result.totalQuestions,
      totalCorrect: result.totalCorrect,
      phishingAccuracy: phishingTotal > 0 ? phishingCorrect / phishingTotal : null,
    };

    let data;
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/predict-risk`, payload, { timeout: 3500 });
      data = response.data;
    } catch (error) {
      data = localRiskPrediction(payload);
    }
    // Expected response shape:
    // { score: 72, riskLevel: "Medium", weakAreas: ["phishing","malware"], recommendations: [...] }

    const riskScore = await RiskScore.create({
      user: result.user,
      score: data.score,
      riskLevel: data.riskLevel,
      weakAreas: data.weakAreas,
      recommendations: data.recommendations,
      basedOnResultId: result._id,
    });

    await History.create({
      user: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      activityType: "Risk Score",
      target: "Assessment result",
      result: `${data.riskLevel} risk`,
      riskLevel: data.riskLevel,
      metadata: {
        score: data.score,
        weakAreas: data.weakAreas,
        recommendations: data.recommendations,
        source: data.source || "ml-service",
      },
    });

    res.status(201).json(riskScore);
  } catch (err) {
    res.status(500).json({ message: "Risk calculation failed", error: err.message });
  }
};

// GET /api/risk/me -> latest risk score for the logged-in user
exports.getMyLatestRisk = async (req, res) => {
  if (!ensureDatabase(res)) return;
  const latest = await RiskScore.findOne({ user: req.user.id }).sort({ createdAt: -1 });
  if (!latest) return res.status(404).json({ message: "No risk score yet — take an assessment first" });
  res.json(latest);
};

// GET /api/risk/me/history -> risk score trend over time (for a chart)
exports.getMyRiskHistory = async (req, res) => {
  if (!ensureDatabase(res)) return;
  const history = await RiskScore.find({ user: req.user.id }).sort({ createdAt: 1 });
  res.json(history);
};
