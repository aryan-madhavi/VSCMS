import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import AlertMessage from '../components/AlertMessage';
import ConfirmModal from '../components/ConfirmModal';

export default function SparePartsPage() {
  const { isAdmin } = useAuth();
  const [parts, setParts] = useState([]);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    part_id: null,
    part_name: '',
    part_number: '',
    unit_price: '0.00',
    stock_quantity: 10,
    reorder_level: 5,
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadParts = async () => {
    try {
      setLoading(true);
      let url = '/spare-parts?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (lowStockOnly) url += `low_stock_only=true&`;
      const data = await api.get(url);
      setParts(data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParts();
  }, [search, lowStockOnly]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      part_id: null,
      part_name: '',
      part_number: '',
      unit_price: '500.00',
      stock_quantity: 20,
      reorder_level: 5,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setIsEditing(true);
    setFormData({
      part_id: p.part_id,
      part_name: p.part_name,
      part_number: p.part_number,
      unit_price: p.unit_price,
      stock_quantity: p.stock_quantity,
      reorder_level: p.reorder_level,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert({ type: '', message: '' });

    try {
      if (isEditing) {
        await api.put(`/spare-parts/${formData.part_id}`, {
          part_name: formData.part_name.trim(),
          part_number: formData.part_number.trim().toUpperCase(),
          unit_price: Number(formData.unit_price),
          stock_quantity: Number(formData.stock_quantity),
          reorder_level: Number(formData.reorder_level),
        });
        setAlert({ type: 'success', message: 'Spare part updated successfully.' });
      } else {
        await api.post('/spare-parts', {
          part_name: formData.part_name.trim(),
          part_number: formData.part_number.trim().toUpperCase(),
          unit_price: Number(formData.unit_price),
          stock_quantity: Number(formData.stock_quantity),
          reorder_level: Number(formData.reorder_level),
        });
        setAlert({ type: 'success', message: 'New spare part added to catalog.' });
      }
      setShowModal(false);
      loadParts();
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
      await api.delete(`/spare-parts/${deleteTarget.part_id}`);
      setAlert({ type: 'success', message: `Part '${deleteTarget.part_name}' deleted.` });
      setDeleteTarget(null);
      loadParts();
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
          <h2 className="fw-bold mb-1">Spare Parts Inventory</h2>
          <p className="text-muted small mb-0">Track real-time inventory counts, unit pricing, and low stock thresholds</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
          <i className="bi bi-plus-lg me-1"></i>Add New Part
        </button>
      </div>

      <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      {/* Filter / Search Bar */}
      <div className="card shadow-sm border-0 mb-4 rounded-3">
        <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="input-group" style={{ maxWidth: '400px' }}>
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search by part name or part number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="form-check form-switch mb-0">
            <input
              className="form-check-input"
              type="checkbox"
              id="lowStockCheck"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
            />
            <label className="form-check-label fw-semibold text-danger small" htmlFor="lowStockCheck">
              <i className="bi bi-exclamation-triangle-fill me-1"></i>Low Stock Items Only
            </label>
          </div>
        </div>
      </div>

      {/* Spare Parts Table */}
      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary spinner-border-sm me-2"></div>
              Loading parts catalog...
            </div>
          ) : parts.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-box-seam fs-2 d-block mb-2"></i>
              No spare parts found matching current filters.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-uppercase text-secondary">
                  <tr>
                    <th>Part No.</th>
                    <th>Part Name</th>
                    <th className="text-end">Unit Price</th>
                    <th className="text-center">Stock Quantity</th>
                    <th className="text-center">Reorder Level</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {parts.map((p) => {
                    const isOutOfStock = p.stock_quantity === 0;
                    const isLow = p.stock_quantity <= p.reorder_level;
                    return (
                      <tr key={p.part_id} className={isOutOfStock ? 'table-danger' : isLow ? 'table-warning' : ''}>
                        <td>
                          <span className="badge bg-light text-dark border font-monospace">
                            {p.part_number}
                          </span>
                        </td>
                        <td className="fw-semibold text-dark">{p.part_name}</td>
                        <td className="text-end fw-bold">
                          ₹{Number(p.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="text-center">
                          <span className={`fw-bold fs-6 ${isOutOfStock ? 'text-danger' : isLow ? 'text-warning' : 'text-success'}`}>
                            {p.stock_quantity}
                          </span>
                        </td>
                        <td className="text-center text-muted">{p.reorder_level}</td>
                        <td>
                          {isOutOfStock ? (
                            <span className="badge bg-danger">Out of Stock</span>
                          ) : isLow ? (
                            <span className="badge bg-warning text-dark">Low Stock Alert</span>
                          ) : (
                            <span className="badge bg-success-subtle text-success border border-success-subtle">
                              Healthy
                            </span>
                          )}
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Part / Restock"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          {isAdmin && (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => setDeleteTarget(p)}
                              title="Delete Part"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
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

      {/* Add / Edit Part Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <form onSubmit={handleSubmit}>
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold">
                    {isEditing ? `Edit Part [${formData.part_number}]` : 'Add New Spare Part'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Part Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Synthetic Engine Oil 5W-30"
                      required
                      value={formData.part_name}
                      onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Part Number (Unique Identifier) *</label>
                    <input
                      type="text"
                      className="form-control font-monospace"
                      placeholder="e.g. OIL-5W30"
                      required
                      value={formData.part_number}
                      onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                    />
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-4">
                      <label className="form-label small fw-semibold">Unit Price (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        required
                        value={formData.unit_price}
                        onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label small fw-semibold">Current Stock *</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        required
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label small fw-semibold">Reorder Level *</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        required
                        value={formData.reorder_level}
                        onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : isEditing ? 'Update Part' : 'Save Part'}
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
        title="Delete Spare Part"
        message={`Are you sure you want to delete '${deleteTarget?.part_name}' (${deleteTarget?.part_number})? If this part appears in historical service jobs, foreign key integrity will prevent its deletion.`}
        confirmText="Confirm Delete"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
