import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHistory, getMyProfile } from "../services/api";
import HeroAnimation from "../components/HeroAnimation";
import XPBar from "../components/XPBar";
import DailyChallengeCard from "../components/DailyChallengeCard";

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyProfile(), getHistory({ limit: 6 })])
      .then(([profileResponse, historyResponse]) => {
        setProfile(profileResponse.data);
        setHistory(historyResponse.data.items || []);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="dashboard-page page-enter">
        <HeroAnimation />
        <div className="card">Loading dashboard...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="dashboard-page page-enter">
        <HeroAnimation />
        <div className="card">
          <h2>Unable to load dashboard</h2>
          <p>Please log in again or make sure the backend is running.</p>
          <Link to="/login"><button>Go to Login</button></Link>
        </div>
      </div>
    );
  }

  const activeThreats = history.filter((item) => ["High", "Critical"].includes(item.riskLevel));
  const securityScore = profile.riskScore != null ? Math.max(0, 100 - Math.round(profile.riskScore / 2)) : null;
  const recommendedActions = profile.riskScore == null
    ? ["Complete an AI Security Assessment", "Run a URL or email phishing scan", "Review recent security history"]
    : ["Review weak areas from your latest risk score", "Practice phishing simulations", "Follow recommended hardening actions"];

  return (
    <div className="dashboard-page page-enter">
      <HeroAnimation label="LIVE SECURITY PREVIEW" />

      <section className="dashboard-welcome card">
        <div>
          <span className="eyebrow">CyberShield Dashboard</span>
          <h1>Welcome back, {profile.name}</h1>
          <p>Your cybersecurity workspace is ready. Keep learning, scanning, and improving your posture.</p>
        </div>
        <XPBar xp={profile.xp} level={profile.level} levelName={profile.levelName} xpForNextLevel={profile.xpForNextLevel} />
      </section>

      <DailyChallengeCard />

      <section className="dashboard-actions">
        <Link to="/toolkit"><button>Open Security Toolkit</button></Link>
        <Link to="/history"><button className="secondary-button">View History</button></Link>
        <Link to="/assessment"><button className="secondary-button">Run Assessment</button></Link>
      </section>

      <section className="risk-metrics">
        <div><span>Security Score</span><strong>{securityScore ?? "Not scored"}</strong></div>
        <div><span>Risk Score</span><strong>{profile.riskScore ?? "Pending"}</strong></div>
        <div><span>AI Security Assessment</span><strong>{profile.riskLevel || "Pending"}</strong></div>
        <div><span>Active Threats</span><strong>{activeThreats.length}</strong></div>
      </section>

      <section className="assessment-results-grid">
        <div className="assessment-card">
          <span>Recent Alerts</span>
          <ul className="finding-list">
            {activeThreats.slice(0, 4).map((item) => <li key={item._id}>{item.activityType}: {item.result}</li>)}
            {activeThreats.length === 0 && <li>No high-risk alerts right now.</li>}
          </ul>
        </div>
        <div className="assessment-card">
          <span>Recommended Actions</span>
          <ul className="finding-list">{recommendedActions.map((action) => <li key={action}>{action}</li>)}</ul>
        </div>
      </section>
    </div>
  );
}
