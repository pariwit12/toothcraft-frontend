import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

export default function PatientDashboard() {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/liff_patient_select"; // ถ้าไม่มี token ให้กลับไปหน้าเลือก
      return;
    }

    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.role !== "patient") {
          alert("คุณไม่มีสิทธิ์เข้าหน้านี้");
          localStorage.removeItem("token");
          window.location.href = "/liff-patient-select";
          return;
        }

        setPatient(res.data.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching patient data", err);
        localStorage.removeItem("token");
        window.location.href = "/liff-patient-select";
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>กำลังโหลด...</p>;

  return (
    <div style={{ padding: "1rem" }}>
      <h1>สวัสดี {patient.first_name} {patient.last_name}</h1>
      <p>เบอร์โทร: {patient.telephone}</p>
      <p>เลขบัตรประชาชน: {patient.id_number}</p>
      {/* สามารถเพิ่มเมนูอื่นๆ เช่น ประวัติการรักษา, คิว, ใบนัด */}
      <a href="/patient-my-appointments" style={{ display: "inline-block", marginTop: "10px" }}>
        ดูวันนัดของฉัน
      </a>
    </div>
  );
}
