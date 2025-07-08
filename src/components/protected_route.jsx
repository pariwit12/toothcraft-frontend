import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

function getRoleFromToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch (error) {
    return null;
  }
}

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  const location = useLocation();
  const role = getRoleFromToken();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  const path = location.pathname;

  // ✅ เฉพาะ staff และ admin
  const allowStaffOrAdmin = role === 'staff' || role === 'admin';
  if (
    (
      path.startsWith('/dashboard/staff') ||
      path.startsWith('/register') ||
      path.startsWith('/search') ||
      path.startsWith('/patient_detail') ||
      path.startsWith('/daily-report-fixed') ||
      path.startsWith('/appointments-calendar') ||
      path.startsWith('/appointments/in-day')
    ) && !allowStaffOrAdmin
  ) {
    return <Navigate to="/" replace />;
  }

  // ✅ เฉพาะ admin เท่านั้น
  if (
    (
      path.startsWith('/money-report') ||
      path.startsWith('/df-summary-report')
    )
    && role !== 'admin'
  ) {
    return <Navigate to="/" replace />;
  }

  // ✅ เฉพาะ doctor
  if (
    (
      path.startsWith('/dashboard/doctor') ||
      path.startsWith('/dashboard/doctor/room') ||
      path.startsWith('/dashboard/doctor/visit') ||
      path.startsWith('/my-df-summary-report')
    ) 
    && role !== 'doctor'
  ) {
    return <Navigate to="/" replace />;
  }

  // ✅ หน้า room ต้องมี selectedRoom ด้วย
  if (path.startsWith('/dashboard/doctor/room')) {
    if (role !== 'doctor') return <Navigate to="/" replace />;

    const selectedRoom = sessionStorage.getItem('selectedRoom');
    if (!selectedRoom) {
      return <Navigate to="/dashboard/doctor" replace />;
    }
  }

  return children;
}
