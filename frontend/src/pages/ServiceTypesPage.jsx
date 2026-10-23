import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import AlertMessage from '../components/AlertMessage';
import ConfirmModal from '../components/ConfirmModal';

export default function ServiceTypesPage() {
  const { isAdmin } = useAuth();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    service_type_id: null,
    type_name: '',
    description: '',
    base_cost: '1000.00',
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadTypes = async () => {
    try {
      setLoading(true);
      const data = await api.get('/service-types');
      setTypes(data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTypes();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      service_type_id: null,
      type_name: '',
      description: '',
      base_cost: '1500.00',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (t) => {
    setIsEditing(true);
    setFormData({
      service_type_id: t.service_type_id,
      type_name: t.type_name,
      description: t.description || '',
      base_cost: t.base_cost,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert({ type: '', message: '' });

    try {
      if (isEditing) {
        await api.put(`/service-types/${formData.service_type_id}`, {
          type_name: formData.type_name.trim(),
          description: formData.description || null,
          base_cost: Number(formData.base_cost),
        });
        setAlert({ type: 'success', message: 'Service type updated.' });
      } else {
        await api.post('/service-types', {
          type_name: formData.type_name.trim(),
          description: formData.description || null,
          base_cost: Number(formData.base_cost),
        });
        setAlert({ type: 'success', message: 'Service type added to catalog.' });
      }
      setShowModal(false);
      loadTypes();
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
      await api.delete(`/service-types/${deleteTarget.service_type_id}`);
      setAlert({ type: 'success', message: `Service type '${deleteTarget.type_name}' deleted.` });
      setDeleteTarget(null);
      loadTypes();
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
          <h2 className="fw-bold mb-1">Standard Service Catalog</h2>
          <p className="text-muted small mb-0">Predefined maintenance packages and baseline labor fees</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
            <i className="bi bi-plus-lg me-1"></i>New Service Package
          </button>
        )}
      </div>

      <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary spinner-border-sm me-2"></div>
              Loading catalog...
            </div>
          ) : types.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-tag fs-2 d-block mb-2"></i>
              No service types defined in catalog.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-uppercase text-secondary">
                  <tr>
                    <th>ID</th>
                    <th>Service Package Name</th>
                    <th>Standard Scope of Work</th>
                    <th className="text-end">Base Labor Cost</th>
                    {isAdmin && <th className="text-end">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {types.map((t) => (
                    <tr key={t.service_type_id}>
                      <td><span className="badge bg-light text-dark border">#{t.service_type_id}</span></td>
                      <td className="fw-bold text-dark">{t.type_name}</td>
                      <td className="small text-secondary" style={{ maxWidth: '350px' }}>
                        {t.description || '-'}
                      </td>
                      <td className="text-end fw-bold text-dark">
                        ₹{Number(t.base_cost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      {isAdmin && (
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => handleOpenEdit(t)}
                            title="Edit Service Type"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setDeleteTarget(t)}
                            title="Delete Service Type"
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
                    {isEditing ? `Edit Service Package` : 'Add Service Catalog Package'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Package Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Periodic Maintenance Service"
                      required
                      value={formData.type_name}
                      onChange={(e) => setFormData({ ...formData, type_name: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Base Labor Charge (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      required
                      value={formData.base_cost}
                      onChange={(e) => setFormData({ ...formData, base_cost: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Scope of Work Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Summary of check points and work items covered"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : isEditing ? 'Update Package' : 'Save Package'}
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
        title="Delete Service Package"
        message={`Are you sure you want to delete '${deleteTarget?.type_name}'? Foreign key referential constraints prevent deleting service types that exist in historical work orders.`}
        confirmText="Confirm Delete"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
