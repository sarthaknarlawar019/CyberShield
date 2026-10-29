const express = require("express");
const router = express.Router();

const scenarios = [
  {
    id: 1,
    type: "Brute Force Attack",
    difficulty: "High",
    title: "Brute Force Login Simulation",
    summary: "Repeated failed logins from one source trigger a high-severity authentication alert.",
    target: "User Login",
    source: "192.0.2.45",
    stages: [
      "Multiple failed logins",
      "Suspicious IP detected",
      "Account risk increased",
      "Security alert generated",
      "Incident created",
    ],
    result: {
      threat: "Brute Force Attack",
      severity: "HIGH",
      confidence: 95,
      status: "Detected & Contained",
    },
    incident:
      "31 failed login attempts from 192.0.2.45 were detected against the login endpoint. CyberShield raised risk and contained the source.",
    actions: ["Block source IP", "Review failed login logs", "Force password reset", "Enable MFA"],
    quiz: {
      question: "What is the best first response?",
      choices: [
        { id: "contain", label: "Block the source IP and review failed-login logs" },
        { id: "ignore", label: "Ignore it because no malware was uploaded" },
        { id: "share", label: "Share the password with support" },
      ],
      correctAnswer: "contain",
      explanation: "Contain the suspicious source first, then review authentication logs and strengthen the account.",
    },
  },
  {
    id: 2,
    type: "Phishing Attack",
    difficulty: "Medium",
    title: "Phishing Attack Simulation",
    summary: "A suspicious URL and email are analyzed for impersonation, urgency, and credential theft indicators.",
    target: "Employee Inbox",
    source: "security@paypal-alerts.xyz",
    stages: [
      "Suspicious message received",
      "URL reputation checked",
      "Credential request detected",
      "Phishing probability calculated",
      "Recommended action generated",
    ],
    result: {
      threat: "Phishing Attack",
      severity: "HIGH",
      confidence: 93,
      status: "Detected & Contained",
    },
    incident:
      "The message used urgency language, a lookalike sender domain, and a suspicious login URL to request credentials.",
    actions: ["Quarantine email", "Block suspicious URL", "Warn affected user", "Report phishing indicators"],
    quiz: {
      question: "Which action should CyberShield recommend?",
      choices: [
        { id: "click", label: "Open the link to confirm the page" },
        { id: "quarantine", label: "Quarantine the email and block the URL" },
        { id: "forward", label: "Forward it to more users for review" },
      ],
      correctAnswer: "quarantine",
      explanation: "Suspicious links and credential requests should be quarantined and blocked, not opened.",
    },
  },
  {
    id: 3,
    type: "Suspicious Login",
    difficulty: "Medium",
    title: "Suspicious Login Simulation",
    summary: "A login from a new device, IP, and location triggers anomaly detection.",
    target: "User Account",
    source: "198.51.100.22",
    stages: [
      "New device fingerprint observed",
      "Unusual IP location detected",
      "Login time compared with normal pattern",
      "Anomaly score increased",
      "User verification recommended",
    ],
    result: {
      threat: "Suspicious Login",
      severity: "MEDIUM",
      confidence: 90,
      status: "Detected & Monitored",
    },
    incident:
      "The account logged in from an unknown device and unfamiliar network compared with previous behavior.",
    actions: ["Request MFA verification", "Notify user", "Review session activity", "Monitor next login"],
    quiz: {
      question: "What confirms this should be treated as anomalous?",
      choices: [
        { id: "password", label: "The password length is unknown" },
        { id: "new-context", label: "The login used a new device and unfamiliar network" },
        { id: "weekday", label: "The login happened on a normal weekday" },
      ],
      correctAnswer: "new-context",
      explanation: "A new device plus unfamiliar network is a strong anomaly signal, especially for account access.",
    },
  },
  {
    id: 4,
    type: "Account Compromise",
    difficulty: "Critical",
    title: "Account Compromise Simulation",
    summary: "Failed logins followed by successful admin dashboard access create a critical incident.",
    target: "Admin Dashboard",
    source: "203.0.113.18",
    stages: [
      "Repeated failed authentication",
      "Successful login after failures",
      "Unknown device detected",
      "Sensitive admin page accessed",
      "Critical incident generated",
    ],
    result: {
      threat: "Possible Account Compromise",
      severity: "CRITICAL",
      confidence: 96,
      status: "Detected & Contained",
    },
    incident:
      "Multiple failed authentication attempts were followed by successful admin dashboard access from an unknown device.",
    actions: ["Terminate suspicious session", "Reset administrator password", "Block source IP", "Review audit logs"],
    quiz: {
      question: "Why is this critical?",
      choices: [
        { id: "admin-after-failures", label: "Failed logins were followed by successful admin access" },
        { id: "known-device", label: "The login came from a known trusted device" },
        { id: "low-volume", label: "Only one failed login happened" },
      ],
      correctAnswer: "admin-after-failures",
      explanation: "Successful admin access after repeated failures suggests possible account compromise and needs immediate containment.",
    },
  },
  {
    id: 5,
    type: "DDoS Traffic Spike",
    difficulty: "High",
    title: "DDoS Traffic Spike Simulation",
    summary: "High request volume from distributed sources triggers traffic anomaly detection.",
    target: "Public API Gateway",
    source: "Multiple IPs",
    stages: [
      "Traffic baseline exceeded",
      "Request frequency spike detected",
      "Multiple source networks identified",
      "Rate limits activated",
      "Availability alert generated",
    ],
    result: {
      threat: "DDoS Traffic Spike",
      severity: "HIGH",
      confidence: 94,
      status: "Detected & Rate Limited",
    },
    incident:
      "The API gateway received abnormal request volume from multiple sources, indicating a possible DDoS traffic spike.",
    actions: ["Enable rate limiting", "Inspect traffic sources", "Block abusive IP ranges", "Scale monitoring thresholds"],
    quiz: {
      question: "Which control helps contain the traffic spike fastest?",
      choices: [
        { id: "rate-limit", label: "Enable rate limiting and inspect traffic sources" },
        { id: "reset-password", label: "Reset every user password" },
        { id: "disable-logs", label: "Disable logs to reduce load" },
      ],
      correctAnswer: "rate-limit",
      explanation: "Rate limiting reduces abusive traffic while teams investigate source patterns and service impact.",
    },
  },
];

router.get("/", (req, res) => {
  res.json({ scenarios });
});

router.get("/:id", (req, res) => {
  const scenario = scenarios.find((item) => item.id === Number(req.params.id));
  if (!scenario) return res.status(404).json({ message: "Scenario not found" });
  res.json(scenario);
});

module.exports = router;
