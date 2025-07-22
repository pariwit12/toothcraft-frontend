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
      await axios.post(`${API_URL}/public/link-line`, {
        id_number: patient.id_number,
        line_user_id: lineUserId,
      });

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

  if (status === 'error') return <p>กรุณาเปิดลิงก์นี้จากแอป Line เท่านั้น</p>;

  if (status === 'need-add-oa') {
    return (
      <div className="text-center" style={{ padding: '1rem', maxWidth: '400px', margin: '0 auto' }}>
        <style>{`
          .line-add-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 10px 20px;
            background-color: #06C755;
            color: white;
            font-weight: bold;
            text-decoration: none;
            border-radius: 999px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: background-color 0.3s ease, transform 0.2s ease;
            margin-bottom: 1rem;
          }

          .line-add-button:hover {
            background-color: #05b64a;
            transform: translateY(-1px);
          }

          .line-icon {
            font-size: 18px;
            margin-right: 8px;
          }

          .reload-button {
            display: inline-block;
            margin-top: 0.5rem;
            padding: 8px 16px;
            font-size: 0.9rem;
            font-weight: 500;
            color: #2563eb;
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 999px;
            cursor: pointer;
            transition: background-color 0.2s ease, transform 0.2s ease;
          }

          .reload-button:hover {
            background-color: #dbeafe;
            transform: translateY(-1px);
          }
        `}</style>

        <p style={{ marginBottom: '1rem', color: '#DC2626', fontWeight: '600' }}>
          ⚠️ กรุณาแอด LINE Official Account ก่อนดำเนินการต่อ
        </p>

        <a
          href="https://lin.ee/U4p9FYN"
          target="_blank"
          rel="noopener noreferrer"
          className="line-add-button"
        >
          <span className="line-icon">➕</span>
          เพิ่มเพื่อนกับ LINE OA
        </a>

        <div>
          <button
            onClick={() => window.location.reload()}
            className="reload-button"
          >
            🔄 โหลดใหม่อีกครั้งหลังแอดเสร็จ
          </button>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <p style={{ padding: '1rem', maxWidth: '400px', margin: '0 auto', color: '#15803D', fontWeight: '600' }}>
        ✅ ลงทะเบียนเรียบร้อยแล้ว ขอบคุณค่ะ
      </p>
    );
  }

  return (
    <div style={{ padding: '1rem', maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>ลงทะเบียน ToothCraft</h2>

      {status === 'ready' && (
        <>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>เลขบัตรประชาชน</label>
          <input
            type="text"
            style={{ border: '1px solid #ccc', padding: '0.5rem', width: '100%', marginBottom: '1rem', marginRight: '1rem' }}
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            required
          />
          <button
            onClick={handleVerifyId}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            ตรวจสอบ
          </button>
        </>
      )}

      {status === 'verified' && patient && (
        <form onSubmit={handleSubmit}>
          <p style={{ marginTop: '1rem' }}>
            ✅ พบข้อมูลคนไข้<br />
            <strong>
              ชื่อ: {patient.first_name} {patient.last_name}<br />
              เลขบัตรประชาชน: {patient.id_number}
            </strong>
          </p>

          <label style={{ display: 'block', marginTop: '1rem', marginBottom: '0.5rem' }}>เบอร์โทรศัพท์</label>
          <input
            type="text"
            style={{ border: '1px solid #ccc', padding: '0.5rem', width: '100%', marginBottom: '1rem', marginRight: '1rem' }}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <button
            type="submit"
            style={{
              backgroundColor: '#16A34A',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            ยืนยันข้อมูลและลงทะเบียน
          </button>
        </form>
      )}
    </div>
  );
}
