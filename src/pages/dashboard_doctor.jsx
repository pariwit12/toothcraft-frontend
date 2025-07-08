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
      <h1>แดชบอร์ดของ Doctor</h1>
      <p>ยินดีต้อนรับสู่ระบบ ToothCraft สำหรับคุณหมอ</p>

      <div style={{ margin: '1rem 0' }}>
        <span>
          ห้องที่คุณหมออยู่: <strong>{currentRoom || 'ยังไม่เลือกห้อง'}</strong>{' '}
        </span>
        <button onClick={() => setIsModalOpen(true)} style={{ marginLeft: '1rem' }}>
          {currentRoom ? 'เปลี่ยนห้อง' : 'เลือกห้อง'}
        </button>
        <Link to="/my-df-summary-report">
          <button style={{ marginLeft: '1rem' }}>📄 ดูรายงาน DF ของฉัน</button>
        </Link>
        <Link to="/logout">
          <button style={{ marginLeft: '1rem' }}>ออกจากระบบ</button>
        </Link>
      </div>

      <hr style={{ margin: '2rem 0' }} />

      <div style={{ backgroundColor: '#f0f8ff', padding: '1.5rem', borderRadius: '10px' }}>
        <p>
          👉 หลังจากเลือกห้องแล้ว ระบบจะพาคุณไปยังหน้าที่ใช้จัดการคนไข้ในห้องนั้น เช่น{' '}
          <strong>เรียกเข้าห้อง</strong> และ <strong>นำออกจากห้อง</strong>
        </p>
        <p>💡 คุณสามารถกลับมาเปลี่ยนห้องได้ทุกเมื่อผ่านปุ่มด้านบน</p>
      </div>

      <EnterRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmRoom}
      />
    </div>
  );
}
