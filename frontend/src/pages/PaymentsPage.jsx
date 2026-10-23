import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import AlertMessage from '../components/AlertMessage';
import ConfirmModal from '../components/ConfirmModal';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Delete Target
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await api.get('/payments');
      setPayments(data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/payments/${deleteTarget.payment_id}`);
      setAlert({ type: 'success', message: res.message });
      setDeleteTarget(null);
      loadPayments();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const filteredPayments = methodFilter
    ? payments.filter((p) => p.payment_method === methodFilter)
    : payments;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Customer Payment Records</h2>
          <p className="text-muted small mb-0">Audit ledger of all transactions received against service invoices</p>
        </div>
      </div>

      <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      {/* Method Filter */}
      <div className="card shadow-sm border-0 mb-4 rounded-3">
        <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-2">
            <label className="fw-semibold small text-nowrap">Filter Payment Method:</label>
            <select
              className="form-select form-select-sm"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              style={{ width: '180px' }}
            >
              <option value="">All Payment Modes</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
          <span className="text-muted small">Total Transactions: {filteredPayments.length}</span>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary spinner-border-sm me-2"></div>
              Loading payment ledger...
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-cash-stack fs-2 d-block mb-2"></i>
              No payment transactions found.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-uppercase text-secondary">
                  <tr>
                    <th>Payment ID</th>
                    <th>Payment Date</th>
                    <th>Linked Invoice</th>
                    <th>Payment Method</th>
                    <th>Transaction Reference</th>
                    <th className="text-end">Amount Paid</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => (
                    <tr key={p.payment_id}>
                      <td><strong>#{p.payment_id}</strong></td>
                      <td>{p.payment_date}</td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          Invoice #{p.invoice_id}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary-emphasis border">
                          {p.payment_method}
                        </span>
                      </td>
                      <td><code>{p.transaction_reference || 'N/A'}</code></td>
                      <td className="text-end fw-bold text-success">
                        ₹{Number(p.amount_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setDeleteTarget(p)}
                          title="Void Payment Record"
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Void Payment Record"
        message={`Are you sure you want to delete Payment #${deleteTarget?.payment_id} (₹${deleteTarget?.amount_paid})? The database trigger 'trg_payment_after_delete' will automatically recalculate Invoice #${deleteTarget?.invoice_id} status.`}
        confirmText="Confirm Void"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
