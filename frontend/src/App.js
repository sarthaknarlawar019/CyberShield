import React from "react";
import { Routes, Route, Link, Navigate, NavLink } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Learn from "./pages/Learn";
import Assessment from "./pages/Assessment";
import RiskDashboard from "./pages/RiskDashboard";
import PhishingSimulator from "./pages/PhishingSimulator";
import AIAssistant from "./pages/AIAssistant";
import Toolkit from "./pages/Toolkit";
import Leaderboard from "./pages/Leaderboard";
import Account from "./pages/Account";
import AdminDashboard from "./pages/AdminDashboard";
import History from "./pages/History";
import GlobalCopilot from "./components/GlobalCopilot";

function isLoggedIn() {
  return !!localStorage.getItem("token");
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function PrivateRoute({ children, role }) {
  if (!isLoggedIn()) return <Navigate to="/login" />;
  const user = getStoredUser();
  if (role && user?.role !== role) return <Navigate to="/dashboard" />;
  return children;
}

const navItems = [
  { to: "/dashboard", label: "Dashboard", code: "DS" },
  { to: "/learn", label: "Learn", code: "LN" },
  { to: "/assessment", label: "Assessment", code: "AS" },
  { to: "/risk", label: "Risk Score", code: "RS" },
  { to: "/phishing", label: "Simulation Lab", code: "SL" },
  { to: "/toolkit", label: "Toolkit", code: "TK" },
  { to: "/leaderboard", label: "Leaderboard", code: "LB" },
  { to: "/assistant", label: "AI Assistant", code: "AI" },
  { to: "/account", label: "Account", code: "AC" },
];

export default function App() {
  const [, forceRender] = React.useState(0);
  const user = getStoredUser();
  const isAdmin = user?.role === "ADMIN";

  React.useEffect(() => {
    const refreshAuth = () => forceRender((n) => n + 1);
    window.addEventListener("auth-change", refreshAuth);
    window.addEventListener("storage", refreshAuth);
    return () => {
      window.removeEventListener("auth-change", refreshAuth);
      window.removeEventListener("storage", refreshAuth);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-change"));
    forceRender((n) => n + 1);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand-lockup" to="/dashboard">
          <img className="brand-logo" src="/cybershield-logo.svg" alt="CyberShield" />
          <span>
            <strong>CyberShield</strong>
            <small>Security training lab</small>
          </span>
        </Link>

        <nav className="side-nav" aria-label="Primary navigation">
          {isAdmin && (
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}
            >
              <span>AD</span>
              Admin
            </NavLink>
          )}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}
            >
              <span>{item.code}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="system-status">
            <span className="status-dot" />
            <span>Training mode</span>
          </div>
          {isLoggedIn() ? (
            <button className="secondary-button" onClick={logout}>Logout</button>
          ) : (
            <div className="auth-links">
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </div>
          )}
        </div>
      </aside>

      <main className="main-stage">
        <div className="topbar">
          <div>
            <span className="eyebrow">Cyber readiness workspace</span>
            <strong>Learn, assess, simulate, improve</strong>
          </div>
          {isLoggedIn() ? (
            <Link className="topbar-history-button" to="/history">History</Link>
          ) : (
            <div className="auth-links">
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </div>
          )}
        </div>

        <div className="container">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/toolkit" element={<Toolkit />} />

            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/admin/dashboard" element={<PrivateRoute role="ADMIN"><AdminDashboard /></PrivateRoute>} />
            <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} />
            <Route path="/assessment" element={<PrivateRoute><Assessment /></PrivateRoute>} />
            <Route path="/risk" element={<PrivateRoute><RiskDashboard /></PrivateRoute>} />
            <Route path="/phishing" element={<PrivateRoute><PhishingSimulator /></PrivateRoute>} />
            <Route path="/assistant" element={<PrivateRoute><AIAssistant /></PrivateRoute>} />
            <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
          </Routes>
        </div>
      </main>
      {isLoggedIn() && <GlobalCopilot />}
    </div>
  );
}
