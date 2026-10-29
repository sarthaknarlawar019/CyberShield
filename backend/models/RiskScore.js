const mongoose = require("mongoose");

const riskScoreSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        score: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },

        riskLevel: {
            type: String,
            enum: ["Low", "Medium", "High"],
            required: true
        },

        weakAreas: {
            type: [String],
            default: []
        },

        recommendations: {
            type: [String],
            default: []
        },

        basedOnResultId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AssessmentResult",
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("RiskScore", riskScoreSchema);
