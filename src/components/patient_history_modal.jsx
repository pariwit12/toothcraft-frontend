import React, { useEffect, useState } from 'react';
import { formatAge, formatDate, formatProcedures } from '../utils/format';
const API_URL = process.env.REACT_APP_API_URL;

export default function PatientHistoryModal({ isOpen, patientObj, onClose }) {
  const [visitHistory, setVisitHistory] = useState([]);

  const [filterDoctor, setFilterDoctor] = useState([]);
  const [filterProcedure, setFilterProcedure] = useState([]);
  const [filterTooth, setFilterTooth] = useState([]);
  const [searchNote, setSearchNote] = useState('');
  const [searchNextVisit, setSearchNextVisit] = useState('');

  const [allDoctors, setAllDoctors] = useState([]);
  const [allProcedures, setAllProcedures] = useState([]);
  const [allTeeth, setAllTeeth] = useState([]);

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen || !patientObj?.patient_id) return;

    const fetchVisitHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/visits/history/${patientObj.patient_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('ข้อมูลไม่ถูกต้อง');
        setVisitHistory(data);

        setAllDoctors([...new Set(data.map(v => `${v.doctors?.first_name} ${v.doctors?.last_name}`).filter(Boolean))]);

        setAllProcedures([...new Set(
          data.flatMap(v =>
            v.visit_procedures?.map(vp => vp.procedures?.name).filter(Boolean) || []
          )
        )]);

        setAllTeeth([...new Set(
          data.flatMap(v =>
            v.visit_procedures?.map(vp => vp.tooth).filter(Boolean) || []
          )
        )]);
      } catch (err) {
        console.error(err);
        setErrorMsg('ไม่สามารถโหลดประวัติการรักษาได้');
        setVisitHistory([]);
      }
    };

    fetchVisitHistory();
  }, [isOpen, patientObj]);

  if (!isOpen || !patientObj) return null;

  const toggleFilter = (value, currentArray, setArray) => {
    if (currentArray.includes(value)) {
      setArray(currentArray.filter(v => v !== value));
    } else {
      setArray([...currentArray, value]);
    }
  };

  const filteredVisitHistory = visitHistory.filter(v => {
    const doctorName = `${v.doctors?.first_name} ${v.doctors?.last_name}`;
    const procedureNames = v.visit_procedures?.map(vp => vp.procedures?.name) || [];
    const toothNumbers = v.visit_procedures?.map(vp => vp.tooth) || [];

    const matchDoctor = filterDoctor.length === 0 || filterDoctor.includes(doctorName);
    const matchProcedure =
      filterProcedure.length === 0 || procedureNames.some(p => filterProcedure.includes(p));
    const matchTooth =
      filterTooth.length === 0 || toothNumbers.some(t => filterTooth.includes(t));

    const matchNote = (v.treatment_note || '').toLowerCase().includes(searchNote.toLowerCase());
    const matchNextVisit = (v.next_visit || '').toLowerCase().includes(searchNextVisit.toLowerCase());

    return matchDoctor && matchProcedure && matchTooth && matchNote && matchNextVisit;
  });

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h2>ประวัติผู้ป่วย</h2>
          <button onClick={onClose} style={closeButtonStyle}>❌ ปิด</button>
        </div>
        <p><b>HN:</b> {patientObj.patient_id}</p>
        <p><b>ชื่อ:</b> {patientObj.patients?.first_name} {patientObj.patients?.last_name}</p>
        <p><b>อายุ:</b> {formatAge(patientObj.patients?.birth_day)}</p>
        <p><b>เบอร์โทร:</b> {patientObj.patients?.telephone || '-'}</p>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h3>ประวัติการรักษา</h3>
          <button
            onClick={() => {
              setFilterDoctor([]);
              setFilterProcedure([]);
              setFilterTooth([]);
            }}
            style={{
              marginLeft: '1rem',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >🧹 ล้างการกรอง</button>
        </div>
        {/* ช่องค้นหาเพิ่มเติม */}
        <div>
          <input
            type="text"
            placeholder="ค้นหาในบันทึก"
            value={searchNote}
            onChange={(e) => setSearchNote(e.target.value)}
            style={{
              padding: '0.5rem',
              width: '100%',
              maxWidth: '300px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              marginBottom: '1rem',
            }}
          />
        </div>

        <div>
          <input
            type="text"
            placeholder="ค้นหาในนัดครั้งหน้า"
            value={searchNextVisit}
            onChange={(e) => setSearchNextVisit(e.target.value)}
            style={{
              padding: '0.5rem',
              width: '100%',
              maxWidth: '300px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              marginBottom: '1rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
          {/* หมอ */}
          <div>
            <strong>กรองหมอ:</strong><br />
            {allDoctors.map((d, idx) => (
              <label key={idx}>
                <input
                  type="checkbox"
                  checked={filterDoctor.includes(d)}
                  onChange={() => toggleFilter(d, filterDoctor, setFilterDoctor)}
                />{' '}
                {d}
                <br />
              </label>
            ))}
          </div>

          {/* หัตถการ */}
          <div>
            <strong>กรองหัตถการ:</strong><br />
            {allProcedures.map((p, idx) => (
              <label key={idx}>
                <input
                  type="checkbox"
                  checked={filterProcedure.includes(p)}
                  onChange={() => toggleFilter(p, filterProcedure, setFilterProcedure)}
                />{' '}
                {p}
                <br />
              </label>
            ))}
          </div>

          {/* ซี่ฟัน */}
          <div>
            <strong>กรองซี่ฟัน:</strong><br />
            {allTeeth.map((t, idx) => (
              <label key={idx}>
                <input
                  type="checkbox"
                  checked={filterTooth.includes(t)}
                  onChange={() => toggleFilter(t, filterTooth, setFilterTooth)}
                />{' '}
                {t}
                <br />
              </label>
            ))}
          </div>
        </div>

        {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
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
              {filteredVisitHistory.map((v) => (
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
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
  background: '#000000aa', display: 'flex', justifyContent: 'center',
  alignItems: 'center', overflowY: 'auto', padding: '1rem',
};

const modalStyle = {
  position: 'relative',
  background: '#fff',
  padding: '2rem',
  borderRadius: '10px',
  width: '95%',
  maxWidth: '1200px',
  maxHeight: '90vh',
  overflowY: 'auto',
};

const closeButtonStyle = {
  position: 'absolute',
  right: '2rem',
  border: 'none',
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  cursor: 'pointer',
};
