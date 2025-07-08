import React from 'react';
import { Link } from 'react-router-dom';

export default function DashboardPublic() {

  return (
    <div>
      <h1>แดชบอร์ดของ Public</h1>
      <p>ยินดีต้อนรับสู่ระบบ ToothCraft สำหรับประชาชน</p>

      <Link to="/register-public">
        <button style={{ marginLeft: '1rem' }}>ลงทะเบียนด้วยตนเอง (สำหรับประชาชน)</button>
      </Link>
      <Link to="/">
        <button style={{ marginLeft: '1rem' }}>🔙 กลับหน้าแรก</button>
      </Link>
      
    </div>
  );
}
