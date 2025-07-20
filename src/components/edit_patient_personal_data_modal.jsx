// 📁 src/components/edit_patient_personal_data_modal.jsx
import React, { useState } from 'react';

export default function EditPatientModal({ patient, onClose, onSave }) {
  const [telephone, setTelephone] = useState(patient.telephone || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ telephone });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#000000aa' }}>
      <div style={{ background: 'white', padding: '2rem', margin: '10% auto', width: '400px', borderRadius: '8px' }}>
        <h3>แก้ไขข้อมูลผู้ป่วย</h3>
        <form onSubmit={handleSubmit}>
          <p><strong>ชื่อ:</strong> {patient.first_name} {patient.last_name}</p>
          <p><strong>เลขบัตรประชาชน:</strong> {patient.id_number}</p>
          <p><strong>วันเกิด:</strong> {new Date(patient.birth_day).toLocaleDateString()}</p>
          <label>
            เบอร์โทรศัพท์:
            <input
              type="text"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              style={{ width: '100%', marginTop: '0.5rem' }}
            />
          </label>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={onClose}>❌ ยกเลิก</button>
            <button type="submit">💾 บันทึก</button>
          </div>
        </form>
      </div>
    </div>
  );
}
