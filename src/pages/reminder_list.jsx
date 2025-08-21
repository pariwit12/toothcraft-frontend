import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL;

export default function ReminderList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quota, setQuota] = useState(null); // 🟢 เพิ่ม state สำหรับเก็บข้อมูลโควต้า
  const [quotaLoading, setQuotaLoading] = useState(false); // 🟢 เพิ่ม state สำหรับโหลดโควต้า
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/appointments/reminders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error('ไม่สามารถโหลดรายการแจ้งเตือน:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLineQuota = async () => {
    setQuotaLoading(true);
    try {
      const response = await fetch(`${API_URL}/line/quota`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setQuota(data);
    } catch (error) {
      console.error('ไม่สามารถโหลด Line quota:', error);
    } finally {
      setQuotaLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchLineQuota();
  }, []);

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
    return `📌 เรียนคุณ ${name}\nขอแจ้งเตือนนัดหมายตรวจรักษาที่คลินิก ToothCraft\nในวัน ${date} เวลา ${time} ${doctor}${note}\n\nหากไม่สามารถมาตามนัด กรุณาแจ้งล่วงหน้า ขอบคุณค่ะ 😊`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => alert('คัดลอกข้อความเรียบร้อยแล้ว'))
      .catch(() => alert('ไม่สามารถคัดลอกข้อความได้'));
  };

  const markAsReminded = async (id, patientName) => {
    const confirmed = window.confirm(
      `คุณแน่ใจหรือไม่ว่าต้องการยืนยันการส่งข้อความถึง "${patientName}" แล้ว?`
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/appointments/${id}/mark-reminded`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('เกิดข้อผิดพลาดในการอัปเดต');

      await fetchAppointments();
    } catch (error) {
      alert('ไม่สามารถอัปเดต reminder_sent ได้');
      console.error(error);
    }
  };

  const pendingReminders = appointments.filter(a => !a.reminder_sent);
  const sentReminders = appointments.filter(a => a.reminder_sent);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>🔔 รายการผู้ป่วยที่ต้องแจ้งเตือนนัดพรุ่งนี้</h2>
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

      {/* 🟢 แสดงโควต้า Line ที่นี่ */}
      <div style={{
        padding: '0.5rem 1rem',
        backgroundColor: '#e6f7ff',
        border: '1px solid #91d5ff',
        borderRadius: '8px',
        marginBottom: '1rem'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>
          ✨ ข้อมูล Line OA:
        </p>
        {quotaLoading ? (
          <p style={{ margin: 0 }}>กำลังโหลดข้อมูลโควต้า...</p>
        ) : quota ? (
          <p style={{ margin: 0 }}>
            โควต้าข้อความ Push Message: <span style={{ fontWeight: 'bold' }}>{quota.value}</span> ข้อความ (สถานะ: {quota.type === 'limited' ? 'แบบจำกัด' : 'ไม่จำกัด'})
          </p>
        ) : (
          <p style={{ margin: 0, color: 'red' }}>ไม่สามารถดึงข้อมูลโควต้าได้</p>
        )}
      </div>

      {loading ? (
        <p>กำลังโหลดข้อมูล...</p>
      ) : (
        <>
          {/* รายการที่ยังไม่ส่งแจ้งเตือน */}
          <h3 style={{ marginTop: '2rem' }}>🟡 ยังไม่ได้แจ้งเตือน</h3>
          {pendingReminders.length === 0 ? (
            <p>ไม่พบผู้ป่วยที่ต้องแจ้งเตือน</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {pendingReminders.map((a) => {
                const message = generateMessage(a);
                const hn = a.patients?.id || 'ไม่พบ HN';
                const name = `${a.patients?.first_name || ''} ${a.patients?.last_name || ''}`;

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
                        onClick={() => markAsReminded(a.id, name)}
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

          {/* รายการที่ส่งแจ้งเตือนแล้ว */}
          <h3 style={{ marginTop: '2rem' }}>✅ แจ้งเตือนแล้ว</h3>
          {sentReminders.length === 0 ? (
            <p>ยังไม่มีรายการที่แจ้งเตือนแล้ว</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {sentReminders.map((a) => {
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
                      backgroundColor: '#f4f4f4',
                      opacity: 0.8,
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
                          cursor: 'pointer',
                        }}
                      >
                        📋 คัดลอกข้อความ
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
