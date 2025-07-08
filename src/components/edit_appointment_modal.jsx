import React, { useState, useMemo } from 'react';
import { format, toZonedTime } from 'date-fns-tz';

// ฟังก์ชันช่วยแปลงเวลา "HH:mm" เป็นจำนวน นาที (0-1439)
const timeStrToMinutes = (timeStr) => {
  const [hh, mm] = timeStr.split(':').map(Number);
  return hh * 60 + mm;
};

// ฟังก์ชันช่วยแปลงจำนวน นาที เป็น "HH:mm"
const minutesToTimeStr = (min) => {
  const hh = Math.floor(min / 60);
  const mm = min % 60;
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
};

export default function EditAppointmentModal({ appointment, workingTimes, onClose, onSaved }) {
  const [selectedTime, setSelectedTime] = useState(() => {
    // แปลงเป็น Date object ในเขตเวลา Asia/Bangkok
    const bangkokDate = toZonedTime(appointment.appointment_time, 'Asia/Bangkok');
    // format ให้ได้แค่เวลา HH:mm
    return format(bangkokDate, 'HH:mm', { timeZone: 'Asia/Bangkok' });
  });
  const [note, setNote] = useState(appointment.note || '');

  // แปลงช่วงเวลาเป็น list ของเวลาที่เลือกได้
  const availableTimes = useMemo(() => {
    const timesSet = new Set();

    for (const period of workingTimes) {
      const startMin = timeStrToMinutes(period.start);
      const endMin = timeStrToMinutes(period.end);
      const latestAllowable = endMin - 30;

      if (latestAllowable <= startMin) {
        timesSet.add(minutesToTimeStr(startMin));
      } else {
        for (let m = startMin; m <= latestAllowable; m += 5) {
          timesSet.add(minutesToTimeStr(m));
        }
      }
    }

    return Array.from(timesSet).sort();
  }, [workingTimes]);

  const handleSave = async () => {
    if (!selectedTime) {
      alert('กรุณาเลือกเวลา');
      return;
    }

    // แปลงวันจาก appointment.appointment_time ให้เป็นวันที่ในเขตเวลา Asia/Bangkok
    const bangkokDate = toZonedTime(appointment.appointment_time, 'Asia/Bangkok');
    const dateStr = format(bangkokDate, 'yyyy-MM-dd', { timeZone: 'Asia/Bangkok' });

    const datetimeStr = `${dateStr}T${selectedTime}:00+07:00`;
    const datetime = new Date(datetimeStr);

    const res = await fetch(`http://localhost:3000/appointments/${appointment.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        appointment_time: datetime,
        note,
      }),
    });

    if (res.ok) {
      alert('บันทึกการแก้ไขเรียบร้อยแล้ว');
      onSaved();
    } else {
      alert('เกิดข้อผิดพลาดในการแก้ไข');
    }
  };

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: 'white', padding: 20, borderRadius: 8, minWidth: 300,
        }}
      >
        <h3>แก้ไขนัดหมาย</h3>

        <label>เวลา (ในช่วงทำงาน):</label>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            style={{ flex: 1 }}
            disabled={selectedTime !== ''}
          >
            <option value="">-- เลือกเวลา --</option>
            {availableTimes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {selectedTime && (
            <button
              type="button"
              onClick={() => setSelectedTime('')}
              style={{ marginLeft: 8 }}
            >
              ❌ ยกเลิกเลือกเวลา
            </button>
          )}
        </div>

        <label>หมายเหตุ:</label>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ width: '100%', marginBottom: 10 }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose}>❌ ยกเลิก</button>
          <button onClick={handleSave} style={{ backgroundColor: '#27ae60', color: 'white' }}>💾 บันทึก</button>
        </div>
      </div>
    </div>
  );
}
