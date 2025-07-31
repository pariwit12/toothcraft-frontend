import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import EnterRoomModal from '../components/enter_room_modal';
const API_URL = process.env.REACT_APP_API_URL;

export default function DashboardDoctor() {
  const [doctorId, setDoctorId] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const savedRoom = sessionStorage.getItem('selectedRoom') || '';
    setCurrentRoom(savedRoom);
  }, []);

  useEffect(() => {
    if (!token) return;
    try {
      const decoded = jwtDecode(token);
      setDoctorId(decoded.id);
    } catch (e) {
      console.error('Invalid token', e);
    }
  }, [token]);

  useEffect(() => {
    if (!doctorId) {
    return;
  }

    setLoading(true);
    setError('');
    fetch(`${API_URL}/appointments/today/${doctorId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลนัดได้');
        return res.json();
      })
      .then((data) => {
        setAppointments(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'เกิดข้อผิดพลาด');
        setLoading(false);
      });
  }, [doctorId]);

  const handleConfirmRoom = (room) => {
    setCurrentRoom(room);
    sessionStorage.setItem('selectedRoom', room);
    setIsModalOpen(false);
    navigate('/dashboard/doctor/room');
  };

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <h1>แดชบอร์ดของ Doctor</h1>
      <p>ยินดีต้อนรับสู่ระบบ ToothCraft สำหรับคุณหมอ</p>

      <div style={{ margin: '1.5rem 0', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        {/* <span>
          ห้องที่คุณหมออยู่: <strong>{currentRoom || 'ยังไม่เลือกห้อง'}</strong>
        </span> */}
        <button onClick={() => setIsModalOpen(true)}>🏥 ห้องตรวจ</button>
        <Link to="/search">
          <button>🔎 ค้นหาผู้ป่วย</button>
        </Link>
        <Link to="/doctor-today-summary">
          <button>📝 สรุปวันนี้</button>
        </Link>
        <Link to="/continue-tx-patient-list">
          <button>🔁 ผู้ป่วยต่อเนื่อง</button>
        </Link>
        <Link to="/my-df-summary-report">
          <button>📄 ดูรายงาน DF ของฉัน</button>
        </Link>
        <Link to="/logout">
          <button>🚪 ออกจากระบบ</button>
        </Link>
      </div>

      {loading && (
        <>
          <hr style={{ margin: '2rem 0' }} />
          <div style={{ marginTop: '1rem' }}>
            🔄 กำลังโหลดข้อมูลนัดหมาย...
          </div>
        </>
      )}

      {!loading && !error && appointments.length > 0 && (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginTop: '1rem',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>เวลา</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>
                ชื่อผู้ป่วย
              </th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => (
              <tr key={appt.id}>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  {new Date(appt.appointment_time).toLocaleTimeString('th-TH', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  {appt.patients
                    ? `${appt.patient_id} - ${appt.patients.first_name || ''} ${appt.patients.last_name || ''}`
                    : '-'}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  {appt.note || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && !error && appointments.length === 0 && (
        <>
          <hr style={{ margin: '2rem 0' }} />
          <div style={{ marginTop: '1rem', color: '#666' }}>
            📭 คุณหมอไม่มีนัดหมายในวันนี้
          </div>
        </>
      )}

      {error && (
        <>
          <hr style={{ margin: '2rem 0' }} />
          <div style={{ color: 'red', marginTop: '1rem' }}>
            ❗ {error}
          </div>
        </>
      )}

      <hr style={{ margin: '2rem 0' }} />

      {/* Info Box */}
      <div style={{
        backgroundColor: '#f0f8ff',
        padding: '1.5rem',
        borderRadius: '10px',
        lineHeight: 1.6
      }}>
        <p>
          👉 ยินดีต้อนรับคุณหมอสู่คลินิกทันตกรรม ทู้ธคราฟฟฟฟฟฟ
        </p>
        <p>
          💡 วันนี้คุณอาจจะเหนื่อย แต่ขอให้รู้ไว้ ว่าคุณเหนื่อย แฮร่!!!
        </p>
      </div>

      {/* Modal เลือกห้อง */}
      <EnterRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmRoom}
      />
    </div>
  );
}
