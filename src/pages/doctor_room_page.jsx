import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReferModal from '../components/refer_modal';

export default function DoctorRoomPage() {
  const [waitingPatients, setWaitingPatients] = useState([]);
  const [roomPatients, setRoomPatients] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [visitHistory, setVisitHistory] = useState([]);
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [referQueueId, setReferQueueId] = useState(null);
  const navigate = useNavigate();

  const selectedRoom = sessionStorage.getItem('selectedRoom') || '';

  useEffect(() => {
    if (!selectedRoom) {
      navigate('/dashboard/doctor');
      return;
    }
    const fetchAllData = () => {
      fetchWaitingPatients();
      fetchRoomPatients();
    };
    fetchAllData();
    const interval = setInterval(fetchAllData, 10000);
    return () => clearInterval(interval);
  }, [selectedRoom, navigate]);

  const fetchVisitHistory = async (patientId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/visits/history/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('ข้อมูลไม่ถูกต้อง');
      setVisitHistory(data);
    } catch (err) {
      console.error(err);
      setErrorMsg('ไม่สามารถโหลดประวัติการรักษาได้');
      setVisitHistory([]);
    }
  };

  const fetchWaitingPatients = async () => {
    setWaitingPatients([]);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/clinic-queue?room=0`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('ข้อมูลไม่ถูกต้อง');
      setWaitingPatients(data);
    } catch (err) {
      console.error(err);
      setErrorMsg('ไม่สามารถโหลดข้อมูลคนไข้รอเข้าห้องได้');
    }
  };

  const fetchRoomPatients = async () => {
    setRoomPatients([]);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/clinic-queue?room=${selectedRoom}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('ข้อมูลไม่ถูกต้อง');
      const sorted = data.sort((a, b) => new Date(a.time_coming) - new Date(b.time_coming));
      setRoomPatients(sorted);
    } catch (err) {
      console.error(err);
      setErrorMsg('ไม่สามารถโหลดข้อมูลคนไข้ในห้องได้');
    }
  };

  const sendToRoom = async (queueId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3000/clinic-queue/${queueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ room: selectedRoom }),
      });
      fetchWaitingPatients();
      fetchRoomPatients();
    } catch (err) {
      console.error('ส่งเข้าห้องไม่ได้', err);
    }
  };

  const handleReferConfirm = async (targetRoom, note) => {
    try {
      const token = localStorage.getItem('token');

      const trimmedNote = note?.trim();
      let formattedNote = '';

      if (trimmedNote) {
        const timestamp = new Date().toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Bangkok', // ✅ เจาะจง timezone
        });

        formattedNote = `-- Doctor -- (${timestamp})\n${trimmedNote}`;
      }

      // ✅ ดึงค่าเดิมของ detail_to_room ก่อน
      const selected = roomPatients.find((p) => p.id === referQueueId);
      const previousNote = selected?.detail_to_room || '';
      const combinedNote = previousNote
        ? `${previousNote.trim()}\n\n${formattedNote}`  // ต่อบรรทัดใหม่
        : formattedNote;

      await fetch(`http://localhost:3000/clinic-queue/${referQueueId}/refer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ room: targetRoom, note: combinedNote.trim()  }),
      });
      setIsReferModalOpen(false);
      setReferQueueId(null);
      fetchRoomPatients();
    } catch (err) {
      console.error('ส่งต่อไม่สำเร็จ', err);
      alert('เกิดข้อผิดพลาดในการส่งต่อ');
    }
  };

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

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH');
  };

  const formatProcedures = (visit) => {
    if (!visit.visit_procedures || visit.visit_procedures.length === 0) return '-';
    return visit.visit_procedures.map((vp, idx) => {
      const procName = vp.procedures?.name || 'ไม่มีชื่อหัตถการ';
      const tooth = vp.tooth ? `#${vp.tooth}` : '';
      const price = vp.price ? `(${vp.price})` : '';
      const paidStatus = vp.paid ? 'ชำระแล้ว' : 'ยังไม่ชำระ';
      return (
        <React.Fragment key={idx}>
          {`${procName} ${tooth} ${price} - ${paidStatus}`}
          {idx !== visit.visit_procedures.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  const handleViewHistory = (patientObj) => {
    setSelectedPatient(patientObj);
    fetchVisitHistory(patientObj.patient_id);
  };

  const handleCloseModal = () => {
    setSelectedPatient(null);
    setVisitHistory([]);
  };

  return (
    <div>
      <h1>ห้องตรวจ {selectedRoom}</h1>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
        <div
          style={{ padding: '0.5rem 1rem', backgroundColor: '#eee', cursor: 'pointer' }}
          onClick={() => navigate('/dashboard/doctor')}
        >
          🔙 กลับไปแดชบอร์ด
        </div>
        <div
          style={{ padding: '0.5rem 1rem', backgroundColor: '#eee', cursor: 'pointer' }}
          onClick={() => navigate('/logout')}
        >
          🚪 ออกจากระบบ
        </div>
      </div>

      {errorMsg && <div style={{ color: 'red', margin: '1rem 0' }}>⚠️ {errorMsg}</div>}

      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* ตารางซ้าย: คนไข้ในห้อง */}
        <div style={{ flex: 1 }}>
          <h3>คนไข้ในห้องตรวจ {selectedRoom}</h3>
          <table border="1" width="100%">
            <thead>
              <tr>
                <th>HN</th>
                <th>ชื่อ</th>
                <th>อายุ</th>
                <th>เวลามาถึง</th>
                <th>รายละเอียดการส่งต่อ</th>
                <th>เลือก</th>
                <th>ส่งต่อ</th>
              </tr>
            </thead>
            <tbody>
              {roomPatients.map((p) => (
                <tr key={p.id}>
                  <td>{p.patient_id}</td>
                  <td>{p.patients?.first_name} {p.patients?.last_name}</td>
                  <td>{formatAge(p.patients?.birth_day)}</td>
                  <td>{formatTime(p.time_coming)}</td>
                  <td style={{ whiteSpace: 'pre-wrap' }}>{p.detail_to_room || '-'}</td>
                  <td>
                    <button onClick={() => navigate(`/dashboard/doctor/visit/${p.id}/${p.patient_id}`)}>เลือก</button>
                  </td>
                  <td>
                    <button onClick={() => {
                      setReferQueueId(p.id);
                      setIsReferModalOpen(true);
                    }}>ส่งต่อ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ตารางขวา: คนไข้ที่รอเข้าห้อง */}
        <div style={{ flex: 1 }}>
          <h3>คนไข้ที่รอเข้าห้อง</h3>
          <table border="1" width="100%">
            <thead>
              <tr>
                <th>HN</th>
                <th>ชื่อ</th>
                <th>อายุ</th>
                <th>เวลามาถึง</th>
                <th>รายละเอียดการส่งต่อ</th>
                <th>ดูประวัติ</th>
              </tr>
            </thead>
            <tbody>
              {waitingPatients.map((p) => (
                <tr key={p.id}>
                  <td>{p.patient_id}</td>
                  <td>{p.patients?.first_name} {p.patients?.last_name}</td>
                  <td>{formatAge(p.patients?.birth_day)}</td>
                  <td>{formatTime(p.time_coming)}</td>
                  <td style={{ whiteSpace: 'pre-wrap' }}>{p.detail_to_room || '-'}</td>
                  <td>
                    <button onClick={() => handleViewHistory(p)}>ดูประวัติ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL ประวัติ */}
      {selectedPatient && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: '#000000aa', display: 'flex', justifyContent: 'center', alignItems: 'center',
          overflowY: 'auto', padding: '1rem',
        }}>
          <div style={{
            background: '#fff', padding: '2rem', borderRadius: '10px', width: '90%',
            maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h2>ประวัติผู้ป่วย</h2>
            <p><b>HN:</b> {selectedPatient.patient_id}</p>
            <p><b>ชื่อ:</b> {selectedPatient.patients?.first_name} {selectedPatient.patients?.last_name}</p>
            <p><b>อายุ:</b> {formatAge(selectedPatient.patients?.birth_day)}</p>
            <p><b>เบอร์โทร:</b> {selectedPatient.patients?.telephone || '-'}</p>

            <h3 style={{ marginTop: '1rem' }}>ประวัติการรักษาเก่า</h3>
            {visitHistory.length === 0 ? (
              <p>ไม่มีประวัติการรักษา</p>
            ) : (
              <table border="1" width="100%" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>วันที่</th>
                    <th>หมอ</th>
                    <th>บันทึก</th>
                    <th>หัตถการ</th>
                    <th>นัดครั้งหน้า</th>
                  </tr>
                </thead>
                <tbody>
                  {visitHistory.map((v) => (
                    <tr key={v.id}>
                      <td>{formatDate(v.visit_time)}</td>
                      <td>{v.doctors?.first_name} {v.doctors?.last_name}</td>
                      <td style={{ whiteSpace: 'pre-wrap' }}>{v.treatment_note || '-'}</td>
                      <td style={{ whiteSpace: 'pre-wrap' }}>{formatProcedures(v)}</td>
                      <td style={{ whiteSpace: 'pre-wrap' }}>{v.next_visit || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
              <button onClick={handleCloseModal}>ปิด</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ส่งต่อ */}
      <ReferModal
        isOpen={isReferModalOpen}
        onClose={() => setIsReferModalOpen(false)}
        queueId={referQueueId}
        onConfirm={handleReferConfirm}
      />
    </div>
  );
}
