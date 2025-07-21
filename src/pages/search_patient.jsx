import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { INSURANCE_TYPE_BY_ID } from '../constants/insurance_type';
const API_URL = process.env.REACT_APP_API_URL;

export default function SearchPatient() {
  const [hn, setHn] = useState('');
  const [name, setName] = useState('');
  const [telephone, setTelephone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [results, setResults] = useState([]);
  const [noResult, setNoResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [userRole, setUserRole] = useState('');


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role || '');
      } catch (err) {
        console.error('ไม่สามารถถอดรหัส token ได้:', err);
      }
    }
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (hn || name || telephone || idNumber) {
        searchPatients();
      } else {
        setResults([]);
        setNoResult(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [hn, name, telephone, idNumber]);

  const searchPatients = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (hn) queryParams.append('hn', hn);
      if (name) queryParams.append('name', name);
      if (telephone) queryParams.append('telephone', telephone);
      if (idNumber) queryParams.append('id_number', idNumber);

      const response = await fetch(`${API_URL}/patients/search-by-field?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (Array.isArray(data)) {
        setResults(data);
        setNoResult(data.length === 0);
      } else {
        setResults([]);
        setNoResult(true);
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการค้นหา:', error);
      setResults([]);
      setNoResult(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDetailClick = (id) => {
    navigate(`/patient_detail/${id}`);
  };

  const handleAddToQueue = async (patientId) => {
    const confirmAdd = window.confirm(`คุณต้องการเพิ่ม HN: ${patientId} เข้าคิวหรือไม่?`);
    if (!confirmAdd) return;

    try {
      const response = await fetch(`${API_URL}/clinic-queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patient_id: patientId,
          time_coming: new Date(),
          room: '0',
          detail_to_room: "ลงทะเบียนโดย staff", // หรือ "self-register" ก็ได้
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert('เกิดข้อผิดพลาด: ' + errorData.error);
        return;
      }

      alert('เพิ่มเข้าคิวเรียบร้อยแล้ว');
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการเพิ่มเข้าคิว:', error);
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>ค้นหาผู้ป่วยเก่า</h2>

      {userRole === 'staff' || userRole === 'admin' ? (
        <button
          onClick={() => navigate('/dashboard/staff')}
          style={{
            backgroundColor: '#f0f0f0',
            padding: '0.5rem 1rem',
            marginBottom: '1rem',
            borderRadius: '6px',
            border: '1px solid #ccc',
            cursor: 'pointer',
          }}
        >
          🔙 กลับหน้าหลัก Staff
        </button>
      ) : null}

      {userRole === 'doctor' && (
        <button
          onClick={() => navigate('/dashboard/doctor')}
          style={{
            backgroundColor: '#f0f0f0',
            padding: '0.5rem 1rem',
            marginBottom: '1rem',
            borderRadius: '6px',
            border: '1px solid #ccc',
            cursor: 'pointer',
          }}
        >
          🔙 กลับหน้าหลัก Doctor
        </button>
      )}

      <input type="text" placeholder="ค้นหา HN" value={hn} onChange={(e) => setHn(e.target.value)} style={{ padding: '0.5rem', width: '100%', marginBottom: '0.5rem' }} />
      <input type="text" placeholder="ค้นหา ชื่อ-นามสกุล" value={name} onChange={(e) => setName(e.target.value)} style={{ padding: '0.5rem', width: '100%', marginBottom: '0.5rem' }} />
      <input type="text" placeholder="ค้นหา เบอร์โทรศัพท์" value={telephone} onChange={(e) => setTelephone(e.target.value)} style={{ padding: '0.5rem', width: '100%', marginBottom: '0.5rem' }} />
      <input type="text" placeholder="ค้นหา เลขบัตรประชาชน" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} style={{ padding: '0.5rem', width: '100%', marginBottom: '1rem' }} />

      {loading && <p>กำลังค้นหา...</p>}
      {!loading && noResult && <p>ไม่พบข้อมูลผู้ป่วย</p>}

      {!loading && results.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {results.map((patient) => (
            <li key={patient.id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '0.5rem', borderRadius: '8px' }}>
              <strong>{patient.first_name} {patient.last_name}</strong><br />
              <label><strong>HN:</strong> {patient.id}</label><br />
              <label><strong>เลขบัตรประชาชน:</strong> {patient.id_number}</label><br />
              <label><strong>วันเกิด:</strong> {new Date(patient.birth_day).toLocaleDateString('th-TH')}</label><br />
              <label><strong>เบอร์โทร:</strong> {patient.telephone}</label><br />
              <label><strong>Line User ID:</strong> {patient.line_user_id ? '✅ มีข้อมูล' : '❌ ไม่มีข้อมูล'}</label><br />
              <label><strong>สิทธิการรักษา:</strong>{' '}
              {patient.insurance_type
                ? INSURANCE_TYPE_BY_ID[patient.insurance_type]
                : '❌ ยังไม่มีการบันทึกสิทธิการรักษา'}</label><br />
              <label><strong>วงเงินคงเหลือ:</strong> {patient.insurance_balance}</label><br />
              <div style={{ marginTop: '0.5rem' }}>
                <button onClick={() => handleDetailClick(patient.id)}>ดูรายละเอียด</button>
                {(userRole === 'staff' || userRole === 'admin') && (
                  <button
                    style={{ marginLeft: '0.5rem', backgroundColor: '#d0f5d0' }}
                    onClick={() => handleAddToQueue(patient.id)}
                  >
                    ➕ เพิ่มเข้าคิว
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
