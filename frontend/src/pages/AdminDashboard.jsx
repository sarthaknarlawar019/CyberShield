import React, { useEffect, useMemo, useState } from "react";
import { deleteUser, getAuditLogs, getUserDetails, getUsers, updateUser, updateUserRole, updateUserStatus } from "../services/api";

const formatDate = (value) => value ? new Date(value).toLocaleString() : "Never";
const emptyModal = { type: "", user: null };

export default function AdminDashboard() {
  const currentUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  }, []);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [menuId, setMenuId] = useState("");
  const [modal, setModal] = useState(emptyModal);
  const [details, setDetails] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", role: "USER", status: "ACTIVE" });

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const [{ data: userData }, { data: logData }] = await Promise.all([
        getUsers({ search, role: roleFilter, status: statusFilter, page, limit: 6 }),
        getAuditLogs(),
      ]);
      const items = userData.items || userData;
      setUsers(items);
      setTotal(userData.total ?? items.length);
      setPages(userData.pages || 1);
      setLogs(logData);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadUsers, 220);
    return () => clearTimeout(timer);
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  const suggestions = users
    .filter((user) => search && `${user.name} ${user.email} ${user.role} ${user.status}`.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 4);

  const openModal = async (type, user) => {
    setMenuId("");
    setModal({ type, user });
    setDetails(null);
    if (type === "details") {
      const { data } = await getUserDetails(user._id);
      setDetails(data);
    }
    if (type === "edit" || type === "role") {
      setEditForm({ name: user.name, role: user.role, status: user.status });
    }
  };

  const completeAction = async (message) => {
    setNotice(message);
    setModal(emptyModal);
    await loadUsers();
    setTimeout(() => setNotice(""), 2800);
  };

  const saveEdit = async () => {
    setSavingId(modal.user._id);
    try {
      await updateUser(modal.user._id, editForm);
      await completeAction("User updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not update user");
    } finally {
      setSavingId("");
    }
  };

  const saveRole = async () => {
    setSavingId(modal.user._id);
    try {
      await updateUserRole(modal.user._id, editForm.role);
      await completeAction("Role updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not update role");
    } finally {
      setSavingId("");
    }
  };

  const changeStatus = async (user, status) => {
    setSavingId(user._id);
    try {
      await updateUserStatus(user._id, status);
      await completeAction(`User status changed to ${status}.`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update status");
    } finally {
      setSavingId("");
    }
  };

  const confirmDelete = async () => {
    setSavingId(modal.user._id);
    try {
      await deleteUser(modal.user._id);
      await completeAction("User deleted safely.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete user");
    } finally {
      setSavingId("");
    }
  };

  return (
    <div className="admin-page page-enter">
      <section className="admin-hero">
        <div>
          <span className="eyebrow">Admin Command Center</span>
          <h1>Users Management</h1>
          <p>Search users, inspect security posture, and manage account access.</p>
        </div>
        <div className="admin-hero-side">
          <button className="secondary-button audit-button" onClick={() => setModal({ type: "audit", user: null })}>Audit History</button>
          <div className="admin-stats">
            <div><strong>{total}</strong><span>Total users</span></div>
            <div><strong>{users.filter((u) => u.role === "ADMIN").length}</strong><span>Admins shown</span></div>
            <div><strong>{users.filter((u) => u.status !== "ACTIVE").length}</strong><span>Restricted shown</span></div>
          </div>
        </div>
      </section>

      <section className="admin-filters admin-searchbar">
        <div className="admin-search-wrap">
          <input placeholder="Search users by name, email, role, or status" value={search} onChange={(event) => setSearch(event.target.value)} />
          {suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((user) => (
                <button key={user._id} type="button" onClick={() => openModal("details", user)}>
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
          <option value="">All roles</option>
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="BLOCKED">BLOCKED</option>
        </select>
        <button className="secondary-button" onClick={() => { setSearch(""); setRoleFilter(""); setStatusFilter(""); }}>Clear</button>
      </section>

      {notice && <p className="success-note">{notice}</p>}
      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <div className="card">Loading users...</div>
      ) : (
        <section className="user-management-list">
          {users.map((user) => (
            <article className="user-management-row" key={user._id} onClick={() => openModal("details", user)}>
              <div className="user-identity"><strong>{user.name}</strong><span>{user.email}</span></div>
              <div className="admin-meta"><span>Role: <strong>{user.role}</strong></span><span>Status: <strong>{user.status}</strong></span><span>Failed logins: {user.failedLoginAttempts || 0}</span></div>
              <div className="admin-meta"><span>Last login: {formatDate(user.lastLogin)}</span><span>Created: {formatDate(user.createdAt)}</span></div>
              <div className="admin-actions menu-host" onClick={(event) => event.stopPropagation()}>
                <button className="secondary-button" onClick={() => setMenuId(menuId === user._id ? "" : user._id)}>Manage</button>
                {menuId === user._id && (
                  <div className="actions-menu">
                    <button onClick={() => openModal("details", user)}>View Details</button>
                    <button onClick={() => openModal("edit", user)}>Edit User</button>
                    <button onClick={() => openModal("role", user)}>Change Role</button>
                    <button onClick={() => changeStatus(user, user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")}>{user.status === "ACTIVE" ? "Deactivate" : "Activate"}</button>
                    <button onClick={() => changeStatus(user, user.status === "BLOCKED" ? "ACTIVE" : "BLOCKED")}>{user.status === "BLOCKED" ? "Unblock" : "Block"}</button>
                    <button className="menu-danger" disabled={currentUser?.id === user._id || savingId === user._id} onClick={() => openModal("delete", user)}>Delete</button>
                  </div>
                )}
              </div>
            </article>
          ))}
          {users.length === 0 && <div className="empty-state card"><h2>No users found</h2><p>Try changing your search or filters.</p></div>}
          <div className="pagination-row">
            <button className="secondary-button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
            <span>Page {page} of {pages}</span>
            <button className="secondary-button" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>Next</button>
          </div>
        </section>
      )}

      {modal.type && (
        <div className="modal-backdrop" role="presentation" onClick={() => setModal(emptyModal)}>
          <section className="admin-modal-panel" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header"><h2>{modal.type === "audit" ? "Audit History" : modal.type === "details" ? "User Security Profile" : modal.type === "delete" ? "Delete User?" : modal.type === "role" ? "Change User Role" : "Edit User"}</h2><button className="secondary-button" onClick={() => setModal(emptyModal)}>Close</button></div>
            {modal.type === "audit" && <AuditLogList logs={logs} />}
            {modal.type === "details" && <UserDetails details={details} />}
            {modal.type === "edit" && <div className="modal-form"><label>Name<input value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} /></label><label>Role<select value={editForm.role} onChange={(event) => setEditForm({ ...editForm, role: event.target.value })}><option>USER</option><option>ADMIN</option></select></label><label>Status<select value={editForm.status} onChange={(event) => setEditForm({ ...editForm, status: event.target.value })}><option>ACTIVE</option><option>INACTIVE</option><option>BLOCKED</option></select></label><button disabled={savingId === modal.user?._id} onClick={saveEdit}>Save Changes</button></div>}
            {modal.type === "role" && <div className="modal-form"><p>Current Role: <strong>{modal.user.role}</strong></p><label>New Role<select value={editForm.role} onChange={(event) => setEditForm({ ...editForm, role: event.target.value })}><option>USER</option><option>ADMIN</option></select></label><button disabled={savingId === modal.user?._id} onClick={saveRole}>Update Role</button></div>}
            {modal.type === "delete" && <div className="delete-confirm"><p>You are about to delete:</p><strong>{modal.user.name}</strong><span>{modal.user.email}</span><p>This is a safe soft delete. History and security records stay available.</p><button className="danger-button" disabled={currentUser?.id === modal.user._id || savingId === modal.user._id} onClick={confirmDelete}>Delete User</button></div>}
          </section>
        </div>
      )}
    </div>
  );
}

function AuditLogList({ logs }) {
  return <div className="audit-list">{logs.slice(0, 20).map((log) => <div className="audit-row" key={log._id}><strong>{log.actorName || log.actor?.name || "Admin"} - {log.action}</strong><span>{log.affectedUserName || log.affectedUser?.name || log.email || "Affected user"}</span><small>{log.previousValue ? `Before: ${JSON.stringify(log.previousValue)}` : ""} {log.newValue ? `After: ${JSON.stringify(log.newValue)}` : ""}</small><small>{formatDate(log.createdAt)}</small></div>)}{logs.length === 0 && <p>No audit logs yet.</p>}</div>;
}

function UserDetails({ details }) {
  if (!details) return <div className="card">Loading profile...</div>;
  const user = details.user;
  return <div className="security-profile"><div className="profile-summary"><div><span>Name</span><strong>{user.name}</strong></div><div><span>Email</span><strong>{user.email}</strong></div><div><span>Role</span><strong>{user.role}</strong></div><div><span>Status</span><strong>{user.status}</strong></div><div><span>Created</span><strong>{formatDate(user.createdAt)}</strong></div><div><span>Last Login</span><strong>{formatDate(user.lastLogin)}</strong></div><div><span>Failed Logins</span><strong>{user.failedLoginAttempts || 0}</strong></div><div><span>Risk Score</span><strong>{details.riskScore ? `${details.riskScore.score} ${details.riskScore.riskLevel}` : "Not available"}</strong></div></div><ActivityBlock title="Recent Alerts" items={details.alerts} /><ActivityBlock title="Recent URL Scans" items={details.urlScans} /><ActivityBlock title="Recent Email Scans" items={details.emailScans} /><ActivityBlock title="Recent Security Activity" items={details.recentActivity} /></div>;
}

function ActivityBlock({ title, items = [] }) {
  return <section className="activity-block"><h3>{title}</h3>{items.map((item) => <div className="audit-row" key={item._id}><strong>{item.activityType}</strong><span>{item.target || item.result}</span><small>{item.riskLevel} - {formatDate(item.createdAt)}</small></div>)}{items.length === 0 && <p className="empty-note">No records yet.</p>}</section>;
}
