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
        birth_day: form.birth_day     // 👇 แปลง birth_day ให้เป็น DateTime ISO string
          ? fromZonedTime(`${form.birth_day}T00:00:00.000Z`, 'Asia/Bangkok')
          : null,
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

      setPatientSummary(data.patient);
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
  
  // 🔧 เพิ่ม Media Query ผ่าน CSS-in-JS
  const containerStyle = {
    margin: '0 auto',
    padding: '1rem',
    fontFamily: 'sans-serif',
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: '600px', // 🔧 จำกัดความกว้างบนจอใหญ่
  };

  const headingStyle = {
    textAlign: 'center',
    marginBottom: '1.5rem',
    fontSize: '1.5rem', // 🔧 ขยาย heading สำหรับ desktop
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    paddingRight: '12px',           // ✅ 🔧 เพิ่ม padding ด้านขวาให้เสมอ
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '1rem',
    boxSizing: 'border-box',
    appearance: 'none',             // ✅ 🔧 ปิด default appearance (icon calendar)
    WebkitAppearance: 'none',       // ✅ 🔧 รองรับ Chrome/Safari
  };

  const textareaStyle = {
    ...inputStyle,
    resize: 'vertical',
  };

  const buttonStyle = (submitting) => ({
    padding: '14px',
    borderRadius: '6px',
    backgroundColor: submitting ? '#ccc' : '#4CAF50',
    color: 'white',
    border: 'none',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: submitting ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.3s ease',
  });

  const summaryBoxStyle = {
    border: '1px solid #ccc',
    padding: '1.5rem',
    borderRadius: '8px',
    background: '#f9fff9',
    fontSize: '1rem',
    lineHeight: '1.6', // 🔧 ปรับให้อ่านง่ายขึ้นทั้งในมือถือ/PC
  };

  // 🔧 ส่วน JSX ที่ปรับแล้ว
  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>📝 ลงทะเบียนคนไข้ด้วยตนเอง</h2>

      {patientSummary ? (
        <div style={summaryBoxStyle}>
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
            {[
              { label: 'ชื่อจริง', name: 'first_name' },
              { label: 'นามสกุล', name: 'last_name' },
              { label: 'เบอร์โทรศัพท์', name: 'telephone' },
              { label: 'เลขบัตรประชาชน', name: 'id_number' },
            ].map(({ label, name }) => (
              <div key={name}>
                <label>{label}</label><br />
                <input
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  required
                  style={inputStyle} // 🔧 ใช้ input style เดียวกันทุก input
                />
              </div>
            ))}

            <div>
              <label>วันเดือนปีเกิด</label><br />
              <input
                name="birth_day"
                type="date"
                value={form.birth_day}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label>ข้อมูลเพิ่มเติม (อาการเบื้องต้น หรือเหตุผลที่มาพบแพทย์)</label><br />
              <textarea
                name="detail_to_room"
                value={form.detail_to_room}
                onChange={handleChange}
                rows={3}
                style={textareaStyle}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={buttonStyle(submitting)}
            >
              {submitting ? 'กำลังลงทะเบียน...' : '✅ ยืนยันลงทะเบียน'}
            </button>
          </div>
        </form>
      )}

      {message && (
        <p style={{
          marginTop: '1rem',
          color: message.includes('✅') ? 'green' : 'red',
          fontWeight: 'bold',
          fontSize: '1rem'
        }}>
          {message}
        </p>
      )}
    </div>
  );

}
