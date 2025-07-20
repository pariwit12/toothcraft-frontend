import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;
const LIFF_ID = '2007782065-45k6ZA90';

export default function LinkLine() {
  const [lineUserId, setLineUserId] = useState(null);
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [patient, setPatient] = useState(null);
  const [status, setStatus] = useState('loading'); // loading, need-add-oa, ready, error, verified, success

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
        const friendship = await liff.getFriendship();

        if (!friendship.friendFlag) {
          setStatus('need-add-oa');
          return;
        }

        setLineUserId(profile.userId);
        setStatus('ready');
      } catch (error) {
        console.error('LIFF init error', error);
        setStatus('error');
      }
    };
    initLiff();
  }, []);

  const handleVerifyId = async () => {
    try {
      const res = await axios.get(`${API_URL}/public/search-patients-by-id-number/${idNumber.trim()}`);
      setPatient(res.data);
      setStatus('verified');
    } catch (err) {
      console.error(err);

      if (err.response) {
        const { status, data } = err.response;

        if (status === 400 || status === 404) {
          alert(`❌ ${data.error}`);
        } else {
          alert('❌ เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง');
        }
      } else {
        alert('❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lineUserId || !patient?.id || !phone) return;

    try {
      // 1. ผูกบัญชี Line
      await axios.post(`${API_URL}/public/link-line`, {
        id_number: patient.id_number,
        line_user_id: lineUserId,
      });

      // 2. อัปเดตเบอร์โทรศัพท์
      await axios.put(`${API_URL}/public/${patient.id}`, {
        ...patient,
        telephone: phone,
      });

      setStatus('success');
    } catch (err) {
      console.error(err);
      alert('❌ เกิดข้อผิดพลาดในการเชื่อมบัญชีหรืออัปเดตเบอร์โทร');
    }
  };

  if (status === 'loading') return <p>กำลังโหลด...</p>;

  if (status === 'error')
    return <p>กรุณาเปิดลิงก์นี้จากแอป Line เท่านั้น</p>;

  if (status === 'need-add-oa')
    return (
      <div className="p-4 max-w-md mx-auto text-center">
        <p className="mb-4 text-red-600 font-semibold">
          ⚠️ กรุณาแอด LINE Official Account ก่อนดำเนินการต่อ
        </p>
        <a
          href="https://lin.ee/U4p9FYN" // ← แก้เป็นลิงก์แอด OA ของคุณ
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-600 text-white px-4 py-2 rounded inline-block"
        >
          ➕ แอด LINE OA
        </a>
        <div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 underline text-blue-600 text-sm"
          >
            🔄 โหลดใหม่อีกครั้งหลังแอดเสร็จ
          </button>
        </div>
      </div>
    );

  if (status === 'success')
    return <p className="p-4 max-w-md mx-auto text-green-700 font-semibold">✅ ลงทะเบียนเรียบร้อยแล้ว ขอบคุณค่ะ</p>;

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">ลงทะเบียน ToothCraft</h2>

      {/* STEP 1: กรอกเลขบัตร */}
      {status === 'ready' && (
        <>
          <label className="block mb-2">เลขบัตรประชาชน</label>
          <input
            type="text"
            className="border p-2 w-full mb-4"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            required
          />
          <button
            onClick={handleVerifyId}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            ตรวจสอบ
          </button>
        </>
      )}

      {/* STEP 2: แสดงชื่อ + เบอร์โทร */}
      {status === 'verified' && patient && (
        <form onSubmit={handleSubmit}>
          <p className="mt-4">
            ✅ พบข้อมูลคนไข้<br />
            <strong>
              ชื่อ: {patient.first_name} {patient.last_name}<br />
              เลขบัตรประชาชน: {patient.id_number}
            </strong>
          </p>

          <label className="block mt-4 mb-2">เบอร์โทรศัพท์</label>
          <input
            type="text"
            className="border p-2 w-full mb-4"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            ยืนยันข้อมูลและลงทะเบียน
          </button>
        </form>
      )}
    </div>
  );
}