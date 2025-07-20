import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/confirm_modal';
import { fromZonedTime } from 'date-fns-tz';

const API_URL = process.env.REACT_APP_API_URL;

export default function RegisterPatientWithLine() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    telephone: '',
    id_number: '',
    birth_day: '',
  });
  const [message, setMessage] = useState('');
  const [newPatient, setNewPatient] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateIdNumber = (id) => {
    if (!id || id.length !== 13 || !/^\d{13}$/.test(id)) return false;
    const digits = id.split('').map(Number);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += digits[i] * (13 - i);
    }
    const checkDigit = (11 - (sum % 11)) % 10;
    return checkDigit === digits[12];
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setMessage('');
    setNewPatient(null);
    setShowConfirm(true);
  };

  // ฟังก์ชันส่งข้อมูลจริงไป backend
  const handleSubmit = async () => {
    setShowConfirm(false);
    try {
      const token = localStorage.getItem('token');

      const trimmedForm = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        telephone: form.telephone.trim(),
        id_number: form.id_number.trim(),
        birth_day: form.birth_day.trim(),
      };

      if (trimmedForm.id_number) {
        const checkRes = await fetch(`${API_URL}/patients/check-id/${trimmedForm.id_number}`, {
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
          ...trimmedForm,
          birth_day: trimmedForm.birth_day
            ? fromZonedTime(`${trimmedForm.birth_day}T00:00:00Z`, 'Asia/Bangkok')
            : null,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        await fetch(`${API_URL}/clinic-queue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            patient_id: data.id,
            time_coming: new Date().toISOString(),
            room: "0",
            detail_to_room: "ลงทะเบียนโดย staff",
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
    <div style={{ maxWidth: 500, margin: '2rem auto', padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2 style={{ marginBottom: '1rem' }}>ลงทะเบียนคนไข้ใหม่</h2>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button onClick={fetchFromCardReader}>📥 ดึงจากบัตรประชาชน</button>
        <button onClick={handleBackToDashboard}>🔙 กลับไปแดชบอร์ด</button>
      </div>

      <form onSubmit={handleFormSubmit} style={{ paddingRight: '1rem' }}>
        {[
          { label: 'ชื่อจริง', name: 'first_name' },
          { label: 'นามสกุล', name: 'last_name' },
          { label: 'เบอร์โทร', name: 'telephone' },
          { label: 'เลขบัตรประชาชน', name: 'id_number' },
          { label: 'วันเกิด', name: 'birth_day', type: 'date' },
        ].map((field) => (
          <div key={field.name} style={{ marginBottom: '0.75rem' }}>
            <label>{field.label}</label><br />
            <input
              name={field.name}
              type={field.type || 'text'}
              value={form[field.name]}
              onChange={handleChange}
              required={field.name !== 'telephone'}
              disabled={field.name === 'telephone'}
              placeholder={field.name === 'telephone' ? 'รอคนไข้ลงทะเบียนใน Line' : ''}
              style={{ 
                width: '100%',
                padding: '0.5rem',
                marginTop: '0.25rem',
                fontSize: '1.25rem',
                backgroundColor: field.name === 'telephone' ? '#eee' : 'white',
                color: field.name === 'telephone' ? '#666' : 'black',
              }}
            />
            {field.name === 'telephone' && (
              <small style={{ color: '#999' }}>จะดึงข้อมูลเบอร์โทรจากการลงทะเบียนใน Line</small>
            )}
          </div>
        ))}
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>✅ ลงทะเบียน</button>
      </form>

      {message && (
        <p style={{
          marginTop: '1rem',
          color: message.startsWith('✅') ? 'green' : 'red',
        }}>
          {message}
        </p>
      )}

      {newPatient && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f9f9f9', border: '1px solid #ddd' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>ข้อมูลคนไข้ที่เพิ่งลงทะเบียน</h3>
          <p><strong>HN:</strong> {newPatient.id}</p>
          <p><strong>ชื่อ:</strong> {newPatient.first_name} {newPatient.last_name}</p>
          <p><strong>เบอร์โทร:</strong> {newPatient.telephone || '-'}</p>
          <p><strong>เลขบัตรประชาชน:</strong> {newPatient.id_number || '-'}</p>
          <p><strong>วันเกิด:</strong> {formatThaiDate(newPatient.birth_day)}</p>
          <p><strong>อายุ:</strong> {calculateAge(newPatient.birth_day)} ปี</p>
        </div>
      )}

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
