import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getScenarios } from "../services/api";

const severityClass = (severity = "") => severity.toLowerCase();

export default function PhishingSimulator() {
  const [scenarios, setScenarios] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [stageIndex, setStageIndex] = useState(-1);
  const [selectedQuiz, setSelectedQuiz] = useState("");
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getScenarios()
      .then(({ data }) => {
        const loaded = data.scenarios || [];
        setScenarios(loaded);
        setActiveId(loaded[0]?.id || null);
      })
      .catch(() => setError("Unable to load the simulation lab. Check that the backend is running."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    const active = scenarios.find((scenario) => scenario.id === activeId);
    if (!active) return undefined;

    setCompleted(false);
    setStageIndex(-1);

    const timers = active.stages.map((_, index) => (
      setTimeout(() => setStageIndex(index), 600 + index * 650)
    ));
    timers.push(setTimeout(() => {
      setRunning(false);
      setCompleted(true);
    }, 600 + active.stages.length * 650));

    return () => timers.forEach(clearTimeout);
  }, [running, activeId, scenarios]);

  const active = scenarios.find((scenario) => scenario.id === activeId);

  const stats = useMemo(() => ({
    scenarios: scenarios.length,
    highSeverity: scenarios.filter((item) => ["HIGH", "CRITICAL"].includes(item.result?.severity)).length,
    averageConfidence: scenarios.length
      ? Math.round(scenarios.reduce((sum, item) => sum + (item.result?.confidence || 0), 0) / scenarios.length)
      : 0,
  }), [scenarios]);

  const chooseScenario = (id) => {
    setActiveId(id);
    setRunning(false);
    setCompleted(false);
    setStageIndex(-1);
    setSelectedQuiz("");
    setQuizSubmitted(false);
  };

  const resetSimulation = () => {
    setRunning(false);
    setCompleted(false);
    setStageIndex(-1);
    setSelectedQuiz("");
    setQuizSubmitted(false);
  };

  const askCopilot = () => {
    const prompt = `Explain this simulated incident and what to fix first:
Simulation: ${active.title}
Threat: ${active.result.threat}
Severity: ${active.result.severity}
Confidence: ${active.result.confidence}%
Target: ${active.target}
Source: ${active.source}
Incident: ${active.incident}
Recommended actions: ${active.actions.join(", ")}`;

    window.dispatchEvent(new CustomEvent("copilot-open", { detail: { prompt } }));
  };

  if (loading) {
    return (
      <div className="simulation-page page-enter">
        <div className="mission-panel">
          <p>Loading attack simulations...</p>
        </div>
      </div>
    );
  }

  if (error || !active) {
    return (
      <div className="simulation-page page-enter">
        <div className="mission-panel">
          <h1>Simulation unavailable</h1>
          <p>{error || "No simulations found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="simulation-page page-enter">
      <header className="mission-hero">
        <div>
          <p className="eyebrow">Security Simulation Lab</p>
          <h1>Run safe attack simulations</h1>
          <p>
            Trigger realistic cybersecurity demos and see how CyberShield detects,
            scores, contains, and explains each incident.
          </p>
        </div>

        <div className="mission-scoreboard">
          <div><strong>{stats.scenarios}</strong><span>simulations</span></div>
          <div><strong>{stats.highSeverity}</strong><span>high risk</span></div>
          <div><strong>{stats.averageConfidence}%</strong><span>avg confidence</span></div>
        </div>
      </header>

      <div className="simulation-layout">
        <aside className="mission-list" aria-label="Simulation scenarios">
          {scenarios.map((scenario) => {
            const isActive = scenario.id === active.id;
            return (
              <button
                key={scenario.id}
                className={`mission-list-item ${isActive ? "active" : ""}`}
                onClick={() => chooseScenario(scenario.id)}
                type="button"
              >
                <span className="mission-type">{scenario.type}</span>
                <strong>{scenario.title}</strong>
                <span>{scenario.difficulty} severity demo</span>
              </button>
            );
          })}
        </aside>

        <main className="mission-panel simulation-lab-panel">
          <div className="mission-meta">
            <span>{active.type}</span>
            <span>{active.difficulty}</span>
            <span>{active.source}</span>
          </div>

          <div className="incident-header">
            <div>
              <h2>{running ? "Simulation Running" : active.title}</h2>
              <p>{active.summary}</p>
            </div>
            <div className="sender-chip">{active.target}</div>
          </div>

          <section className="simulation-stage-card">
            <h3>{active.type}</h3>
            <div className="simulation-stage-list">
              {active.stages.map((stage, index) => {
                const visible = index <= stageIndex || completed;
                return (
                  <div key={stage} className={`simulation-stage ${visible ? "active" : ""}`}>
                    <span>Stage {index + 1}</span>
                    <strong>{stage}</strong>
                  </div>
                );
              })}
            </div>
          </section>

          {!running && !completed && (
            <button className="submit-mission" onClick={() => setRunning(true)}>
              Run Simulation
            </button>
          )}

          {running && <p className="selection-note">CyberShield is analyzing staged activity...</p>}

          {completed && (
            <section className="simulation-result-card">
              <span className={`risk-badge ${severityClass(active.result.severity) === "critical" ? "high" : "suspicious"}`}>
                {active.result.status}
              </span>
              <h3>Result</h3>
              <div className="incident-grid">
                <span>Threat<strong>{active.result.threat}</strong></span>
                <span>Severity<strong>{active.result.severity}</strong></span>
                <span>Confidence<strong>{active.result.confidence}%</strong></span>
                <span>Status<strong>{active.result.status}</strong></span>
              </div>

              <div className="incident-narrative">
                <h4>Incident</h4>
                <p>{active.incident}</p>
                <h4>Recommended Actions</h4>
                <ol>{active.actions.map((action) => <li key={action}>{action}</li>)}</ol>
              </div>

              <div className="simulation-quiz-card">
                <h4>Quick Quiz</h4>
                <p>{active.quiz.question}</p>
                <div className="decision-grid compact-decision-grid">
                  {active.quiz.choices.map((choice) => (
                    <button
                      key={choice.id}
                      type="button"
                      className={`decision-option ${selectedQuiz === choice.id ? "selected" : ""}`}
                      disabled={quizSubmitted}
                      onClick={() => setSelectedQuiz(choice.id)}
                    >
                      <strong>{choice.label}</strong>
                    </button>
                  ))}
                </div>
                {!quizSubmitted ? (
                  <button disabled={!selectedQuiz} onClick={() => setQuizSubmitted(true)}>Submit Quiz</button>
                ) : (
                  <div className={`mission-feedback ${selectedQuiz === active.quiz.correctAnswer ? "success" : "danger"}`}>
                    <h3>{selectedQuiz === active.quiz.correctAnswer ? "Correct response" : "Review this response"}</h3>
                    <p>{active.quiz.explanation}</p>
                  </div>
                )}
              </div>

              <div className="simulation-actions">
                <Link to="/toolkit"><button>View Incident</button></Link>
                <button className="secondary-button" onClick={askCopilot}>Ask Copilot</button>
                <button className="secondary-button" onClick={resetSimulation}>Reset Simulation</button>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
