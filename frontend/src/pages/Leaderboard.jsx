// pages/Leaderboard.jsx
import React, { useEffect, useState } from "react";
import { getLeaderboard } from "../services/api";

const rankClass = (rank) => (rank === 1 ? "gold" : rank === 2 ? "silver" : rank === 3 ? "bronze" : "");

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard().then((res) => setRows(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-enter">
      <h1>🏅 Leaderboard</h1>
      <div className="card">
        {loading && <div className="skeleton" style={{ height: 200 }} />}
        {!loading &&
          rows.map((r) => (
            <div key={r.rank} className="leaderboard-row">
              <div className={`leaderboard-rank ${rankClass(r.rank)}`}>{r.rank}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>Level {r.level} · {r.achievementCount} achievements</div>
              </div>
              <div style={{ fontWeight: 700 }}>{r.xp} XP</div>
            </div>
          ))}
        {!loading && rows.length === 0 && <p>No users yet — be the first!</p>}
      </div>
    </div>
  );
}