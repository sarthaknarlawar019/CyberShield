const mongoose = require("mongoose");

const categoryScoreSchema = new mongoose.Schema(
    {
        category: {
            type: String,
            required: true
        },

        correct: {
            type: Number,
            required: true
        },

        total: {
            type: Number,
            required: true
        }
    },
    { _id: false }
);

const assessmentResultSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        assessment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Assessment",
            required: true
        },

        categoryScores: {
            type: [categoryScoreSchema],
            default: []
        },

        totalCorrect: {
            type: Number,
            default: 0
        },

        totalQuestions: {
            type: Number,
            default: 0
        },

        timeTakenSeconds: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "AssessmentResult",
    assessmentResultSchema
);