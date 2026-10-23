import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import AlertMessage from '../components/AlertMessage';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-dark py-5 px-3">
      <div className="card shadow-lg border-0 rounded-4" style={{ maxWidth: '440px', width: '100%' }}>
        <div className="card-body p-4 p-sm-5">
          <div className="text-center mb-4">
            <div
              className="d-inline-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-circle mb-3 shadow-sm"
              style={{ width: '64px', height: '64px' }}
            >
              <i className="bi bi-tools fs-2"></i>
            </div>
            <h3 className="fw-bold text-dark mb-1">VSCMS Portal</h3>
            <p className="text-secondary small mb-0">Vehicle Service Center Management System</p>
          </div>

          <AlertMessage type="error" message={error} onClose={() => setError('')} />

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold text-secondary small">Username or Email</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-person text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="admin or user@domain.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold text-secondary small">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-lock text-muted"></i>
                </span>
                <input
                  type="password"
                  className="form-control bg-light border-start-0"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-semibold shadow-sm mb-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Classroom / Viva Demo Shortcut Buttons */}
          <div className="border-top pt-3 mt-2 text-center">
            <span className="text-muted small d-block mb-2">Classroom Viva Demo Accounts:</span>
            <div className="d-flex gap-2 justify-content-center">
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => setDemoCredentials('admin', 'Admin@123')}
              >
                <i className="bi bi-shield-check me-1"></i>Admin Demo
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => setDemoCredentials('staff1', 'Staff@123')}
              >
                <i className="bi bi-person-badge me-1"></i>Staff Demo
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="text-secondary small mt-3 text-center">
        DBMS Mini-Project | Academic Demonstration Environment
      </div>
    </div>
  );
}
