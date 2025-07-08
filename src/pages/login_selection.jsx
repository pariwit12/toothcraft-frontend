// 📁 frontend/src/pages/login_selection.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginSelection() {
  const navigate = useNavigate();

  return (
    <>
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <h1>เข้าสู่ระบบ</h1>
        <p>กรุณาเลือกประเภทผู้ใช้งาน</p>
        <button onClick={() => navigate('/login/staff')} style={{ margin: '10px' }}>
          เข้าสู่ระบบ Staff
        </button>
        <button onClick={() => navigate('/login/doctor')} style={{ margin: '10px' }}>
          เข้าสู่ระบบ Doctor
        </button>
      </div>
      <div style={{ textAlign: 'center' }}>
        <button onClick={() => navigate('/public')} style={{ margin: '10px' }}>
          สำหรับประชาชน
        </button>
      </div>
    </>
  );
}
