import React from 'react';

export default function StatCard({ title, value, icon, color = 'primary', subtitle }) {
  return (
    <div className="card shadow-sm border-0 h-100 rounded-3">
      <div className="card-body p-3">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <span className="text-muted small text-uppercase fw-semibold">{title}</span>
            <h3 className="fw-bold my-1 text-dark">{value}</h3>
            {subtitle && <small className="text-secondary">{subtitle}</small>}
          </div>
          <div
            className={`d-flex align-items-center justify-content-center rounded-circle bg-${color}-subtle text-${color}`}
            style={{ width: '48px', height: '48px' }}
          >
            <i className={`bi ${icon} fs-4`}></i>
          </div>
        </div>
      </div>
    </div>
  );
}
