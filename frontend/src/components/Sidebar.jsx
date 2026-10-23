import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Sidebar() {
  const { isAdmin } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { to: '/customers', label: 'Customers', icon: 'bi-people' },
    { to: '/vehicles', label: 'Vehicles', icon: 'bi-car-front' },
    { to: '/bookings', label: 'Service Bookings', icon: 'bi-calendar-check' },
    { to: '/service-details', label: 'Service Details', icon: 'bi-list-task' },
    { to: '/spare-parts', label: 'Spare Parts', icon: 'bi-gear-wide-connected' },
    { to: '/mechanics', label: 'Mechanics', icon: 'bi-person-badge' },
    { to: '/service-types', label: 'Service Types', icon: 'bi-tags' },
    { to: '/invoices', label: 'Invoices', icon: 'bi-receipt' },
    { to: '/payments', label: 'Payments', icon: 'bi-credit-card-2-front' },
    { to: '/reports', label: 'Reports & Analytics', icon: 'bi-graph-up' },
  ];

  if (isAdmin) {
    navItems.push({ to: '/users', label: 'User Management', icon: 'bi-shield-lock' });
  }

  return (
    <div className="bg-white border-end shadow-sm d-flex flex-column" style={{ minWidth: '240px', width: '240px' }}>
      <div className="p-3 border-bottom bg-light">
        <span className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
          Navigation
        </span>
      </div>
      <div className="list-group list-group-flush py-2 flex-grow-1 overflow-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `list-group-item list-group-item-action d-flex align-items-center py-2 px-3 border-0 rounded-0 ${
                isActive
                  ? 'bg-primary text-white fw-semibold'
                  : 'text-dark'
              }`
            }
          >
            <i className={`bi ${item.icon} me-3 fs-5`}></i>
            <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
          </NavLink>
        ))}
      </div>
      <div className="p-3 border-top bg-light text-center small text-muted">
        VSCMS DBMS Project v1.0
      </div>
    </div>
  );
}
