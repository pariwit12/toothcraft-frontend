// 📁 src/pages/patient_detail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppointmentPatientModal from '../components/appointment_patient_modal';
import EditPatientModal from '../components/edit_patient_personal_data_modal';
import { INSURANCE_TYPE_BY_ID } from '../constants/insurance_type';
import EditPatientInsuranceModal from '../components/edit_patient_insurance_modal';
const API_URL = process.env.REACT_APP_API_URL;

const getUserRole = (token) => {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch (err) {
    console.error('ไม่สามารถอ่าน token:', err);
    return null;
  }
};

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState('');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditInsuranceModal, setShowEditInsuranceModal] = useState(false);
  const token = localStorage.getItem('token');
  const role = getUserRole(token);

  // เก็บประวัติการรักษา
  const [visitHistory, setVisitHistory] = useState([]);

  useEffect(() => {
    // ดึงข้อมูลผู้ป่วย
    fetch(`${API_URL}/patients/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('ไม่พบข้อมูลผู้ป่วย');
        return res.json();
      })
      .then((data) => {
        setPatient(data);
      })
      .catch((err) => {
        setError(err.message);
      });

    // ดึงประวัติการรักษา
    fetch(`${API_URL}/visits/history/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('ไม่สามารถโหลดประวัติการรักษาได้');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setVisitHistory(data);
        else setVisitHistory([]);
      })
      .catch((err) => {
        console.error(err);
        setVisitHistory([]);
      });
  }, [id]);

  // ฟอร์แมตวันที่
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH');
  };

  // ฟอร์แมตหัตถการ
  const formatProcedures = (visit) => {
    if (!visit.visit_procedures || visit.visit_procedures.length === 0) return '-';
    return visit.visit_procedures.map((vp, idx) => {
      const procName = vp.procedures?.name || 'ไม่มีชื่อหัตถการ';
      const tooth = vp.tooth ? `#${vp.tooth}` : '';
      const price = vp.price ? `(${vp.price})` : '';
      const paidStatus = vp.paid ? '' : 'ยังไม่ชำระ';

      const displayText = [procName, tooth, price].filter(Boolean).join(' ');
      const statusText = paidStatus ? ` - ${paidStatus}` : '';

      return (
        <React.Fragment key={idx}>
          - {displayText + statusText}
          {idx !== visit.visit_procedures.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  const handleSave = (updatedFields) => {
    fetch(`${API_URL}/patients/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ...patient, ...updatedFields })
    })
      .then((res) => {
        if (!res.ok) throw new Error('อัปเดตข้อมูลไม่สำเร็จ');
        return res.json();
      })
      .then((updatedPatient) => {
        setPatient(updatedPatient);
        setShowEditModal(false);
      })
      .catch((err) => {
        alert(err.message);
      });
  };

  return (
    <>
      <div style={{ padding: '1rem' }}>
        <h2>รายละเอียดผู้ป่วย</h2>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        {!error && !patient && <p>กำลังโหลดข้อมูล...</p>}

        {patient && (
          <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
            <p><strong>HN:</strong> {patient.id}</p>
            <p><strong>ชื่อ:</strong> {patient.first_name} {patient.last_name}</p>
            <p><strong>เบอร์โทร:</strong> {patient.telephone}</p>
            <p><strong>เลขบัตรประชาชน:</strong> {patient.id_number}</p>
            <p><strong>วันเกิด:</strong> {patient.birth_day ? new Date(patient.birth_day).toLocaleDateString() : '-'}</p>
            <p><strong>Line:</strong> {patient.line_user_id ? '✅ มีข้อมูล' : '❌ ไม่มีข้อมูล'}</p>
            <p><strong>สิทธิการรักษา:</strong>{' '}
              {patient.insurance_type
                ? INSURANCE_TYPE_BY_ID[patient.insurance_type]
                : '❌ ยังไม่มีการบันทึกสิทธิการรักษา'}</p>
            <p><strong>วงเงินคงเหลือ:</strong> {patient.insurance_balance}</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button onClick={() => navigate(-1)}>🔙 ย้อนกลับ</button>
              <button onClick={() => setShowAppointmentModal(true)}>📅 ดูรายการนัด</button>
              {(role === 'staff' || role === 'admin') && (
                <>
                  <button onClick={() => setShowEditModal(true)}>✏️ แก้ไขข้อมูล</button>
                  <button onClick={() => setShowEditInsuranceModal(true)}>🏥 แก้ไขสิทธิ</button>
                </>
              )}
            </div>
          </div>
        )}

        <h3>ประวัติการรักษา</h3>
        {visitHistory.length === 0 ? (
          <p>ไม่มีประวัติการรักษา</p>
        ) : (
          <table border="1" width="100%" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>วันที่</th>
                <th>หมอ</th>
                <th>บันทึก</th>
                <th>หัตถการ</th>
                <th>นัดครั้งหน้า</th>
              </tr>
            </thead>
            <tbody>
              {visitHistory.map((v) => (
                <tr key={v.id}>
                  <td>{formatDate(v.visit_time)}</td>
                  <td>{v.doctors?.first_name} {v.doctors?.last_name}</td>
                  <td style={{ whiteSpace: 'pre-wrap' }}>{v.treatment_note || '-'}</td>
                  <td style={{ whiteSpace: 'pre-wrap' }}>{formatProcedures(v)}</td>
                  <td style={{ whiteSpace: 'pre-wrap' }}>{v.next_visit || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAppointmentModal && (
        <AppointmentPatientModal
          patientId={id}
          onClose={() => setShowAppointmentModal(false)}
        />
      )}
      {showEditModal && (
        <EditPatientModal
          patient={patient}
          onClose={() => setShowEditModal(false)}
          onSave={handleSave}
        />
      )}
      {showEditInsuranceModal && (
        <EditPatientInsuranceModal
          patient={patient}
          onClose={() => setShowEditInsuranceModal(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
