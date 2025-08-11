import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL;

export default function EditContinueTxNoteModal({ isOpen, patientObj, onClose, onSave }) {
  const [note, setNote] = useState(patientObj.continue_tx_note || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/continue-tx-patient/${patientObj.id}/note`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ continue_tx_note: note.trim() }),
      });

      if (!res.ok) throw new Error('Update failed');

      const updated = await res.json();
      onSave(updated); // 🔁 ส่งข้อมูลกลับให้หน้า list รีเฟรช
      onClose();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !patientObj) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      justifyContent: 'center', alignItems: 'center',
    }}>
      <div style={{ background: '#fff', padding: '2rem', borderRadius: '8px', width: '400px' }}>
        <h3>📝 แก้ไขหมายเหตุ</h3>
        <p><strong>{patientObj.patients?.first_name} {patientObj.patients?.last_name}</strong></p>
        <textarea
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', marginTop: '1rem' }}
        />
        <div style={{ marginTop: '1rem', textAlign: 'right' }}>
          <button onClick={onClose} disabled={loading} style={{ marginRight: '0.5rem' }}>
            ❌ ยกเลิก
          </button>
          <button onClick={handleSave} disabled={loading}>
            💾 บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}
