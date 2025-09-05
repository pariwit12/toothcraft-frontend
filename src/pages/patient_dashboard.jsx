import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import axios from "axios";
import { INSURANCE_TYPE_BY_ID } from '../constants/insurance_type';

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
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: "1rem" }}>
      <div>
        <h1>สวัสดี {patient.first_name} {patient.last_name}</h1>
        <p>สิทธิการรักษา: {patient.insurance_type ? INSURANCE_TYPE_BY_ID[patient.insurance_type] : 'ไม่มีข้อมูล'}</p>
        {['บัตรทอง', 'ประกันสังคม'].includes(INSURANCE_TYPE_BY_ID[patient.insurance_type]) && (
          <p>วงเงินคงเหลือ: {patient.insurance_balance}</p>
        )}
        <p>หมายเหตุ: สิทธิการรักษาที่แสดงเป็นการสรุปจากข้อมูลที่คลินิกทันตกรรมทู้ธคราฟมีเท่านั้น</p>
        <hr />
      </div>
      <div>
        <Link to="/patient-open-camera-check-in">
          <button
            style={{
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            📷 เข้ารับบริการ
          </button>
        </Link>
        <Link to="/patient-my-appointments">
          <button
            style={{
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            📆 ดูวันนัด
          </button>
        </Link>
        <Link to="/patient-my-plan">
          <button
            style={{
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            📋 ดูผลตรวจ & แผนการรักษา
          </button>
        </Link>
        <Link to="/patient-my-visit-procedures">
          <button
            style={{
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            📋 ดูประวัติหัตถการ
          </button>
        </Link>
        <hr />
      </div>
      <div>
        <p>เลขประจำตัว: {patient.id}</p>
        <p>เลขบัตรประชาชน: {patient.id_number}</p>
        <p>วันเกิด: {patient.birth_day ? new Date(patient.birth_day).toLocaleDateString('th-TH') : 'ไม่มีข้อมูล'}</p>
        <p>เบอร์โทรศัพท์: {patient.telephone ? patient.telephone : 'ไม่มีข้อมูล'}</p>
      </div>
    </div>
  );
}
