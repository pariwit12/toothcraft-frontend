// 📁 frontend/src/pages/patient_appointments.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

export default function PatientMyVisitProcedures() {
  const [visitProcedures, setVisitProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/liff_patient_select";
      return;
    }

    const fetchVisitProcedures = async () => {
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

        // ดึง visit_procedures ของผู้ป่วย
        const appRes = await axios.get(
          `${API_URL}/visit-procedures/${meRes.data.data.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setVisitProcedures(Array.isArray(appRes.data) ? appRes.data : []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching visit_procedures", error);
        localStorage.removeItem("token");
        window.location.href = "/liff_patient_select";
      }
    };

    fetchVisitProcedures();
  }, []);

  if (loading) return <p>กำลังโหลด...</p>;

  // 🗂 Group ข้อมูลตามวันที่ visit_time
  const groupedByDate = visitProcedures.reduce((acc, vp) => {
    const dateKey = new Date(vp.visits.visit_time)
      .toLocaleDateString("th-TH", { timeZone: 'Asia/Bangkok',});
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(vp);
    return acc;
  }, {});

  return (
    <div style={{ padding: "1rem", maxWidth: "800px", margin: "0 auto" }}>
      <h2>📋 ประวัติหัตถการรักษาของ {patient.first_name} {patient.last_name}</h2>

      {Object.keys(groupedByDate).length === 0 ? (
        <p>ไม่มีข้อมูลหัตถการ</p>
      ) : (
        Object.keys(groupedByDate).map((date) => (
          <div key={date} style={{ marginBottom: "1rem" }}>
            <h3 style={{ background: "#f0f0f0", padding: "0.5rem" }}>{date}</h3>
            <table
              border="1"
              width="100%"
              style={{ borderCollapse: "collapse" }}
            >
              <thead>
                <tr>
                  <th>เวลา</th>
                  <th>หัตถการ</th>
                  <th>ซี่ฟัน</th>
                  <th>หมอ</th>
                </tr>
              </thead>
              <tbody>
                {groupedByDate[date].map((vp) => (
                  <tr key={vp.id}>
                    <td>
                      {new Date(vp.visits.visit_time).toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </td>
                    <td>{vp.procedures?.name || "-"}</td>
                    <td>{vp.tooth || "-"}</td>
                    <td>
                      {vp.visits.doctors
                        ? `${vp.visits.doctors.first_name} (${vp.visits.doctors.nickname})`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}