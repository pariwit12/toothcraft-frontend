import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { formatAge, formatTime } from '../utils/format';
import ReferModal from '../components/refer_modal';
import PatientHistoryModal from '../components/patient_history_modal';
const API_URL = process.env.REACT_APP_API_URL;

export default function DoctorRoomPage() {
  const [waitingPatients, setWaitingPatients] = useState([]);
  const [roomPatients, setRoomPatients] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [referQueueId, setReferQueueId] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const decoded = jwtDecode(token);
  const [doctorData, setDoctorData] = useState(null);

  const selectedRoom = sessionStorage.getItem('selectedRoom') || '';

  useEffect(() => {
    if (!decoded.id) return;
    const fetchDoctorData = async () => {
      try {
        const res = await fetch(`${API_URL}/doctors/${decoded.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('ไม่สามารถโหลดข้อมูลแพทย์ได้');
        const data = await res.json();
        setDoctorData(data);
      } catch (err) {
        console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลแพทย์:', err);
      }
    };
    fetchDoctorData();
  }, [token]);

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

  const fetchWaitingPatients = async () => {
    setWaitingPatients([]);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/clinic-queue?room=0`, {
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
      const res = await fetch(`${API_URL}/clinic-queue?room=${selectedRoom}`, {
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

      await fetch(`${API_URL}/clinic-queue/${referQueueId}/refer`, {
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

  return (
    <div>
      <h1>ห้องตรวจ {selectedRoom}{doctorData && (<> - {doctorData.first_name} {doctorData.last_name} ({doctorData.nickname})</>)}</h1>

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
                    <button onClick={() => setSelectedPatient(p)}>ดูประวัติ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL ส่งต่อ */}
      <ReferModal
        isOpen={isReferModalOpen}
        onClose={() => setIsReferModalOpen(false)}
        queueId={referQueueId}
        onConfirm={handleReferConfirm}
      />
      {/* MODAL ประวัติ */}
      <PatientHistoryModal
        isOpen={!!selectedPatient}
        patientObj={selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />
    </div>
  );
}
