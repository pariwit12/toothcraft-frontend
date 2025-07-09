import { fromZonedTime } from 'date-fns-tz';
import React, { useState } from 'react';
const API_URL = process.env.REACT_APP_API_URL;

export default function PublicRegister() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    telephone: '',
    id_number: '',
    birth_day: '',
    detail_to_room: '',
  });

  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [patientSummary, setPatientSummary] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateIdNumber = (id) => {
    if (!id || id.length !== 13) return false;
    if (!/^[0-9]{13}$/.test(id)) return false;
    const digits = id.split('').map(Number);
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += digits[i] * (13 - i);
    const checkDigit = (11 - (sum % 11)) % 10;
    return checkDigit === digits[12];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setSubmitting(true);

    if (!validateIdNumber(form.id_number)) {
      setMessage('❌ เลขบัตรประชาชนไม่ถูกต้อง');
      setSubmitting(false);
      return;
    }

    try {
      const formToSend = {
        ...form,
        // 👇 แปลง birth_day ให้เป็น DateTime ISO string
        birth_day: form.birth_day ? fromZonedTime(`${form.birth_day}T00:00:00.000Z`, 'Asia/Bangkok') : null,
        detail_to_room: form.detail_to_room
          ? `ลงทะเบียนด้วยตนเอง\n\n-- Patient --\n${form.detail_to_room.trim()}`
          : 'ลงทะเบียนด้วยตนเอง',
      };

      const res = await fetch(`${API_URL}/public/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formToSend),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || '❌ เกิดข้อผิดพลาดในการลงทะเบียน');
        setSubmitting(false);
        return;
      }

      setPatientSummary(data.patient); // แสดงผลจาก backend ที่ตอบกลับ
      setForm({
        first_name: '',
        last_name: '',
        telephone: '',
        id_number: '',
        birth_day: '',
        detail_to_room: '',
      });
      setMessage('');
    } catch (err) {
      console.error(err);
      setMessage('❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
    }

    setSubmitting(false);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>📝 ลงทะเบียนคนไข้ด้วยตนเอง</h2>

      {patientSummary ? (
        <div style={{ border: '1px solid #ccc', padding: '1.5rem', borderRadius: '8px', background: '#f9fff9' }}>
          <h3 style={{ color: 'green' }}>✅ ลงทะเบียนสำเร็จ! กรุณารอเรียกคิว</h3>
          <p><strong>ชื่อ:</strong> {patientSummary.first_name}</p>
          <p><strong>นามสกุล:</strong> {patientSummary.last_name}</p>
          <p><strong>เบอร์โทร:</strong> {patientSummary.telephone || '-'}</p>
          <p><strong>เลขบัตรประชาชน:</strong> {patientSummary.id_number}</p>
          <p><strong>วันเกิด:</strong> {new Date(patientSummary.birth_day).toLocaleDateString('th-TH') || '-'}</p>
          <p><strong>ข้อมูลเพิ่มเติม:</strong> {form.detail_to_room || '-'}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label>ชื่อจริง</label><br />
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label>นามสกุล</label><br />
              <input
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label>เบอร์โทรศัพท์</label><br />
              <input
                name="telephone"
                value={form.telephone}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label>เลขบัตรประชาชน</label><br />
              <input
                name="id_number"
                value={form.id_number}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label>วันเดือนปีเกิด</label><br />
              <input
                name="birth_day"
                type="date"
                value={form.birth_day}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label>ข้อมูลเพิ่มเติม (อาการเบื้องต้น หรือเหตุผลที่มาพบแพทย์)</label><br />
              <textarea
                name="detail_to_room"
                value={form.detail_to_room}
                onChange={handleChange}
                rows={3}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '10px',
                borderRadius: '5px',
                backgroundColor: submitting ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'กำลังลงทะเบียน...' : '✅ ยืนยันลงทะเบียน'}
            </button>
          </div>
        </form>
      )}

      {message && (
        <p style={{ marginTop: '1rem', color: message.includes('✅') ? 'green' : 'red' }}>
          {message}
        </p>
      )}
    </div>
  );
}
