import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LoginSelection from './pages/login_selection';
import LoginStaff from './pages/login_staff';
import LoginDoctor from './pages/login_doctor';
import DashboardPublic from './pages/dashboard_public';
import PublicRegister from './pages/public_register';
import LinkLine from './pages/link_line';

/* Doctor */
import DashboardDoctor from './pages/dashboard_doctor';
import DoctorRoomPage from './pages/doctor_room_page';
import DoctorTreatmentForm from './pages/doctor_treatment_form';
import MyDfSummaryReport from './pages/my_df_summary_report';

/* Staff || Admin */
import DashboardStaff from './pages/dashboard_staff';
import RegisterPatient from './pages/register_patient';
import PatientDetail from './pages/patient_detail';
import MoneyReceivedReportFixed from './pages/money_received_report_fixed';
import AppointmentCalendar from './pages/appointment_calendar';
import AppointmentInDay from './pages/appointment_in_day';
import ReminderList from './pages/reminder_list';
import FeedbackList from './pages/feedback_list';
import ClinicOverview from './pages/clinic_overview';
import ConfirmCreateSentList from './pages/confirm_create_sent_list';

/* Admin */
import MoneyReceivedReport from './pages/money_received_report';
import DfSummaryReport from './pages/df_summary_report';

/* Staff || Admin || Doctor */
import SearchPatient from './pages/search_patient';


import ProtectedRoute from './components/protected_route';
import Logout from './pages/logout';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginSelection />} />
        <Route path="/login/staff" element={<LoginStaff />} />
        <Route path="/login/doctor" element={<LoginDoctor />} />
        <Route path="/public" element={<DashboardPublic />} />
        <Route path="/register-public" element={<PublicRegister />} />
        <Route path="/link-line" element={<LinkLine />} />


        {/* Doctor */}
        <Route
          path="/dashboard/doctor"
          element={
            <ProtectedRoute>
              <DashboardDoctor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/doctor/room"
          element={
            <ProtectedRoute>
              <DoctorRoomPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/doctor/visit/:queueId/:patientId"
          element={
            <ProtectedRoute>
              <DoctorTreatmentForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-df-summary-report"
          element={
            <ProtectedRoute>
              <MyDfSummaryReport />
            </ProtectedRoute>
          }
        />


        {/* Staff || Admin */}
        <Route
          path="/dashboard/staff"
          element={
            <ProtectedRoute>
              <DashboardStaff />
            </ProtectedRoute>
          }
        />
        <Route
          path="/register"
          element={
            <ProtectedRoute>
              <RegisterPatient />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient_detail/:id"
          element={
            <ProtectedRoute>
              <PatientDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/daily-report-fixed"
          element={
            <ProtectedRoute>
              <MoneyReceivedReportFixed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments-calendar"
          element={
            <ProtectedRoute>            
              <AppointmentCalendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments/in-day"
          element={
            <ProtectedRoute>
              <AppointmentInDay />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reminder-list"
          element={
            <ProtectedRoute>
              <ReminderList />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/feedback-list"
          element={
            <ProtectedRoute>
              <FeedbackList />
            </ProtectedRoute>
          }
        />
        <Route path="/clinic-overview" element={<ClinicOverview />} />
        <Route path="/confirm-create-list" element={<ConfirmCreateSentList />} />


        {/* Admin */}
        <Route
          path="/money-report"
          element={
            <ProtectedRoute>
              <MoneyReceivedReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/df-summary-report"
          element={
            <ProtectedRoute>
              <DfSummaryReport />
            </ProtectedRoute>
          }
        />

        
        {/* Staff || Admin || Doctor */}
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <SearchPatient />
            </ProtectedRoute>
          }
        />


        <Route path="/logout" element={<Logout />} />
      </Routes>
    </Router>
  );
}