import React, { useEffect, useState } from 'react';
import { formatAge, formatDate, formatProcedures } from '../utils/format';
const API_URL = process.env.REACT_APP_API_URL;

export default function PatientHistoryModal({ isOpen, patientObj, onClose }) {
  const [visitHistory, setVisitHistory] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen || !patientObj?.patient_id) return;

    const fetchVisitHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/visits/history/${patientObj.patient_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('ข้อมูลไม่ถูกต้อง');
        setVisitHistory(data);
      } catch (err) {
        console.error(err);
        setErrorMsg('ไม่สามารถโหลดประวัติการรักษาได้');
        setVisitHistory([]);
      }
    };

    fetchVisitHistory();
  }, [isOpen, patientObj]);

  if (!isOpen || !patientObj) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h2>ประวัติผู้ป่วย</h2>
          <button onClick={onClose} style={closeButtonStyle}>❌ ปิด</button>
        </div>
        <p><b>HN:</b> {patientObj.patient_id}</p>
        <p><b>ชื่อ:</b> {patientObj.patients?.first_name} {patientObj.patients?.last_name}</p>
        <p><b>อายุ:</b> {formatAge(patientObj.patients?.birth_day)}</p>
        <p><b>เบอร์โทร:</b> {patientObj.patients?.telephone || '-'}</p>

        <h3 style={{ marginTop: '1rem' }}>ประวัติการรักษาเก่า</h3>
        {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
        {visitHistory.length === 0 ? (
          <p>ไม่มีประวัติการรักษา</p>
        ) : (
          <table border="1" width="100%" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>วันที่</th>
                <th>หมอ</th>
                <th>บันทึก</th>
                <th>หัตถการ</th>
                <th>นัดครั้งหน้า</th>
              </tr>
            </thead>
            <tbody>
              {visitHistory.map((v) => (
                <tr key={v.id}>
                  <td>{formatDate(v.visit_time)}</td>
                  <td>{v.doctors?.first_name} {v.doctors?.last_name}</td>
                  <td style={{ whiteSpace: 'pre-wrap' }}>{v.treatment_note || '-'}</td>
                  <td style={{ whiteSpace: 'pre-wrap' }}>{formatProcedures(v)}</td>
                  <td style={{ whiteSpace: 'pre-wrap' }}>{v.next_visit || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
  background: '#000000aa', display: 'flex', justifyContent: 'center',
  alignItems: 'center', overflowY: 'auto', padding: '1rem',
};

const modalStyle = {
  position: 'relative',
  background: '#fff',
  padding: '2rem',
  borderRadius: '10px',
  width: '95%',
  maxWidth: '1200px',
  maxHeight: '90vh',
  overflowY: 'auto',
};

const closeButtonStyle = {
  position: 'absolute',
  right: '2rem',
  border: 'none',
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  cursor: 'pointer',
};
