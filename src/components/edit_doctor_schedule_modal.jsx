import React, { useState } from 'react';
import { fromZonedTime } from 'date-fns-tz';
const API_URL = process.env.REACT_APP_API_URL;

const generate_time_options = () => {
  const options = [];
  for (let h = 0; h < 24; h++) {
    for (let m of [0, 30]) {
      const hour = String(h).padStart(2, '0');
      const minute = String(m).padStart(2, '0');
      options.push(`${hour}:${minute}`);
    }
  }
  return options;
};

export default function EditDoctorScheduleModal({ is_open, on_close, schedule, on_saved }) {
  const [start_time, set_start_time] = useState(
    new Date(schedule.start_time).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })
  );

  const [end_time, set_end_time] = useState(
    new Date(schedule.end_time).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })
  );

  const token = localStorage.getItem('token');

  const handle_save = async () => {
    const [start_hour, start_minute] = start_time.split(':').map(Number);
    const [end_hour, end_minute] = end_time.split(':').map(Number);

    const start_total = start_hour * 60 + start_minute;
    const end_total = end_hour * 60 + end_minute;

    if (end_total <= start_total) {
      alert('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น');
      return;
    }

    const date_str = new Date(schedule.start_time).toLocaleDateString('en-CA', {
      timeZone: 'Asia/Bangkok',
    });

    const new_start = fromZonedTime(`${date_str}T${start_time}:00.000`, 'Asia/Bangkok');
    const new_end = fromZonedTime(`${date_str}T${end_time}:00.000`, 'Asia/Bangkok');

    try {
      const res = await fetch(`${API_URL}/doctor-schedules/safe-update/${schedule.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctor_id: schedule.doctor_id,
          start_time: new_start,
          end_time: new_end,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        alert('แก้ไขเวลาสำเร็จ');
        if (on_saved) on_saved();
      } else {
        alert('ไม่สามารถแก้ไขได้: ' + (json?.error || 'ไม่ทราบสาเหตุ'));
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const handle_delete = async () => {
    const confirm_delete = window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบเวลานี้?');
    if (!confirm_delete) return;

    try {
      const res = await fetch(`${API_URL}/doctor-schedules/safe-delete/${schedule.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (res.ok) {
        alert('ลบสำเร็จ');
        if (on_saved) on_saved();
      } else {
        alert('ไม่สามารถลบได้: ' + (json?.error || 'ไม่ทราบสาเหตุ'));
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  if (!is_open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '1rem',
          borderRadius: '8px',
          width: '320px',
        }}
      >
        <h3>แก้ไขเวลาหมอ</h3>
        <p>หมอ ID: {schedule.doctor_id}</p>

        <label>เวลาเริ่ม:</label>
        <select
          value={start_time}
          onChange={(e) => set_start_time(e.target.value)}
          style={{ width: '100%' }}
        >
          {generate_time_options().map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <label>เวลาสิ้นสุด:</label>
        <select
          value={end_time}
          onChange={(e) => set_end_time(e.target.value)}
          style={{ width: '100%', marginBottom: '1rem' }}
        >
          {generate_time_options().map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={handle_delete} style={{ backgroundColor: 'red', color: 'white' }}>
            ลบ
          </button>
          <div>
            <button onClick={on_close} style={{ marginRight: '0.5rem' }}>
              ยกเลิก
            </button>
            <button onClick={handle_save}>บันทึก</button>
          </div>
        </div>
      </div>
    </div>
  );
}
