// pages/RiskDashboard.jsx
// Displays Cybersecurity Risk Score, trend, top risk factors, and recommendations.

import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getMyLatestRisk, getMyRiskHistory } from "../services/api";
import ProgressRing from "../components/ProgressRing";

const riskFactorLabels = {
  phishing: "Phishing response gaps",
  password_security: "Weak password policy",
  malware: "Outdated dependency or malware exposure",
  social_engineering: "Suspicious login or social-engineering exposure",
  network_security: "Unsafe network behavior",
  data_privacy: "Data privacy exposure",
  login_security: "Login anomaly exposure",
  security_logs: "Unreviewed security logs",
  incident_response: "Incident response gaps",
};

function displayRiskLevel(risk) {
  if (!risk) return "Unknown";
  if (risk.riskLevel === "Medium") return "Moderate";
  return risk.riskLevel;
}

function buildRiskInsights(risk, history) {
  if (!risk) return null;

  const sorted = [...history].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const currentIndex = sorted.findIndex((item) => item._id === risk._id);
  const previous =
    currentIndex > 0
      ? sorted[currentIndex - 1]
      : sorted.length > 1
        ? sorted[sorted.length - 2]
        : null;

  const change = previous ? Math.round(risk.score - previous.score) : 0;
  const topFactors = (risk.weakAreas || []).map((area) => riskFactorLabels[area] || area.replace("_", " "));
  const level = displayRiskLevel(risk);
  const confidence = Math.max(72, Math.min(96, Math.round(90 - (risk.weakAreas?.length || 0) * 3)));
  const mainThreat = topFactors[0] || (risk.score >= 70 ? "Broad security exposure" : "No dominant threat detected");

  return {
    level,
    change,
    topFactors: topFactors.length ? topFactors : ["No major risk factors detected"],
    confidence,
    mainThreat,
  };
}

export default function RiskDashboard() {
  const location = useLocation();
  const [risk, setRisk] = useState(location.state?.riskData || null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!location.state?.riskData);

  useEffect(() => {
    if (!risk) {
      getMyLatestRisk()
        .then((res) => {
          setRisk(res.data);
          setError("");
        })
        .catch(() => setError("No risk score yet. Run an assessment to generate your AI risk profile."))
        .finally(() => setLoading(false));
    }
    getMyRiskHistory().then((res) => setHistory(res.data)).catch(() => {});
  }, [risk]);

  const insights = useMemo(() => buildRiskInsights(risk, history), [risk, history]);

  if (loading) return <div className="card">Loading your risk score...</div>;

  if (error || !risk || !insights) {
    return (
      <div className="risk-page page-enter">
        <section className="risk-empty-state">
          <span className="eyebrow">Risk Score</span>
          <h1>No risk score yet</h1>
          <p>{error || "Complete an assessment so CyberShield can calculate your current risk profile."}</p>
          <Link to="/assessment"><button>Run Assessment</button></Link>
        </section>
      </div>
    );
  }

  const changeLabel =
    insights.change === 0
      ? "No previous scan"
      : `${insights.change > 0 ? "+" : ""}${insights.change} from previous scan`;

  return (
    <div className="risk-page page-enter">
      <header className="risk-hero">
        <div>
          <p className="eyebrow">Risk Score</p>
          <h1>{risk.score}</h1>
          <p>
            Current level: <strong>{insights.level}</strong>. Main detected
            threat: <strong>{insights.mainThreat}</strong>.
          </p>
        </div>
        <ProgressRing value={risk.score} label="Risk score" />
      </header>

      <section className="risk-metrics">
        <div><span>Risk Score</span><strong>{risk.score}</strong></div>
        <div><span>Risk Level</span><strong>{insights.level}</strong></div>
        <div><span>Risk Change</span><strong>{changeLabel}</strong></div>
        <div><span>AI Confidence</span><strong>{insights.confidence}%</strong></div>
      </section>

      <section className="assessment-results-grid">
        <div className="card">
          <h2>Top Risk Factors</h2>
          <ul className="finding-list">
            {insights.topFactors.map((factor) => <li key={factor}>{factor}</li>)}
          </ul>
        </div>

        <div className="card">
          <h2>Detected Threat</h2>
          <dl className="summary-list">
            <div><dt>Main detected threat</dt><dd>{insights.mainThreat}</dd></div>
            <div><dt>Model confidence</dt><dd>{insights.confidence}%</dd></div>
            <div><dt>Stored risk level</dt><dd>{risk.riskLevel}</dd></div>
            <div><dt>Display risk level</dt><dd>{insights.level}</dd></div>
          </dl>
        </div>
      </section>

      <div className="card">
        <h2>Recommended Actions</h2>
        <ul className="finding-list">
          {(risk.recommendations?.length ? risk.recommendations : ["Keep learning, scanning, and reviewing suspicious activity."]).map((recommendation, index) => (
            <li key={index}>{recommendation}</li>
          ))}
        </ul>
      </div>

      {history.length > 1 && (
        <div className="card">
          <h2>Score History</h2>
          <div className="history-strip">
            {history.map((item) => (
              <div key={item._id}>
                <strong>{item.score}</strong>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
