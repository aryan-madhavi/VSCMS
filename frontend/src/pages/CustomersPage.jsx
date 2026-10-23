import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import AlertMessage from '../components/AlertMessage';
import ConfirmModal from '../components/ConfirmModal';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: null,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const url = search ? `/customers?search=${encodeURIComponent(search)}` : '/customers';
      const data = await api.get(url);
      setCustomers(data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      customer_id: null,
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (c) => {
    setIsEditing(true);
    setFormData({
      customer_id: c.customer_id,
      first_name: c.first_name,
      last_name: c.last_name,
      email: c.email || '',
      phone: c.phone,
      address: c.address || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert({ type: '', message: '' });

    try {
      if (isEditing) {
        await api.put(`/customers/${formData.customer_id}`, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email || null,
          phone: formData.phone,
          address: formData.address || null,
        });
        setAlert({ type: 'success', message: 'Customer updated successfully.' });
      } else {
        await api.post('/customers', {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email || null,
          phone: formData.phone,
          address: formData.address || null,
        });
        setAlert({ type: 'success', message: 'Customer registered successfully.' });
      }
      setShowModal(false);
      loadCustomers();
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
      await api.delete(`/customers/${deleteTarget.customer_id}`);
      setAlert({ type: 'success', message: `Customer '${deleteTarget.first_name} ${deleteTarget.last_name}' deleted.` });
      setDeleteTarget(null);
      loadCustomers();
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
          <h2 className="fw-bold mb-1">Customer Management</h2>
          <p className="text-muted small mb-0">Manage vehicle owners and contact records</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
          <i className="bi bi-person-plus me-1"></i>Add Customer
        </button>
      </div>

      <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      {/* Search and Filters Bar */}
      <div className="card shadow-sm border-0 mb-4 rounded-3">
        <div className="card-body p-3">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search by customer name, phone number, or email..."
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

      {/* Customers Table */}
      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary spinner-border-sm me-2"></div>
              Loading customers...
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-person-slash fs-2 d-block mb-2"></i>
              No customer records found.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-uppercase text-secondary">
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Contact Phone</th>
                    <th>Email Address</th>
                    <th>Billing Address</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.customer_id}>
                      <td><span className="badge bg-light text-dark border">#{c.customer_id}</span></td>
                      <td className="fw-bold text-dark">{c.first_name} {c.last_name}</td>
                      <td>
                        <a href={`tel:${c.phone}`} className="text-decoration-none text-dark">
                          <i className="bi bi-telephone text-primary me-1"></i>{c.phone}
                        </a>
                      </td>
                      <td>{c.email ? <span className="text-muted">{c.email}</span> : <em className="text-muted small">None</em>}</td>
                      <td className="small text-secondary" style={{ maxWidth: '250px' }}>{c.address || '-'}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleOpenEdit(c)}
                          title="Edit Customer"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setDeleteTarget(c)}
                          title="Delete Customer"
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

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <form onSubmit={handleSubmit}>
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold">
                    {isEditing ? 'Edit Customer Profile' : 'Register New Customer'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">First Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Last Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
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
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Email Address (Optional)</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Street / City Address</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Address details"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : isEditing ? 'Update Customer' : 'Save Customer'}
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
        title="Delete Customer"
        message={`Are you sure you want to delete customer '${deleteTarget?.first_name} ${deleteTarget?.last_name}'? If vehicles are registered to this customer, the database referential integrity constraint will reject the deletion.`}
        confirmText="Confirm Delete"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
