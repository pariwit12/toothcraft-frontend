// 📁 frontend/src/pages/logout.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    // 🔐 ลบ token ออกจาก localStorage
    localStorage.removeItem('token');

    // ✅ redirect ไปหน้าเลือก login
    navigate('/');
  }, [navigate]);

  return null; // ไม่ต้อง render อะไร
}
