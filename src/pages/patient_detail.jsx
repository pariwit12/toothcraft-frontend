// 📁 src/pages/patient_detail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
const API_URL = process.env.REACT_APP_API_URL;

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // 🔧 เพิ่ม: ดึง token จาก localStorage และส่งใน header Authorization
    const token = localStorage.getItem('token'); // ถ้าใช้ชื่ออื่น ให้แก้ตรงนี้ด้วย

    fetch(`${API_URL}/patients/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`, // 🔧 ส่ง token ใน header
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('ไม่พบข้อมูลผู้ป่วย');
        }
        return res.json();
      })
      .then((data) => {
        setPatient(data);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, [id]);

  return (
    <div style={{ padding: '1rem' }}>
      <h2>รายละเอียดผู้ป่วย</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!error && !patient && <p>กำลังโหลดข้อมูล...</p>}

      {patient && (
        <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
          <p><strong>HN:</strong> {patient.id}</p> {/* 🔧 เพิ่มแสดง HN (id) */}
          <p><strong>ชื่อ:</strong> {patient.first_name} {patient.last_name}</p>
          <p><strong>เบอร์โทร:</strong> {patient.telephone}</p>
          <p><strong>เลขบัตรประชาชน:</strong> {patient.id_number}</p>
          <p><strong>วันเกิด:</strong> {patient.birth_day ? new Date(patient.birth_day).toLocaleDateString() : '-'}</p>

          <button style={{ marginTop: '1rem' }} onClick={() => navigate(-1)}>
            🔙 ย้อนกลับ
          </button>
        </div>
      )}
    </div>
  );
}
