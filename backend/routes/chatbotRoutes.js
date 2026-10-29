const express = require("express");
const router = express.Router();

const chatbotData = require("../chatbot_data");

function findAnswer(message) {
    const text = message.toLowerCase();
    if (text.includes("simulation") || text.includes("simulated incident") || text.includes("brute force login simulation")) {
        return {
            topic: "simulation",
            answer:
                "This simulation demonstrates how CyberShield detects staged attack behavior. Review each stage, identify the key signal, confirm the severity, and follow containment actions such as terminating suspicious sessions, blocking the source IP, enabling MFA, resetting affected credentials, and reviewing audit logs."
        };
    }

    for (const item of chatbotData) {
        for (const keyword of item.keywords) {
            const words = keyword.toLowerCase().split(" ");

            const matches = words.filter(
                (word) =>
                    word.length > 3 &&
                    text.includes(word)
            );

            // Single-word keywords (for example, "malware") are valid too.
            if (matches.length >= Math.min(2, words.length)) {
                return {
                    topic: item.topic,
                    answer: item.response
                };
            }
        }
    }

    return {
            topic: "general",
        answer:
            "I can help with phishing, password security, malware, social engineering, network security, and data privacy. Ask me a cybersecurity question."
    };
}

router.post("/", (req, res) => {
    try {
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                message: "Please provide a question."
            });
        }

        const result = findAnswer(message);

        res.json({
            success: true,
            question: message,
            topic: result.topic,
            reply: result.answer,
            answer: result.answer
        });

    } catch (error) {
        console.error("Chatbot error:", error);

        res.status(500).json({
            success: false,
            message: "Chatbot service failed."
        });
    }
});

module.exports = router;
