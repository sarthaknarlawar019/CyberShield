// components/DailyChallengeCard.jsx
import React, { useEffect, useState } from "react";
import { getTodayChallenge, submitTodayChallenge } from "../services/api";
import GameToast from "./GameToast";

export default function DailyChallengeCard() {
  const [challenge, setChallenge] = useState(null);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [gameResult, setGameResult] = useState(null);

  useEffect(() => {
    getTodayChallenge().then((res) => setChallenge(res.data));
  }, []);

  const submit = async () => {
    if (selected === null) return;
    try {
      const { data } = await submitTodayChallenge(selected);
      setResult(data);
      setGameResult(data);
    } catch (err) {
      alert(err.response?.data?.message || "Could not submit");
    }
  };

  if (!challenge) return null;

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>⚡ Today's Cyber Challenge</h3>
      {challenge.alreadyCompleted && !result ? (
        <p style={{ color: "#94a3b8" }}>You've already completed today's challenge. Come back tomorrow!</p>
      ) : (
        <>
          <p>{challenge.question}</p>
          {challenge.options.map((opt, idx) => (
            <label key={idx} style={{ display: "block", marginBottom: 6 }}>
              <input
                type="radio"
                name="dc"
                checked={selected === idx}
                onChange={() => setSelected(idx)}
                disabled={!!result}
              />{" "}
              {opt}
            </label>
          ))}
          {!result && (
            <button onClick={submit} disabled={selected === null}>
              Submit Answer
            </button>
          )}
          {result && (
            <div className="page-enter" style={{ marginTop: 10 }}>
              <strong>{result.correct ? "✅ Correct!" : "❌ Not quite"}</strong>
              <p style={{ color: "#94a3b8" }}>{result.explanation}</p>
            </div>
          )}
        </>
      )}
      <GameToast result={gameResult} />
    </div>
  );
}