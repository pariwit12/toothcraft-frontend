import React, { useState, useEffect } from 'react';
const API_URL = process.env.REACT_APP_API_URL;

export default function AppointmentModal({ doctor, date, onClose, onSaved }) {
  const [searchFields, setSearchFields] = useState({
    hn: '',
    name: '',
    telephone: '',
    id_number: '',
  });

  const [isNewPatient, setIsNewPatient] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [appointmentTime, setAppointmentTime] = useState('');
  const [note, setNote] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [contactChannel, setContactChannel] = useState('');

  const availableTimes = (() => {
    const workingPeriods = doctor.working_times || [
      { start: doctor.working_start, end: doctor.working_end }
    ];

    const timesSet = new Set();

    const timeStrToMinutes = (timeStr) => {
      const [hh, mm] = timeStr.split(':').map(Number);
      return hh * 60 + mm;
    };

    const minutesToTimeStr = (min) => {
      const hh = Math.floor(min / 60);
      const mm = min % 60;
      return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
    };

    for (const period of workingPeriods) {
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

    // แปลง Set เป็น Array แล้วเรียงลำดับ
    return Array.from(timesSet).sort((a, b) => {
      const [ah, am] = a.split(':').map(Number);
      const [bh, bm] = b.split(':').map(Number);
      return ah * 60 + am - (bh * 60 + bm);
    });
  })();


  useEffect(() => {
    setAppointmentTime('');
    setNote('');
    setSelectedPatient(null);
    setSearchFields({ hn: '', name: '', telephone: '', id_number: '' });
    setSearchResults([]);
    setIsSearching(false);
    setHasSearched(false);
  }, []);

  useEffect(() => {
    // ถ้ามี selectedPatient แล้ว ไม่ต้อง search ซ้ำ
    if (selectedPatient !== null) {
      setIsSearching(false);
      setHasSearched(true);
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      const queryParams = new URLSearchParams();

      if (searchFields.hn) queryParams.append('hn', searchFields.hn);
      if (searchFields.name) queryParams.append('name', searchFields.name);
      if (searchFields.telephone) queryParams.append('telephone', searchFields.telephone);
      if (searchFields.id_number) queryParams.append('id_number', searchFields.id_number);

      if (Object.values(searchFields).some(val => String(val).trim() !== '')) {
        setIsSearching(true);
        fetch(`${API_URL}/patients/search-by-field?${queryParams.toString()}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
          .then((res) => res.json())
          .then((data) => {
            setSearchResults(data);
            setIsSearching(false);
            setHasSearched(true);
          })
          .catch(() => {
            setSearchResults([]);
            setIsSearching(false);
            setHasSearched(true);
          });
      } else {
        setSearchResults([]);
        setIsSearching(false);
        setHasSearched(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchFields, selectedPatient]);

  const handleFieldChange = (field) => (e) => {
    setSearchFields((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
    setSelectedPatient(null);
    setHasSearched(false);
  };

  const handleSaveAppointment = async () => {
    if (!appointmentTime || (!selectedPatient && !isNewPatient)) {
      alert('กรุณาเลือกเวลานัด และเลือกหรือกรอกข้อมูลผู้ป่วย');
      return;
    }

    if (!note.trim()) {  // เพิ่มบรรทัดนี้ ตรวจสอบ note ไม่ว่าง หรือไม่ใช่แค่ช่องว่าง
      alert('กรุณากรอกหมายเหตุ');
      return;
    }

    if (isNewPatient) {
      if (!searchFields.name.trim()) {
        alert('กรุณากรอกชื่อ-นามสกุลของคนไข้ใหม่');
        return;
      }
      if (!searchFields.telephone.trim()) {
        alert('กรุณากรอกเบอร์โทรศัพท์ของคนไข้ใหม่');
        return;
      }
      if (!contactChannel) {
        alert('กรุณาเลือกช่องทางการติดต่อของคนไข้ใหม่');
        return;
      }
    }

    const token = localStorage.getItem('token');
    let patientId = selectedPatient?.id;

    let finalNote = note; // ใช้ตัวแปรใหม่เก็บ note

    if (!patientId && isNewPatient) {
      const fullName = searchFields.name?.trim() || '';
      const tel = searchFields.telephone?.trim() || '';
      const extraNote = `| คนไข้ใหม่ | ชื่อ: ${fullName} | โทร: ${tel} | ช่องทาง: ${contactChannel}`;
      finalNote = `${note ? note + '\n' : ''}${extraNote}`;
    }

    const dateStr = new Date(date).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
    const appointmentDateTime = new Date(`${dateStr}T${appointmentTime}:00+07:00`);

    try {
      const res = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patient_id: patientId || null,
          doctor_id: doctor.id,
          appointment_time: appointmentDateTime,
          note: finalNote,
        }),
      });

      if (!res.ok) throw new Error('ไม่สามารถบันทึกนัดหมายได้');

      alert('บันทึกนัดหมายสำเร็จ');
      if (onSaved) onSaved(); // ✅ แจ้ง parent ให้ refresh
    } catch (error) {
      console.error('❌ Error saving appointment:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกนัดหมาย');
    }
  };


  // แค่เพิ่มสีตัวหนังสือเข้มเมื่อ disabled เท่านั้น
  const disabledTextColor = '#000';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'white',
          padding: 20,
          borderRadius: 8,
          width: 400,
          position: 'relative',
          minHeight: 600,
          display: 'flex',
          flexDirection: 'column',
          overflowX: 'hidden',      // ป้องกัน scroll แนวนอน
          boxSizing: 'border-box',  // รวม padding และ border ในขนาด
        }}
      >
        <h3>เพิ่มนัดให้คุณหมอ {doctor.first_name}</h3>

        <label>เวลา:</label>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <select
            value={appointmentTime}
            onChange={(e) => setAppointmentTime(e.target.value)}
            style={{
              flexGrow: 1,
              color: appointmentTime !== '' ? disabledTextColor : undefined,
              fontWeight: appointmentTime !== '' ? '700' : undefined,
              width: '100%',
              boxSizing: 'border-box',
            }}
            disabled={appointmentTime !== ''}
          >
            <option value="">-- เลือกเวลา --</option>
            {availableTimes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {appointmentTime !== '' && (
            <button
              type="button"
              onClick={() => setAppointmentTime('')}
              style={{ marginLeft: 8 }}
            >
              ❌ ยกเลิกเลือกเวลา
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <button
            type="button"
            style={{
              flex: 1,
              background: !isNewPatient ? '#4CAF50' : '#ccc',
              color: 'white',
              border: 'none',
              padding: '8px 0',
              borderRadius: 4,
              cursor: 'pointer',
            }}
            onClick={() => {
              setIsNewPatient(false);
              setSelectedPatient(null);
              setSearchFields({ hn: '', name: '', telephone: '', id_number: '' });
            }}
          >
            👤 คนไข้เก่า
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              background: isNewPatient ? '#2196F3' : '#ccc',
              color: 'white',
              border: 'none',
              padding: '8px 0',
              borderRadius: 4,
              cursor: 'pointer',
            }}
            onClick={() => {
              setIsNewPatient(true);
              setSelectedPatient(null);
              setSearchFields({ hn: '', name: '', telephone: '', id_number: '' });
            }}
          >
            🆕 คนไข้ใหม่
          </button>
        </div>

        {isNewPatient ? (
          <>
            <label>ข้อมูลผู้ป่วยใหม่:</label>
            <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: 10 }}>
              <input
                type="text"
                placeholder="ชื่อ-นามสกุล"
                value={searchFields.name}
                onChange={handleFieldChange('name')}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  marginBottom: 6,
                }}
              />
              <input
                type="text"
                placeholder="เบอร์โทรศัพท์"
                value={searchFields.telephone}
                onChange={handleFieldChange('telephone')}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  marginBottom: 10,
                }}
              />
              <select
                value={contactChannel}
                onChange={(e) => setContactChannel(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  marginBottom: 10,
                }}
              >
                <option value="">-- ช่องทางการติดต่อ --</option>
                <option value="LineOA">LineOA</option>
                <option value="Facebook Chat">Facebook Chat</option>
                <option value="โทรติดต่อ">โทรติดต่อ</option>
                <option value="ติดต่อที่คลินิก">ติดต่อที่คลินิก</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>
          </>
        ) : (
          <>
            <label>ค้นหาผู้ป่วย:</label>

            <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: 10 }}>
              <input
                type="number"
                placeholder="HN"
                value={searchFields.hn}
                onChange={handleFieldChange('hn')}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  marginBottom: 6,
                  color: !!selectedPatient ? disabledTextColor : undefined,
                  fontWeight: !!selectedPatient ? '700' : undefined,
                }}
                disabled={!!selectedPatient}
              />
              <input
                type="text"
                placeholder="ชื่อหรือนามสกุล"
                value={searchFields.name}
                onChange={handleFieldChange('name')}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  marginBottom: 6,
                  color: !!selectedPatient ? disabledTextColor : undefined,
                  fontWeight: !!selectedPatient ? '700' : undefined,
                }}
                disabled={!!selectedPatient}
              />
              <input
                type="text"
                placeholder="เบอร์โทรศัพท์"
                value={searchFields.telephone}
                onChange={handleFieldChange('telephone')}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  marginBottom: 6,
                  color: !!selectedPatient ? disabledTextColor : undefined,
                  fontWeight: !!selectedPatient ? '700' : undefined,
                }}
                disabled={!!selectedPatient}
              />
              <input
                type="text"
                placeholder="เลขบัตรประชาชน"
                value={searchFields.id_number}
                onChange={handleFieldChange('id_number')}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  marginBottom: 10,
                  color: !!selectedPatient ? disabledTextColor : undefined,
                  fontWeight: !!selectedPatient ? '700' : undefined,
                }}
                disabled={!!selectedPatient}
              />

              {isSearching && (
                <div style={{ marginBottom: 10, fontStyle: 'italic', color: '#888' }}>
                  🔍 กำลังค้นหา...
                </div>
              )}

              {searchResults.length > 0 && !selectedPatient && (
                <ul
                  style={{
                    position: 'relative',
                    zIndex: 9999,
                    background: 'white',
                    maxHeight: 150,
                    overflowY: 'auto',
                    listStyle: 'none',
                    padding: 0,
                    marginTop: 2,
                    width: '100%',
                    border: '1px solid #ccc',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    boxSizing: 'border-box',
                  }}
                >
                  {searchResults.map((p) => (
                    <li
                      key={p.id}
                      onClick={() => {
                        setSelectedPatient(p);
                        setSearchResults([]);
                      }}
                      style={{
                        padding: '6px 8px',
                        borderBottom: '1px solid #eee',
                        cursor: 'pointer',
                        backgroundColor: '#f9f9f9',
                      }}
                    >
                      HN: {p.id} - {p.first_name} {p.last_name} ({p.telephone})
                    </li>
                  ))}
                </ul>
              )}

              {!isSearching &&
                hasSearched &&
                searchResults.length === 0 &&
                !selectedPatient &&
                Object.values(searchFields).some((val) => String(val).trim() !== '') && (
                  <div style={{ marginBottom: 10, color: 'red', fontStyle: 'italic' }}>
                    ❗️ไม่พบข้อมูลผู้ป่วยที่ตรงกับเงื่อนไข
                  </div>
                )}

              {selectedPatient && (
                <div style={{ marginBottom: 10, fontStyle: 'italic', color: '#555', display: 'flex', alignItems: 'center' }}>
                  <div style={{ flexGrow: 1 }}>
                    ✅ เลือกแล้ว: {selectedPatient.first_name} {selectedPatient.last_name} (HN: {selectedPatient.id})
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatient(null);
                      setSearchFields({ hn: '', name: '', telephone: '', id_number: '' });
                      setSearchResults([]);
                      setHasSearched(false);
                    }}
                    style={{ marginLeft: 8 }}
                  >
                    ❌ ยกเลิกเลือกคนไข้
                  </button>
                </div>
              )}
            </div>
          </>
        )}


        <label>หมายเหตุ:</label>
        <textarea
          style={{
            width: '100%',
            boxSizing: 'border-box',
            marginBottom: 10,
            minHeight: 80,
            resize: 'vertical',
          }}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            style={{ marginRight: '0.5rem', background: '#4CAF50', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4 }}
            onClick={handleSaveAppointment}
          >
            💾 บันทึกนัดหมาย
          </button>
          <button onClick={onClose}>❌ ปิด</button>
        </div>
      </div>
    </div>
  );
}
