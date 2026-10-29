// pages/AIAssistant.jsx
// Step 8: "AI cybersecurity assistant"

import React, { useState, useRef, useEffect } from "react";
import { askAssistant } from "../services/api";

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! Ask me anything about phishing, passwords, malware, or online safety." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { from: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await askAssistant(userMsg.text);
      setMessages((prev) => [...prev, { from: "bot", text: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { from: "bot", text: "Sorry, I'm having trouble right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>🤖 AI Cybersecurity Assistant</h1>
      <div className="card" style={{ display: "flex", flexDirection: "column", minHeight: 400 }}>
        {messages.map((m, i) => (
          <div key={i} className={m.from === "user" ? "chat-bubble-user" : "chat-bubble-bot"}>
            {m.text}
          </div>
        ))}
        {loading && <div className="chat-bubble-bot">Thinking…</div>}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="Ask a cybersecurity question…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}