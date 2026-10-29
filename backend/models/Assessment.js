const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true
    },

    questionText: {
        type: String,
        required: true
    },

    options: {
        type: [String],
        required: true
    },

    correctOptionIndex: {
        type: Number,
        required: true
    }
});

const assessmentSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },

        description: {
            type: String,
            required: true
        },

        questions: {
            type: [questionSchema],
            default: []
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Assessment", assessmentSchema);