// 📁 frontend/src/pages/login_staff.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
const API_URL = process.env.REACT_APP_API_URL;

export default function LoginStaff() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        navigate('/dashboard/staff');
      } else {
        localStorage.removeItem('token'); // ✅ ลบ token ถ้า login ไม่สำเร็จ
        setMessage(data.error || 'ล็อกอินไม่สำเร็จ');
      }
    } catch (error) {
      localStorage.removeItem('token'); // ✅ ลบ token ถ้าเชื่อมต่อ backend ไม่ได้
      setMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>เข้าสู่ระบบ Staff</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="ชื่อผู้ใช้"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        /><br />
        <input
          type="password"
          placeholder="รหัสผ่าน"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br />
        <button type="submit" disabled={loading}>
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>
      {message && <p style={{ color: 'red' }}>{message}</p>}
    </div>
  );
}
