import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LoginSelection from './pages/login_selection';
import LoginStaff from './pages/login_staff';
import LoginDoctor from './pages/login_doctor';
import DashboardPublic from './pages/dashboard_public';
import PublicRegister from './pages/public_register';
import LinkLine from './pages/link_line';
import LiffPatientSelect from './pages/liff_patient_select';

/* Doctor */
import DashboardDoctor from './pages/dashboard_doctor';
import DoctorRoomPage from './pages/doctor_room_page';
import DoctorTreatmentForm from './pages/doctor_treatment_form';
import MyDfSummaryReport from './pages/my_df_summary_report';
import DoctorTodaySummary from './pages/doctor_today_summary';

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
import RegisterPatientWithLine from './pages/register_patient_with_line';
import InsurancePatientList from './pages/insurance_patient_list';
import VisitTodaySummary from './pages/visit_today_summary';
import DoctorList from './pages/doctor_list';

/* Admin */
import MoneyReceivedReport from './pages/money_received_report';
import DfSummaryReport from './pages/df_summary_report';

/* Staff || Admin || Doctor */
import SearchPatient from './pages/search_patient';
import ContinueTxPatientList from './pages/continue_tx_patient_list';

/* Patient */
import PatientDashboard from './pages/patient_dashboard';
import PatientMyAppointments from "./pages/patient_my_appointments";


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
        <Route path="/liff-patient-select" element={<LiffPatientSelect />} />


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
        <Route path="/doctor-today-summary" element={<DoctorTodaySummary />} />


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
        <Route
          path="/register-with-line"
          element={
            <ProtectedRoute>
              <RegisterPatientWithLine />
            </ProtectedRoute>
          }
        />
        <Route path="/insurance-patient-list" element={<InsurancePatientList />} />
        <Route path="/visit-today-summary" element={<VisitTodaySummary />} />
        <Route path="/doctor-list" element={<DoctorList />} />


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
        <Route path="/continue-tx-patient-list" element={<ContinueTxPatientList />} />


        {/* Patient */}
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/patient-my-appointments" element={<PatientMyAppointments />} />



        <Route path="/logout" element={<Logout />} />
      </Routes>
    </Router>
  );
}