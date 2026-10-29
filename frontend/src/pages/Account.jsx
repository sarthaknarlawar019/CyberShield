import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMyProfile } from "../services/api";
import XPBar from "../components/XPBar";

const formatDate = (value) => {
  if (!value) return "Not available";
  return new Date(value).toLocaleString();
};

export default function Account() {
  const [profile, setProfile] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyProfile()
      .then(({ data }) => {
        setProfile(data);
        localStorage.setItem("user", JSON.stringify(data));
      })
      .catch(() => setNotice("Showing the details saved for this browser session."))
      .finally(() => setLoading(false));
  }, []);

  const initials = useMemo(() => {
    const name = profile?.name || profile?.email || "CS";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [profile]);

  const securityScore = profile?.riskScore != null ? Math.max(0, 100 - Math.round(profile.riskScore / 2)) : "Pending";
  const riskLabel = profile?.riskLevel || "Not assessed";

  return (
    <div className="account-page page-enter">
      <section className="account-hero">
        <div className="account-identity">
          <div className="account-avatar">{initials || "CS"}</div>
          <div>
            <span className="eyebrow">Account Center</span>
            <h1>{profile?.name || "CyberShield User"}</h1>
            <p>{profile?.email || "Sign in again to refresh account details."}</p>
            <div className="account-badges">
              <span>{profile?.role || "USER"}</span>
              <span className={`status-pill status-${(profile?.status || "ACTIVE").toLowerCase()}`}>
                {profile?.status || "ACTIVE"}
              </span>
            </div>
          </div>
        </div>
        <div className="account-score-card">
          <span>Security Score</span>
          <strong>{securityScore}</strong>
          <small>{riskLabel}</small>
        </div>
      </section>

      {notice && <p className="subtle-note">{notice}</p>}
      {loading && <p className="subtle-note">Refreshing account details...</p>}

      <section className="account-grid">
        <div className="account-panel">
          <div className="account-panel-header">
            <span className="eyebrow">Profile</span>
            <h2>Identity Details</h2>
          </div>
          <dl className="profile-list refined-profile-list">
            <div><dt>Name</dt><dd>{profile?.name || "Not available"}</dd></div>
            <div><dt>Email</dt><dd>{profile?.email || "Not available"}</dd></div>
            <div><dt>Role</dt><dd>{profile?.role || "USER"}</dd></div>
            <div><dt>Status</dt><dd>{profile?.status || "ACTIVE"}</dd></div>
            <div><dt>Member Since</dt><dd>{formatDate(profile?.createdAt)}</dd></div>
            <div><dt>Last Login</dt><dd>{formatDate(profile?.lastLogin)}</dd></div>
          </dl>
        </div>

        <div className="account-panel">
          <div className="account-panel-header">
            <span className="eyebrow">Security</span>
            <h2>Session Health</h2>
          </div>
          <div className="account-stat-grid">
            <div><span>Risk Score</span><strong>{profile?.riskScore ?? "Pending"}</strong></div>
            <div><span>Failed Logins</span><strong>{profile?.failedLoginAttempts || 0}</strong></div>
            <div><span>Phishing Accuracy</span><strong>{profile?.phishingAccuracy != null ? `${profile.phishingAccuracy}%` : "Pending"}</strong></div>
            <div><span>Learning Streak</span><strong>{profile?.currentStreak || 0}</strong></div>
          </div>
        </div>
      </section>

      <section className="account-panel account-progress-panel">
        <div className="account-panel-header">
          <span className="eyebrow">Progress</span>
          <h2>CyberShield Growth</h2>
        </div>
        <XPBar xp={profile?.xp || 0} level={profile?.level || 1} levelName={profile?.levelName || "Analyst"} xpForNextLevel={profile?.xpForNextLevel} />
        <div className="account-quick-actions">
          <Link to="/toolkit"><button>Open Toolkit</button></Link>
          <Link to="/history"><button className="secondary-button">View History</button></Link>
          <Link to="/assessment"><button className="secondary-button">Run Assessment</button></Link>
        </div>
      </section>
    </div>
  );
}
