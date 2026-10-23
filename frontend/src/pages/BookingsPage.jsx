import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import AlertMessage from '../components/AlertMessage';
import ConfirmModal from '../components/ConfirmModal';

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    booking_id: null,
    vehicle_id: '',
    booking_date: new Date().toISOString().split('T')[0],
    status: 'Pending',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Quick Invoice Generation Modal / Action
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/bookings?status=${encodeURIComponent(statusFilter)}` : '/bookings';
      const [bData, vData] = await Promise.all([api.get(url), api.get('/vehicles')]);
      setBookings(bData);
      setVehicles(vData);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      booking_id: null,
      vehicle_id: vehicles.length > 0 ? vehicles[0].vehicle_id : '',
      booking_date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (b) => {
    setIsEditing(true);
    setFormData({
      booking_id: b.booking_id,
      vehicle_id: b.vehicle_id,
      booking_date: b.booking_date,
      status: b.status,
      notes: b.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert({ type: '', message: '' });

    try {
      if (isEditing) {
        await api.put(`/bookings/${formData.booking_id}`, {
          vehicle_id: Number(formData.vehicle_id),
          booking_date: formData.booking_date,
          status: formData.status,
          notes: formData.notes || null,
        });
        setAlert({ type: 'success', message: 'Service booking updated successfully.' });
      } else {
        await api.post('/bookings', {
          vehicle_id: Number(formData.vehicle_id),
          booking_date: formData.booking_date,
          status: formData.status,
          notes: formData.notes || null,
        });
        setAlert({ type: 'success', message: 'New service appointment booked.' });
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateInvoice = async (bookingId) => {
    setInvoiceSubmitting(true);
    try {
      const inv = await api.post('/invoices', { booking_id: bookingId });
      setAlert({
        type: 'success',
        message: `Invoice #${inv.invoice_id} successfully generated for Booking #${bookingId}! Total: ₹${inv.total_amount}`,
      });
      loadData();
    } catch (err) {
      setAlert({ type: 'error', message: 'Invoice generation failed: ' + err.message });
    } finally {
      setInvoiceSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/bookings/${deleteTarget.booking_id}`);
      setAlert({ type: 'success', message: `Booking #${deleteTarget.booking_id} deleted.` });
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Completed':
        return 'bg-success';
      case 'In Progress':
        return 'bg-warning text-dark';
      case 'Pending':
        return 'bg-info text-dark';
      case 'Cancelled':
        return 'bg-secondary';
      default:
        return 'bg-light text-dark';
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Service Bookings</h2>
          <p className="text-muted small mb-0">Track and manage customer service appointments</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
          <i className="bi bi-calendar-plus me-1"></i>New Booking
        </button>
      </div>

      <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      {/* Status Filter Tabs */}
      <div className="card shadow-sm border-0 mb-4 rounded-3">
        <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="btn-group btn-group-sm" role="group">
            <button
              type="button"
              className={`btn ${statusFilter === '' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setStatusFilter('')}
            >
              All Bookings
            </button>
            <button
              type="button"
              className={`btn ${statusFilter === 'Pending' ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary'}`}
              onClick={() => setStatusFilter('Pending')}
            >
              Pending
            </button>
            <button
              type="button"
              className={`btn ${statusFilter === 'In Progress' ? 'btn-warning text-dark fw-bold' : 'btn-outline-secondary'}`}
              onClick={() => setStatusFilter('In Progress')}
            >
              In Progress
            </button>
            <button
              type="button"
              className={`btn ${statusFilter === 'Completed' ? 'btn-success fw-bold' : 'btn-outline-secondary'}`}
              onClick={() => setStatusFilter('Completed')}
            >
              Completed
            </button>
          </div>
          <span className="text-muted small">Total Found: {bookings.length}</span>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary spinner-border-sm me-2"></div>
              Loading bookings...
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-calendar-x fs-2 d-block mb-2"></i>
              No service bookings found.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-uppercase text-secondary">
                  <tr>
                    <th>Booking ID</th>
                    <th>Date</th>
                    <th>Vehicle</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Billing State</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.booking_id}>
                      <td><strong>#{b.booking_id}</strong></td>
                      <td>{b.booking_date}</td>
                      <td>
                        <span className="badge bg-light text-dark border font-monospace">
                          {b.registration_number || `Vehicle #${b.vehicle_id}`}
                        </span>
                      </td>
                      <td>
                        <div>{b.customer_name || '-'}</div>
                        <small className="text-muted">{b.customer_phone}</small>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(b.status)}`}>{b.status}</span>
                      </td>
                      <td className="small text-secondary" style={{ maxWidth: '200px' }}>
                        {b.notes || <em className="text-muted">No notes</em>}
                      </td>
                      <td>
                        {b.has_invoice ? (
                          <Link to="/invoices" className="badge bg-primary text-decoration-none p-2">
                            <i className="bi bi-receipt me-1"></i>Invoice #{b.invoice_id}
                          </Link>
                        ) : (
                          <button
                            className="btn btn-sm btn-outline-success py-1 px-2"
                            disabled={invoiceSubmitting}
                            onClick={() => handleGenerateInvoice(b.booking_id)}
                            title="Generate invoice based on labor and parts used"
                          >
                            <i className="bi bi-plus-circle me-1"></i>Create Invoice
                          </button>
                        )}
                      </td>
                      <td className="text-end">
                        <Link
                          to={`/service-details?booking_id=${b.booking_id}`}
                          className="btn btn-sm btn-outline-info me-2"
                          title="Assign Tasks & Record Parts"
                        >
                          <i className="bi bi-tools"></i> Tasks
                        </Link>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleOpenEdit(b)}
                          title="Edit Booking"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setDeleteTarget(b)}
                          title="Delete Booking"
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

      {/* Add / Edit Booking Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <form onSubmit={handleSubmit}>
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold">
                    {isEditing ? `Edit Booking #${formData.booking_id}` : 'Create New Service Booking'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Target Vehicle *</label>
                    <select
                      className="form-select font-monospace"
                      required
                      value={formData.vehicle_id}
                      onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                    >
                      <option value="">Select registered vehicle...</option>
                      {vehicles.map((v) => (
                        <option key={v.vehicle_id} value={v.vehicle_id}>
                          {v.registration_number} - {v.make} {v.model} ({v.customer_name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Appointment Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={formData.booking_date}
                        onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Booking Status *</label>
                      <select
                        className="form-select"
                        required
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Service Request Notes</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Customer reported complaints, requested inspections, or maintenance instructions"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : isEditing ? 'Update Booking' : 'Confirm Booking'}
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
        title="Delete Booking"
        message={`Are you sure you want to delete Booking #${deleteTarget?.booking_id}? If an invoice has been generated, deletion will be rejected.`}
        confirmText="Confirm Delete"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
