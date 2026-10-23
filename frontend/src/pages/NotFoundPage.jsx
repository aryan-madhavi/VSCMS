import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="text-center py-5">
      <div className="py-5">
        <i className="bi bi-compass text-muted" style={{ fontSize: '4rem' }}></i>
        <h1 className="display-4 fw-bold text-dark mt-3">404</h1>
        <p className="lead text-secondary">The page or resource you requested could not be found.</p>
        <Link to="/dashboard" className="btn btn-primary px-4 mt-2">
          <i className="bi bi-house me-2"></i>Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
