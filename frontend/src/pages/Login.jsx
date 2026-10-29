// pages/Login.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/api";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await login(form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("auth-change"));
      navigate(data.redirectTo || (data.user?.role === "ADMIN" ? "/admin/dashboard" : "/dashboard"));
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page refined-login clean-login page-enter">
      <section className="login-hero-panel clean-login-hero">
        <div className="clean-login-brand">
          <img className="brand-logo" src="/cybershield-logo.svg" alt="CyberShield" />
          <strong>CyberShield</strong>
        </div>
        <div className="clean-login-copy">
          <h1>Intelligent Security. Continuous Protection.</h1>
          <p>AI-powered cybersecurity monitoring for your digital environment.</p>
        </div>
        <div className="login-feature-list">
          <span>AI Threat Detection</span>
          <span>Suspicious URL Scanning</span>
          <span>Real-time Risk Analysis</span>
        </div>
      </section>

      <section className="auth-card card refined-login-card clean-login-card">
        <div className="login-card-top clean-card-top">
          <p className="eyebrow">Secure access</p>
          <h2>Welcome Back</h2>
          <span>Sign in to continue</span>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="input-shell">Email
            <input
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label className="input-shell">Password
            <input
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>
          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" />
              Remember me
            </label>
            <button className="link-button" type="button">Forgot password?</button>
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="full-button" disabled={submitting} type="submit">
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="login-card-footer">
          <span>New to CyberShield?</span>
          <Link to="/register">Create account</Link>
        </div>
      </section>
    </div>
  );
}
