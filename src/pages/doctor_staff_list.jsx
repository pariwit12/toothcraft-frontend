import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
const API_URL = process.env.REACT_APP_API_URL;

export default function DoctorList() {
  const [doctors, setDoctors] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedType, setSelectedType] = useState('doctors');
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

    const fetchStaff = async () => {
      try {
        const res = await fetch(`${API_URL}/staff`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setStaff(data);
      } catch (error) {
        console.error('โหลดข้อมูลพนักงานล้มเหลว:', error);
      }
    };

    fetchDoctors();
    fetchStaff();
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

      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => setSelectedType('doctors')}
          style={{ marginRight: '1rem', backgroundColor: selectedType === 'doctors' ? '#2196f3' : '#ccc', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: 6 }}
        >
          หมอ
        </button>
        <button
          onClick={() => setSelectedType('staff')}
          style={{ backgroundColor: selectedType === 'staff' ? '#2196f3' : '#ccc', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: 6 }}
        >
          พนักงาน
        </button>
      </div>

      {selectedType === 'doctors' && (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>รหัส</th>
              <th>ชื่อ</th>
              <th>ชื่อเล่น</th>
              <th>เบอร์โทร</th>
              <th>เลขที่ใบประกอบวิชาชีพ</th>
              <th>เลขบัตรประชาชน</th>
              <th>วันเกิด</th>
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
                <td>{doctor.cid || '-'}</td>
                <td>{doctor.birth_day ? new Date(doctor.birth_day).toLocaleDateString('th-Th') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedType === 'staff' && (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>รหัส</th>
              <th>ชื่อ</th>
              <th>ชื่อเล่น</th>
              <th>เบอร์โทร</th>
              <th>เลขบัตรประชาชน</th>
              <th>วันเกิด</th>
              <th>บทบาท</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((staff) => (
              <tr key={staff.id}>
                <td>{staff.id}</td>
                <td>{staff.first_name} {staff.last_name}</td>
                <td>{staff.nickname || '-'}</td>
                <td>{staff.telephone || '-'}</td>
                <td>{staff.cid || '-'}</td>
                <td>{staff.birth_day ? new Date(staff.birth_day).toLocaleDateString('th-Th') : '-'}</td>
                <td>{staff.role || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
