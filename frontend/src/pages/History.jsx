import React, { useEffect, useState } from "react";
import { getHistory } from "../services/api";

const formatDate = (value) => new Date(value).toLocaleDateString();
const formatTime = (value) => new Date(value).toLocaleTimeString();

export default function History() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [activityType, setActivityType] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getHistory({ search, activityType, riskLevel, page, limit: 10 })
      .then(({ data }) => {
        setItems(data.items);
        setPages(data.pages);
      })
      .catch((err) => setError(err.response?.data?.message || "Could not load history"))
      .finally(() => setLoading(false));
  }, [search, activityType, riskLevel, page]);

  useEffect(() => setPage(1), [search, activityType, riskLevel]);

  return (
    <div className="history-page page-enter">
      <section className="toolkit-hero">
        <div><span className="eyebrow">Security History</span><h1>Activity history with user context.</h1></div>
        <div className="toolkit-status"><strong>{items.length}</strong><span>Records shown</span></div>
      </section>
      <section className="admin-filters admin-searchbar">
        <input placeholder="Search user, email, URL, subject, threat, or activity" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select value={activityType} onChange={(event) => setActivityType(event.target.value)}><option value="">All activity</option><option>URL Scan</option><option>Email Scan</option><option>Login</option><option>Threat Detection</option><option>Incident Analysis</option><option>Admin Action</option></select>
        <select value={riskLevel} onChange={(event) => setRiskLevel(event.target.value)}><option value="">All risks</option><option>Low</option><option>Medium</option><option>High</option><option>Critical</option><option>Info</option></select>
        <button className="secondary-button" onClick={() => { setSearch(""); setActivityType(""); setRiskLevel(""); }}>Clear</button>
      </section>
      {error && <p className="form-error">{error}</p>}
      {loading ? <div className="card">Loading history...</div> : <section className="history-list">{items.map((item) => <article className="history-row" key={item._id}><div><strong>{item.userName}</strong><span>{item.userEmail}</span></div><div><strong>{item.activityType}</strong><span>Target: {item.target || "Not specified"}</span></div><div><span>Result: {item.result}</span><span>Risk: {item.riskLevel}</span></div><div><span>{formatDate(item.createdAt)}</span><span>{formatTime(item.createdAt)}</span></div></article>)}{items.length === 0 && <div className="empty-state card"><h2>No history found</h2><p>Try changing your search or filters.</p></div>}<div className="pagination-row"><button className="secondary-button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {pages}</span><button className="secondary-button" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>Next</button></div></section>}
    </div>
  );
}
