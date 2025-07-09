// 📁 src/pages/patient_detail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
const API_URL = process.env.REACT_APP_API_URL;

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState('');

  // เก็บประวัติการรักษา
  const [visitHistory, setVisitHistory] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    // ดึงข้อมูลผู้ป่วย
    fetch(`${API_URL}/patients/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('ไม่พบข้อมูลผู้ป่วย');
        return res.json();
      })
      .then((data) => {
        setPatient(data);
      })
      .catch((err) => {
        setError(err.message);
      });

    // ดึงประวัติการรักษา
    fetch(`${API_URL}/visits/history/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('ไม่สามารถโหลดประวัติการรักษาได้');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setVisitHistory(data);
        else setVisitHistory([]);
      })
      .catch((err) => {
        console.error(err);
        setVisitHistory([]);
      });
  }, [id]);

  // ฟอร์แมตวันที่
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH');
  };

  // ฟอร์แมตหัตถการ
  const formatProcedures = (visit) => {
    if (!visit.visit_procedures || visit.visit_procedures.length === 0) return '-';
    return visit.visit_procedures.map((vp, idx) => {
      const procName = vp.procedures?.name || 'ไม่มีชื่อหัตถการ';
      const tooth = vp.tooth ? `#${vp.tooth}` : '';
      const price = vp.price ? `(${vp.price})` : '';
      const paidStatus = vp.paid ? 'ชำระแล้ว' : 'ยังไม่ชำระ';
      return (
        <React.Fragment key={idx}>
          {`${procName} ${tooth} ${price} - ${paidStatus}`}
          {idx !== visit.visit_procedures.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>รายละเอียดผู้ป่วย</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!error && !patient && <p>กำลังโหลดข้อมูล...</p>}

      {patient && (
        <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
          <p><strong>HN:</strong> {patient.id}</p>
          <p><strong>ชื่อ:</strong> {patient.first_name} {patient.last_name}</p>
          <p><strong>เบอร์โทร:</strong> {patient.telephone}</p>
          <p><strong>เลขบัตรประชาชน:</strong> {patient.id_number}</p>
          <p><strong>วันเกิด:</strong> {patient.birth_day ? new Date(patient.birth_day).toLocaleDateString() : '-'}</p>

          <button style={{ marginTop: '1rem' }} onClick={() => navigate(-1)}>
            🔙 ย้อนกลับ
          </button>
        </div>
      )}

      <h3>ประวัติการรักษา</h3>
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
  );
}
