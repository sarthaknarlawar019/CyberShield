// components/XPBar.jsx
import React from "react";

export default function XPBar({ xp, level, levelName, xpForNextLevel, prevThreshold = 0 }) {
  let percent = 100;
  if (xpForNextLevel !== null && xpForNextLevel !== undefined) {
    const span = xpForNextLevel - prevThreshold;
    const progress = xp - prevThreshold;
    percent = Math.max(0, Math.min(100, Math.round((progress / span) * 100)));
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14 }}>
        <span>
          <strong>Level {level}</strong> - {levelName}
        </span>
        <span style={{ color: "#94a3b8" }}>
          {xp} XP{xpForNextLevel != null ? ` / ${xpForNextLevel} XP` : " (Max Level)"}
        </span>
      </div>
      <div className="xp-bar-track">
        <div className="xp-bar-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
