import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import StatCard from '../components/StatCard';
import AlertMessage from '../components/AlertMessage';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [outstanding, setOutstanding] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [sumData, stockData, balData] = await Promise.all([
          api.get('/reports/service-summary'),
          api.get('/reports/low-stock'),
          api.get('/reports/outstanding-balances'),
        ]);
        setSummary(sumData);
        setLowStock(stockData.slice(0, 5)); // Top 5
        setOutstanding(balData.slice(0, 5)); // Top 5
      } catch (err) {
        setError('Failed to load dashboard metrics: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading metrics...</span>
        </div>
        <p className="text-muted mt-2">Connecting to MySQL database views...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Operational Dashboard</h2>
          <p className="text-muted small mb-0">Overview of vehicle service operations, inventory, and accounts</p>
        </div>
        <div>
          <Link to="/bookings" className="btn btn-primary btn-sm me-2">
            <i className="bi bi-plus-circle me-1"></i>New Booking
          </Link>
          <Link to="/invoices" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-receipt me-1"></i>View Invoices
          </Link>
        </div>
      </div>

      <AlertMessage type="error" message={error} onClose={() => setError('')} />

      {/* KPI Stats Grid */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <StatCard
            title="Total Customers"
            value={summary?.total_customers ?? 0}
            icon="bi-people"
            color="primary"
            subtitle={`${summary?.total_vehicles ?? 0} vehicles registered`}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard
            title="Pending Bookings"
            value={summary?.pending_bookings ?? 0}
            icon="bi-hourglass-split"
            color="warning"
            subtitle={`${summary?.in_progress_bookings ?? 0} currently in progress`}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard
            title="Completed Services"
            value={summary?.completed_bookings ?? 0}
            icon="bi-check-circle"
            color="success"
            subtitle="Successfully serviced"
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard
            title="Low Stock Items"
            value={summary?.low_stock_parts_count ?? 0}
            icon="bi-exclamation-triangle"
            color={summary?.low_stock_parts_count > 0 ? 'danger' : 'success'}
            subtitle={`Out of ${summary?.total_parts_catalog ?? 0} catalog parts`}
          />
        </div>
      </div>

      {/* Financial Overview Row */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm border-0 rounded-3 p-3 bg-white">
            <span className="text-muted small text-uppercase fw-semibold">Total Invoiced Amount</span>
            <h4 className="fw-bold text-dark my-1">
              ₹{Number(summary?.total_invoiced_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h4>
            <small className="text-secondary">Gross billed across all invoices</small>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 rounded-3 p-3 bg-white">
            <span className="text-muted small text-uppercase fw-semibold">Revenue Collected</span>
            <h4 className="fw-bold text-success my-1">
              ₹{Number(summary?.total_revenue_collected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h4>
            <small className="text-secondary">Realized payments to date</small>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 rounded-3 p-3 bg-white">
            <span className="text-muted small text-uppercase fw-semibold">Outstanding Balances</span>
            <h4 className="fw-bold text-danger my-1">
              ₹{Number(summary?.total_outstanding_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h4>
            <small className="text-secondary">Pending collection from customers</small>
          </div>
        </div>
      </div>

      {/* Tables Row: Low Stock Alerts and Outstanding Invoices */}
      <div className="row g-4">
        {/* Low Stock Alerts */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 rounded-3 h-100">
            <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 text-dark">
                <i className="bi bi-box-seam text-danger me-2"></i>Low Stock Inventory Alerts
              </h5>
              <Link to="/spare-parts" className="btn btn-sm btn-link text-decoration-none">
                View All Parts
              </Link>
            </div>
            <div className="card-body p-0">
              {lowStock.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  <i className="bi bi-check-all text-success fs-3 d-block mb-1"></i>
                  All inventory stock levels are healthy.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light small text-uppercase text-secondary">
                      <tr>
                        <th>Part Name</th>
                        <th>Part No.</th>
                        <th className="text-center">Current Stock</th>
                        <th className="text-center">Reorder Level</th>
                        <th>Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStock.map((item) => (
                        <tr key={item.part_id}>
                          <td className="fw-semibold">{item.part_name}</td>
                          <td><code>{item.part_number}</code></td>
                          <td className="text-center fw-bold text-danger">{item.stock_quantity}</td>
                          <td className="text-center text-muted">{item.reorder_level}</td>
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
          </div>
        </div>

        {/* Outstanding Payment Balances */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 rounded-3 h-100">
            <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 text-dark">
                <i className="bi bi-cash-stack text-warning me-2"></i>Pending Customer Balances
              </h5>
              <Link to="/reports" className="btn btn-sm btn-link text-decoration-none">
                Full Report
              </Link>
            </div>
            <div className="card-body p-0">
              {outstanding.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  <i className="bi bi-check2-circle text-success fs-3 d-block mb-1"></i>
                  No outstanding receivables! All invoices are fully paid.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light small text-uppercase text-secondary">
                      <tr>
                        <th>Invoice</th>
                        <th>Customer</th>
                        <th>Vehicle</th>
                        <th className="text-end">Balance Due</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outstanding.map((item) => (
                        <tr key={item.invoice_id}>
                          <td><strong>#{item.invoice_id}</strong></td>
                          <td>
                            <div>{item.customer_name}</div>
                            <small className="text-muted">{item.customer_phone}</small>
                          </td>
                          <td><code>{item.registration_number}</code></td>
                          <td className="text-end fw-bold text-danger">
                            ₹{Number(item.balance_due).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                item.payment_status === 'Partially Paid' ? 'bg-warning text-dark' : 'bg-danger'
                              }`}
                            >
                              {item.payment_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
