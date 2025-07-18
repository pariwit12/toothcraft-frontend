import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL;

export default function ConfirmCreateSentList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/appointments/confirm-create`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error('ไม่สามารถโหลดรายการยืนยันนัด:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [token]);

  const formatDateThai = (dateStr) =>
    new Date(dateStr).toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

  const generateMessage = (a) => {
    const name = `${a.patients?.first_name || ''} ${a.patients?.last_name || ''}`;
    const date = formatDateThai(a.appointment_time);
    const time = formatTime(a.appointment_time);
    const doctor = a.doctors?.first_name
      ? `กับคุณหมอ${a.doctors.first_name} ${a.doctors.last_name || ''}`
      : '';
    const note = a.note ? `\nหมายเหตุ: ${a.note}` : '';
    return `📌 เรียนคุณ ${name}\nคลินิก ToothCraft ได้ลงนัดของคุณเรียบร้อยแล้ว\nในวัน ${date} เวลา ${time} ${doctor}${note}\n\nหากมีข้อสงสัยสามารถสอบถามเพิ่มเติมได้เลยนะคะ ขอบคุณค่ะ 😊`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => alert('คัดลอกข้อความเรียบร้อยแล้ว'))
      .catch(() => alert('ไม่สามารถคัดลอกข้อความได้'));
  };

  const markAsConfirmed = async (id, patientName) => {
    const confirmed = window.confirm(
      `คุณแน่ใจหรือไม่ว่าต้องการยืนยันการส่งข้อความถึง "${patientName}" แล้ว?`
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/appointments/${id}/mark-confirm-create`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('เกิดข้อผิดพลาดในการอัปเดต');

      await fetchAppointments();
    } catch (error) {
      alert('ไม่สามารถอัปเดต confirm_create_sent ได้');
      console.error(error);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>📨 รายการผู้ป่วยที่ต้องยืนยันการลงวันนัด</h2>
        <button
          onClick={() => navigate('/dashboard/staff')}
          style={{
            marginLeft: '1rem',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          ⬅️ กลับหน้าหลัก
        </button>
      </div>

      {loading ? (
        <p>กำลังโหลดข้อมูล...</p>
      ) : appointments.length === 0 ? (
        <p>ไม่พบนัดที่ยังไม่ได้ยืนยันการแจ้ง</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {appointments.map((a) => {
            const message = generateMessage(a);
            const hn = a.patients?.id || 'ไม่พบ HN';

            return (
              <li
                key={a.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  backgroundColor: '#fefefe',
                }}
              >
                <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  🆔 HN: {hn}
                </div>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message}</pre>
                <div style={{ marginTop: '0.5rem' }}>
                  <button
                    onClick={() => copyToClipboard(message)}
                    style={{
                      backgroundColor: '#4caf50',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      marginRight: '1rem',
                      cursor: 'pointer',
                    }}
                  >
                    📋 คัดลอกข้อความ
                  </button>

                  <button
                    onClick={() =>
                      markAsConfirmed(
                        a.id,
                        `${a.patients?.first_name || ''} ${a.patients?.last_name || ''}`
                      )
                    }
                    style={{
                      backgroundColor: '#1976d2',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    ✅ ส่งแล้ว
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
