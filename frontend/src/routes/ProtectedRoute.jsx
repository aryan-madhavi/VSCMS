import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger shadow-sm d-inline-block text-start p-4">
          <h4 className="alert-heading fw-bold">
            <i className="bi bi-shield-x me-2"></i>Access Denied
          </h4>
          <p className="mb-0">
            This module requires <strong>{requiredRole}</strong> privileges. Your current role is <strong>{role}</strong>.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
