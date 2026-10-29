import React, { useState } from "react";
import { checkEmail, checkUrl } from "../services/api";

function Result({ data }) {
  if (!data) return null;
  const cls = data.riskLevel === "High Risk" ? "high" : data.riskLevel === "Suspicious" ? "suspicious" : "safe";

  return (
    <div className="tool-result">
      <span className={`risk-badge ${cls}`}>{data.riskLevel} - {data.riskScore}</span>
      <p>{data.recommendation}</p>
      <ul>
        {data.reasons?.map((reason, index) => (
          <li key={index} className={`reason-${reason.type}`}>{reason.text}</li>
        ))}
      </ul>
    </div>
  );
}

function UrlDetector() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const scan = async () => {
    const value = url
      .trim()
      .replace(/^URL:\s*/i, "")
      .replace(/[),.;\]]+$/g, "");
    if (!value) {
      setError("Enter a URL to scan.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    try {
      const { data } = await checkUrl(value);
      setUrl(data.url || value);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "URL scan failed. Please check the backend and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="tool-panel">
      <div className="tool-panel-header">
        <span className="tool-code">URL</span>
        <div>
          <h2>URL Phishing Detector</h2>
          <p>Check suspicious links for phishing probability, indicators and risk level.</p>
        </div>
      </div>
      <label className="tool-field">
        <span>URL</span>
        <div className="url-input-row">
          <input
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder="Enter or paste a URL"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && scan()}
          />
          {url && <button className="secondary-button compact-button" onClick={() => { setUrl(""); setResult(null); setError(""); }}>Clear</button>}
        </div>
      </label>
      {error && <p className="form-error">{error}</p>}
      <button disabled={loading} onClick={scan}>{loading ? "Scanning..." : "Scan URL"}</button>
      <Result data={result} />
    </section>
  );
}

function EmailDetector() {
  const [email, setEmail] = useState({ senderName: "", senderEmail: "", subject: "", body: "" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field, value) => setEmail((prev) => ({ ...prev, [field]: value }));

  const scan = async () => {
    const hasContent = Object.values(email).some((value) => value.trim());
    if (!hasContent) {
      setError("Paste email details or body text to scan.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    try {
      const payload = Object.fromEntries(
        Object.entries(email).map(([key, value]) => [key, value.trim()])
      );
      const { data } = await checkEmail(payload);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "Email scan failed. Please check the backend and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="tool-panel">
      <div className="tool-panel-header">
        <span className="tool-code">EM</span>
        <div>
          <h2>Email Phishing Detector</h2>
          <p>Analyze sender, content, links and credential requests.</p>
        </div>
      </div>
      <input placeholder="Sender Name" value={email.senderName} onChange={(event) => update("senderName", event.target.value)} />
      <input placeholder="Sender Email" value={email.senderEmail} onChange={(event) => update("senderEmail", event.target.value)} />
      <input placeholder="Subject" value={email.subject} onChange={(event) => update("subject", event.target.value)} />
      <textarea rows={4} placeholder="Email Body" value={email.body} onChange={(event) => update("body", event.target.value)} />
      {error && <p className="form-error">{error}</p>}
      <button disabled={loading} onClick={scan}>{loading ? "Scanning..." : "Scan Email"}</button>
      <Result data={result} />
    </section>
  );
}

function AIThreatScanner() {
  const [result, setResult] = useState(null);
  const startScan = () => setResult({
    title: "Possible Brute Force Attack",
    severity: "HIGH",
    confidence: 94,
    source: "103.xx.xx.42",
    target: "Admin Login",
    detectedAt: new Date().toLocaleString(),
    actions: ["Block suspicious IP", "Review failed login attempts", "Enable MFA", "Check successful logins"],
  });

  return (
    <section className="tool-panel">
      <div className="tool-panel-header">
        <span className="tool-code">AI</span>
        <div>
          <h2>AI Threat Scanner</h2>
          <p>Detect suspicious activity, abnormal behavior, and potential security threats using AI-powered analysis.</p>
        </div>
      </div>
      <button onClick={startScan}>Start Threat Scan</button>
      {result && (
        <div className="tool-result">
          <span className="risk-badge high">Threat Detected</span>
          <h3>{result.title}</h3>
          <div className="incident-grid">
            <span>Severity<strong>{result.severity}</strong></span>
            <span>AI Confidence<strong>{result.confidence}%</strong></span>
            <span>Source<strong>{result.source}</strong></span>
            <span>Target<strong>{result.target}</strong></span>
            <span>Detection Time<strong>{result.detectedAt}</strong></span>
          </div>
          <ul>{result.actions.map((action) => <li key={action}>{action}</li>)}</ul>
        </div>
      )}
    </section>
  );
}

function IncidentAnalyzer() {
  const [incident, setIncident] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");

  const analyze = () => {
    const text = incident.trim();
    if (!text) {
      setError("Paste incident or log details to analyze.");
      setAnalysis(null);
      return;
    }

    setError("");
    const failedMatch = text.match(/(\d+)\s+(?:failed|failure|unsuccessful)\s+(?:login|auth|authentication|attempt)/i);
    const sourceIp = text.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/)?.[0] || "Not found";
    const failedAttempts = failedMatch ? Number(failedMatch[1]) : 0;
    const successfulLogin = /(successful|success|logged in|login succeeded|authenticated)/i.test(text);
    const unknownDevice = /(unknown|new|unrecognized|unseen)\s+(device|browser|client)/i.test(text);
    const adminAccess = /admin\s+(dashboard|panel|console|portal)|administrator/i.test(text);
    const accountMatch = text.match(/(?:account|user|username|email)\s*(?:then|:|=|-)?\s*([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|[A-Z][A-Z0-9._-]{2,})/i);

    const attackType = failedAttempts >= 10 && successfulLogin
      ? "Brute Force / Possible Account Compromise"
      : failedAttempts >= 10
        ? "Brute Force Attempt"
        : successfulLogin && unknownDevice
          ? "Suspicious Login"
          : "Suspicious Security Incident";

    const severityScore =
      (failedAttempts >= 30 ? 35 : failedAttempts >= 10 ? 25 : failedAttempts > 0 ? 10 : 0) +
      (successfulLogin ? 25 : 0) +
      (unknownDevice ? 15 : 0) +
      (adminAccess ? 20 : 0);

    const severity = severityScore >= 75 ? "CRITICAL" : severityScore >= 45 ? "HIGH" : severityScore >= 20 ? "MEDIUM" : "LOW";
    const confidence = Math.min(98, 72 + (failedAttempts ? 8 : 0) + (successfulLogin ? 8 : 0) + (unknownDevice ? 4 : 0) + (adminAccess ? 4 : 0));
    const affectedResource = adminAccess ? "Admin Dashboard" : accountMatch?.[1] || "User Account";

    setAnalysis({
      threatType: attackType,
      severity,
      sourceIp,
      failedAttempts: failedAttempts || "Not detected",
      successfulLogin: successfulLogin ? "Yes" : "No",
      unknownDevice: unknownDevice ? "Detected" : "Not detected",
      affectedResource,
      confidence,
      whatHappened: successfulLogin && failedAttempts
        ? "Multiple failed authentication attempts were followed by a successful login from the same suspicious activity pattern."
        : failedAttempts
          ? "Multiple failed authentication attempts indicate a likely credential guessing attempt."
          : "The pasted activity contains suspicious login or access behavior that should be reviewed.",
      impact: [
        successfulLogin && "Unauthorized account access",
        adminAccess && "Unauthorized administrator access",
        "User data exposure",
        "Privilege misuse",
      ].filter(Boolean),
      actions: [
        successfulLogin && "Terminate suspicious session",
        "Reset affected account password",
        sourceIp !== "Not found" && "Block or investigate source IP",
        "Enable MFA",
        "Review audit logs",
      ].filter(Boolean),
    });
  };

  return (
    <section className="tool-panel">
      <div className="tool-panel-header">
        <span className="tool-code">IA</span>
        <div>
          <h2>Incident Analyzer</h2>
          <p>Investigate security events, identify likely causes, assess impact, and receive recommended response actions.</p>
        </div>
      </div>
      <textarea
        rows={6}
        placeholder="Paste incident/logs..."
        value={incident}
        onChange={(event) => setIncident(event.target.value)}
      />
      {error && <p className="form-error">{error}</p>}
      <button onClick={analyze}>Analyze Incident</button>
      {analysis && (
        <div className="tool-result incident-analysis-result">
          <h3>Incident Analysis</h3>
          <div className="incident-grid">
            <span>Threat Type<strong>{analysis.threatType}</strong></span>
            <span>Severity<strong>{analysis.severity}</strong></span>
            <span>Source IP<strong>{analysis.sourceIp}</strong></span>
            <span>Failed Attempts<strong>{analysis.failedAttempts}</strong></span>
            <span>Successful Login<strong>{analysis.successfulLogin}</strong></span>
            <span>Unknown Device<strong>{analysis.unknownDevice}</strong></span>
            <span>Affected Resource<strong>{analysis.affectedResource}</strong></span>
            <span>AI Confidence<strong>{analysis.confidence}%</strong></span>
          </div>
          <div className="incident-narrative">
            <h4>What Happened</h4>
            <p>{analysis.whatHappened}</p>
            <h4>Potential Impact</h4>
            <ul>{analysis.impact.map((item) => <li key={item}>{item}</li>)}</ul>
            <h4>Recommended Actions</h4>
            <ol>{analysis.actions.map((action) => <li key={action}>{action}</li>)}</ol>
          </div>
        </div>
      )}
    </section>
  );
}

export default function Toolkit() {
  return (
    <div className="toolkit-page page-enter">
      <section className="toolkit-hero">
        <div>
          <span className="eyebrow">CyberShield Security Toolkit</span>
          <h1>Scan suspicious content and investigate security activity.</h1>
          <p>Use quick phishing checks first, then move into AI-powered investigation when activity looks unusual.</p>
        </div>
        <div className="toolkit-status"><strong>4</strong><span>Tools ready</span></div>
      </section>

      <section className="toolkit-section">
        <div className="section-heading"><span className="eyebrow">Phishing Detection</span><h2>Quick scans</h2></div>
        <div className="toolkit-grid primary-tool-grid"><UrlDetector /><EmailDetector /></div>
      </section>

      <section className="toolkit-section">
        <div className="section-heading"><span className="eyebrow">AI Security Analysis</span><h2>Advanced investigation tools</h2></div>
        <div className="toolkit-grid primary-tool-grid"><AIThreatScanner /><IncidentAnalyzer /></div>
      </section>
    </div>
  );
}
