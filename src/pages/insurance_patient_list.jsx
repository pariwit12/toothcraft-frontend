import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { INSURANCE_TYPE_BY_ID } from '../constants/insurance_type';
import AppointmentPatientModal from '../components/appointment_patient_modal';
import PatientHistoryModal from '../components/patient_history_modal';
const API_URL = process.env.REACT_APP_API_URL;

export default function InsurancePatientList() {
  const [patients, setPatients] = useState([]);
  const [selectedType, setSelectedType] = useState('บัตรทอง');
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [appointmentPatientId, setAppointmentPatientId] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyPatientObj, setHistoryPatientObj] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch(`${API_URL}/patients/by-insurance-type?label=${selectedType}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setPatients(data);
      } catch (err) {
        console.error('โหลดข้อมูลผิดพลาด:', err);
      }
    };

    if (token) fetchPatients();
  }, [selectedType, token]);

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2>ข้อมูลผู้ป่วยตามสิทธิ (วงเงินคงเหลือ &gt; 0)</h2>
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

      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => setSelectedType('บัตรทอง')}
          style={{ marginRight: '1rem', backgroundColor: selectedType === 'บัตรทอง' ? '#2196f3' : '#ccc', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: 6 }}
        >
          บัตรทอง
        </button>
        <button
          onClick={() => setSelectedType('ประกันสังคม')}
          style={{ backgroundColor: selectedType === 'ประกันสังคม' ? '#2196f3' : '#ccc', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: 6 }}
        >
          ประกันสังคม
        </button>
      </div>

      <table border="1" cellPadding="8" width="100%">
        <thead>
          <tr>
            <th>HN</th>
            <th>ชื่อ</th>
            <th>เบอร์โทร</th>
            <th>สิทธิ</th>
            <th>วงเงินคงเหลือ</th>
            <th>เลือก</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.first_name} {p.last_name}</td>
              <td>{p.telephone || '-'}</td>
              <td>{INSURANCE_TYPE_BY_ID[p.insurance_type] || '-'}</td>
              <td>{p.insurance_balance?.toLocaleString() || 0}</td>
              <td>
                <button onClick={() => {
                  setHistoryPatientObj(p);
                  setHistoryModalOpen(true);
                }}>
                  🧾 ประวัติ
                </button>
                <button onClick={() => {
                  setAppointmentPatientId(p?.id);
                  setAppointmentModalOpen(true);
                }}>
                  📅 วันนัด
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
    </div>
  );
}
