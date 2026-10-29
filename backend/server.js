// server.js
// Entry point: wires together DB, middleware, and all route modules.

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const connectDB = require("./config/db");
const ensureDefaultAdmin = require("./utils/ensureDefaultAdmin");

const profileRoutes = require("./routes/profileRoutes");
const toolkitRoutes = require("./routes/toolkitRoutes");
const authRoutes = require("./routes/authRoutes");
const learnRoutes = require("./routes/learnRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const riskRoutes = require("./routes/riskRoutes");
const phishingRoutes = require("./routes/phishingRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const progressRoutes = require("./routes/progressRoutes");
const dailyChallengeRoutes = require("./routes/dailyChallengeRoutes");
const userRoutes = require("./routes/userRoutes");
const historyRoutes = require("./routes/historyRoutes");

const app = express();

app.use(cors());
app.use(express.json());

connectDB().then((connection) => {
  if (connection) {
    ensureDefaultAdmin().catch((error) => {
      console.error("Default admin seed failed:", error.message);
    });
  }
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/profile", profileRoutes);
app.use("/api/toolkit", toolkitRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/learn", learnRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/risk", riskRoutes);
app.use("/api/phishing", phishingRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/daily-challenge", dailyChallengeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/history", historyRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong", error: err.message });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(`CyberShield backend running on port ${PORT}`)
);

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    const healthUrl = `http://127.0.0.1:${PORT}/api/health`;

    http
      .get(healthUrl, (res) => {
        if (res.statusCode === 200) {
          console.log(
            `CyberShield backend is already running on port ${PORT}.`
          );
          process.exit(0);
        }

        console.error(
          `Port ${PORT} is already in use by another process. ` +
          `Stop it or change PORT in backend/.env before starting the backend.`
        );
        process.exit(1);
      })
      .on("error", () => {
        console.error(
          `Port ${PORT} is already in use. ` +
          `Stop the existing process or change PORT in backend/.env before starting the backend.`
        );
        process.exit(1);
      });
    return;
  }

  console.error("Backend failed to start:", error.message);
  process.exit(1);
});
