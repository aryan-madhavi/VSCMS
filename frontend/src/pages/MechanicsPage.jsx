import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import AlertMessage from '../components/AlertMessage';
import ConfirmModal from '../components/ConfirmModal';

export default function MechanicsPage() {
  const { isAdmin } = useAuth();
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    mechanic_id: null,
    name: '',
    phone: '',
    email: '',
    specialization: '',
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadMechanics = async () => {
    try {
      setLoading(true);
      const data = await api.get('/mechanics');
      setMechanics(data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMechanics();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      mechanic_id: null,
      name: '',
      phone: '',
      email: '',
      specialization: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (m) => {
    setIsEditing(true);
    setFormData({
      mechanic_id: m.mechanic_id,
      name: m.name,
      phone: m.phone,
      email: m.email || '',
      specialization: m.specialization,
      is_active: m.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert({ type: '', message: '' });

    try {
      if (isEditing) {
        await api.put(`/mechanics/${formData.mechanic_id}`, {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email || null,
          specialization: formData.specialization.trim(),
          is_active: formData.is_active,
        });
        setAlert({ type: 'success', message: 'Mechanic profile updated.' });
      } else {
        await api.post('/mechanics', {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email || null,
          specialization: formData.specialization.trim(),
          is_active: formData.is_active,
        });
        setAlert({ type: 'success', message: 'Mechanic registered successfully.' });
      }
      setShowModal(false);
      loadMechanics();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/mechanics/${deleteTarget.mechanic_id}`);
      setAlert({ type: 'success', message: `Mechanic '${deleteTarget.name}' deleted.` });
      setDeleteTarget(null);
      loadMechanics();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Service Mechanics & Technicians</h2>
          <p className="text-muted small mb-0">Manage service workshop staff and skill specializations</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
            <i className="bi bi-person-plus me-1"></i>Add Technician
          </button>
        )}
      </div>

      <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary spinner-border-sm me-2"></div>
              Loading mechanics...
            </div>
          ) : mechanics.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-person-slash fs-2 d-block mb-2"></i>
              No mechanics registered in the system.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-uppercase text-secondary">
                  <tr>
                    <th>ID</th>
                    <th>Technician Name</th>
                    <th>Specialization</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Status</th>
                    {isAdmin && <th className="text-end">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {mechanics.map((m) => (
                    <tr key={m.mechanic_id}>
                      <td><span className="badge bg-light text-dark border">#{m.mechanic_id}</span></td>
                      <td className="fw-bold text-dark">{m.name}</td>
                      <td>
                        <span className="badge bg-info-subtle text-info-emphasis border">
                          {m.specialization}
                        </span>
                      </td>
                      <td>{m.phone}</td>
                      <td>{m.email || '-'}</td>
                      <td>
                        {m.is_active ? (
                          <span className="badge bg-success">Active</span>
                        ) : (
                          <span className="badge bg-secondary">Inactive</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => handleOpenEdit(m)}
                            title="Edit Mechanic"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setDeleteTarget(m)}
                            title="Delete Mechanic"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <form onSubmit={handleSubmit}>
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold">
                    {isEditing ? `Edit Technician [${formData.name}]` : 'Register Workshop Technician'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Mechanic Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Rajesh Sharma"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Specialization Domain *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Brake Systems, Engine Tuning, Electrical Diagnostics"
                      required
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    />
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Phone Number *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="+91-98XXXXXXXX"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="mech@vscms.local"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-check form-switch mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="activeCheck"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <label className="form-check-label small fw-semibold" htmlFor="activeCheck">
                      Active for Service Assignments
                    </label>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : isEditing ? 'Update Technician' : 'Save Technician'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Mechanic"
        message={`Are you sure you want to delete technician '${deleteTarget?.name}'? If services have been assigned to them in history, deletion will be rejected.`}
        confirmText="Confirm Delete"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
