import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AppointmentModal from '../components/appointment_modal';
import EditAppointmentModal from '../components/edit_appointment_modal';
import AddDoctorModal from '../components/add_doctor_modal';
import EditDoctorScheduleModal from '../components/edit_doctor_schedule_modal';
import AppointmentPatientModal from '../components/appointment_patient_modal';
import PatientHistoryModal from '../components/patient_history_modal';
const API_URL = process.env.REACT_APP_API_URL;


export default function AppointmentInDay() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dateParam = searchParams.get('date');
  const doctorIdParam = searchParams.get('doctor_id');

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [addScheduleModalOpen, setAddScheduleModalOpen] = useState(false);
  const [editScheduleModalOpen, setEditScheduleModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [doctorForSchedule, setDoctorForSchedule] = useState(null);

  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [appointmentPatientId, setAppointmentPatientId] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyPatientObj, setHistoryPatientObj] = useState(null);


  const [role, setRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setRole(payload.role);
      } catch (err) {
        console.error('ไม่สามารถ decode token ได้:', err);
        setRole(null);
      }
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const url = new URL(`${API_URL}/appointments/in-day`);
      url.searchParams.append('date', dateParam);
      if (doctorIdParam) url.searchParams.append('doctor_id', doctorIdParam);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [dateParam, doctorIdParam]);

  useEffect(() => {
    if (dateParam) fetchData();
  }, [fetchData, dateParam]);

  const handleDeleteAppointment = async (id) => {
    const confirm = window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบนัดหมายนี้?');
    if (!confirm) return;

    try {
      const res = await fetch(`${API_URL}/appointments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!res.ok) throw new Error('ลบนัดหมายไม่สำเร็จ');
      alert('ลบนัดหมายสำเร็จ');
      fetchData();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบนัดหมาย');
      console.error(err);
    }
  };


  return (
    <div>
      <h2>ตารางนัดหมายในวัน {dateParam}</h2>

      <button
        onClick={() => {
          const [year, month] = dateParam.split('-');
          const monthIndex = parseInt(month) - 1;
          navigate(`/appointments-calendar?month=${monthIndex}&year=${year}`);
        }}
        style={{ marginBottom: '1rem', cursor: 'pointer' }}
      >
        🔙 กลับหน้าปฏิทินนัดหมาย
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading && <p>กำลังโหลดข้อมูล...</p>}

      {!loading && !error && data.length === 0 && <p>ไม่พบนัดหมายหรือเวลาทำงานในวันดังกล่าว</p>}

      {!loading && !error && data.length > 0 && (
        <div>
          {data.map((doctorGroup) => {
            const doctor = doctorGroup.doctor;
            return (
              <div key={doctor?.id || Math.random()} style={{ border: '1px solid #ccc', marginBottom: 20, padding: 10 }}>
                <h3>
                  หมอ: {doctor?.first_name} {doctor?.last_name} {doctor?.nickname && `(${doctor.nickname})`}
                  {role === 'admin' && (
                    <button style={{ marginLeft: '1rem' }} onClick={() => {
                      setDoctorForSchedule(doctor);
                      setAddScheduleModalOpen(true);
                    }}>
                      ➕ เพิ่มเวลาทำงาน
                    </button>
                  )}
                </h3>

                <h4>เวลาทำงาน</h4>
                {doctorGroup.schedules.length === 0 ? (
                  <p>ไม่มีเวลาทำงาน</p>
                ) : (
                  <ul>
                    {doctorGroup.schedules.map((sch) => (
                      <li key={sch.id} style={{ marginBottom: '0.25rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                          {new Date(sch.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - {new Date(sch.end_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                          {sch.guarantee_income ? ` | ประกัน: ${sch.guarantee_income} บาท` : ''}
                          {role === 'admin' && (
                            <>
                              <button
                                style={{
                                  fontSize: '0.8rem',
                                  padding: '2px 6px',
                                  marginLeft: '1rem',
                                }}
                                onClick={() => {
                                  setSelectedSchedule({ ...sch, doctor_id: Number(doctor.id) });
                                  setEditScheduleModalOpen(true);
                                }}
                              >
                                ✏️ แก้ไข
                              </button>
                            </>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>

                )}

                <h4>นัดหมาย</h4>
                {doctorGroup.schedules.length === 0 ? (
                  <p>ไม่มีเวลาทำงาน</p>
                ) : (
                  <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead>
                      <tr style={{ background: '#f0f0f0' }}>
                        <th style={{ border: '1px solid #ccc', padding: '4px' }}>เวลา</th>
                        <th style={{ border: '1px solid #ccc', padding: '4px' }}>คนไข้</th>
                        <th style={{ border: '1px solid #ccc', padding: '4px' }}>หมายเหตุ</th>
                        <th style={{ border: '1px solid #ccc', padding: '4px' }}>ประวัติ</th>
                        <th style={{ border: '1px solid #ccc', padding: '4px' }}>วันนัด</th>
                        {(role === 'admin' || role === 'staff') && (
                          <>
                            <th style={{ border: '1px solid #ccc', padding: '4px' }}>แก้ไข</th>
                            <th style={{ border: '1px solid #ccc', padding: '4px' }}>ลบ</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {doctorGroup.appointments.map((apt) => {
                        const aptTime = new Date(apt.appointment_time);
                        const timeStr = aptTime.toLocaleTimeString('th-TH', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <tr key={apt.id}>
                            <td style={{ border: '1px solid #ccc', padding: '4px', whiteSpace: 'nowrap' }}>{timeStr}</td>
                            <td style={{ border: '1px solid #ccc', padding: '4px' }}>
                              {apt.patients ? `HN: ${apt.patients.id} - ${apt.patients.first_name} ${apt.patients.last_name}` : '-'}
                            </td>
                            <td style={{ border: '1px solid #ccc', padding: '4px' }}>{apt.note || '-'}</td>
                            <td style={{ border: '1px solid #ccc', padding: '4px' }}>
                              {apt.patients ?
                                <div>
                                  <button onClick={() => {
                                    // สร้าง object ใหม่ที่รวม key เดิมทั้งหมดของ apt
                                    // และเพิ่ม key ใหม่ `doctors` ที่มีค่าเท่ากับ apt.doctor
                                    const newApt = { ...apt, patient_id: apt.patients.id }; 
                                    // หรือถ้าอยากลบ key เก่าออกด้วย:
                                    // const { doctor, ...rest } = apt;
                                    // const newApt = { ...rest, doctors: doctor };
                                    
                                    setHistoryPatientObj(newApt);
                                    setHistoryModalOpen(true);
                                  }}>
                                    🧾 ประวัติ
                                  </button>
                                </div>
                                :
                                '-'
                              }
                            </td>
                            <td style={{ border: '1px solid #ccc', padding: '4px' }}>
                              {apt.patients ?
                                <div>
                                  <button onClick={() => {
                                    setAppointmentPatientId(apt.patients.id);
                                    setAppointmentModalOpen(true);
                                  }}>
                                    📅 วันนัด
                                  </button>
                                </div>
                                :
                                '-'
                              }
                            </td>
                            {(role === 'admin' || role === 'staff') && (
                              <>
                                <td style={{ border: '1px solid #ccc', padding: '4px', textAlign: 'center' }}>
                                  <button
                                    style={{ backgroundColor: '#3498db', color: 'white', border: 'none', padding: '4px 8px', cursor: 'pointer' }}
                                    onClick={() => {
                                      setSelectedAppointment(apt);
                                      setSelectedDoctor({
                                        ...doctor,
                                        working_times: doctorGroup.schedules.map((sch) => ({
                                          start: new Date(sch.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }),
                                          end: new Date(sch.end_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }),
                                        })),
                                      });
                                      setEditModalOpen(true);
                                    }}
                                  >
                                    แก้ไข
                                  </button>
                                </td>
                                <td style={{ border: '1px solid #ccc', padding: '4px', textAlign: 'center' }}>
                                  <button
                                    style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '4px 8px', cursor: 'pointer' }}
                                    onClick={() => handleDeleteAppointment(apt.id)}
                                  >
                                    ลบ
                                  </button>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                      <tr>
                        <td colSpan={7} style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                          <span style={{ marginRight: 10 }}>➕ เพิ่มนัดใหม่</span>
                          <button
                            onClick={() => {
                              const formatTime = (dateStr) =>
                                new Date(dateStr).toLocaleTimeString('th-TH', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false,
                                });
                              setSelectedDoctor({
                                ...doctor,
                                working_times: doctorGroup.schedules.map((sch) => ({
                                  start: formatTime(sch.start_time),
                                  end: formatTime(sch.end_time),
                                })),
                              });
                              setIsModalOpen(true);
                            }}
                          >
                            เปิดแบบฟอร์ม
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && selectedDoctor && (
        <AppointmentModal
          doctor={selectedDoctor}
          date={dateParam}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => {
            setIsModalOpen(false);
            fetchData();
          }}
        />
      )}

      {editModalOpen && selectedAppointment && selectedDoctor && (
        <EditAppointmentModal
          appointment={selectedAppointment}
          workingTimes={selectedDoctor.working_times}
          onClose={() => setEditModalOpen(false)}
          onSaved={() => {
            setEditModalOpen(false);
            fetchData();
          }}
        />
      )}

      {addScheduleModalOpen && doctorForSchedule && (
        <AddDoctorModal
          isOpen={addScheduleModalOpen}
          onClose={() => setAddScheduleModalOpen(false)}
          selectedDate={dateParam}
          onDoctorAdded={() => {
            setAddScheduleModalOpen(false);
            fetchData();
          }}
          forceDoctor={doctorForSchedule}
        />
      )}

      {editScheduleModalOpen && selectedSchedule && (
        <EditDoctorScheduleModal
          is_open={editScheduleModalOpen}
          on_close={() => setEditScheduleModalOpen(false)}
          schedule={selectedSchedule}
          on_saved={() => {
            setEditScheduleModalOpen(false);
            fetchData();
          }}
        />
      )}
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