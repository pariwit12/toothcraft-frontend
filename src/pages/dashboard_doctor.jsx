import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EnterRoomModal from '../components/enter_room_modal';

export default function DashboardDoctor() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const savedRoom = sessionStorage.getItem('selectedRoom') || '';
    setCurrentRoom(savedRoom);
  }, []);

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

      {/* Action Buttons */}
      <div style={{ margin: '1.5rem 0', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <span>
          ห้องที่คุณหมออยู่: <strong>{currentRoom || 'ยังไม่เลือกห้อง'}</strong>
        </span>
        <button onClick={() => setIsModalOpen(true)}>🏥 ห้องตรวจ</button>
        <Link to="/my-df-summary-report">
          <button>📄 ดูรายงาน DF ของฉัน</button>
        </Link>
        <Link to="/logout">
          <button>🚪 ออกจากระบบ</button>
        </Link>
      </div>

      <hr style={{ margin: '2rem 0' }} />

      {/* Info Box */}
      <div style={{
        backgroundColor: '#f0f8ff',
        padding: '1.5rem',
        borderRadius: '10px',
        lineHeight: 1.6
      }}>
        <p>
          👉 หลังจากเลือกห้องแล้ว ระบบจะพาคุณไปยังหน้าที่ใช้จัดการคนไข้ในห้องนั้น เช่น{' '}
          <strong>เรียกเข้าห้อง</strong> และ <strong>นำออกจากห้อง</strong>
        </p>
        <p>
          💡 คุณสามารถกลับมาเปลี่ยนห้องได้ทุกเมื่อผ่านปุ่มด้านบน
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
