import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReferModal from '../components/refer_modal';

const API_URL = process.env.REACT_APP_API_URL;

const ROOMS = [
  { label: '🆕 ลงทะเบียนใหม่', value: '0' },
  { label: '🩺 ห้องตรวจ 1', value: '1' },
  { label: '🩺 ห้องตรวจ 2', value: '2' },
  { label: '🩺 ห้องตรวจ 3', value: '3' },
  { label: '💰 รอชำระเงิน', value: 'cashier' },
];

export default function ClinicOverview() {
  // 📌 State
  const [queuesByRoom, setQueuesByRoom] = useState({});
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState(null);

  // 📌 Other
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // 📌 useEffect - Fetch data on mount
  useEffect(() => {
    const fetchAllRooms = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/clinic-queue`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        const grouped = data.reduce((acc, item) => {
          const room = item.room || 'unknown';
          if (!acc[room]) acc[room] = [];
          acc[room].push(item);
          return acc;
        }, {});

        setQueuesByRoom(grouped);
      } catch (err) {
        console.error(`Error fetching clinic queues`, err);
      }
      setLoading(false);
    };

    fetchAllRooms();
  }, []);

  // 📌 Handler: เปิด modal ส่งต่อ
  const handleRefer = (queueItem) => {
    setSelectedQueue(queueItem);
    setModalOpen(true);
  };

  // 📌 Handler: ยืนยันการส่งต่อ
  const handleConfirmRefer = async (room, note) => {
    const { id, patient_id, detail_to_room } = selectedQueue;
    const time_coming = new Date().toISOString();

    const existingDetail = detail_to_room || '';
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

  // 📌 Render
  return (
    <>
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1>📋 ภาพรวมผู้ป่วยในคลินิก</h1>
          <button
            onClick={() => navigate('/dashboard/staff')}
            style={{
              marginLeft: '1rem',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            ⬅️ กลับหน้าหลัก
          </button>
        </div>

        {loading && <p>⏳ กำลังโหลดข้อมูล...</p>}

        {!loading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              width: '100%',
            }}
          >
            {ROOMS.map(({ label, value }) => (
              <div key={value} style={{ width: '100%' }}>
                <h3>{label}</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ccc', padding: '6px' }}>ชื่อ</th>
                      <th style={{ border: '1px solid #ccc', padding: '6px' }}>เวลามา</th>
                      <th style={{ border: '1px solid #ccc', padding: '6px' }}>หมายเหตุ</th>
                      <th style={{ border: '1px solid #ccc', padding: '6px' }}>ส่งต่อ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(queuesByRoom[value] || []).map((q) => (
                      <tr key={q.id}>
                        <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                          {q.patients?.first_name} {q.patients?.last_name}
                        </td>
                        <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                          {new Date(q.time_coming).toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td style={{ border: '1px solid #ccc', padding: '6px', whiteSpace: 'pre-wrap' }}>
                          {q.detail_to_room || '-'}
                        </td>
                        <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                          <button onClick={() => handleRefer(q)}>ส่งต่อ</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(queuesByRoom[value] || []).length === 0 && (
                  <p style={{ color: '#888' }}>ไม่มีผู้ป่วยในห้องนี้</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ReferModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmRefer}
        queueId={selectedQueue?.id}
      />
    </>
  );
}
