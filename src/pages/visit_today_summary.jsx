import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppointmentPatientModal from '../components/appointment_patient_modal';
import PatientHistoryModal from '../components/patient_history_modal';

const API_URL = process.env.REACT_APP_API_URL;

export default function VisitTodaySummary() {
  const [visits, setVisits] = useState([]);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [appointmentPatientId, setAppointmentPatientId] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyPatientObj, setHistoryPatientObj] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const res = await fetch(`${API_URL}/visits/today-by-all-doctor`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setVisits(data);
      } catch (err) {
        console.error('เกิดข้อผิดพลาดในการโหลดข้อมูล:', err);
      }
    };

    fetchVisits();
  }, [token]);

  const formatDateTime = (dt) => {
    if (!dt) return '-';
    return new Date(dt).toLocaleString('th-TH', {
    //   dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2>📋 รายการคนไข้ที่เข้ารับบริการวันนี้</h2>
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
      <table border="1" cellPadding="8" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>เวลา</th>
            <th>ชื่อคนไข้</th>
            <th>หมอ</th>
            <th>บันทึกการรักษา</th>
            <th>หัตถการ</th>
            <th>นัดครั้งหน้า</th>
            <th>เลือก</th>
          </tr>
        </thead>
        <tbody>
          {visits.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center' }}>
                ไม่มีข้อมูลวันนี้
              </td>
            </tr>
          ) : (
            visits.map((v) => (
              <tr key={v.id}>
                <td>{formatDateTime(v.visit_time)}</td>
                <td>
                  {v.patient_id} - {v.patients?.first_name} {v.patients?.last_name}
                </td>
                <td>{`${v.doctors?.first_name} (${v.doctors?.nickname})`}</td>
                <td style={{ whiteSpace: 'pre-wrap' }}>{v.treatment_note || '-'}</td>
                <td>
                  {v.visit_procedures.length === 0 ? (
                    '-'
                  ) : (
                    v.visit_procedures.map((vp, idx) => {
                      const status = vp.paid ? '' : ' - ❌ ยังไม่ชำระ';
                      return (
                        <div key={idx}>
                          {'- ' + (vp.procedures?.name || 'ไม่พบชื่อ')} #{vp.tooth} ({vp.price})
                          {status}
                        </div>
                      );
                    })
                  )}
                </td>
                <td style={{ whiteSpace: 'pre-wrap' }}>{v.next_visit || '-'}</td>
                <td>
                  <div>
                    <button
                      onClick={() => {
                        setHistoryPatientObj({
                          patient_id: v.patient_id,
                          patients: v.patients,
                        });
                        setHistoryModalOpen(true);
                      }}
                    >
                      🧾 ประวัติ
                    </button>
                  </div>
                  <div>
                    <button
                      onClick={() => {
                        setAppointmentPatientId(v.patient_id);
                        setAppointmentModalOpen(true);
                      }}
                    >
                      📅 วันนัด
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

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
