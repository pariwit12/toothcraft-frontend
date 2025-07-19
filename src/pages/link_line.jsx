import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;
const LIFF_ID = "2007782065-45k6ZA90"; // กำหนด LIFF ID ที่ได้จาก Line Developer Console

export default function LinkLine() {
  const [lineUserId, setLineUserId] = useState(null);
  const [idNumber, setIdNumber] = useState('');
  const [status, setStatus] = useState('loading'); // loading, ready, error, success

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liff = (await import('@line/liff')).default;
        await liff.init({ liffId: LIFF_ID });
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }
        const profile = await liff.getProfile();
        setLineUserId(profile.userId);
        setStatus('ready');
      } catch (error) {
        console.error("LIFF init error", error);
        setStatus('error');
      }
    };
    initLiff();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lineUserId || !idNumber) return;

    try {
      await axios.post(`${API_URL}/public/link-line`, {
        id_number: idNumber,
        line_user_id: lineUserId,
      });
      setStatus('success');
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการเชื่อมบัญชี");
    }
  };

  if (status === 'loading') return <p>กำลังโหลด...</p>;
  if (status === 'error') return <p>กรุณาเปิดลิงก์นี้จากแอป Line เท่านั้น</p>;
  if (status === 'success') return <p>เชื่อมบัญชีเรียบร้อยแล้ว ขอบคุณค่ะ</p>;

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">เชื่อมบัญชีกับ Line</h2>
      <form onSubmit={handleSubmit}>
        <label className="block mb-2">เลขบัตรประชาชน</label>
        <input
          type="text"
          className="border p-2 w-full mb-4"
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          required
        />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
          ยืนยันการเชื่อมบัญชี
        </button>
      </form>
    </div>
  );
}
