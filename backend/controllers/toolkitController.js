// controllers/toolkitController.js
// The CyberShield Security Toolkit: URL Security Tester + Email Security Analyzer.
// Both are rule-based heuristic checks (no external calls, nothing executed) -
// safe to run against untrusted/malicious-looking input.
const History = require("../models/History");

const SUSPICIOUS_TLDS = ["zip", "top", "xyz", "click", "gq", "tk", "cf", "ml"];
const URL_SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly"];
const BRAND_KEYWORDS = ["paypal", "amazon", "microsoft", "apple", "google", "netflix", "bank", "irs", "facebook", "instagram"];

const mapRiskLevel = (level) => {
  if (level === "High Risk") return "High";
  if (level === "Suspicious") return "Medium";
  if (level === "Likely Safe") return "Low";
  return "Info";
};

const normalizeUrlInput = (value) => {
  const raw = String(value || "").trim();
  const extracted = raw.match(/(?:https?:\/\/|www\.)[^\s<>"']+|[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s<>"']*)?/i)?.[0] || raw;
  return extracted
    .trim()
    .replace(/[),.;\]]+$/g, "")
    .replace(/^\/\//, "https://");
};

const saveHistory = async (req, entry) => {
  if (!req.user) return;
  try {
    await History.create({
      user: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      ...entry,
    });
  } catch (error) {
    console.error("History save failed:", error.message);
  }
};

exports.checkUrl = async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ message: "url is required" });
  }
  const normalizedUrl = normalizeUrlInput(url);

  const reasons = [];
  let riskPoints = 0;

  let parsed;
  try {
    parsed = new URL(/^https?:\/\//i.test(normalizedUrl) ? normalizedUrl : `http://${normalizedUrl}`);
  } catch {
    return res.status(400).json({ message: "Enter a valid URL, for example https://example.com" });
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!hostname.includes(".") && !/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    return res.status(400).json({ message: "Enter a full domain, for example https://example.com" });
  }

  if (/^https:\/\//i.test(normalizedUrl)) {
    reasons.push({ type: "good", text: "HTTPS enabled" });
  } else {
    reasons.push({ type: "warning", text: "Not using HTTPS" });
    riskPoints += 15;
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    reasons.push({ type: "warning", text: "Uses a raw IP address instead of a domain name" });
    riskPoints += 30;
  }

  if (URL_SHORTENERS.some((s) => hostname.includes(s))) {
    reasons.push({ type: "warning", text: "Uses a URL shortening service (destination is hidden)" });
    riskPoints += 20;
  }

  const tld = hostname.split(".").pop();
  if (SUSPICIOUS_TLDS.includes(tld)) {
    reasons.push({ type: "warning", text: `Uses an uncommon/high-risk top-level domain (.${tld})` });
    riskPoints += 15;
  }

  const domainParts = hostname.split(".");
  const baseDomain = domainParts.length >= 2 ? domainParts[domainParts.length - 2] : hostname;
  const mentionedBrand = BRAND_KEYWORDS.find((b) => hostname.includes(b));
  if (mentionedBrand && baseDomain !== mentionedBrand) {
    reasons.push({ type: "warning", text: `Mentions "${mentionedBrand}" but that is not the actual domain - possible impersonation` });
    riskPoints += 35;
  }

  if (domainParts.length > 4) {
    reasons.push({ type: "warning", text: "Unusually complex subdomain structure" });
    riskPoints += 15;
  }

  if (/[0-9]/.test(baseDomain) && BRAND_KEYWORDS.some((b) => levenshteinClose(baseDomain, b))) {
    reasons.push({ type: "warning", text: "Domain closely resembles a known brand with character substitution" });
    riskPoints += 30;
  }

  if (parsed.search.length > 60) {
    reasons.push({ type: "warning", text: "Unusually long query string" });
    riskPoints += 5;
  }

  if (reasons.filter((r) => r.type === "warning").length === 0) {
    reasons.push({ type: "good", text: "No obvious red flags detected" });
  }

  const riskLevel = riskPoints >= 50 ? "High Risk" : riskPoints >= 20 ? "Suspicious" : "Likely Safe";

  const payload = {
    url: normalizedUrl,
    hostname,
    riskLevel,
    riskScore: Math.min(100, riskPoints),
    reasons,
    scanTime: new Date(),
    recommendation: riskPoints >= 50 ? "Do not visit this URL. Block and report it." : riskPoints >= 20 ? "Open only after verifying the source." : "No immediate action required.",
  };

  await saveHistory(req, {
    activityType: "URL Scan",
    target: normalizedUrl,
    result: riskLevel,
    riskLevel: mapRiskLevel(riskLevel),
    metadata: payload,
  });

  res.json(payload);
};

function levenshteinClose(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let differences = 0;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) differences++;
  }
  return differences <= 2 && a !== b;
}

exports.checkEmail = async (req, res) => {
  const { senderName = "", senderEmail = "", subject = "", body = "" } = req.body;
  if (!senderEmail && !subject && !body) {
    return res.status(400).json({ message: "Provide at least senderEmail, subject, or body" });
  }

  const fullText = `${subject} ${body}`.toLowerCase();
  const reasons = [];
  let riskPoints = 0;

  const URGENCY_WORDS = ["urgent", "immediately", "act now", "24 hours", "suspended", "verify now", "final notice", "expire"];
  const CREDENTIAL_WORDS = ["password", "otp", "verification code", "ssn", "social security", "credit card", "bank account", "pin number"];
  const THREAT_WORDS = ["account will be closed", "legal action", "suspended", "unauthorized access", "unusual activity"];

  const foundUrgency = URGENCY_WORDS.filter((w) => fullText.includes(w));
  if (foundUrgency.length > 0) {
    reasons.push({ type: "warning", text: `Uses urgency/pressure language ("${foundUrgency[0]}")` });
    riskPoints += 20;
  }

  const foundCredential = CREDENTIAL_WORDS.filter((w) => fullText.includes(w));
  if (foundCredential.length > 0) {
    reasons.push({ type: "warning", text: `Requests sensitive info ("${foundCredential[0]}")` });
    riskPoints += 30;
  }

  const foundThreat = THREAT_WORDS.filter((w) => fullText.includes(w));
  if (foundThreat.length > 0) {
    reasons.push({ type: "warning", text: "Contains threatening/account-suspension language" });
    riskPoints += 20;
  }

  const emailDomain = senderEmail.split("@")[1]?.toLowerCase() || "";
  const claimedBrand = BRAND_KEYWORDS.find(
    (b) => senderName.toLowerCase().includes(b) || fullText.includes(b)
  );
  if (claimedBrand && emailDomain && !emailDomain.includes(claimedBrand)) {
    reasons.push({ type: "warning", text: `Claims to be from "${claimedBrand}" but sender domain is "${emailDomain}"` });
    riskPoints += 35;
  }

  if (/dear (user|customer|member|sir\/madam)/i.test(body)) {
    reasons.push({ type: "warning", text: "Uses a generic greeting instead of your name" });
    riskPoints += 10;
  }

  const linkMatches = body.match(/https?:\/\/[^\s]+/g) || [];
  if (linkMatches.length > 0) {
    reasons.push({ type: "info", text: `Contains ${linkMatches.length} link(s) - verify destination before clicking` });
  }

  if (reasons.filter((r) => r.type === "warning").length === 0) {
    reasons.push({ type: "good", text: "No obvious phishing indicators detected" });
  }

  const riskLevel = riskPoints >= 50 ? "High Risk" : riskPoints >= 20 ? "Suspicious" : "Likely Safe";

  const payload = {
    riskLevel,
    riskScore: Math.min(100, riskPoints),
    reasons,
    linksFound: linkMatches,
    scanTime: new Date(),
    recommendation: riskPoints >= 50 ? "Do not click links. Report and delete this email." : riskPoints >= 20 ? "Verify the sender through a trusted channel." : "No immediate action required.",
  };

  await saveHistory(req, {
    activityType: "Email Scan",
    target: subject || senderEmail || "Email content",
    result: riskLevel,
    riskLevel: mapRiskLevel(riskLevel),
    metadata: { ...payload, senderName, senderEmail, subject },
  });

  res.json(payload);
};
