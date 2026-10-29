const mongoose = require("mongoose");

const ensureDatabase = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      message: "Database unavailable. Start MongoDB and check backend/.env MONGO_URI.",
    });
    return false;
  }
  return true;
};

module.exports = { ensureDatabase };
