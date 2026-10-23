import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import AlertMessage from '../components/AlertMessage';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Add User Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'Staff',
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.get('/users');
      setUsers(data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      full_name: '',
      role: 'Staff',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert({ type: '', message: '' });

    try {
      await api.post('/users', {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.full_name.trim(),
        role: formData.role,
        is_active: formData.is_active,
      });
      setAlert({ type: 'success', message: `Staff account '${formData.username}' created successfully.` });
      setShowModal(false);
      loadUsers();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (targetUser) => {
    if (targetUser.user_id === currentUser.user_id && targetUser.is_active) {
      setAlert({ type: 'error', message: 'You cannot deactivate your own active administrator account!' });
      return;
    }

    try {
      const newStatus = !targetUser.is_active;
      await api.patch(`/users/${targetUser.user_id}/status`, {
        is_active: newStatus,
      });
      setAlert({
        type: 'success',
        message: `Account '${targetUser.username}' is now ${newStatus ? 'Activated' : 'Deactivated'}.`,
      });
      loadUsers();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">User & Role Management</h2>
          <p className="text-muted small mb-0">Administrator controls for staff authentication accounts and RBAC access</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
          <i className="bi bi-person-plus me-1"></i>Create Staff Account
        </button>
      </div>

      <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary spinner-border-sm me-2"></div>
              Loading system accounts...
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-uppercase text-secondary">
                  <tr>
                    <th>User ID</th>
                    <th>Username</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>System Role</th>
                    <th>Account Status</th>
                    <th>Created</th>
                    <th className="text-end">Status Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = u.user_id === currentUser?.user_id;
                    return (
                      <tr key={u.user_id} className={!u.is_active ? 'table-light text-muted' : ''}>
                        <td>#{u.user_id}</td>
                        <td className="fw-bold">
                          {u.username} {isSelf && <span className="badge bg-secondary ms-1">You</span>}
                        </td>
                        <td>{u.full_name}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`badge ${u.role === 'Administrator' ? 'bg-danger' : 'bg-primary'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          {u.is_active ? (
                            <span className="badge bg-success">Active</span>
                          ) : (
                            <span className="badge bg-danger">Deactivated</span>
                          )}
                        </td>
                        <td className="small text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="text-end">
                          <button
                            className={`btn btn-sm ${u.is_active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                            onClick={() => handleToggleStatus(u)}
                            disabled={isSelf}
                            title={isSelf ? 'Cannot deactivate self' : u.is_active ? 'Deactivate user' : 'Activate user'}
                          >
                            {u.is_active ? (
                              <>
                                <i className="bi bi-person-x me-1"></i>Deactivate
                              </>
                            ) : (
                              <>
                                <i className="bi bi-person-check me-1"></i>Activate
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <form onSubmit={handleSubmit}>
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold">Create System Account</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Username *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. staff_rahul"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Rahul Patil"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="rahul@vscms.local"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Password *</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Min 6 characters"
                        required
                        minLength={6}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">System Role *</label>
                      <select
                        className="form-select"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      >
                        <option value="Staff">Staff</option>
                        <option value="Administrator">Administrator</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
