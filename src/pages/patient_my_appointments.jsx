// 📁 frontend/src/pages/patient_appointments.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/liff_patient_select";
      return;
    }

    const fetchAppointments = async () => {
      try {
        // ดึงข้อมูลผู้ป่วยจาก token
        const meRes = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (meRes.data.role !== "patient") {
          alert("คุณไม่มีสิทธิ์เข้าหน้านี้");
          localStorage.removeItem("token");
          window.location.href = "/liff_patient_select";
          return;
        }

        setPatient(meRes.data.data);

        // ดึงนัดของผู้ป่วย
        const appRes = await axios.get(
          `${API_URL}/appointments/patient/${meRes.data.data.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setAppointments(Array.isArray(appRes.data) ? appRes.data : []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching appointments", error);
        localStorage.removeItem("token");
        window.location.href = "/liff_patient_select";
      }
    };

    fetchAppointments();
  }, []);

  if (loading) return <p>กำลังโหลด...</p>;

  // 🕒 แบ่งรายการนัด
  const now = new Date();
  const upcomingAppointments = appointments.filter(
    (appt) => new Date(appt.appointment_time) >= now
  );
  const pastAppointments = appointments.filter(
    (appt) => new Date(appt.appointment_time) < now
  );

  // 🧩 ตารางรายการนัด
  const renderTable = (list) => (
    <table
      border="1"
      width="100%"
      style={{ borderCollapse: "collapse", marginTop: "0.5rem" }}
    >
      <thead>
        <tr>
          <th>วันที่นัด</th>
          <th>เวลา</th>
          <th>หมอ</th>
        </tr>
      </thead>
      <tbody>
        {list.map((appt) => (
          <tr key={appt.id}>
            <td>{new Date(appt.appointment_time).toLocaleDateString("th-TH")}</td>
            <td>
              {new Date(appt.appointment_time).toLocaleTimeString("th-TH", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </td>
            <td>
              {`${appt.doctors.first_name} (${appt.doctors.nickname})`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div style={{ padding: "1rem", maxWidth: "800px", margin: "0 auto" }}>
      <h2>📅 รายการนัดของ {patient.first_name} {patient.last_name}</h2>

      {appointments.length === 0 ? (
        <p>ไม่มีรายการนัด</p>
      ) : (
        <>
          {upcomingAppointments.length > 0 && (
            <>
              <h3 style={{ marginTop: "1rem" }}>🟢 รายการนัดที่ยังไม่ถึง</h3>
              {renderTable(upcomingAppointments)}
            </>
          )}

          {pastAppointments.length > 0 && (
            <>
              <h3 style={{ marginTop: "1rem" }}>⚫ รายการนัดที่ผ่านมาแล้ว</h3>
              {renderTable(pastAppointments)}
            </>
          )}
        </>
      )}
    </div>
  );
}
