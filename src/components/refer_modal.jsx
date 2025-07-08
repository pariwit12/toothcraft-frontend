// 📁 frontend/src/components/refer_modal.jsx
import React, { useState, useEffect } from 'react';

export default function ReferModal({ isOpen, onClose, onConfirm, queueId }) {
  const [room, setRoom] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRoom('');
      setNote('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!room) {
      alert('กรุณาเลือกห้องก่อนส่งต่อ');
      return;
    }

    onConfirm(room, note);
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3>ส่งต่อผู้ป่วย</h3>

        <label>เลือกห้อง:
          <select value={room} onChange={(e) => setRoom(e.target.value)} style={styles.select}>
            <option value="">-- กรุณาเลือก --</option>
            <option value="1">ห้องตรวจ 1</option>
            <option value="2">ห้องตรวจ 2</option>
            <option value="3">ห้องตรวจ 3</option>
            <option value="cashier">รอชำระเงิน</option>
          </select>
        </label>

        <label style={{ display: 'block', marginTop: '1rem' }}>หมายเหตุ (note):
          <textarea
            rows="5"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </label>

        <div style={{ marginTop: '1rem' }}>
          <button onClick={handleSubmit}>✅ ยืนยัน</button>
          <button onClick={onClose} style={{ marginLeft: '1rem' }}>❌ ยกเลิก</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', width: '300px',
    boxShadow: '0 0 10px rgba(0,0,0,0.2)'
  },
  select: {
    width: '100%', padding: '0.5rem', marginTop: '0.25rem'
  }
};
