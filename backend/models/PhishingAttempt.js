const mongoose = require("mongoose");

const phishingAttemptSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        scenario: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PhishingScenario"
        },

        scenarioId: {
            type: Number
        },

        answer: {
            type: String,
            enum: ["phishing", "safe"],
            required: true
        },

        correct: {
            type: Boolean,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "PhishingAttempt",
    phishingAttemptSchema
);
