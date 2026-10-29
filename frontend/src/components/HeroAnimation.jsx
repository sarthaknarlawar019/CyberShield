// components/HeroAnimation.jsx
// Animated "video-style" hero thumbnail — a looping cybersecurity scan
// visual built from CSS animations + inline SVG. No video file needed,
// so it works instantly with zero extra assets or bandwidth.

import React, { useMemo } from "react";

export default function HeroAnimation({ label = "LIVE THREAT SCAN" }) {
  // Randomized particle positions/delays, memoized so they don't reshuffle on re-render
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        top: `${Math.random() * 85 + 5}%`,
        left: `${Math.random() * 90 + 5}%`,
        delay: `${(Math.random() * 5).toFixed(2)}s`,
        duration: `${(4 + Math.random() * 4).toFixed(2)}s`,
      })),
    []
  );

  return (
    <div className="hero-thumb">
      <div className="hero-grid" />
      <div className="hero-sweep" />

      {particles.map((p) => (
        <span
          key={p.id}
          className="hero-particle"
          style={{
            top: p.top,
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}

      <div className="hero-shield">
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3z"
            fill="rgba(56,189,248,0.15)"
            stroke="#38bdf8"
            strokeWidth="1.5"
          />
          <path
            d="M9 12l2 2 4-4"
            stroke="#38bdf8"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="hero-label">
        <span className="hero-dot" />
        {label}
      </div>
    </div>
  );
}