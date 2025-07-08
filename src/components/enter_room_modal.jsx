import React, { useState, useEffect } from 'react';

export default function EnterRoomModal({ isOpen, onClose, onConfirm }) {
  const [selectedRoom, setSelectedRoom] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedRoom('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedRoom) {
      onConfirm(selectedRoom);
      onClose();
    } else {
      alert('กรุณาเลือกห้องตรวจ');
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2>เลือกห้องตรวจ</h2>
        <select
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
        >
          <option value="">-- กรุณาเลือกห้อง --</option>
          <option value="1">ห้องตรวจ 1</option> {/* แก้เป็น string "1" */}
          <option value="2">ห้องตรวจ 2</option>
          <option value="3">ห้องตรวจ 3</option>
        </select>

        <div style={{ marginTop: '1rem' }}>
          <button onClick={handleConfirm}>ยืนยัน</button>
          <button onClick={onClose} style={{ marginLeft: '1rem' }}>ยกเลิก</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '10px',
    width: '300px',
    textAlign: 'center',
  },
};
