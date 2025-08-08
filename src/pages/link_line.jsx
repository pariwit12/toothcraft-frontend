import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { fromZonedTime } from 'date-fns-tz';

const API_URL = process.env.REACT_APP_API_URL;
const LIFF_ID = '2007782065-45k6ZA90';

export default function LinkLine() {
  const [lineUserId, setLineUserId] = useState(null);
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [patient, setPatient] = useState(null);
  const [status, setStatus] = useState('loading'); // loading, need-add-oa, register-new-hn, ready, error, verified, success
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

        // ปกติ liff.getProfile() จะไม่คืน anonymous ID (จะคืนจริงเลยถ้าเป็นเพื่อน)
        // แต่เพื่อความชัวร์ ควรเช็คว่า profile.userId เริ่มต้นด้วย "U" ซึ่งเป็น prefix ของ LINE userId จริง
        if (!profile.userId || !profile.userId.startsWith("U")) {
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

  useEffect(() => {
    if (status === 'success') {
      alert('✅ ลงทะเบียนเรียบร้อยแล้ว ขอบคุณค่ะ');
    }
  }, [status]);

  const handleVerifyId = async () => {
    try {
      const res = await axios.get(`${API_URL}/public/search-patients-by-id-number/${idNumber.trim()}`);
      setPatient(res.data);
      setPhone(res.data.telephone || '');
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
    if (!lineUserId || !patient?.id_number || !phone) return;

    try {
      await axios.post(`${API_URL}/public/link-line-and-update-phone`, {
        id_number: patient.id_number,
        line_user_id: lineUserId,
        telephone: phone,
      });

      setStatus('success');
    } catch (err) {
      console.error(err);
      alert('❌ เกิดข้อผิดพลาดในการลงทะเบียน');
    }
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

  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    // แสดง popup ยืนยัน
    const confirmSubmit = window.confirm('คุณต้องการยืนยันการลงทะเบียนใช่หรือไม่?');
    if (!confirmSubmit) return; // ถ้าไม่ยืนยัน -> หยุด

    setMessage('');
    setSubmitting(true);

    if (!validateIdNumber(idNumber)) {
      setMessage('❌ เลขบัตรประชาชนไม่ถูกต้อง');
      setSubmitting(false);
      return;
    }

    // ✅ ตรวจสอบว่า birth_day ไม่ควรอยู่ในอนาคต = กรอกมาเป็น พ.ศ.
    if (birthDay && new Date(birthDay) > new Date()) {      // ไม่ได้สนใจ time-zone
      setMessage('❌ กรุณากรอกวันเกิดเป็นปี ค.ศ.');
      setSubmitting(false);
      return;
    }

    try {

      const payload = {
        first_name: firstName,
        last_name: lastName,
        telephone: phone,
        id_number: idNumber,
        birth_day: birthDay     // 👇 แปลง birth_day ให้เป็น DateTime ISO string
          ? fromZonedTime(`${birthDay}T00:00:00.000Z`, 'Asia/Bangkok')
          : null,
        line_user_id: lineUserId,
      };

      const res = await fetch(`${API_URL}/public/link-line-and-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || '❌ เกิดข้อผิดพลาดในการลงทะเบียน');
        setSubmitting(false);
        return;
      }
      
      setStatus('success');

    } catch (err) {
      console.error(err);
      setMessage('❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
    }

    setSubmitting(false);

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
            style={{ border: '1px solid #ccc', padding: '0.5rem', width: '100%', marginBottom: '1rem' }}
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
          <button
            onClick={() => setStatus('register-new-hn')}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              marginLeft: '1rem',
            }}
          >
            คนไข้ใหม่
          </button>
        </>
      )}

      {status === 'register-new-hn' && (
        <form onSubmit={handleCreateSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            <div>
              <label>ชื่อจริง</label><br />
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                style={inputStyle} // 🔧 ใช้ input style เดียวกันทุก input
              />
            </div>

            <div>
              <label>นามสกุล</label><br />
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                style={inputStyle} // 🔧 ใช้ input style เดียวกันทุก input
              />
            </div>

            <div>
              <label>เบอร์โทรศัพท์</label><br />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={inputStyle} // 🔧 ใช้ input style เดียวกันทุก input
              />
            </div>

            <div>
              <label>เลขบัตรประชาชน</label><br />
              <input
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                required
                style={inputStyle} // 🔧 ใช้ input style เดียวกันทุก input
              />
            </div>

            <div>
              <label>วันเดือนปีเกิด</label><br />
              <input
                name="birth_day"
                type="date"
                value={birthDay}
                onChange={(e) => setBirthDay(e.target.value)}
                required
                style={inputStyle}
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
          color: 'red',
          fontWeight: 'bold',
          fontSize: '1rem'
        }}>
          {message}
        </p>
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
            style={{ border: '1px solid #ccc', padding: '0.5rem', width: '100%', marginBottom: '1rem' }}
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
