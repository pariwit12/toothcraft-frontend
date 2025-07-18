// 📁 frontend/src/pages/dashboard_staff.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ReferModal from '../components/refer_modal';
import PaymentModal from '../components/payment_modal';
import AppointmentPatientModal from '../components/appointment_patient_modal';
import PatientHistoryModal from '../components/patient_history_modal';
const API_URL = process.env.REACT_APP_API_URL;

export default function DashboardStaff() {
  const [newPatients, setNewPatients] = useState([]);
  const [waitingPayment, setWaitingPayment] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false); // ✅ สำหรับ Payment Modal
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null); // ✅ สำหรับ Payment Modal
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [appointmentPatientId, setAppointmentPatientId] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyPatientObj, setHistoryPatientObj] = useState(null);
  const [role, setRole] = useState(null); // ✅ เพิ่ม state เก็บ role
  const token = localStorage.getItem('token');

  // ✅ ดึง role จาก token JWT
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setRole(payload.role);
      } catch (err) {
        console.error('ไม่สามารถ decode token ได้:', err);
      }
    }
  }, [token]);

  // โหลดข้อมูล clinic_queue ห้อง "0" (คนไข้ใหม่) และ "cashier" (รอชำระเงิน)
  useEffect(() => {
    if (!token) return;

    const fetchAll = async () => {
      try {
        const [newRes, payRes] = await Promise.all([
          fetch(`${API_URL}/clinic-queue?room=0`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/clinic-queue?room=cashier`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const [newData, payData] = await Promise.all([
          newRes.json(),
          payRes.json(),
        ]);

        setNewPatients(newData);
        setWaitingPayment(payData);
      } catch (err) {
        console.error('เกิดข้อผิดพลาดในการโหลดข้อมูล:', err);
      }
    };

    fetchAll(); // โหลดรอบแรกทันที

    const interval = setInterval(fetchAll, 10000); // โหลดทุก 10 วิ

    return () => clearInterval(interval); // clear ตอน unmount
  }, [token]);


  // ฟังก์ชันคำนวณอายุแบบปีกับเดือน
  const formatAge = (birthDateStr) => {
    if (!birthDateStr) return '-';
    const birthDate = new Date(birthDateStr);
    const now = new Date();
    let years = now.getFullYear() - birthDate.getFullYear();
    let months = now.getMonth() - birthDate.getMonth();
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return `${years} ปี ${months} เดือน`;
  };

  // ฟังก์ชันแปลงเวลามาถึงให้อยู่ในรูปแบบ HH:mm
  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('th-TH', {
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
  };

  // เปิด modal ส่งต่อ พร้อมเลือกคิว
  const handleRefer = (queueItem) => {
    setSelectedQueue(queueItem);
    setModalOpen(true);
  };

  // ยืนยันส่งต่อ ส่งข้อมูลไป backend
  const handleConfirmRefer = async (room, note) => {
    const { id, patient_id } = selectedQueue;
    const time_coming = new Date().toISOString();
    
    const existingDetail = selectedQueue.detail_to_room || '';
    const trimmedNote = note?.trim();

    let updatedNote = existingDetail;
    if (trimmedNote) {
      const timestamp = new Date().toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Bangkok',
      });

      updatedNote += (existingDetail ? '\n\n' : '') + `-- Counter -- (${timestamp})\n${trimmedNote}`;
    }

    try {
      const response = await fetch(`${API_URL}/clinic-queue/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({ room, detail_to_room: updatedNote, patient_id, time_coming }),

      });

      if (!response.ok) {
        const errorData = await response.json();
        alert('เกิดข้อผิดพลาด: ' + errorData.error);
        return;
      }

      alert('ส่งต่อผู้ป่วยสำเร็จ');
      setModalOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการส่งต่อ:', error);
      alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
    }
  };

  // เปิด modal ชำระเงิน พร้อมเลือกคิวและข้อมูลผู้ป่วย
  const handlePayment = (queueItem) => {
    setSelectedQueue(queueItem);
    setSelectedPatient(queueItem.patients);
    setPaymentModalOpen(true);
  };

  return (
    <div>
      <h1>แดชบอร์ดของ Staff</h1>
      <p>ยินดีต้อนรับสู่ระบบ ToothCraft สำหรับพนักงาน</p>

      <Link to="/register">
        <button>ลงทะเบียนคนไข้ใหม่</button>
      </Link>
      <Link to="/search">
        <button style={{ marginLeft: '1rem' }}>ค้นหาผู้ป่วยเก่า</button>
      </Link>
      <Link to="/clinic-overview">
        <button style={{ marginLeft: '1rem' }}>🧍‍♂️ ภาพรวมคนไข้</button>
      </Link>
      <Link to="/appointments-calendar">
        <button style={{ marginLeft: '1rem' }}>📆 ตารางนัด</button>
      </Link>
      <Link to="/confirm-create-list">
        <button style={{ marginLeft: '1rem' }}>📨 แจ้งลงนัด</button>
      </Link>
      <Link to="/reminder-list">
        <button style={{ marginLeft: '1rem' }}>🔔 เตือนนัด</button>
      </Link>
      <Link to="/feedback-list">
        <button style={{ marginLeft: '1rem' }}>📨 ประเมินความพึงพอใจ</button>
      </Link>
      <Link to="/daily-report-fixed">
        <button style={{ marginLeft: '1rem' }}>📋 รายงานประจำวัน</button>
      </Link>
      <Link to="/logout">
        <button style={{ marginLeft: '1rem' }}>ออกจากระบบ</button>
      </Link>

      {/* ✅ แสดงปุ่มลับเฉพาะ admin */}
      {role === 'admin' && (
        <div style={{ marginTop: '1rem' }}>
          <Link to="/money-report">
            <button
              style={{
                backgroundColor: '#c62828',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                marginRight: '1rem',
              }}
            >
              📊 รายงานเงินรับ
            </button>
          </Link>
          <Link to="/df-summary-report">
            <button
              style={{
                backgroundColor: '#2e7d32',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              📈 สรุป DF
            </button>
          </Link>
        </div>
      )}

      <hr style={{ margin: '2rem 0' }} />

      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* 🔹 คนไข้ที่เพิ่งลงทะเบียน */}
        <div style={{ flex: 1 }}>
          <h3>คนไข้ที่เพิ่งลงทะเบียน</h3>
          <table border="1" cellPadding="8">
            <thead>
              <tr>
                <th>HN</th>
                <th>ชื่อ</th>
                <th>อายุ</th>
                <th>เวลามาถึง</th>
                <th>รายละเอียด</th>
                <th>ส่งต่อ</th>
              </tr>
            </thead>
            <tbody>
              {newPatients.map((item) => {
                const p = item.patients;
                return (
                  <tr key={item.id}>
                    <td>{p?.id}</td>
                    <td>{p?.first_name} {p?.last_name}</td>
                    <td>{formatAge(p?.birth_day)}</td>
                    <td>{formatTime(item.time_coming)}</td>
                    <td style={{ whiteSpace: 'pre-wrap' }}>{item.detail_to_room || '-'}</td>
                    <td>
                      <button onClick={() => handleRefer(item)}>ส่งต่อ</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 🔸 คนไข้ที่รอชำระเงิน */}
        <div style={{ flex: 1 }}>
          <h3>คนไข้ที่รอชำระเงิน</h3>
          <table border="1" cellPadding="8">
            <thead>
              <tr>
                <th>HN</th>
                <th>ชื่อ</th>
                <th>อายุ</th>
                <th>เวลามาถึง</th>
                <th>รายละเอียด</th>
                <th>เลือก</th>
              </tr>
            </thead>
            <tbody>
              {waitingPayment.map((item) => {
                const p = item.patients;
                return (
                  <tr key={item.id}>
                    <td>{p?.id}</td>
                    <td>{p?.first_name} {p?.last_name}</td>
                    <td>{formatAge(p?.birth_day)}</td>
                    <td>{formatTime(item.time_coming)}</td>
                    <td style={{ whiteSpace: 'pre-wrap' }}>{item.detail_to_room || '-'}</td>
                    <td>
                      <div>
                        <button onClick={() => {
                          setHistoryPatientObj(item);
                          setHistoryModalOpen(true);
                        }}>
                          🧾 ประวัติ
                        </button>
                      </div>
                      <div>
                        <button onClick={() => {
                          setAppointmentPatientId(p?.id);
                          setAppointmentModalOpen(true);
                        }}>
                          📅 วันนัด
                        </button>
                      </div>
                      <div>
                        <button onClick={() => handleRefer(item)}>ส่งต่อ</button>
                      </div>
                      <div>
                        <button onClick={() => handlePayment(item)}>ชำระเงิน</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal ส่งต่อ */}
      <ReferModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmRefer}
      />

      {/* Modal ชำระเงิน */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        patient={selectedPatient}
        queueId={selectedQueue?.id}
        onConfirmOnly={async () => {
          alert('บันทึกการชำระเงินเรียบร้อยแล้ว');
        }}
        onConfirmAndDelete={async () => {
          try {
            // 📌 1. บันทึก feedback ก่อนลบ
            const feedbackRes = await fetch(`${API_URL}/feedback-surveys`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                patient_id: selectedPatient?.id,
                time_sent: new Date().toISOString(),
              }),
            });

            if (!feedbackRes.ok) {
              const errorData = await feedbackRes.json();
              alert('เกิดข้อผิดพลาดในการสร้าง feedback: ' + errorData.error);
              return;
            }

            // 📌 2. ลบ clinic_queue หลังจากบันทึก feedback
            const response = await fetch(`${API_URL}/clinic-queue/${selectedQueue?.id}`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (!response.ok) {
              const errorData = await response.json();
              alert('เกิดข้อผิดพลาดในการลบ queue: ' + errorData.error);
              return;
            }

            alert('บันทึกและลบคิวเรียบร้อยแล้ว');
            setPaymentModalOpen(false);
            window.location.reload();
          } catch (err) {
            console.error('เกิดข้อผิดพลาดในการลบ clinic_queue:', err);
            alert('เกิดข้อผิดพลาดในการลบ clinic_queue');
          }
        }}
      />
      {appointmentModalOpen && (
        <AppointmentPatientModal
          patientId={appointmentPatientId}
          onClose={() => setAppointmentModalOpen(false)}
        />
      )}
      <PatientHistoryModal
        isOpen={historyModalOpen}
        patientObj={historyPatientObj}
        onClose={() => setHistoryModalOpen(false)}
      />
    </div>
  );
}
