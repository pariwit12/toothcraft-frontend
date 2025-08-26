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
  const [quota, setQuota] = useState(null); // 🟢 เพิ่ม state สำหรับเก็บข้อมูลโควต้า
  const [quotaLoading, setQuotaLoading] = useState(false); // 🟢 เพิ่ม state สำหรับโหลดโควต้า
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const fetchLineQuota = async () => {
    setQuotaLoading(true);
    try {
      const response = await fetch(`${API_URL}/line/quota`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setQuota(data);
    } catch (error) {
      console.error('ไม่สามารถโหลด Line quota:', error);
    } finally {
      setQuotaLoading(false);
    }
  };

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

    if (token) {
      fetchPatients();
      fetchLineQuota();
    }
  }, [selectedType, token]);

    // ✅ เพิ่มฟังก์ชันสำหรับคัดลอกข้อความ
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => alert('คัดลอกข้อความเรียบร้อยแล้ว'))
      .catch(() => alert('ไม่สามารถคัดลอกข้อความได้'));
  };

  // ✅ เพิ่มฟังก์ชันสำหรับสร้างข้อความแจ้งสิทธิ
  const generateInsuranceMessage = (p) => {
    const name = `${p.first_name.trim() || ''} ${p.last_name.trim() || ''}`.trim();
    const insuranceName = INSURANCE_TYPE_BY_ID[p.insurance_type] || 'ไม่ระบุ';
    const balance = p.insurance_balance?.toLocaleString();
    
    const today = new Date();
    const currentMonth = today.toLocaleString('th-TH', { month: 'numeric', timeZone: 'Asia/Bangkok' });
    const currentYear = today.toLocaleString('th-TH', { year: 'numeric', timeZone: 'Asia/Bangkok' }).split(' ')[1];
    let expiryDate = '';

    if (insuranceName === 'บัตรทอง') {
      if (7 <= parseInt(currentMonth) && parseInt(currentMonth) <= 9) {
        expiryDate = `หมดเขต: 30 กันยายน ${currentYear}\n`;
      }
    } else if (insuranceName === 'ประกันสังคม') {
      if (10 <= parseInt(currentMonth) && parseInt(currentMonth) <= 12) {
        expiryDate = `หมดเขต: 31 ธันวาคม ${currentYear}\n`;
      }
    }

    return `✨ เรียนคุณ ${name}
คลินิกทันตกรรม ToothCraft ขอแจ้งสิทธิการรักษาคงเหลือ

สิทธิ: ${insuranceName}
วงเงินคงเหลือ: ${balance} บาท
${expiryDate}
นัดหมายเพื่อรักษาสิทธิได้เลยนะคะ 😊`;
  };

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

      {/* 🟢 แสดงโควต้า Line ที่นี่ */}
      <div style={{
        padding: '0.5rem 1rem',
        backgroundColor: '#e6f7ff',
        border: '1px solid #91d5ff',
        borderRadius: '8px',
        marginBottom: '1rem'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>
          ✨ ข้อมูล Line OA:
        </p>
        {quotaLoading ? (
          <p style={{ margin: 0 }}>กำลังโหลดข้อมูลโควต้า...</p>
        ) : quota ? (
          <p style={{ margin: 0 }}>
            โควต้าข้อความ Push Message: <span style={{ fontWeight: 'bold' }}>{quota.totalUsage}/{quota.value}</span> ข้อความ (สถานะ: {quota.type === 'limited' ? 'แบบจำกัด' : 'ไม่จำกัด'})
          </p>
        ) : (
          <p style={{ margin: 0, color: 'red' }}>ไม่สามารถดึงข้อมูลโควต้าได้</p>
        )}
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
                {/* ✅ เพิ่มปุ่มคัดลอกข้อความแจ้งสิทธิ */}
                <button
                  onClick={() => {
                    const message = generateInsuranceMessage(p);
                    copyToClipboard(message);
                  }}
                >
                  📋 คัดลอกข้อความแจ้งสิทธิ
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
