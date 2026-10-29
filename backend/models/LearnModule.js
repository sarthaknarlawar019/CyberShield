const mongoose = require("mongoose");

const learnModuleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    content: {
      type: String,
      required: true
    },

    category: {
      type: String,
      required: true
    },

    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.LearnModule ||
  mongoose.model("LearnModule", learnModuleSchema);