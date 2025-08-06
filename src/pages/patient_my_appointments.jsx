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

        setAppointments(appRes.data);
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

  return (
    <div style={{ padding: "1rem" }}>
      <h2>📅 วันนัดของคุณ {patient.first_name} {patient.last_name}</h2>
      {appointments.length === 0 ? (
        <p>ไม่มีข้อมูลนัด</p>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", marginTop: "10px" }}>
          <thead>
            <tr>
              <th>วันนัด</th>
              <th>เวลา</th>
              <th>แพทย์</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((app) => {
              const date = new Date(app.appointment_time);
              return (
                <tr key={app.id}>
                  <td>{date.toLocaleDateString("th-TH")}</td>
                  <td>{date.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{app.doctors ? `${app.doctors.first_name} ${app.doctors.last_name}` : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
