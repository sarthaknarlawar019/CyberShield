import React, { useCallback, useEffect, useState } from "react";
import { askAssistant } from "../services/api";

export default function GlobalCopilot() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    { from: "bot", text: "I can explain risk scores, phishing results, alerts, incidents, and what to fix first." },
  ]);
  const [loading, setLoading] = useState(false);
  const prompts = ["Explain my risk score", "Analyze latest alert", "Explain phishing result", "Explain latest simulation"];

  const ask = useCallback(async (value = question) => {
    if (!value.trim()) return;
    const text = value.trim();
    setQuestion("");
    setMessages((prev) => [...prev, { from: "user", text }]);
    setLoading(true);
    try {
      const { data } = await askAssistant(text);
      setMessages((prev) => [...prev, { from: "bot", text: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { from: "bot", text: "Review the latest risk score, recent high-risk activity, phishing scan results, and recommended actions first." }]);
    } finally {
      setLoading(false);
    }
  }, [question]);

  useEffect(() => {
    const openWithContext = (event) => {
      const prompt = event.detail?.prompt || "Explain latest simulation";
      setOpen(true);
      ask(prompt);
    };

    window.addEventListener("copilot-open", openWithContext);
    return () => window.removeEventListener("copilot-open", openWithContext);
  }, [ask]);

  return (
    <div className="global-copilot">
      {!open && (
        <button className="copilot-launcher" onClick={() => setOpen(true)}>
          <span>CS</span>
          CyberShield Copilot
          <i />
        </button>
      )}

      {open && (
        <section className="copilot-popover">
          <div className="copilot-popover-header">
            <strong>CyberShield Copilot</strong>
            <span><i /> Online</span>
            <button className="secondary-button" onClick={() => setOpen(false)}>Close</button>
          </div>
          <p>How can I help with your security?</p>
          <div className="copilot-context-strip">
            <span>Risk</span>
            <span>Alerts</span>
            <span>Scans</span>
            <span>Actions</span>
          </div>
          <div className="prompt-grid">
            {prompts.map((prompt) => (
              <button className="secondary-button" key={prompt} onClick={() => ask(prompt)}>{prompt}</button>
            ))}
          </div>
          <div className="copilot-thread">
            {messages.map((message, index) => (
              <div className={`copilot-message ${message.from}`} key={`${message.from}-${index}`}>
                {message.text}
              </div>
            ))}
            {loading && <div className="copilot-message bot">Thinking...</div>}
          </div>
          <div className="copilot-input">
            <input placeholder="Ask CyberShield..." value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => event.key === "Enter" && ask()} />
            <button disabled={loading} onClick={() => ask()}>{loading ? "..." : "Send"}</button>
          </div>
        </section>
      )}
    </div>
  );
}
