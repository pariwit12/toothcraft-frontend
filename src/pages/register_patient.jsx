import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/confirm_modal';
import { fromZonedTime } from 'date-fns-tz';
const API_URL = process.env.REACT_APP_API_URL;

export default function RegisterPatient() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    telephone: '',
    id_number: '',
    birth_day: '',
  });
  const [message, setMessage] = useState('');
  const [newPatient, setNewPatient] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);  // ✅ state modal show/hide
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ฟังก์ชันตรวจสอบเลขบัตรประชาชน (รูปแบบ 13 หลัก, เลขจริง)
  const validateIdNumber = (id) => {
    if (!id || id.length !== 13) return false;
    if (!/^\d{13}$/.test(id)) return false;

    const digits = id.split('').map(Number);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += digits[i] * (13 - i);
    }
    const checkDigit = (11 - (sum % 11)) % 10;
    return checkDigit === digits[12];
  };

  // ฟังก์ชันเปิด modal แทน handleSubmit เดิม
  const handleFormSubmit = (e) => {
    e.preventDefault();
    setMessage('');
    setNewPatient(null);
    setShowConfirm(true); // เปิด modal
  };

  // ฟังก์ชันส่งข้อมูลจริงไป backend
  const handleSubmit = async () => {
    setShowConfirm(false);
    try {
      const token = localStorage.getItem('token');

      if (form.id_number) {
        const checkRes = await fetch(`${API_URL}/patients/check-id/${form.id_number}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const checkData = await checkRes.json();
        if (checkData.exists) {
          setMessage('❌ เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว');
          return;
        }
      }

      const res = await fetch(`${API_URL}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          birth_day: form.birth_day ? fromZonedTime(`${form.birth_day}T00:00:00Z`, 'Asia/Bangkok') : null,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        const queueRes = await fetch(`${API_URL}/clinic-queue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            patient_id: data.id,
            time_coming: new Date().toISOString(),
            room: "0", // ✅ ห้องเริ่มต้น
            detail_to_room: "ลงทะเบียนโดย staff", // หรือ "self-register" ก็ได้
          }),
        });

        setMessage('✅ ลงทะเบียนคนไข้สำเร็จ');
        setNewPatient(data);
        setForm({
          first_name: '',
          last_name: '',
          telephone: '',
          id_number: '',
          birth_day: '',
        });
      } else {
        setMessage(data.error || '❌ เกิดข้อผิดพลาด');
      }
    } catch (err) {
      setMessage('❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
    }
  };

  const formatThaiDate = (isoDateStr) => {
    if (!isoDateStr) return '-';
    const date = new Date(isoDateStr);
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear() + 543;
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
    ];
    return `${day} ${thaiMonths[month]} ${year}`;
  };

  const calculateAge = (isoDateStr) => {
    if (!isoDateStr) return '-';
    const today = new Date();
    const birthDate = new Date(isoDateStr);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const fetchFromCardReader = async () => {
    try {
      const res = await fetch('http://localhost:5001/read-card');
      if (!res.ok) throw new Error('ไม่พบข้อมูลจากบัตร');

      const data = await res.json();
      setForm((prev) => ({
        ...prev,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        id_number: data.id_number || '',
        birth_day: data.birth_day || '',
      }));
      setMessage('✅ ดึงข้อมูลจากบัตรสำเร็จ');
    } catch (err) {
      setMessage('❌ ไม่สามารถดึงข้อมูลจากบัตรได้');
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard/staff');
  };

  return (
    <div>
      <h2>ลงทะเบียนคนไข้ใหม่</h2>

      <button onClick={fetchFromCardReader} style={{ marginBottom: '1rem' }}>
        📥 ดึงจากบัตรประชาชน
      </button>
      <button onClick={handleBackToDashboard} style={{ marginBottom: '1rem' }}>
        🔙 กลับไปแดชบอร์ด
      </button>

      <form onSubmit={handleFormSubmit}>
        <input
          name="first_name"
          placeholder="ชื่อจริง"
          value={form.first_name}
          onChange={handleChange}
          required
        /><br />
        <input
          name="last_name"
          placeholder="นามสกุล"
          value={form.last_name}
          onChange={handleChange}
          required
        /><br />
        <input
          name="telephone"
          placeholder="เบอร์โทร"
          value={form.telephone}
          onChange={handleChange}
          required
        /><br />
        <input
          name="id_number"
          placeholder="เลขบัตรประชาชน"
          value={form.id_number}
          onChange={handleChange}
          required
        /><br />
        <input
          name="birth_day"
          type="date"
          value={form.birth_day}
          onChange={handleChange}
          required
        /><br />
        <button type="submit">ลงทะเบียน</button>
      </form>

      {message && <p>{message}</p>}

      {newPatient && (
        <div style={{ marginTop: '1rem', border: '1px solid #ccc', padding: '1rem' }}>
          <h3>ข้อมูลคนไข้ที่เพิ่งลงทะเบียน</h3>
          <p><strong>HN:</strong> {newPatient.id}</p>
          <p><strong>ชื่อ:</strong> {newPatient.first_name} {newPatient.last_name}</p>
          <p><strong>เบอร์โทร:</strong> {newPatient.telephone || '-'}</p>
          <p><strong>เลขบัตรประชาชน:</strong> {newPatient.id_number || '-'}</p>
          <p><strong>วันเกิด:</strong> {formatThaiDate(newPatient.birth_day)}</p>
          <p><strong>อายุ:</strong> {calculateAge(newPatient.birth_day)} ปี</p>
        </div>
      )}

      {/* เรียกใช้งาน ConfirmModal */}
      <ConfirmModal
        visible={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSubmit}
        formData={form}
        formatThaiDate={formatThaiDate}
        calculateAge={calculateAge}
        idNumberValid={validateIdNumber(form.id_number)}
      />
    </div>
  );
}
