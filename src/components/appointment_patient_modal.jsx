import React, { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL;

export default function AppointmentPatientModal({ patientId, onClose }) {
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [patientName, setPatientName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!patientId) return;

    // ดึงชื่อผู้ป่วย
    fetch(`${API_URL}/patients/${patientId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setPatientName(`${data.first_name} ${data.last_name}`);
      });

    // ดึงรายการนัด
    fetch(`${API_URL}/appointments/patient/${patientId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setPatientAppointments(Array.isArray(data) ? data : []);
      });
  }, [patientId]);

  // 🕒 แบ่งรายการนัดเป็น 2 กลุ่ม
  const now = new Date();
  const upcomingAppointments = patientAppointments.filter(
    (appt) => new Date(appt.appointment_time) >= now
  );
  const pastAppointments = patientAppointments.filter(
    (appt) => new Date(appt.appointment_time) < now
  );

  // 🧩 ส่วนแสดงตารางรายการนัด
  const renderTable = (appointments) => (
    <table border="1" width="100%" style={{ borderCollapse: 'collapse', marginTop: '0.5rem' }}>
      <thead>
        <tr>
          <th>วันที่นัด</th>
          <th>เวลา</th>
          <th>หมอ</th>
          <th>หมายเหตุ</th>
        </tr>
      </thead>
      <tbody>
        {appointments.map((appt) => (
          <tr key={appt.id}>
            <td>{new Date(appt.appointment_time).toLocaleDateString('th-TH')}</td>
            <td>{new Date(appt.appointment_time).toLocaleTimeString('th-TH', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })}</td>
            <td>{`${appt.doctors.first_name} (${appt.doctors.nickname})`}</td>
            <td>{appt.note || '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: '#fff',
        padding: '1.5rem',
        borderRadius: '8px',
        maxWidth: '700px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h2>📅 รายการนัดของ {patientName}</h2>
          <button onClick={onClose}>❌ ปิด</button>
        </div>

        {patientAppointments.length === 0 ? (
          <p>ไม่มีรายการนัด</p>
        ) : (
          <>
            {upcomingAppointments.length > 0 && (
              <>
                <h3 style={{ marginTop: '1rem' }}>🟢 รายการนัดที่ยังไม่ถึง</h3>
                {renderTable(upcomingAppointments)}
              </>
            )}

            {pastAppointments.length > 0 && (
              <>
                <h3 style={{ marginTop: '1rem' }}>⚫ รายการนัดที่ผ่านมาแล้ว</h3>
                {renderTable(pastAppointments)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}