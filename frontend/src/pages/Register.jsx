import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../services/api";

const checksFor = (password) => [
  { label: "At least 8 characters", pass: password.length >= 8 },
  { label: "An uppercase letter", pass: /[A-Z]/.test(password) },
  { label: "A lowercase letter", pass: /[a-z]/.test(password) },
  { label: "A number", pass: /\d/.test(password) },
  { label: "A symbol", pass: /[^A-Za-z0-9]/.test(password) },
];

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const checks = useMemo(() => checksFor(form.password), [form.password]);
  const strength = checks.filter((check) => check.pass).length;
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong", "Strong"];
  const isStrong = strength === checks.length;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!isStrong) {
      setError("Choose a stronger password before creating your account.");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await register(form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("auth-change"));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card card">
      <p className="eyebrow">CREATE YOUR ACCOUNT</p>
      <h1>Start your security journey</h1>
      <form onSubmit={handleSubmit}>
        <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
        <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
        <label>Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
        <div className="password-meter" aria-live="polite">
          <div className="strength-row"><span>Password strength</span><strong className={`strength-${strength}`}>{labels[strength]}</strong></div>
          <div className="meter-track"><span className={`meter-fill strength-${strength}`} style={{ width: `${strength * 20}%` }} /></div>
          <ul>{checks.map((check) => <li className={check.pass ? "passed" : ""} key={check.label}>{check.pass ? "✓" : "○"} {check.label}</li>)}</ul>
        </div>
        {error && <p className="form-error">{error}</p>}
        <button disabled={submitting} type="submit">{submitting ? "Creating account…" : "Create account"}</button>
      </form>
    </div>
  );
}
