import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL;

export default function DoctorVisitTodayPage() {
  const [doctorId, setDoctorId] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      setDoctorId(decoded.id);
    } catch (err) {
      setError('ไม่สามารถถอดรหัส Token ได้');
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!doctorId) return;

    setLoading(true);
    fetch(`${API_URL}/visits/today-by-doctor/${doctorId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('เกิดข้อผิดพลาดในการดึงข้อมูล');
        return res.json();
      })
      .then((data) => {
        setVisits(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'เกิดข้อผิดพลาด');
        setLoading(false);
      });
  }, [doctorId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH');
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatProcedures = (visit) => {
    if (!visit.visit_procedures || visit.visit_procedures.length === 0) return '-';
    return visit.visit_procedures.map((vp, idx) => {
      const procName = vp.procedures?.name || 'ไม่มีชื่อหัตถการ';
      const tooth = vp.tooth ? `#${vp.tooth}` : '';
      const price = vp.price ? `(${vp.price})` : '';
      const paidStatus = vp.paid ? '' : 'ยังไม่ชำระ';

      const displayText = [procName, tooth, price].filter(Boolean).join(' ');
      const statusText = paidStatus ? ` - ${paidStatus}` : '';

      return (
        <React.Fragment key={idx}>
          {displayText + statusText}
          {idx !== visit.visit_procedures.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>🦷 รายการที่คุณหมอทำในวันนี้</h2>

      <Link to="/dashboard/doctor">
        <button style={{ marginBottom: '1rem' }}>⬅️ กลับไปหน้าแดชบอร์ด</button>
      </Link>

      {loading && <p>🔄 กำลังโหลดข้อมูล...</p>}
      {error && <p style={{ color: 'red' }}>❌ {error}</p>}

      {!loading && visits.length === 0 ? (
        <p>📭 วันนี้ยังไม่มีรายการรักษา</p>
      ) : (
        <table border="1" width="100%" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>เวลา</th>
              <th>ชื่อผู้ป่วย</th>
              <th>หัตถการ</th>
              <th>หมายเหตุ</th>
              <th>นัดครั้งหน้า</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((v) => (
              <tr key={v.id}>
                <td>{formatTime(v.visit_time)}</td>
                <td>
                  {v.patients.id} - {v.patients?.first_name} {v.patients?.last_name}
                </td>
                <td style={{ whiteSpace: 'pre-wrap' }}>{formatProcedures(v)}</td>
                <td style={{ whiteSpace: 'pre-wrap' }}>{v.treatment_note || '-'}</td>
                <td style={{ whiteSpace: 'pre-wrap' }}>{v.next_visit || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
