import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import AlertMessage from '../components/AlertMessage';
import ConfirmModal from '../components/ConfirmModal';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: null,
    customer_id: '',
    registration_number: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const url = search ? `/vehicles?search=${encodeURIComponent(search)}` : '/vehicles';
      const [vData, cData] = await Promise.all([api.get(url), api.get('/customers')]);
      setVehicles(vData);
      setCustomers(cData);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      vehicle_id: null,
      customer_id: customers.length > 0 ? customers[0].customer_id : '',
      registration_number: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (v) => {
    setIsEditing(true);
    setFormData({
      vehicle_id: v.vehicle_id,
      customer_id: v.customer_id,
      registration_number: v.registration_number,
      make: v.make,
      model: v.model,
      year: v.year,
      color: v.color || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert({ type: '', message: '' });

    try {
      if (isEditing) {
        await api.put(`/vehicles/${formData.vehicle_id}`, {
          customer_id: Number(formData.customer_id),
          registration_number: formData.registration_number.toUpperCase().trim(),
          make: formData.make.trim(),
          model: formData.model.trim(),
          year: Number(formData.year),
          color: formData.color || null,
        });
        setAlert({ type: 'success', message: 'Vehicle record updated successfully.' });
      } else {
        await api.post('/vehicles', {
          customer_id: Number(formData.customer_id),
          registration_number: formData.registration_number.toUpperCase().trim(),
          make: formData.make.trim(),
          model: formData.model.trim(),
          year: Number(formData.year),
          color: formData.color || null,
        });
        setAlert({ type: 'success', message: 'Vehicle registered successfully.' });
      }
      setShowModal(false);
      loadData();
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
      await api.delete(`/vehicles/${deleteTarget.vehicle_id}`);
      setAlert({ type: 'success', message: `Vehicle ${deleteTarget.registration_number} deleted.` });
      setDeleteTarget(null);
      loadData();
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
          <h2 className="fw-bold mb-1">Vehicle Registry</h2>
          <p className="text-muted small mb-0">Manage customer automobiles and registration profiles</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
          <i className="bi bi-plus-lg me-1"></i>Register Vehicle
        </button>
      </div>

      <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      {/* Search Bar */}
      <div className="card shadow-sm border-0 mb-4 rounded-3">
        <div className="card-body p-3">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search by license plate number, make (e.g. Honda), or model (e.g. Civic)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="btn btn-outline-secondary" type="button" onClick={() => setSearch('')}>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary spinner-border-sm me-2"></div>
              Loading vehicles...
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-car-front fs-2 d-block mb-2"></i>
              No vehicle records found.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-uppercase text-secondary">
                  <tr>
                    <th>Registration No.</th>
                    <th>Make & Model</th>
                    <th>Year</th>
                    <th>Color</th>
                    <th>Registered Owner</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => (
                    <tr key={v.vehicle_id}>
                      <td>
                        <span className="badge bg-dark-subtle text-dark border px-2 py-1 fs-6 font-monospace">
                          {v.registration_number}
                        </span>
                      </td>
                      <td className="fw-semibold text-dark">{v.make} {v.model}</td>
                      <td>{v.year}</td>
                      <td>
                        {v.color ? (
                          <span className="badge bg-light text-secondary border">{v.color}</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <i className="bi bi-person text-secondary me-1"></i>
                        {v.customer_name || `Customer #${v.customer_id}`}
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleOpenEdit(v)}
                          title="Edit Vehicle"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setDeleteTarget(v)}
                          title="Delete Vehicle"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Vehicle Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <form onSubmit={handleSubmit}>
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold">
                    {isEditing ? 'Edit Vehicle Profile' : 'Register Vehicle to Customer'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Customer / Owner *</label>
                    <select
                      className="form-select"
                      required
                      value={formData.customer_id}
                      onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    >
                      <option value="">Select a registered customer...</option>
                      {customers.map((c) => (
                        <option key={c.customer_id} value={c.customer_id}>
                          {c.first_name} {c.last_name} ({c.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">License Plate / Registration No. *</label>
                    <input
                      type="text"
                      className="form-control font-monospace"
                      placeholder="e.g. MH-02-AB-1234"
                      required
                      value={formData.registration_number}
                      onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                    />
                    <small className="text-muted">Must be unique across the service center registry.</small>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Make (Manufacturer) *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Honda"
                        required
                        value={formData.make}
                        onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Model *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Civic"
                        required
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Manufacturing Year *</label>
                      <input
                        type="number"
                        min="1970"
                        max="2100"
                        className="form-control"
                        required
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Vehicle Color</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Metallic Grey"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : isEditing ? 'Update Vehicle' : 'Save Vehicle'}
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
        title="Delete Vehicle"
        message={`Are you sure you want to delete vehicle ${deleteTarget?.registration_number}? If this vehicle has service booking history, the foreign key constraint will block the deletion.`}
        confirmText="Confirm Delete"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
