import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import AppointmentPatientModal from '../components/appointment_patient_modal';
import PatientHistoryModal from '../components/patient_history_modal';
import EditContinueTxNoteModal from '../components/edit_continue_tx_note_modal';

const API_URL = process.env.REACT_APP_API_URL;

export default function ContinueTxPatientList() {
  const [patients, setPatients] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [selectedTxList, setSelectedTxList] = useState([]);
  const [selectedAppointmentStatus, setSelectedAppointmentStatus] = useState([]); // ['has', 'none']

  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [appointmentPatientId, setAppointmentPatientId] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyPatientObj, setHistoryPatientObj] = useState(null);
  const [editNoteModalOpen, setEditNoteModalOpen] = useState(false);
  const [selectedNotePatient, setSelectedNotePatient] = useState(null);

  const token = localStorage.getItem('token');
  const [role, setRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const decoded = jwtDecode(token || '');
    setRole(decoded.role);

    const fetchPatients = async () => {
      try {
        const url =
          decoded.role === 'doctor'
            ? `${API_URL}/continue-tx-patient/doctor`
            : `${API_URL}/continue-tx-patient`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setPatients(data);
      } catch (err) {
        console.error('โหลดข้อมูลผิดพลาด:', err);
      }
    };

    if (token) fetchPatients();
  }, [token]);

  // 🔎 Filter logic
  const filteredPatients = patients.filter((p) => {
    const fullName = `${p.patients?.first_name || ''} ${p.patients?.last_name || ''}`.toLowerCase();
    const doctorName = p.doctors?.nickname || '';
    const txTitle = p.continue_tx_list?.name || '';
    const appointmentTime = p.patients?.appointments?.[0]?.appointment_time || null;

    const matchName = fullName.includes(searchName.toLowerCase());
    const matchDoctor = selectedDoctors.length === 0 || selectedDoctors.includes(doctorName);
    const matchTxList = selectedTxList.length === 0 || selectedTxList.includes(txTitle);

    const hasAppointment = !!appointmentTime;
    const matchAppointmentStatus =
      selectedAppointmentStatus.length === 0 ||
      (selectedAppointmentStatus.includes('has') && hasAppointment) ||
      (selectedAppointmentStatus.includes('none') && !hasAppointment);

    return matchName && matchDoctor && matchTxList && matchAppointmentStatus;
  });

  // 📌 Extract unique doctor nicknames & tx list names for filter checkboxes
  const allDoctors = [...new Set(patients.map((p) => p.doctors?.nickname).filter(Boolean))];
  const allTxLists = [...new Set(patients.map((p) => p.continue_tx_list?.name).filter(Boolean))];

  const handleDeletePatient = async (id) => {
    const confirmed = window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบผู้ป่วยรายนี้?');
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_URL}/continue-tx-patient/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setPatients((prev) => prev.filter((p) => p.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'ลบไม่สำเร็จ');
      }
    } catch (err) {
      console.error('ลบผิดพลาด:', err);
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2>รายชื่อผู้ป่วยต่อเนื่อง</h2>
        <button
          onClick={() =>
            navigate(role === 'doctor' ? '/dashboard/doctor' : '/dashboard/staff')
          }
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

      {/* 🔍 Filter UI */}
      <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="ค้นหาชื่อหรือนามสกุลผู้ป่วย"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          style={{
            padding: '0.5rem',
            width: '100%',
            maxWidth: '300px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            marginBottom: '1rem',
          }}
        />

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div>
            <strong>กรองตามหมอ:</strong>
            {allDoctors.map((doc) => (
              <label key={doc} style={{ display: 'block', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  value={doc}
                  checked={selectedDoctors.includes(doc)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSelectedDoctors((prev) =>
                      checked ? [...prev, doc] : prev.filter((d) => d !== doc)
                    );
                  }}
                />
                <span style={{ marginLeft: '8px' }}>{doc}</span>
              </label>
            ))}
          </div>

          <div>
            <strong>กรองตามรายการ:</strong>
            {allTxLists.map((tx) => (
              <label key={tx} style={{ display: 'block', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  value={tx}
                  checked={selectedTxList.includes(tx)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSelectedTxList((prev) =>
                      checked ? [...prev, tx] : prev.filter((t) => t !== tx)
                    );
                  }}
                />
                <span style={{ marginLeft: '8px' }}>{tx}</span>
              </label>
            ))}
          </div>

          <div>
            <strong>กรองตามวันนัด:</strong>
            {['has', 'none'].map((status) => (
              <label key={status} style={{ display: 'block', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  value={status}
                  checked={selectedAppointmentStatus.includes(status)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSelectedAppointmentStatus((prev) =>
                      checked ? [...prev, status] : prev.filter((s) => s !== status)
                    );
                  }}
                />
                <span style={{ marginLeft: '8px' }}>
                  {status === 'has' ? 'มีวันนัด' : 'ไม่มีวันนัด'}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 📋 Table */}
      <table border="1" cellPadding="8" width="100%" style={{ marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>ชื่อ</th>
            <th>หมอผู้รักษา</th>
            <th>ซี่ฟัน</th>
            <th>รายการ</th>
            <th>วันนัดถัดไป</th>
            <th>หมายเหตุ</th>
            <th>เลือก</th>
          </tr>
        </thead>
        <tbody>
          {filteredPatients.map((p) => (
            <tr key={p.id}>
              <td>
                {p.patient_id} - {p.patients?.first_name} {p.patients?.last_name}
              </td>
              <td>
                {p.doctors?.first_name} ({p.doctors?.nickname})
              </td>
              <td>{p.tooth || '-'}</td>
              <td>{p.continue_tx_list?.name || '-'}</td>
              <td>{p.patients?.appointments?.[0]?.appointment_time ? 
                new Date(p.patients?.appointments?.[0]?.appointment_time).toLocaleString('th-TH', {
                  timeZone: 'Asia/Bangkok',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                }) : '-'
                }
              </td>
              <td style={{ whiteSpace: 'pre-wrap' }}>{p.continue_tx_note || '-'}</td>
              <td>
                <button
                  onClick={() => {
                    setHistoryPatientObj(p.patients);
                    setHistoryModalOpen(true);
                  }}
                >
                  🧾 ประวัติ
                </button>
                <button
                  onClick={() => {
                    setAppointmentPatientId(p.patient_id);
                    setAppointmentModalOpen(true);
                  }}
                >
                  📅 วันนัด
                </button>
                {(role === 'admin' || role === 'staff') && (
                  <button
                    onClick={() => {
                      setSelectedNotePatient(p);
                      setEditNoteModalOpen(true);
                    }}
                  >
                    📝 แก้ไขหมายเหตุ
                  </button>
                )}
                {role === 'admin' && (
                  <button
                    style={{
                      marginLeft: '0.5rem',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.3rem 0.5rem',
                    }}
                    onClick={() => handleDeletePatient(p.id)}
                  >
                    🗑️ ลบ
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 📆 Modals */}
      {appointmentModalOpen && (
        <AppointmentPatientModal
          patientId={appointmentPatientId}
          onClose={() => setAppointmentModalOpen(false)}
        />
      )}
      {historyModalOpen && (
        <PatientHistoryModal
          isOpen={historyModalOpen}
          patientObj={{ patient_id: historyPatientObj?.id, patients: historyPatientObj }}
          onClose={() => setHistoryModalOpen(false)}
        />
      )}
      {editNoteModalOpen && selectedNotePatient && (
        <EditContinueTxNoteModal
          isOpen={editNoteModalOpen}
          patientObj={selectedNotePatient}
          onClose={() => setEditNoteModalOpen(false)}
          onSave={(updatedPatient) => {
            setPatients((prev) =>
              prev.map((p) =>
                p.id === updatedPatient.id
                  ? { ...p, continue_tx_note: updatedPatient.continue_tx_note }
                  : p
              )
            );
          }}
        />
      )}
    </div>
  );
}
