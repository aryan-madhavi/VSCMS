import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import AlertMessage from '../components/AlertMessage';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('history');
  const [historyData, setHistoryData] = useState([]);
  const [lowStockData, setLowStockData] = useState([]);
  const [balancesData, setBalancesData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const [hist, stock, bal, sum] = await Promise.all([
          api.get('/reports/service-history'),
          api.get('/reports/low-stock'),
          api.get('/reports/outstanding-balances'),
          api.get('/reports/service-summary'),
        ]);
        setHistoryData(hist);
        setLowStockData(stock);
        setBalancesData(bal);
        setSummaryData(sum);
      } catch (err) {
        setAlert({ type: 'error', message: 'Failed to query database views: ' + err.message });
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Analytical Reports & Database Views</h2>
          <p className="text-muted small mb-0">Ground-truth reporting powered by pre-compiled MySQL views</p>
        </div>
      </div>

      <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      {/* Nav Tabs */}
      <ul className="nav nav-pills mb-4 gap-2 bg-white p-2 rounded-3 shadow-sm border">
        <li className="nav-item">
          <button
            className={`nav-link btn-sm ${activeTab === 'history' ? 'active fw-bold' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <i className="bi bi-clock-history me-1"></i>Service History (<code>view_service_history</code>)
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link btn-sm ${activeTab === 'low_stock' ? 'active fw-bold' : ''}`}
            onClick={() => setActiveTab('low_stock')}
          >
            <i className="bi bi-exclamation-triangle me-1"></i>Low Stock Alerts (<code>view_low_stock_alerts</code>)
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link btn-sm ${activeTab === 'balances' ? 'active fw-bold' : ''}`}
            onClick={() => setActiveTab('balances')}
          >
            <i className="bi bi-cash-stack me-1"></i>Outstanding Balances (<code>view_outstanding_balances</code>)
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link btn-sm ${activeTab === 'summary' ? 'active fw-bold' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            <i className="bi bi-pie-chart me-1"></i>KPI Summary (<code>view_service_summary</code>)
          </button>
        </li>
      </ul>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary spinner-border-sm me-2"></div>
          Executing view queries in MySQL...
        </div>
      ) : (
        <div className="card shadow-sm border-0 rounded-3">
          <div className="card-body p-0">
            {/* TAB 1: Service History View */}
            {activeTab === 'history' && (
              <div>
                <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
                  <span className="small text-secondary fw-semibold">
                    MySQL View: <code>view_service_history</code> (Joined: Customer, Vehicle, Booking, Details, Mechanic, Parts)
                  </span>
                  <span className="badge bg-secondary">{historyData.length} Records</span>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light small text-uppercase text-secondary">
                      <tr>
                        <th>Booking ID</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Vehicle</th>
                        <th>Service Type</th>
                        <th>Mechanic</th>
                        <th className="text-end">Labor</th>
                        <th className="text-end">Parts</th>
                        <th className="text-end">Task Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map((row, idx) => (
                        <tr key={`${row.booking_id}-${row.service_detail_id || idx}`}>
                          <td><strong>#{row.booking_id}</strong></td>
                          <td>{row.booking_date}</td>
                          <td>
                            <div className="fw-semibold">{row.customer_name}</div>
                            <small className="text-muted">{row.customer_phone}</small>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border font-monospace">
                              {row.registration_number}
                            </span>
                          </td>
                          <td>{row.service_type || '-'}</td>
                          <td>{row.mechanic_name || '-'}</td>
                          <td className="text-end">₹{Number(row.labor_cost || 0).toFixed(2)}</td>
                          <td className="text-end">₹{Number(row.parts_cost || 0).toFixed(2)}</td>
                          <td className="text-end fw-bold text-dark">
                            ₹{Number(row.total_detail_cost || 0).toFixed(2)}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                row.booking_status === 'Completed'
                                  ? 'bg-success'
                                  : row.booking_status === 'In Progress'
                                  ? 'bg-warning text-dark'
                                  : 'bg-secondary'
                              }`}
                            >
                              {row.booking_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: Low Stock Alerts View */}
            {activeTab === 'low_stock' && (
              <div>
                <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
                  <span className="small text-secondary fw-semibold">
                    MySQL View: <code>view_low_stock_alerts</code> (Calculates Shortage = Reorder Level - Stock)
                  </span>
                  <span className="badge bg-danger">{lowStockData.length} Alert Items</span>
                </div>
                {lowStockData.length === 0 ? (
                  <div className="p-5 text-center text-muted">
                    <i className="bi bi-check-circle-fill text-success fs-2 d-block mb-2"></i>
                    All spare part inventory levels exceed reorder thresholds.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light small text-uppercase text-secondary">
                        <tr>
                          <th>Part ID</th>
                          <th>Part Number</th>
                          <th>Part Name</th>
                          <th className="text-end">Unit Price</th>
                          <th className="text-center">Current Stock</th>
                          <th className="text-center">Reorder Threshold</th>
                          <th className="text-center">Shortage</th>
                          <th>Alert Severity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStockData.map((item) => (
                          <tr key={item.part_id}>
                            <td>#{item.part_id}</td>
                            <td><code>{item.part_number}</code></td>
                            <td className="fw-semibold text-dark">{item.part_name}</td>
                            <td className="text-end">₹{Number(item.unit_price).toFixed(2)}</td>
                            <td className="text-center fw-bold text-danger fs-6">{item.stock_quantity}</td>
                            <td className="text-center text-muted">{item.reorder_level}</td>
                            <td className="text-center fw-bold text-danger">+{item.shortage_quantity}</td>
                            <td>
                              <span
                                className={`badge ${
                                  item.alert_severity === 'OUT_OF_STOCK'
                                    ? 'bg-danger'
                                    : item.alert_severity === 'CRITICAL'
                                    ? 'bg-warning text-dark'
                                    : 'bg-secondary'
                                }`}
                              >
                                {item.alert_severity}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Outstanding Balances View */}
            {activeTab === 'balances' && (
              <div>
                <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
                  <span className="small text-secondary fw-semibold">
                    MySQL View: <code>view_outstanding_balances</code> (Filters: balance_due &gt; 0)
                  </span>
                  <span className="badge bg-warning text-dark">{balancesData.length} Pending Collections</span>
                </div>
                {balancesData.length === 0 ? (
                  <div className="p-5 text-center text-muted">
                    <i className="bi bi-check-circle-fill text-success fs-2 d-block mb-2"></i>
                    No outstanding accounts receivable!
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light small text-uppercase text-secondary">
                        <tr>
                          <th>Invoice ID</th>
                          <th>Invoice Date</th>
                          <th>Customer Name</th>
                          <th>Phone Number</th>
                          <th>Vehicle Plate</th>
                          <th className="text-end">Total Invoiced</th>
                          <th className="text-end">Amount Paid</th>
                          <th className="text-end">Balance Due</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {balancesData.map((b) => (
                          <tr key={b.invoice_id}>
                            <td><strong>#{b.invoice_id}</strong></td>
                            <td>{b.invoice_date}</td>
                            <td className="fw-semibold">{b.customer_name}</td>
                            <td>
                              <a href={`tel:${b.customer_phone}`} className="text-decoration-none">
                                <i className="bi bi-telephone text-primary me-1"></i>{b.customer_phone}
                              </a>
                            </td>
                            <td><code>{b.registration_number}</code></td>
                            <td className="text-end">₹{Number(b.total_amount).toFixed(2)}</td>
                            <td className="text-end text-success">₹{Number(b.total_paid).toFixed(2)}</td>
                            <td className="text-end fw-bold text-danger fs-6">
                              ₹{Number(b.balance_due).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  b.payment_status === 'Partially Paid' ? 'bg-warning text-dark' : 'bg-danger'
                                }`}
                              >
                                {b.payment_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Service Summary View */}
            {activeTab === 'summary' && summaryData && (
              <div className="p-4">
                <div className="mb-4">
                  <span className="small text-secondary fw-semibold">
                    MySQL View: <code>view_service_summary</code> (Multi-table KPI Aggregates)
                  </span>
                </div>
                <div className="row g-3">
                  <div className="col-md-3">
                    <div className="p-3 border rounded text-center bg-light">
                      <span className="text-muted small text-uppercase d-block">Registered Customers</span>
                      <h3 className="fw-bold text-primary my-1">{summaryData.total_customers}</h3>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="p-3 border rounded text-center bg-light">
                      <span className="text-muted small text-uppercase d-block">Registered Vehicles</span>
                      <h3 className="fw-bold text-primary my-1">{summaryData.total_vehicles}</h3>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="p-3 border rounded text-center bg-light">
                      <span className="text-muted small text-uppercase d-block">Total Bookings</span>
                      <h3 className="fw-bold text-dark my-1">{summaryData.total_bookings}</h3>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="p-3 border rounded text-center bg-light">
                      <span className="text-muted small text-uppercase d-block">Completed Jobs</span>
                      <h3 className="fw-bold text-success my-1">{summaryData.completed_bookings}</h3>
                    </div>
                  </div>
                </div>

                <div className="row g-3 mt-3">
                  <div className="col-md-4">
                    <div className="p-3 border rounded text-center bg-light">
                      <span className="text-muted small text-uppercase d-block">Gross Invoiced Revenue</span>
                      <h4 className="fw-bold text-dark my-1">
                        ₹{Number(summaryData.total_invoiced_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </h4>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 border rounded text-center bg-light">
                      <span className="text-muted small text-uppercase d-block">Realized Cash Collections</span>
                      <h4 className="fw-bold text-success my-1">
                        ₹{Number(summaryData.total_revenue_collected).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </h4>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 border rounded text-center bg-light">
                      <span className="text-muted small text-uppercase d-block">Total Accounts Receivable</span>
                      <h4 className="fw-bold text-danger my-1">
                        ₹{Number(summaryData.total_outstanding_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
