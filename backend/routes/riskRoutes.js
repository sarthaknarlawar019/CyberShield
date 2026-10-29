const express = require("express");
const router = express.Router();
const axios = require("axios");
const auth = require("../middleware/auth");
const {
    calculateRisk,
    getMyLatestRisk,
    getMyRiskHistory
} = require("../controllers/riskController");
const ML_SERVICE_URL =
    process.env.ML_SERVICE_URL || "http://127.0.0.1:5001";

function localRiskPrediction(payload) {
    const categoryScores = payload.categoryScores || [];
    const totalQuestions = payload.totalQuestions || 1;
    const totalCorrect = payload.totalCorrect || 0;
    const accuracy = totalCorrect / totalQuestions;
    const phishingAccuracy = payload.phishingAccuracy;
    const weakAreas = categoryScores
        .filter((item) => item.total && item.correct / item.total < 0.75)
        .sort((a, b) => (a.correct / a.total) - (b.correct / b.total))
        .map((item) => item.category);

    let score = Math.round((1 - accuracy) * 75);
    if (phishingAccuracy !== null && phishingAccuracy !== undefined) {
        score += Math.round((1 - phishingAccuracy) * 20);
    }
    if (weakAreas.length >= 3) score += 8;
    score = Math.max(5, Math.min(100, score));

    return {
        score,
        riskLevel: score >= 70 ? "High" : score >= 35 ? "Medium" : "Low",
        weakAreas,
        recommendations: weakAreas.length
            ? weakAreas.map((area) => `Review ${area.replace("_", " ")} and apply the recommended safeguards.`)
            : ["No major risk factors detected. Keep monitoring and practicing regularly."],
        source: "local-fallback"
    };
}

router.post("/calculate/:resultId", auth, calculateRisk);
router.get("/me", auth, getMyLatestRisk);
router.get("/me/history", auth, getMyRiskHistory);

router.post("/predict", async (req, res) => {
    try {
        const {
            overall_accuracy,
            avg_time_per_question,
            phishing_sim_accuracy,
            category_accuracy
        } = req.body;

        const categories = [
            "phishing",
            "password_security",
            "malware",
            "social_engineering",
            "network_security",
            "data_privacy"
        ];

        const totalQuestions = 100;
        const overallAccuracy = Number(overall_accuracy || 0);
        const categoryScores = categories.map((category) => {
            const accuracy = Number(category_accuracy?.[category] || overallAccuracy);
            return {
                category,
                correct: Math.round(accuracy * totalQuestions),
                total: totalQuestions
            };
        });

        const payload = {
            categoryScores,
            totalCorrect: Math.round(overallAccuracy * totalQuestions),
            totalQuestions,
            timeTakenSeconds: Number(avg_time_per_question || 30) * totalQuestions,
            phishingAccuracy: phishing_sim_accuracy ?? null
        };

        let data;
        try {
            const response = await axios.post(`${ML_SERVICE_URL}/predict-risk`, payload, { timeout: 3500 });
            data = response.data;
        } catch {
            data = localRiskPrediction(payload);
        }

        res.json(data);

    } catch (error) {
        console.error("Risk prediction error:", error.message);

        res.status(500).json({
            message: "Unable to calculate risk score",
            error: error.message
        });
    }
});

module.exports = router;
