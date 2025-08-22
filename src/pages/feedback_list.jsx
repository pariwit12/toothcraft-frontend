import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL;

export default function FeedbackList() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quota, setQuota] = useState(null); // 🟢 เพิ่ม state สำหรับเก็บข้อมูลโควต้า
  const [quotaLoading, setQuotaLoading] = useState(false); // 🟢 เพิ่ม state สำหรับโหลดโควต้า
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/feedback-surveys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setFeedbacks(data);
    } catch (error) {
      console.error('ไม่สามารถโหลดรายการ feedback:', error);
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
    fetchFeedbacks();
    fetchLineQuota();
  }, []);

  const formatDateThai = (dateStr) =>
    new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const generateMessage = (fb) => {
    const name = `${fb.patients?.first_name || ''} ${fb.patients?.last_name || ''}`.trim();
    const sentDate = formatDateThai(fb.time_sent);
    const rawDate = (() => {
      const date = new Date(fb.time_sent);
      const [day, month, year] = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date).split('/');
      return `${year}-${month}-${day}`;
    })();


    // 👉 ใส่ค่าลงใน Google Form URL (ต้องปรับ entry.XXXX ให้ตรงกับช่องใน Google Form)
    const encodedName = encodeURIComponent(name);
    const encodedDate = encodeURIComponent(rawDate);

    const formUrl = `https://docs.google.com/forms/d/e/1FAIpQLSe39K4BZ-fmQEn5Lre3kA8d3JWxE0XrQAwn46ow1umVNX17Bg/viewform?usp=pp_url&entry.1370361891=${encodedDate}&entry.409582844=${encodedName}`;

    return `เรียนคุณ ${name}
คลินิกทันตกรรม ToothCraft ขอขอบคุณที่เข้ารับบริการกับเราในวันที่ ${sentDate}

เพื่อพัฒนาคุณภาพการบริการให้ดียิ่งขึ้น
รบกวนสละเวลาไม่กี่นาทีในการตอบแบบประเมินความพึงพอใจผ่านลิงก์ที่เราได้ส่งไปให้
${formUrl}

ดูการรักษาและผลตรวจได้ที่ https://liff.line.me/2007782065-3M56JnV7
ขอขอบพระคุณค่ะ 🙏😊`;
  };


  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => alert('คัดลอกข้อความเรียบร้อยแล้ว'))
      .catch(() => alert('ไม่สามารถคัดลอกข้อความได้'));
  };

  const markAsSent = async (id, patientName) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการยืนยันการส่งข้อความถึง "${patientName}" แล้ว?`)) return;

    try {
      const res = await fetch(`${API_URL}/feedback-surveys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setFeedbacks((prev) => prev.filter((fb) => fb.id !== id));
      } else {
        alert('ไม่สามารถลบข้อมูลได้');
      }
    } catch (err) {
      console.error('เกิดข้อผิดพลาดในการลบ:', err);
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>📝 ประเมินความพึงพอใจ</h2>
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
      ) : feedbacks.length === 0 ? (
        <p>ไม่พบรายการแบบประเมิน</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {feedbacks.map((fb) => {
            const message = generateMessage(fb);
            const hn = fb.patients?.id || 'ไม่พบ HN';

            return (
              <li
                key={fb.id}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  backgroundColor: '#f7f7f7',
                }}
              >
                <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  🆔 HN: {hn}
                </div>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message}</pre>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
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
                  <button
                    onClick={() =>
                      markAsSent(
                        fb.id,
                        `${fb.patients?.first_name || ''} ${fb.patients?.last_name || ''}`
                      )}
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
