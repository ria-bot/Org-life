// frontend/src/pages/AdminUsers.jsx
import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import AdminLayout from "../components/AdminLayout";
import "./Admin.css";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const limit = 20;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const result = await api.getAllUsers({ search, page, limit });
      setUsers(result.users);
      setTotal(result.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ✅ VERIFY USER - This is the key function!
  async function handleVerifyUser(user) {
    if (!window.confirm(`Verify ${user.full_name}? This will activate their account.`)) return;
    
    try {
      // Call your backend to verify the user
      await api.verifyUserById(user.id);
      setSuccess(`✅ ${user.full_name} has been verified!`);
      loadUsers(); // Refresh list
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggleStatus(user) {
    try {
      await api.toggleUserStatus(user.id, !user.is_active);
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Delete ${user.full_name}? This will permanently delete all their data. This cannot be undone.`)) return;
    try {
      await api.deleteUser(user.id);
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <AdminLayout title="User Management" subtitle="View, search, verify, and manage registered users">
      <div className="filter-bar">
        <input
          className="filter-input"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {error && <p className="status-badge inactive">{error}</p>}
      {success && <p className="status-badge active" style={{ color: '#2d7a3a' }}>{success}</p>}

      <div className="admin-table-wrap">
        {loading ? (
          <p style={{ padding: 20 }}>Loading...</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Verified</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.full_name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone_number}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td>
                    <span className={`verified-badge ${user.is_verified ? 'verified' : 'unverified'}`}>
                      {user.is_verified ? '✅ Verified' : '❌ Unverified'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                      {user.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {/* 🔥 VERIFY BUTTON - Show only for unverified users */}
                      {!user.is_verified && (
                        <button 
                          className="btn-verify"
                          onClick={() => handleVerifyUser(user)}
                        >
                          ✅ Verify
                        </button>
                      )}
                      <button 
                        className={`btn-toggle ${user.is_active ? 'deactivate' : 'activate'}`}
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button 
                        className="btn-small danger" 
                        onClick={() => handleDelete(user)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={7} className="empty-state">No users found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="pagination-bar">
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
        <span>Page {page} of {Math.ceil(total / limit) || 1}</span>
        <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
      </div>
    </AdminLayout>
  );
}