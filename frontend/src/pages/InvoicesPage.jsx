import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import AlertMessage from '../components/AlertMessage';
import ConfirmModal from '../components/ConfirmModal';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [bookingsWithoutInvoice, setBookingsWithoutInvoice] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Invoice Details & Payment Modal
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [invoicePayments, setInvoicePayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // New Payment Form within modal
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Quick Generate Invoice Modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedBookingToInvoice, setSelectedBookingToInvoice] = useState('');
  const [generating, setGenerating] = useState(false);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/invoices?status=${encodeURIComponent(statusFilter)}` : '/invoices';
      const [invData, bData] = await Promise.all([api.get(url), api.get('/bookings')]);
      setInvoices(invData);
      // Filter bookings that do not have an invoice yet
      const uninvoiced = bData.filter((b) => !b.has_invoice && b.status !== 'Cancelled');
      setBookingsWithoutInvoice(uninvoiced);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  const handleOpenDetails = async (inv) => {
    setActiveInvoice(inv);
    setPaymentAmount(inv.balance_due > 0 ? String(inv.balance_due) : '');
    setPaymentRef('');
    setPaymentsLoading(true);
    try {
      const pmts = await api.get(`/payments?invoice_id=${inv.invoice_id}`);
      setInvoicePayments(pmts);
    } catch (err) {
      console.error('Failed to load invoice payments:', err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      setAlert({ type: 'error', message: 'Please enter a valid positive payment amount.' });
      return;
    }

    setPaymentSubmitting(true);
    setAlert({ type: '', message: '' });

    try {
      await api.post('/payments', {
        invoice_id: activeInvoice.invoice_id,
        amount_paid: Number(paymentAmount),
        payment_method: paymentMethod,
        transaction_reference: paymentRef || null,
      });

      // Reload active invoice and payment list
      const updatedInv = await api.get(`/invoices/${activeInvoice.invoice_id}`);
      const updatedPmts = await api.get(`/payments?invoice_id=${activeInvoice.invoice_id}`);
      setActiveInvoice(updatedInv);
      setInvoicePayments(updatedPmts);
      setPaymentAmount(updatedInv.balance_due > 0 ? String(updatedInv.balance_due) : '');
      setPaymentRef('');
      setAlert({
        type: 'success',
        message: `Payment of ₹${paymentAmount} logged. Database trigger updated status to '${updatedInv.status}'!`,
      });
      loadInvoices();
    } catch (err) {
      setAlert({ type: 'error', message: 'Payment failed: ' + err.message });
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    if (!selectedBookingToInvoice) return;
    setGenerating(true);
    setAlert({ type: '', message: '' });

    try {
      const inv = await api.post('/invoices', {
        booking_id: Number(selectedBookingToInvoice),
      });
      setAlert({
        type: 'success',
        message: `Invoice #${inv.invoice_id} successfully created! Total: ₹${inv.total_amount}`,
      });
      setShowGenerateModal(false);
      loadInvoices();
    } catch (err) {
      setAlert({ type: 'error', message: 'Generation failed: ' + err.message });
    } finally {
      setGenerating(false);
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Paid':
        return 'bg-success';
      case 'Partially Paid':
        return 'bg-warning text-dark';
      case 'Unpaid':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Customer Invoices & Billing</h2>
          <p className="text-muted small mb-0">Track billed service amounts, taxes, received payments, and balances</p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            setSelectedBookingToInvoice(
              bookingsWithoutInvoice.length > 0 ? bookingsWithoutInvoice[0].booking_id : ''
            );
            setShowGenerateModal(true);
          }}
          disabled={bookingsWithoutInvoice.length === 0}
        >
          <i className="bi bi-file-earmark-plus me-1"></i>Generate Invoice
        </button>
      </div>

      <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      {/* Filter Tabs */}
      <div className="card shadow-sm border-0 mb-4 rounded-3">
        <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="btn-group btn-group-sm" role="group">
            <button
              type="button"
              className={`btn ${statusFilter === '' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setStatusFilter('')}
            >
              All Invoices
            </button>
            <button
              type="button"
              className={`btn ${statusFilter === 'Unpaid' ? 'btn-danger fw-bold' : 'btn-outline-secondary'}`}
              onClick={() => setStatusFilter('Unpaid')}
            >
              Unpaid
            </button>
            <button
              type="button"
              className={`btn ${statusFilter === 'Partially Paid' ? 'btn-warning text-dark fw-bold' : 'btn-outline-secondary'}`}
              onClick={() => setStatusFilter('Partially Paid')}
            >
              Partially Paid
            </button>
            <button
              type="button"
              className={`btn ${statusFilter === 'Paid' ? 'btn-success fw-bold' : 'btn-outline-secondary'}`}
              onClick={() => setStatusFilter('Paid')}
            >
              Paid
            </button>
          </div>
          <span className="text-muted small">Total Invoices: {invoices.length}</span>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary spinner-border-sm me-2"></div>
              Loading invoices...
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-receipt fs-2 d-block mb-2"></i>
              No invoice records found.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-uppercase text-secondary">
                  <tr>
                    <th>Invoice ID</th>
                    <th>Invoice Date</th>
                    <th>Customer & Vehicle</th>
                    <th className="text-end">Labor</th>
                    <th className="text-end">Parts</th>
                    <th className="text-end">Tax (18%)</th>
                    <th className="text-end">Grand Total</th>
                    <th className="text-end">Paid Amount</th>
                    <th className="text-end">Balance Due</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.invoice_id}>
                      <td><strong>#{inv.invoice_id}</strong></td>
                      <td>{inv.invoice_date}</td>
                      <td>
                        <div className="fw-semibold text-dark">{inv.customer_name}</div>
                        <small className="text-muted font-monospace">{inv.registration_number}</small>
                      </td>
                      <td className="text-end">₹{Number(inv.labor_amount).toFixed(2)}</td>
                      <td className="text-end">₹{Number(inv.parts_amount).toFixed(2)}</td>
                      <td className="text-end text-secondary">₹{Number(inv.tax_amount).toFixed(2)}</td>
                      <td className="text-end fw-bold text-dark">
                        ₹{Number(inv.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-end text-success fw-semibold">
                        ₹{Number(inv.total_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-end fw-bold text-danger">
                        ₹{Number(inv.balance_due || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(inv.status)}`}>{inv.status}</span>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-primary py-1 px-2"
                          onClick={() => handleOpenDetails(inv)}
                        >
                          <i className="bi bi-cash me-1"></i>Pay / Details
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

      {/* Invoice Details & Multiple Payment Modal */}
      {activeInvoice && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <div className="modal-header border-bottom">
                <div>
                  <h5 className="modal-title fw-bold mb-0">
                    Invoice #{activeInvoice.invoice_id} - Billing & Payment History
                  </h5>
                  <small className="text-muted">
                    Customer: {activeInvoice.customer_name} | Vehicle: {activeInvoice.registration_number}
                  </small>
                </div>
                <button type="button" className="btn-close" onClick={() => setActiveInvoice(null)}></button>
              </div>

              <div className="modal-body">
                {/* Financial Breakdown Cards */}
                <div className="row g-2 mb-4 text-center">
                  <div className="col-3">
                    <div className="p-2 border rounded bg-light">
                      <small className="text-muted d-block">Labor Total</small>
                      <strong className="text-dark">₹{Number(activeInvoice.labor_amount).toFixed(2)}</strong>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="p-2 border rounded bg-light">
                      <small className="text-muted d-block">Parts Total</small>
                      <strong className="text-dark">₹{Number(activeInvoice.parts_amount).toFixed(2)}</strong>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="p-2 border rounded bg-light">
                      <small className="text-muted d-block">Tax (GST 18%)</small>
                      <strong className="text-secondary">₹{Number(activeInvoice.tax_amount).toFixed(2)}</strong>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="p-2 border rounded bg-primary-subtle text-primary border-primary-subtle">
                      <small className="d-block fw-semibold">Grand Total</small>
                      <strong className="fs-6">₹{Number(activeInvoice.total_amount).toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <div className="p-3 border rounded text-center bg-light">
                      <span className="text-muted small d-block">Cumulative Amount Paid</span>
                      <h4 className="fw-bold text-success mb-0">
                        ₹{Number(activeInvoice.total_paid || 0).toFixed(2)}
                      </h4>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 border rounded text-center bg-light">
                      <span className="text-muted small d-block">Outstanding Balance Due</span>
                      <h4 className="fw-bold text-danger mb-0">
                        ₹{Number(activeInvoice.balance_due || 0).toFixed(2)}
                      </h4>
                    </div>
                  </div>
                </div>

                {/* Record New Payment Form (if balance remains) */}
                {Number(activeInvoice.balance_due) > 0 ? (
                  <div className="card shadow-sm border-0 mb-4 bg-light">
                    <div className="card-body p-3">
                      <h6 className="fw-bold mb-3 text-dark">
                        <i className="bi bi-wallet2 text-success me-2"></i>Record New Payment
                      </h6>
                      <form onSubmit={handleRecordPayment}>
                        <div className="row g-2">
                          <div className="col-md-4">
                            <label className="form-label small fw-semibold">Amount to Pay (₹) *</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              max={Number(activeInvoice.balance_due)}
                              className="form-control form-control-sm"
                              required
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label small fw-semibold">Payment Method *</label>
                            <select
                              className="form-select form-select-sm"
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                            >
                              <option value="Cash">Cash</option>
                              <option value="UPI">UPI</option>
                              <option value="Credit Card">Credit Card</option>
                              <option value="Debit Card">Debit Card</option>
                              <option value="Bank Transfer">Bank Transfer</option>
                            </select>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label small fw-semibold">Transaction Reference</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="e.g. UPI/2026/TXN-101"
                              value={paymentRef}
                              onChange={(e) => setPaymentRef(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="mt-3 text-end">
                          <button
                            type="submit"
                            className="btn btn-sm btn-success px-3"
                            disabled={paymentSubmitting}
                          >
                            {paymentSubmitting ? 'Recording Payment...' : 'Submit Payment'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-success d-flex align-items-center mb-4">
                    <i className="bi bi-check-circle-fill fs-4 me-2"></i>
                    <div>
                      <strong>Invoice Fully Settled!</strong> All dues have been collected. Status is <strong>Paid</strong>.
                    </div>
                  </div>
                )}

                {/* Historical Payments Table */}
                <h6 className="fw-bold mb-2 text-secondary" style={{ fontSize: '0.85rem' }}>
                  <i className="bi bi-clock-history me-1"></i>TRANSACTION HISTORY ({invoicePayments.length})
                </h6>
                {paymentsLoading ? (
                  <div className="text-center py-3 text-muted">Loading payments...</div>
                ) : invoicePayments.length === 0 ? (
                  <div className="text-muted small fst-italic">No payments recorded yet for this invoice.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered align-middle mb-0 bg-white">
                      <thead className="table-light small text-secondary">
                        <tr>
                          <th>Payment ID</th>
                          <th>Payment Date</th>
                          <th>Method</th>
                          <th>Reference Code</th>
                          <th className="text-end">Amount Paid</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoicePayments.map((p) => (
                          <tr key={p.payment_id}>
                            <td>#{p.payment_id}</td>
                            <td>{p.payment_date}</td>
                            <td><span className="badge bg-light text-dark border">{p.payment_method}</span></td>
                            <td><code>{p.transaction_reference || 'N/A'}</code></td>
                            <td className="text-end fw-bold text-success">
                              ₹{Number(p.amount_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="modal-footer border-top">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveInvoice(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Invoice Modal */}
      {showGenerateModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <form onSubmit={handleGenerateInvoice}>
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold">Generate Service Invoice</h5>
                  <button type="button" className="btn-close" onClick={() => setShowGenerateModal(false)}></button>
                </div>
                <div className="modal-body">
                  <p className="text-muted small">
                    Select a completed service booking to compile labor charges, spare parts usage, and 18% GST into an official invoice.
                  </p>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Select Uninvoiced Booking *</label>
                    <select
                      className="form-select"
                      required
                      value={selectedBookingToInvoice}
                      onChange={(e) => setSelectedBookingToInvoice(e.target.value)}
                    >
                      <option value="">Select booking...</option>
                      {bookingsWithoutInvoice.map((b) => (
                        <option key={b.booking_id} value={b.booking_id}>
                          Booking #{b.booking_id} - {b.registration_number} ({b.customer_name}) [{b.status}]
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowGenerateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={generating || !selectedBookingToInvoice}>
                    {generating ? 'Generating Invoice...' : 'Generate Invoice'}
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
