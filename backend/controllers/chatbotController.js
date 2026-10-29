// controllers/chatbotController.js
const axios = require("axios");
const RiskScore = require("../models/RiskScore");
const History = require("../models/History");
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

function localAssistantReply(message, latestRisk, recentActivity) {
  const lower = message.toLowerCase();
  if (lower.includes("simulation") || lower.includes("simulated incident")) {
    return {
      reply:
        "This simulation shows how CyberShield detects staged attack behavior, assigns severity, and recommends containment. Review the stages in order, confirm the key signal, then apply the recommended actions such as blocking the source, terminating suspicious sessions, enabling MFA, and reviewing audit logs.",
    };
  }

  if (lower.includes("risk")) {
    return {
      reply: latestRisk
        ? `Your latest risk score is ${latestRisk.score} with ${latestRisk.riskLevel} risk. Focus first on: ${(latestRisk.recommendations || []).slice(0, 2).join(" ")}`
        : "No risk score is available yet. Run an assessment to generate your CyberShield risk profile.",
    };
  }

  return {
    reply: recentActivity.length
      ? `I found ${recentActivity.length} recent security activities. Start with any High or Critical items, then review related scan results and audit history.`
      : "I can explain simulations, risk scores, phishing results, alerts, incidents, suspicious IPs, and recommended actions.",
  };
}

exports.askAssistant = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: "message is required" });

    const latestRisk = await RiskScore.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    const recentActivity = await History.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(8);
    if (message.toLowerCase().includes("simulation") || message.toLowerCase().includes("simulated incident")) {
      return res.json(localAssistantReply(message, latestRisk, recentActivity));
    }

    const context = latestRisk
      ? {
          riskScore: latestRisk.score,
          riskLevel: latestRisk.riskLevel,
          weakAreas: latestRisk.weakAreas,
          recommendations: latestRisk.recommendations,
          recentActivity: recentActivity.map((item) => ({
            activityType: item.activityType,
            target: item.target,
            result: item.result,
            riskLevel: item.riskLevel,
            createdAt: item.createdAt,
          })),
        }
      : { recentActivity };

    let data;
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/chatbot`, { message, context }, { timeout: 3500 });
      data = response.data;
    } catch {
      data = localAssistantReply(message, latestRisk, recentActivity);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Assistant unavailable", error: err.message });
  }
};
