// 📁 frontend/src/pages/doctor_treatment_form.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReferModal from '../components/refer_modal';
import ToothSelectModal from '../components/tooth_select_modal';
const API_URL = process.env.REACT_APP_API_URL;

export default function DoctorTreatmentForm() {
  const { queueId, patientId } = useParams();
  const [treatmentNote, setTreatmentNote] = useState('');
  const [nextVisit, setNextVisit] = useState('');
  const [procedures, setProcedures] = useState([]);
  const [availableProcedures, setAvailableProcedures] = useState([]);
  const [message, setMessage] = useState('');
  const [patient, setPatient] = useState(null);
  const [queueDetail, setQueueDetail] = useState(null);

  const [visitHistory, setVisitHistory] = useState([]);

  const [filterDoctor, setFilterDoctor] = useState([]);
  const [filterProcedure, setFilterProcedure] = useState([]);
  const [filterTooth, setFilterTooth] = useState([]);
  const [searchNote, setSearchNote] = useState('');
  const [searchNextVisit, setSearchNextVisit] = useState('');

  const [allDoctors, setAllDoctors] = useState([]);
  const [allProcedures, setAllProcedures] = useState([]);
  const [allTeeth, setAllTeeth] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [isReferOpen, setIsReferOpen] = useState(false);
  const [isToothModalOpen, setIsToothModalOpen] = useState(false);
  const [editingToothIndex, setEditingToothIndex] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProcedures();
    fetchPatientInfo();
    fetchQueueDetail();
    fetchVisitHistory();
  }, []);

  const fetchProcedures = async () => {
    try {
      const res = await fetch(`${API_URL}/procedures`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
        // 🔧 เรียงตาม id น้อยไปมาก
      const sorted = Array.isArray(data)
        ? data.sort((a, b) => a.id - b.id)
        : [];

      setAvailableProcedures(sorted);
    } catch {
      console.error('ไม่สามารถโหลด procedures');
    }
  };

  const fetchPatientInfo = async () => {
    try {
      const res = await fetch(`${API_URL}/patients/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setPatient(data);
    } catch {
      console.error('ไม่สามารถโหลดข้อมูลผู้ป่วย');
    }
  };

  const fetchQueueDetail = async () => {
    try {
      const res = await fetch(`${API_URL}/clinic-queue/${queueId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setQueueDetail(data);
    } catch {
      console.error('ไม่สามารถโหลดข้อมูลคิว');
    }
  };

  const fetchVisitHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/visits/history/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setVisitHistory(data);

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
    } catch {
      console.error('ไม่สามารถโหลดประวัติการรักษา');
    }
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const dob = new Date(birthDate);
    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    if (today.getDate() < dob.getDate()) months--;
    if (months < 0) {
      years--;
      months += 12;
    }
    return `${years} ปี ${months} เดือน`;
  };

  const handleAddProcedure = (p) => {
    setProcedures((prev) => [
      {
        procedure_id: p.id,
        tooth: '',
        price: p.default_price || '',
        paid: false,
      },
      ...prev,
    ]);
  };

  const handleChangeProcedure = (index, field, value) => {
    const newProcedures = [...procedures];
    newProcedures[index][field] = value;
    setProcedures(newProcedures);
  };

  const formatProcedures = (visit) => {
    if (!visit.visit_procedures?.length) return '-';
    return visit.visit_procedures.map((vp, idx) => {
      const procName = vp.procedures?.name || 'ไม่มีชื่อหัตถการ';
      const tooth = vp.tooth ? `#${vp.tooth}` : '';
      const price = vp.price ? `(${vp.price})` : '';
      const paidStatus = vp.paid ? '' : ' - ยังไม่ชำระ';
      return (
        <React.Fragment key={idx}>
          {`- ${procName} ${tooth} ${price}${paidStatus}`}
          {idx !== visit.visit_procedures.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  const handleSubmit = async () => {
    setMessage('');
    const payload = {
      patient_id: Number(patientId),
      treatment_note: treatmentNote,
      next_visit: nextVisit,
      procedures,
    };

    const res = await fetch(`${API_URL}/visits/with-procedures`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error || 'เกิดข้อผิดพลาด');
      throw new Error(data.error);
    }
  };

  const handleReferConfirm = async (room, note) => {
    try {
      // ตรวจสอบสถานะคิวก่อน
      const checkRes = await fetch(`${API_URL}/clinic-queue/${queueId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const checkData = await checkRes.json();

      if (!checkRes.ok || checkData.patient_id !== Number(patientId) || checkData.room !== queueDetail?.room) {
        alert('ไม่สามารถส่งต่อได้ เนื่องจากคนไข้ไม่มีสถานะอยู่ในห้องนี้แล้ว');
        setIsReferOpen(false);
        return;
      }

      // บันทึกการรักษาก่อน
      await handleSubmit();

      // ✅ เตรียม note ใหม่
      const trimmedNote = note?.trim();
      let formattedNote = '';

      if (trimmedNote) {
        const timestamp = new Date().toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Bangkok',
        });
        formattedNote = `-- Doctor -- (${timestamp})\n${trimmedNote}`;
      }

      // ✅ รวม note เก่ากับใหม่
      const previousNote = checkData.detail_to_room || '';
      const combinedNote = previousNote
        ? `${previousNote.trim()}\n\n${formattedNote}`
        : formattedNote;

      // PUT ส่งต่อ
      const res = await fetch(`${API_URL}/clinic-queue/${queueId}/refer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ room, note: combinedNote.trim() }),
      });

      if (res.ok) {
        alert('ส่งต่อสำเร็จ');
        navigate('/dashboard/doctor/room');
      } else {
        const data = await res.json();
        setMessage(data.error || 'เกิดข้อผิดพลาดในการส่งต่อ');
      }
    } catch (err) {
      console.error(err);
      setMessage('เชื่อมต่อไม่สำเร็จ');
    }
  };

  const allCategories = [...new Set(availableProcedures.map((p) => p.category?.trim()))];

  const handleRemoveProcedure = (index) => {
    setProcedures((prev) => prev.filter((_, i) => i !== index));
  };

  const openToothModal = (index) => {
    setEditingToothIndex(index);
    setIsToothModalOpen(true);
  };

  const handleToothSelect = (value) => {
    if (editingToothIndex !== null) {
      handleChangeProcedure(editingToothIndex, 'tooth', value);
      setEditingToothIndex(null);
    }
  };

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
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, maxWidth: '50%', display: 'flex', flexDirection: 'column' }}>
          <h2>บันทึกการรักษา</h2>

          {patient ? (
            <div>
              <b>คิว:</b> {queueId} | <b>HN:</b> {patient.id}
              <br />
              <b>ชื่อ-สกุล:</b> {patient.first_name} {patient.last_name}
              <br />
              <b>อายุ:</b> {calculateAge(patient.birth_day)}
              <br />
              {queueDetail?.detail_to_room && (
                <>
                  <b>รายละเอียดการส่งต่อ:</b> 
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {queueDetail.detail_to_room}
                  </div>
                </>
              )}
            </div>
          ) : (
            <p>กำลังโหลดข้อมูลผู้ป่วย...</p>
          )}

          <div>
            <label style={{ marginTop: '1rem', display: 'block' }}>บันทึกการรักษา:</label>
            <textarea
              value={treatmentNote}
              onChange={(e) => setTreatmentNote(e.target.value)}
              rows={6}
              style={{ width: '100%' }}
            />

            <label style={{ marginTop: '1rem', display: 'block' }}>นัดครั้งหน้า:</label>
            <textarea
              value={nextVisit}
              onChange={(e) => setNextVisit(e.target.value)}
              rows={3}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <h3>เลือกหัตถการ</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    setSelectedCategory((prev) => (prev === cat ? '' : cat))
                  }
                  style={{
                    padding: '0.5rem 1rem',
                    background: selectedCategory === cat ? '#007bff' : '#eee',
                    color: selectedCategory === cat ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {selectedCategory && (
              <div style={{ marginTop: '1rem' }}>
                {availableProcedures
                  .filter((p) => p.category?.trim() === selectedCategory)
                  .map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '3fr 1fr 0.5fr 1fr auto',
                        gap: '0.5rem',
                        alignItems: 'center',
                        padding: '0.25rem 0',
                      }}
                    >
                      <span>{p.name}</span>
                      <span style={{ textAlign: 'right' }}>{p.min_price}</span>
                      <span style={{ textAlign: 'center' }}>-</span>
                      <span style={{ textAlign: 'left' }}>{p.max_price}</span>
                      <button onClick={() => handleAddProcedure(p)} style={{ cursor: 'pointer' }}>➕ เพิ่ม</button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {procedures.length > 0 && (
            <div>
              <h4>รายการหัตถการที่เลือก</h4>
              <div>
                {procedures.map((proc, index) => {
                  const name =
                    availableProcedures.find((p) => p.id === Number(proc.procedure_id))?.name || '(ไม่พบ)';
                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '0.5rem 0',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ flex: 3 }}>
                        <b>{name}</b>
                      </div>

                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label htmlFor={`tooth-${index}`}>ซี่ฟัน:</label>
                        <button
                          onClick={() => openToothModal(index)}
                          style={{
                            padding: '4px 8px',
                            border: '1px solid #ccc',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            minWidth: '60px',
                            background: '#f9f9f9'
                          }}
                        >
                          {proc.tooth || 'เลือก'}
                        </button>
                      </div>

                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label htmlFor={`price-${index}`}>ราคา:</label>
                        <input
                          id={`price-${index}`}
                          type="number"
                          value={proc.price}
                          onChange={(e) => handleChangeProcedure(index, 'price', e.target.value)}
                          style={{
                            width: '80px',
                            padding: '4px 6px',
                            borderRadius: '5px',
                            border: '1px solid #ccc',
                          }}
                        />
                      </div>

                      <div>
                        <button
                          onClick={() => handleRemoveProcedure(index)}
                          style={{
                            color: 'red',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                          }}
                        >
                          ❌ ลบ
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {message && <p style={{ color: 'red' }}>{message}</p>}

          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={async () => {
                // 🔒 ตรวจสอบการเลือกซี่ฟันให้ครบทุกหัตถการ
                const missingTooth = procedures.some((p) => !p.tooth || p.tooth.trim() === '');
                if (missingTooth) {
                  alert('กรุณาเลือกซี่ฟันให้ครบทุกหัตถการ');
                  return;
                }
                setIsReferOpen(true);
              }}
            >
              💾 บันทึก
            </button>{' '}
            <button onClick={() => navigate('/dashboard/doctor/room')}>ยกเลิก</button>
          </div>
        </div>

        <div style={{ flex: 1, maxWidth: '50%', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h3>ประวัติการรักษา</h3>
            <button
              onClick={() => {
                setFilterDoctor([]);
                setFilterProcedure([]);
                setFilterTooth([]);
                setSearchNote('');
                setSearchNextVisit('');
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

          {visitHistory.length === 0 ? (
            <p>ไม่มีประวัติการรักษา</p>
          ) : (
            <table border="1" width="100%" cellPadding="5" style={{ borderCollapse: 'collapse', borderColor: '#ccc' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>วันที่</th>
                  <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>หมอ</th>
                  <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>บันทึก</th>
                  <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>หัตถการ</th>
                  <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>นัดครั้งหน้า</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisitHistory.map((v) => (
                  <tr key={v.id}>
                    <td style={{ whiteSpace: 'nowrap', padding: '0.25rem 0', border: '1px solid #ccc' }}>
                      {new Date(v.visit_time).toLocaleDateString('th-TH')}
                    </td>
                    <td style={{ whiteSpace: 'pre-wrap', padding: '0.25rem 0', border: '1px solid #ccc' }}>
                      {`${v.doctors.first_name} (${v.doctors.nickname})` || '-'}
                    </td>
                    <td style={{ whiteSpace: 'pre-wrap', padding: '0.25rem 0', border: '1px solid #ccc' }}>
                      {v.treatment_note || '-'}
                    </td>
                    <td style={{ whiteSpace: 'pre-wrap', padding: '0.25rem 0', border: '1px solid #ccc' }}>
                      {formatProcedures(v)}
                    </td>
                    <td style={{ whiteSpace: 'pre-wrap', padding: '0.25rem 0', border: '1px solid #ccc' }}>
                      {v.next_visit || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <ReferModal
        isOpen={isReferOpen}
        onClose={() => setIsReferOpen(false)}
        onConfirm={handleReferConfirm}
        queueId={queueId}
      />
      <ToothSelectModal
        isOpen={isToothModalOpen}
        onClose={() => setIsToothModalOpen(false)}
        onSelect={handleToothSelect}
      />
    </div>
  );
}