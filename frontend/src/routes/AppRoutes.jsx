import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../layouts/MainLayout';

import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import CustomersPage from '../pages/CustomersPage';
import VehiclesPage from '../pages/VehiclesPage';
import BookingsPage from '../pages/BookingsPage';
import ServiceDetailsPage from '../pages/ServiceDetailsPage';
import SparePartsPage from '../pages/SparePartsPage';
import MechanicsPage from '../pages/MechanicsPage';
import ServiceTypesPage from '../pages/ServiceTypesPage';
import InvoicesPage from '../pages/InvoicesPage';
import PaymentsPage from '../pages/PaymentsPage';
import ReportsPage from '../pages/ReportsPage';
import UsersPage from '../pages/UsersPage';
import NotFoundPage from '../pages/NotFoundPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="vehicles" element={<VehiclesPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="service-details" element={<ServiceDetailsPage />} />
        <Route path="spare-parts" element={<SparePartsPage />} />
        <Route path="mechanics" element={<MechanicsPage />} />
        <Route path="service-types" element={<ServiceTypesPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="reports" element={<ReportsPage />} />

        {/* Administrator Exclusive Module */}
        <Route
          path="users"
          element={
            <ProtectedRoute requiredRole="Administrator">
              <UsersPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
