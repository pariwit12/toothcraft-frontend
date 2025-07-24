import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL;

export default function EditPatientHistoryModal({ isOpen, onClose, visit, onSuccess }) {
  const [treatmentNote, setTreatmentNote] = useState('');
  const [nextVisit, setNextVisit] = useState('');
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (visit) {
      setTreatmentNote(visit.treatment_note || '');
      setNextVisit(visit.next_visit || '');
    }
  }, [visit]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/visits/${visit.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          treatment_note: treatmentNote,
          next_visit: nextVisit,
          patient_id: visit.patient_id,
          doctor_id: visit.doctor_id,
          visit_time: visit.visit_time,
        }),
      });

      if (!res.ok) throw new Error('อัปเดตไม่สำเร็จ');

      onSuccess();
      onClose();
    } catch (err) {
      alert('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !visit) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '500px',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>📝 แก้ไขข้อมูลการรักษา</h3>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '1.2rem',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: 'bold' }}>หมายเหตุ:</label>
          <textarea
            rows="4"
            value={treatmentNote}
            onChange={(e) => setTreatmentNote(e.target.value)}
            style={{
              width: '100%',
              marginTop: '0.25rem',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: 'bold' }}>นัดครั้งหน้า:</label>
          <textarea
            rows="2"
            value={nextVisit}
            onChange={(e) => setNextVisit(e.target.value)}
            style={{
              width: '100%',
              marginTop: '0.25rem',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#ccc',
              color: '#000',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            ❌ ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#6c757d' : '#28a745',
              color: '#fff',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            💾 บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}
