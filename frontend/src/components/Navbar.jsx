import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3 py-2 shadow-sm border-bottom border-secondary">
      <div className="container-fluid">
        <span className="navbar-brand fw-bold d-flex align-items-center mb-0">
          <i className="bi bi-tools text-warning me-2 fs-5"></i>
          <span>VSCMS <small className="fw-normal text-muted fs-6">| Vehicle Service Center</small></span>
        </span>

        <div className="d-flex align-items-center ms-auto">
          {user && (
            <>
              <div className="me-3 text-end d-none d-sm-block">
                <div className="text-white fw-semibold small">{user.full_name || user.username}</div>
                <span className={`badge ${user.role === 'Administrator' ? 'bg-danger' : 'bg-primary'}`}>
                  {user.role}
                </span>
              </div>
              <button
                className="btn btn-sm btn-outline-light d-flex align-items-center"
                onClick={handleLogout}
                title="Log out of system"
              >
                <i className="bi bi-box-arrow-right me-1"></i>
                <span className="d-none d-md-inline">Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
