import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { fromZonedTime } from 'date-fns-tz';

const generateTimeOptions = () => {
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

export default function AddDoctorModal({ isOpen, onClose, selectedDate, onDoctorAdded, forceDoctor }) {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (isOpen) {
      fetch('http://localhost:3000/doctors', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          const doctorOptions = data.map(d => ({
            value: d.id,
            label: `${d.first_name} ${d.last_name}`,
          }));
          setDoctors(doctorOptions);

          if (forceDoctor) {
            const matched = doctorOptions.find(opt => opt.value === forceDoctor.id);
            if (matched) setSelectedDoctor(matched);
          }
        })
        .catch(console.error);
    }
  }, [isOpen, token, forceDoctor]);

  const handleSubmit = async () => {
    if (!selectedDoctor || !startTime || !endTime) {
      alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const startTotal = startHour * 60 + startMinute;
    const endTotal = endHour * 60 + endMinute;

    if (endTotal <= startTotal) {
      alert('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น');
      return;
    }

    const dateStr = new Date(selectedDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
    const newStart = fromZonedTime(`${dateStr}T${startTime}:00.000`, 'Asia/Bangkok');
    const newEnd = fromZonedTime(`${dateStr}T${endTime}:00.000`, 'Asia/Bangkok');

    const payload = {
      doctor_id: selectedDoctor.value,
      start_time: newStart,
      end_time: newEnd,
    };

    try {
      const res = await fetch('http://localhost:3000/doctor-schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert('บันทึกเวลาหมอสำเร็จ');
        if (onDoctorAdded) onDoctorAdded();
      } else {
        const err = await res.json();
        console.error('POST Error:', err);
        alert('ไม่สามารถบันทึกได้: ' + (err?.error || 'ไม่ทราบสาเหตุ'));
      }
    } catch (err) {
      console.error('Network Error:', err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center',
    }}>
      <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', width: '300px' }}>
        <h3>เพิ่มหมอ {new Date(selectedDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })}</h3>

        <label>เลือกหมอ:</label>
        <Select
          options={doctors}
          value={selectedDoctor}
          onChange={setSelectedDoctor}
          placeholder="ค้นหาหมอ..."
          isSearchable
          isDisabled={!!forceDoctor}
        />

        <label style={{ marginTop: '0.5rem' }}>เวลาเริ่ม:</label>
        <select
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          style={{ width: '100%', marginBottom: '0.5rem' }}
        >
          <option value="">-- เลือกเวลาเริ่ม --</option>
          {generateTimeOptions().map((time) => (
            <option key={time} value={time}>{time}</option>
          ))}
        </select>

        <label>เวลาสิ้นสุด:</label>
        <select
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          style={{ width: '100%', marginBottom: '1rem' }}
        >
          <option value="">-- เลือกเวลาสิ้นสุด --</option>
          {generateTimeOptions().map((time) => (
            <option key={time} value={time}>{time}</option>
          ))}
        </select>

        <div style={{ textAlign: 'right' }}>
          <button onClick={onClose} style={{ marginRight: '0.5rem' }}>ยกเลิก</button>
          <button onClick={handleSubmit}>บันทึก</button>
        </div>
      </div>
    </div>
  );
}
