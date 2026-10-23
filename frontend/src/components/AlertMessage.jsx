import React from 'react';

export default function AlertMessage({ type = 'info', message, onClose }) {
  if (!message) return null;

  const alertClass = {
    success: 'alert-success',
    error: 'alert-danger',
    warning: 'alert-warning',
    info: 'alert-info',
  }[type] || 'alert-info';

  const iconClass = {
    success: 'bi-check-circle-fill',
    error: 'bi-exclamation-triangle-fill',
    warning: 'bi-exclamation-circle-fill',
    info: 'bi-info-circle-fill',
  }[type] || 'bi-info-circle-fill';

  return (
    <div className={`alert ${alertClass} alert-dismissible fade show d-flex align-items-center shadow-sm mb-3`} role="alert">
      <i className={`bi ${iconClass} me-2 fs-5`}></i>
      <div className="flex-grow-1">{message}</div>
      {onClose && (
        <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
      )}
    </div>
  );
}
