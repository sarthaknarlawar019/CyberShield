const mongoose = require("mongoose");

const phishingScenarioSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        correctAnswer: {
            type: String,
            enum: ["phishing", "safe"],
            required: true
        },
        explanation: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "PhishingScenario",
    phishingScenarioSchema
);