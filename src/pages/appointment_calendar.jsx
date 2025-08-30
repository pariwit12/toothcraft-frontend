import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fromZonedTime } from 'date-fns-tz';
import AddDoctorModal from '../components/add_doctor_modal';
const API_URL = process.env.REACT_APP_API_URL;

export default function AppointmentCalendar() {
  const navigate = useNavigate();
  const today = new Date();
  const [searchParams] = useSearchParams();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [role, setRole] = useState(null);
  const [doctorId, setDoctorId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false); // ✅ state สำหรับ modal
  const [selectedDate, setSelectedDate] = useState(''); // ✅ วันที่ที่เลือก
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setRole(payload.role);
      const id = payload.id;
      if (id) {
          setDoctorId(id);
      }
    }
  }, [token]);

  const [doctorSchedules, setDoctorSchedules] = useState([]);

  useEffect(() => {
    const monthFromQuery = parseInt(searchParams.get('month'));
    const yearFromQuery = parseInt(searchParams.get('year'));

    if (!isNaN(monthFromQuery)) setCurrentMonth(monthFromQuery);
    if (!isNaN(yearFromQuery)) setCurrentYear(yearFromQuery);
  }, []);

  const refreshSchedules = async () => {
    if (!token) return;

    try {
      if (role === 'admin' || role === 'staff') {
        const res = await fetch(`${API_URL}/doctor-schedules/in-month?month=${currentMonth}&year=${currentYear}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setDoctorSchedules(data);
      }
      if (role === 'doctor' && doctorId) {
        const res = await fetch(`${API_URL}/doctor-schedules/in-month-by-doctor?month=${currentMonth}&year=${currentYear}&doctor_id=${doctorId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setDoctorSchedules(data);
      }
    } catch (error) {
      console.error('โหลดข้อมูลตารางหมอไม่สำเร็จ:', error);
    }
  };

  useEffect(() => {
    refreshSchedules();
  }, [currentMonth, currentYear, token, role, doctorId]); // เพิ่ม role และ doctorId เป็น dependency

  const renderDoctorNamesForDate = (dateNum) => {
    const pad = (num) => String(num).padStart(2, '0');
    const dateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(dateNum)}`;

    // คัดกรองเฉพาะรายการในวันนั้น
    const names = doctorSchedules
      .filter((s) => {
        const startDate = new Date(s.start_time);
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        const startDateStr = `${year}-${month}-${day}`;
        return startDateStr === dateStr;
      })
      .map((s) => s.doctors?.nickname || `${s.doctors?.first_name || ''} ${s.doctors?.last_name || ''}`.trim())
      .filter((n, i, self) => n && self.indexOf(n) === i); // ลบชื่อซ้ำ

    return (
      <ul style={{ margin: '0.25rem 0 0 0', padding: '0', listStyle: 'none', fontSize: '0.95rem', color: '#1976d2' }}>
        {names.map((name, idx) => (
          <li key={idx}>👨‍⚕ {name}</li>
        ))}
      </ul>
    );
  };

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const monthNames = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
  ];

  const handleMonthSelect = (monthIndex) => {
    setCurrentMonth(monthIndex);
    setShowMonthPicker(false);
  };

  const handlePrevYear = () => {
    setCurrentYear((prev) => prev - 1);
  };

  const handleNextYear = () => {
    setCurrentYear((prev) => prev + 1);
  };

  const openAddDoctorModal = (day) => {
    const dateObj = fromZonedTime(new Date(currentYear, currentMonth, day), 'Asia/Bangkok');
    const formattedDate = dateObj.toLocaleString('sv-SE'); // YYYY-MM-DD
    setSelectedDate(formattedDate);
    setModalOpen(true);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>📅 ตารางนัดประจำเดือน</h2>

      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button onClick={handlePrevMonth}>← เดือนก่อน</button>
        <button onClick={() => setShowMonthPicker(!showMonthPicker)}>
          {monthNames[currentMonth]} {currentYear + 543} ⬇
        </button>
        <button onClick={handleNextMonth}>เดือนถัดไป →</button>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {(role === 'admin' || role === 'staff') && (
          <button onClick={() => navigate('/dashboard/staff')}>
            🔙 กลับหน้าหลัก
          </button>
        )}
        {role === 'doctor' && (
          <button onClick={() => navigate('/dashboard/doctor')}>
            🔙 กลับหน้าหลัก
          </button>
        )}
      </div>

      {showMonthPicker && (
        <div style={{
          border: '1px solid #ccc',
          padding: '1rem',
          display: 'inline-block',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '1rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <button onClick={handlePrevYear}>←</button>
            <strong>{currentYear + 543}</strong>
            <button onClick={handleNextYear}>→</button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.5rem',
            width: '240px',
          }}>
            {monthNames.map((name, index) => (
              <button
                key={index}
                onClick={() => handleMonthSelect(index)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  backgroundColor: index === currentMonth ? '#1976d2' : 'white',
                  color: index === currentMonth ? 'white' : 'black',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        tableLayout: 'fixed',
      }}>
        <caption style={{
          captionSide: 'top',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem'
        }}>
          {monthNames[currentMonth]} {currentYear + 543}
        </caption>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            {['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'].map((day) => (
              <th key={day} style={{
                padding: '0.5rem',
                border: '1px solid #ccc',
                width: '14.28%',
                textAlign: 'center',
              }}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(() => {
            const daysInMonth = fromZonedTime(new Date(currentYear, currentMonth + 1, 0), 'Asia/Bangkok').getDate();
            const firstDate = fromZonedTime(new Date(currentYear, currentMonth, 1), 'Asia/Bangkok');
            const firstDay = (firstDate.getDay() + 6) % 7;

            const calendar = Array.from({ length: 7 }, () => []);
            let day = 1;

            for (let i = 0; i < firstDay; i++) {
              calendar[i].push(null);
            }

            while (day <= daysInMonth) {
              const date = fromZonedTime(new Date(currentYear, currentMonth, day), 'Asia/Bangkok');
              const weekday = (date.getDay() + 6) % 7;
              calendar[weekday].push(day);
              day++;
            }

            const maxRows = Math.max(...calendar.map((col) => col.length));
            const rows = [];

            for (let r = 0; r < maxRows; r++) {
              const row = [];
              for (let c = 0; c < 7; c++) {
                const dateNum = calendar[c][r];
                row.push(
                  <td key={`${r}-${c}`} style={{
                    border: '1px solid #ccc',
                    verticalAlign: 'top',
                    height: '80px',
                    padding: '0.3rem',
                    width: '14.28%',
                    textAlign: 'left',
                  }}>
                    {dateNum && (
                      <>
                        <strong>
                          {dateNum}
                          {/* {today.getHours()} -- สำหรับเช็ค timezone ของ today */}
                          {(() => {
                            const isToday =
                              today.getDate() === dateNum &&
                              today.getMonth() === currentMonth &&
                              today.getFullYear() === currentYear;

                            return isToday ? ' ⭐️ Today' : '';
                          })()}
                        </strong>

                        {renderDoctorNamesForDate(dateNum)}

                        {/* เพิ่มปุ่มลิงก์ดูตารางนัด */}
                        <div style={{ marginTop: '0.25rem' }}>
                          {renderDoctorNamesForDate(dateNum).props.children.length > 0 && (
                            <button
                              style={{ fontSize: '0.75rem', padding: '2px 6px', cursor: 'pointer' }}
                              onClick={() => {
                                const pad = (num) => String(num).padStart(2, '0');
                                const dateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(dateNum)}`;
                                if (role === 'doctor')
                                  navigate(`/appointments/in-day?date=${dateStr}&doctor_id=${doctorId}`);
                                if (role === 'admin' || role === 'staff')
                                  navigate(`/appointments/in-day?date=${dateStr}`);
                              }}
                            >
                              📅 ดูตารางนัด
                            </button>
                          )}
                        </div>

                        {role === 'admin' && (
                          <div style={{ marginTop: '0.25rem' }}>
                            <button
                              onClick={() => openAddDoctorModal(dateNum)}
                              style={{ fontSize: '0.75rem', padding: '2px 6px', marginTop: '0.25rem' }}
                            >
                              ✏ เพิ่ม
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </td>
                );
              }
              rows.push(<tr key={r}>{row}</tr>);
            }

            return rows;
          })()}
        </tbody>
      </table>

      {/* ✅ AddDoctorModal ที่เชื่อมแล้ว */}
      <AddDoctorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedDate={selectedDate}
        onDoctorAdded={() => {
          setModalOpen(false);
          refreshSchedules(); // 🔄 รีเฟรชข้อมูลทันทีหลังเพิ่ม
        }}
      />
    </div>
  );
}
