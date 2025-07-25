import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
const API_URL = process.env.REACT_APP_API_URL;

export default function DoctorList() {
  const [doctors, setDoctors] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch(`${API_URL}/doctors`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setDoctors(data);
      } catch (error) {
        console.error('โหลดข้อมูลแพทย์ล้มเหลว:', error);
      }
    };

    fetchDoctors();
  }, [token]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h1>📋 รายชื่อแพทย์ทั้งหมด</h1>
        <button
          onClick={() => navigate('/dashboard/staff')}
          style={{
            marginLeft: '1rem',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          ⬅️ กลับหน้าหลัก
        </button>
      </div>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>รหัส</th>
            <th>ชื่อ</th>
            <th>ชื่อเล่น</th>
            <th>เบอร์โทร</th>
            <th>เลขที่ใบประกอบวิชาชีพ</th>
          </tr>
        </thead>
        <tbody>
          {doctors.map((doctor) => (
            <tr key={doctor.id}>
              <td>{doctor.id}</td>
              <td>{doctor.first_name} {doctor.last_name}</td>
              <td>{doctor.nickname || '-'}</td>
              <td>{doctor.telephone || '-'}</td>
              <td>{doctor.license_number || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
