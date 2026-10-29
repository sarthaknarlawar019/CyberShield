import React from "react";

export default function ProgressRing({ value = 0, label = "Score" }) {
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - safeValue / 100);

  return (
    <div className="progress-ring" role="img" aria-label={`${label}: ${safeValue} out of 100`}>
      <svg viewBox="0 0 128 128" aria-hidden="true">
        <circle className="progress-ring-track" cx="64" cy="64" r={radius} />
        <circle
          className="progress-ring-value"
          cx="64"
          cy="64"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="progress-ring-label">
        <strong>{safeValue}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
