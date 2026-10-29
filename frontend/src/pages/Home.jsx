import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const signedIn = Boolean(localStorage.getItem("token"));
  const user = JSON.parse(localStorage.getItem("user") || "null");

  return (
    <div className="home-page">
      <section className="hero-panel">
        <p className="eyebrow">CYBERSHIELD PLATFORM</p>
        <h1>Build safer habits for a safer digital life.</h1>
        <p className="hero-copy">
          Learn cybersecurity fundamentals, test your knowledge, practice identifying phishing,
          and get personal recommendations.
        </p>
        <div className="hero-actions">
          <Link className="primary-link" to="/learn">Explore learning</Link>
          <Link className="secondary-link" to={signedIn ? "/account" : "/register"}>
            {signedIn ? `View ${user?.name || "your"} account` : "Create free account"}
          </Link>
        </div>
      </section>
      <section className="feature-grid">
        <article className="feature-card"><span>01</span><h2>Learn</h2><p>Short, focused lessons on everyday digital safety.</p><Link to="/learn">Open lessons →</Link></article>
        <article className="feature-card"><span>02</span><h2>Assess</h2><p>Measure your understanding and spot knowledge gaps.</p><Link to="/assessment">Take assessment →</Link></article>
        <article className="feature-card"><span>03</span><h2>Practice</h2><p>Learn to identify realistic phishing messages safely.</p><Link to="/phishing">Try simulator →</Link></article>
      </section>
    </div>
  );
}
