// pages/Assessment.jsx
// Step 2: Take assessments, summarize findings, then trigger ML risk scoring.

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { calculateRisk, getAssessmentById, getAssessments, submitAssessment } from "../services/api";
import GameToast from "../components/GameToast";

const findingLabels = {
  phishing: "MFA disabled or phishing response gaps",
  password_security: "Weak password policy",
  malware: "Outdated dependency or unsafe download behavior",
  social_engineering: "Suspicious login or identity-verification attempts",
  network_security: "Unsafe network access behavior",
  data_privacy: "Sensitive data exposure risk",
};

function buildAssessmentSummary(result) {
  if (!result) return null;

  const checksCompleted = result.totalQuestions || 0;
  const passedChecks = result.totalCorrect || 0;
  const failedChecks = Math.max(0, checksCompleted - passedChecks);
  const criticalIssues = (result.categoryScores || []).filter((item) => {
    const accuracy = item.total ? item.correct / item.total : 1;
    return accuracy < 0.5;
  }).length;
  const warnings = Math.max(0, failedChecks - criticalIssues);
  const percent = checksCompleted ? Math.round((passedChecks / checksCompleted) * 100) : 0;

  const status =
    criticalIssues > 0 || percent < 50
      ? "Critical"
      : warnings > 0 || percent < 80
        ? "Needs Attention"
        : "Secure";

  const topFindings = (result.categoryScores || [])
    .filter((item) => item.correct < item.total)
    .sort((a, b) => (a.correct / a.total) - (b.correct / b.total))
    .slice(0, 4)
    .map((item) => findingLabels[item.category] || `${item.category.replace("_", " ")} needs review`);

  const recommendedAction =
    status === "Secure"
      ? "Keep practicing simulations weekly and retake the assessment after new modules."
      : status === "Needs Attention"
        ? "Review the highlighted modules, complete one simulation, then rerun the risk score."
        : "Prioritize critical findings now: strengthen authentication, review weak areas, and avoid risky logins.";

  return {
    status,
    checksCompleted,
    passedChecks,
    warnings,
    criticalIssues,
    topFindings: topFindings.length ? topFindings : ["No major findings detected"],
    recommendedAction,
    lastAssessmentTime: new Date().toLocaleString(),
  };
}

export default function Assessment() {
  const [gameResult, setGameResult] = useState(null);
  const [list, setList] = useState([]);
  const [active, setActive] = useState(null);
  const [answers, setAnswers] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [result, setResult] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [calculatingRisk, setCalculatingRisk] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getAssessments()
      .then((res) => setList(res.data))
      .catch(() => setError("Unable to load assessments. Check that the backend is running."))
      .finally(() => setLoadingList(false));
  }, []);

  const summary = useMemo(() => buildAssessmentSummary(result), [result]);

  const start = async (id) => {
    const { data } = await getAssessmentById(id);
    setActive(data);
    setAnswers({});
    setResult(null);
    setRiskData(null);
    setError("");
    setStartTime(Date.now());
  };

  const selectAnswer = (questionId, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const submit = async () => {
    const timeTakenSeconds = Math.round((Date.now() - startTime) / 1000);
    const payload = {
      answers: Object.entries(answers).map(([questionId, selectedOptionIndex]) => ({
        questionId,
        selectedOptionIndex,
      })),
      timeTakenSeconds,
    };

    try {
      const { data: submitData } = await submitAssessment(active._id, payload);
      setResult(submitData);
      setGameResult(submitData);
      setCalculatingRisk(true);

      const { data } = await calculateRisk(submitData.resultId);
      setRiskData(data);
    } catch (err) {
      setError(err.response?.data?.message || "Assessment failed. Make sure backend and ML service are running.");
    } finally {
      setCalculatingRisk(false);
    }
  };

  if (!active) {
    return (
      <div className="assessment-page page-enter">
        <header className="assessment-hero">
          <div>
            <p className="eyebrow">Assessment Center</p>
            <h1>Run a cybersecurity readiness check</h1>
            <p>
              Each assessment reviews your answers, flags weak areas, and feeds
              the ML risk engine.
            </p>
          </div>
          <div className="assessment-preview">
            <strong>Output includes</strong>
            <span>Security status</span>
            <span>Top findings</span>
            <span>Recommended action</span>
          </div>
        </header>

        {error && <p className="form-error">{error}</p>}

        {loadingList && <div className="card">Loading assessments...</div>}

        {!loadingList && !error && list.length === 0 && (
          <div className="card">
            <h2>No assessments available</h2>
            <p>Refresh the page once the backend has connected to MongoDB.</p>
          </div>
        )}

        <div className="assessment-list">
          {list.map((assessment) => (
            <article key={assessment._id} className="assessment-card">
              <span>{assessment.questions?.length || 0} checks</span>
              <h2>{assessment.title}</h2>
              <p>{assessment.description}</p>
              <button onClick={() => start(assessment._id)}>Start assessment</button>
            </article>
          ))}
        </div>
      </div>
    );
  }

  const allAnswered = active.questions.every((q) => answers[q._id] !== undefined);

  if (result && summary) {
    return (
      <div className="assessment-page page-enter">
        <header className="assessment-hero compact">
          <div>
            <p className="eyebrow">Assessment Complete</p>
            <h1>{summary.status}</h1>
            <p>{summary.recommendedAction}</p>
          </div>
          <div className={`security-status ${summary.status.toLowerCase().replace(" ", "-")}`}>
            {summary.status}
          </div>
        </header>

        <section className="assessment-metrics">
          <div><span>Checks Completed</span><strong>{summary.checksCompleted}</strong></div>
          <div><span>Passed Checks</span><strong>{summary.passedChecks}</strong></div>
          <div><span>Warnings</span><strong>{summary.warnings}</strong></div>
          <div><span>Critical Issues</span><strong>{summary.criticalIssues}</strong></div>
        </section>

        <section className="assessment-results-grid">
          <div className="card">
            <h2>Top Findings</h2>
            <ul className="finding-list">
              {summary.topFindings.map((finding) => <li key={finding}>{finding}</li>)}
            </ul>
          </div>

          <div className="card">
            <h2>Assessment Details</h2>
            <dl className="summary-list">
              <div><dt>Overall Security Status</dt><dd>{summary.status}</dd></div>
              <div><dt>Last Assessment Time</dt><dd>{summary.lastAssessmentTime}</dd></div>
              <div><dt>Recommended Action</dt><dd>{summary.recommendedAction}</dd></div>
              <div><dt>Risk Score</dt><dd>{riskData ? riskData.score : calculatingRisk ? "Calculating..." : "Unavailable"}</dd></div>
            </dl>
          </div>
        </section>

        <div className="assessment-actions">
          <button onClick={() => navigate("/risk", { state: { riskData } })} disabled={!riskData}>
            View Risk Score
          </button>
          <button className="secondary-button" onClick={() => setActive(null)}>
            Back to assessments
          </button>
        </div>

        {error && <p className="form-error">{error}</p>}
        <GameToast result={gameResult} />
      </div>
    );
  }

  return (
    <div className="assessment-page page-enter">
      <header className="assessment-hero compact">
        <div>
          <p className="eyebrow">Active Assessment</p>
          <h1>{active.title}</h1>
          <p>{active.description}</p>
        </div>
        <div className="assessment-preview">
          <strong>{Object.keys(answers).length}/{active.questions.length}</strong>
          <span>checks answered</span>
        </div>
      </header>

      {active.questions.map((q, i) => (
        <div key={q._id} className="question-card">
          <span>Check {i + 1}</span>
          <p><strong>{q.questionText}</strong></p>
          {q.options.map((opt, idx) => (
            <label key={idx} className="answer-option">
              <input
                type="radio"
                name={q._id}
                checked={answers[q._id] === idx}
                onChange={() => selectAnswer(q._id, idx)}
              />
              {opt}
            </label>
          ))}
        </div>
      ))}

      <button disabled={!allAnswered} onClick={submit}>
        Submit Assessment
      </button>
      {error && <p className="form-error">{error}</p>}
      <GameToast result={gameResult} />
    </div>
  );
}
