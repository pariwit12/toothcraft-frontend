// 📁 frontend/src/pages/liff_patient_select.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL;
const LIFF_ID = '2007782065-3M56JnV7';

export default function LiffPatientSelect() {
  const [patients, setPatients] = useState([]);
  const [status, setStatus] = useState("loading"); // loading, need-add-oa, ready, error

  const navigate = useNavigate();

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liff = (await import("@line/liff")).default;
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

        // เรียก API backend เพื่อดึง patient
        const res = await axios.post(`${API_URL}/public/search-patient-by-LIFF`, {
          line_user_id: profile.userId
        });

        setPatients(res.data);
        setStatus("ready");
      } catch (err) {
        console.error("LIFF init error", err);
        setStatus("error");
      }
    };

    initLiff();
  }, []);

  const handleSelectPatient = async (patient) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login-patient-liff`, {
        patient_id: patient.id
      });

      // เก็บ token ใน localStorage
      localStorage.setItem("token", res.data.token);

      // redirect ไปหน้า Dashboard ของ patient
      window.location.href = "/patient-dashboard";
    } catch (err) {
      console.error("Login patient error", err);
      alert("ไม่สามารถเข้าสู่ระบบได้");
    }
  };

  if (status === "loading") return <p>กำลังโหลด...</p>;
  if (status === "error") return <p>❌ ไม่สามารถเปิดได้ กรุณาเปิดจากแอป LINE</p>;
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

  if (status === 'ready') {
    return (
      <div style={{ padding: "1rem" }}>
        <h2>เลือกรายชื่อคนไข้</h2>
        <p style={{ marginRight: '1rem', }}>หากไม่พบข้อมูล กรุณาคลิก</p>
        <button
          onClick={() => navigate("liff-new-patient")}
          style={{
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          ลงทะเบียน/เชื่อมบัญชี
        </button>
        {patients.length === 0 ? (
          <p>ไม่พบข้อมูลคนไข้ที่เชื่อมกับ LINE นี้</p>
        ) : (
          <div>
            {patients.map((p) => (
              <p style={{ marginTop: '1rem' }}>
                ✅ พบข้อมูลคนไข้<br />
                <strong>
                  ชื่อ: {p.first_name} {p.last_name}<br />
                  เลขบัตรประชาชน: {p.id_number}<br />
                </strong>
                <button
                  key={p.id}
                  style={{
                    marginTop: '0.5rem',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSelectPatient(p)}
                >
                  เข้าสู่ระบบ ({p.first_name})
                </button>
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }
}
