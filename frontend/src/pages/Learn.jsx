import React, { useEffect, useMemo, useState } from "react";
import { completeModule, getModules, getMyProgress } from "../services/api";
import GameToast from "../components/GameToast";

const categoryLabels = {
  fundamentals: "Fundamentals",
  password_security: "Password Security",
  phishing: "Phishing",
  malware: "Malware",
  social_engineering: "Social Engineering",
  data_privacy: "Data Privacy",
  network_security: "Network Security",
  login_security: "Login Security",
  security_logs: "Security Logs",
  incident_response: "Incident Response",
};

const moduleTakeaways = {
  fundamentals: ["CIA triad", "Security layers", "Common attack paths"],
  password_security: ["Unique passwords", "Password managers", "MFA"],
  phishing: ["Sender checks", "Link inspection", "Credential requests"],
  malware: ["Unsafe downloads", "Updates", "Backups"],
  social_engineering: ["Impersonation", "Pressure tactics", "Second-channel verification"],
  data_privacy: ["Permissions", "Sensitive data", "Safe sharing"],
  network_security: ["Public Wi-Fi", "Router safety", "Trusted VPN"],
  login_security: ["Failed attempts", "New devices", "Impossible travel"],
  security_logs: ["Event fields", "Patterns", "Alert triage"],
  incident_response: ["Containment", "Recovery", "Post-incident review"],
};

const formatCategory = (category) => categoryLabels[category] || category.replace("_", " ");

export default function Learn() {
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [category, setCategory] = useState("all");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [gameResult, setGameResult] = useState(null);

  useEffect(() => {
    getModules()
      .then(({ data }) => setModules(data))
      .catch(() => setNotice("CyberShield backend is currently unavailable."))
      .finally(() => setLoading(false));

    if (localStorage.getItem("token")) {
      getMyProgress().then(({ data }) => setProgress(data)).catch(() => {});
    }
  }, []);

  const categories = useMemo(() => {
    const unique = [...new Set(modules.map((module) => module.category))];
    return unique.sort((a, b) => formatCategory(a).localeCompare(formatCategory(b)));
  }, [modules]);

  const visibleModules = category === "all"
    ? modules
    : modules.filter((module) => module.category === category);

  const complete = async (moduleId) => {
    try {
      const { data } = await completeModule(moduleId);
      setGameResult(data);
      setNotice(data.xp?.xpAwarded ? `Module completed! +${data.xp.xpAwarded} XP` : data.message);
      const progressResponse = await getMyProgress();
      setProgress(progressResponse.data);
    } catch {
      setNotice("Please log in to track learning progress.");
    }
  };

  if (loading) return <div className="learn-loading">Loading cybersecurity modules...</div>;

  return (
    <div className="learn-page page-enter">
      <header className="learn-header">
        <div>
          <span className="learn-label">CyberShield Academy</span>
          <h1>Your learning path</h1>
          <p>Short practical lessons for safer logins, phishing defense, incident handling, and everyday security decisions.</p>
        </div>
        <div className="learn-stat"><strong>{progress?.progressPercent ?? 0}%</strong><span>Overall progress</span></div>
      </header>

      {progress && (
        <section className="learning-progress card">
          <div><strong>Level {progress.level}</strong><span>{progress.xp} XP</span></div>
          <div><strong>{progress.currentStreak} day streak</strong><span>{progress.modulesCompleted}/{progress.totalModules} modules</span></div>
          <div className="module-progress-track"><span style={{ width: `${progress.progressPercent}%` }} /></div>
        </section>
      )}

      <section className="learn-controls">
        <button className={category === "all" ? "" : "secondary-button"} onClick={() => setCategory("all")}>All</button>
        {categories.map((item) => (
          <button
            key={item}
            className={category === item ? "" : "secondary-button"}
            onClick={() => setCategory(item)}
          >
            {formatCategory(item)}
          </button>
        ))}
      </section>

      {notice && <p className="learning-notice">{notice}</p>}

      {!modules.length ? (
        <div className="empty-learning">
          <h2>No modules available</h2>
          <p>Refresh after the backend connects to MongoDB.</p>
        </div>
      ) : (
        <div className="learning-grid">
          {visibleModules.map((module, index) => {
            const open = openId === module._id;
            const completed = progress?.completedModules?.some((id) => String(id) === module._id);
            const takeaways = moduleTakeaways[module.category] || ["Review", "Practice", "Apply"];

            return (
              <article key={module._id} className={`learning-card ${open ? "learning-card-open" : ""} ${completed ? "learning-card-completed" : ""}`}>
                <div className="module-number">{completed ? "Done" : String(index + 1).padStart(2, "0")}</div>
                <div className="module-content">
                  <span className="module-category">{formatCategory(module.category)}</span>
                  <h2>{module.title}</h2>
                  <p className="module-description">{module.description}</p>
                  <div className="lesson-tags">
                    {takeaways.map((takeaway) => <span key={takeaway}>{takeaway}</span>)}
                  </div>
                  <button className="module-toggle" onClick={() => setOpenId(open ? null : module._id)}>
                    {open ? "Hide lesson" : completed ? "Review lesson" : "Start learning"}
                  </button>
                  {open && (
                    <div className="lesson-content">
                      <div className="lesson-divider" />
                      <p>{module.content}</p>
                      <button className="complete-btn" disabled={completed} onClick={() => complete(module._id)}>
                        {completed ? "Completed" : "Mark complete (+25 XP)"}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <GameToast result={gameResult} />
    </div>
  );
}
