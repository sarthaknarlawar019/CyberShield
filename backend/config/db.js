const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn("MongoDB connection skipped: set MONGO_URI in backend/.env.");
    return;
  }

  try {
    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error(
      `MongoDB connection unavailable: ${error.message}. ` +
      "The API will continue running, but database-backed routes will be unavailable."
    );
    return null;
  }
};

module.exports = connectDB;
