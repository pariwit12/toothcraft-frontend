import React, { useEffect, useState } from 'react';
import { formatAge, formatDate, formatProcedures } from '../utils/format';
import FullImageModal from '../components/full_image_modal';
const API_URL = process.env.REACT_APP_API_URL;

export default function PatientHistoryModal({ isOpen, patientObj, onClose }) {
  const [visitHistory, setVisitHistory] = useState([]);

  const [filterDoctor, setFilterDoctor] = useState([]);
  const [filterProcedure, setFilterProcedure] = useState([]);
  const [filterTooth, setFilterTooth] = useState([]);
  const [searchNote, setSearchNote] = useState('');
  const [searchNextVisit, setSearchNextVisit] = useState('');
  
  const [showHistoryFilter, setShowHistoryFilter] = useState('Hide'); // หรือ 'Show'

  const [allDoctors, setAllDoctors] = useState([]);
  const [allProcedures, setAllProcedures] = useState([]);
  const [allTeeth, setAllTeeth] = useState([]);

  const [patientIoExams, setPatientIoExams] = useState([]);
  const [patientContinueTx, setPatientContinueTx] = useState([]);

  const [visitHistoryIoDisplayMode, setVisitHistoryIoDisplayMode] = useState('planOnly'); // หรือ 'planAndName'
  
  const [patientImages, setPatientImages] = useState([]);
  
  const [showFullImageModal, setShowFullImageModal] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState('');
  const [selectedImageUrl, setSelectedImageUrl] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!isOpen || !patientObj?.patient_id) return;

    const fetchVisitHistory = async () => {
      try {
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
    fetchPatientIoExam();
    fetchPatientContinueTx();
    fetchPatientImages();
  }, [isOpen, patientObj]);

  if (!isOpen || !patientObj) return null;


  const fetchPatientImages = async () => {
    try {
      const res = await fetch(`${API_URL}/gcs/patient/${patientObj.patient_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('ไม่สามารถโหลดรูปภาพได้');
      const data = await res.json();
      setPatientImages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPatientContinueTx = async () => {
    try {
      const res = await fetch(`${API_URL}/continue-tx-patient/patient/${patientObj.patient_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setPatientContinueTx(data); // เก็บข้อมูลเต็ม
      }
    } catch {
      console.error('ไม่สามารถโหลด continue_tx_patient ของคนไข้');
    }
  };

  const fetchPatientIoExam = async () => {
    try {
      const res = await fetch(`${API_URL}/io-exam-patient/patient/${patientObj.patient_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setPatientIoExams(data);
    } catch {
      console.error('ไม่สามารถโหลดผลการตรวจทั้งหมดของคนไข้');
    }
  };

  const toothOrder = [
    '18','17','16','15','14','13','12','11',
    '21','22','23','24','25','26','27','28',
    '38','37','36','35','34','33','32','31',
    '41','42','43','44','45','46','47','48',
    '55','54','53','52','51',
    '61','62','63','64','65',
    '75','74','73','72','71',
    '81','82','83','84','85'
  ];

  const getToothOrderIndex = (toothSurface) => {
    const match = toothSurface.match(/^(\d+)/);
    const tooth = match ? match[1] : '';
    return toothOrder.indexOf(tooth);
  };

  const getIoPlansForVisit = (visit, mode = 'planAndName') => {
    const plans = patientIoExams.filter(io =>
      new Date(io.date_create) <= new Date(visit.visit_time) &&
      (!io.date_end || new Date(io.date_end) > new Date(visit.visit_time))
    );

    if (plans.length === 0) return '';

    if (mode === 'planOnly') {
      // 👉 Group by plan only
      const grouped = {};

      plans.forEach(io => {
        const plan = io.io_finding_list?.plan || 'ไม่ระบุแผน';
        const tooth = io.tooth || '';
        const surface = (io.surface || '').replaceAll(',', '');
        const toothSurface = `${tooth}${surface}`;

        if (!grouped[plan]) grouped[plan] = [];

        grouped[plan].push({ toothSurface });
      });

      // Sort each plan's toothSurfaces
      Object.keys(grouped).forEach(plan => {
        grouped[plan].sort((a, b) =>
          getToothOrderIndex(a.toothSurface) - getToothOrderIndex(b.toothSurface)
        );
      });

      return (
        <>
          {Object.entries(grouped).map(([plan, list]) => (
            <div key={plan}>
              <strong>- {plan}</strong>: {list.map(i => i.toothSurface).join(', ')}
            </div>
          ))}
        </>
      );
    }

    // 👉 Default: planAndName
    const grouped = {};

    plans.forEach(io => {
      const plan = io.io_finding_list?.plan || 'ไม่ระบุแผน';
      const name = io.io_finding_list?.name || 'ไม่ระบุชื่อ';
      const tooth = io.tooth || '';
      const surface = (io.surface || '').replaceAll(',', '');
      const toothSurface = `${tooth}${surface}`;

      if (!grouped[plan]) grouped[plan] = {};
      if (!grouped[plan][name]) grouped[plan][name] = [];

      grouped[plan][name].push({ toothSurface });
    });

    // Sort each plan/name
    Object.keys(grouped).forEach(plan => {
      Object.keys(grouped[plan]).forEach(name => {
        grouped[plan][name].sort(
          (a, b) => getToothOrderIndex(a.toothSurface) - getToothOrderIndex(b.toothSurface)
        );
      });
    });

    return (
      <>
        {Object.entries(grouped).map(([plan, names]) => (
          <li key={plan}>
            <strong>{plan}</strong>
            {Object.entries(names).map(([name, toothList]) => (
              <div key={name}>
                - {name} {toothList.length > 0 && `(${toothList.map(i => i.toothSurface).join(', ')})`}
              </div>
            ))}
          </li>
        ))}
      </>
    );
  };

  const getContinueTxForVisit = (visit, mode = 'planAndName') => {
    const plans = patientContinueTx.filter(io =>
      new Date(io.date_create) <= new Date(visit.visit_time) &&
      (!io.date_end || new Date(io.date_end) > new Date(visit.visit_time))
    );

    if (plans.length === 0) return '';

    if (mode === 'planOnly') {
      // 👉 Group by plan only
      const grouped = {};

      plans.forEach(io => {
        const plan = io.continue_tx_list?.name || 'ไม่ระบุแผน';
        const tooth = io.tooth || '';
        const surface = (io.surface || '').replaceAll(',', '');
        const toothSurface = `${tooth}${surface}`;

        if (!grouped[plan]) grouped[plan] = [];

        grouped[plan].push({ toothSurface });
      });

      // Sort each plan's toothSurfaces
      Object.keys(grouped).forEach(plan => {
        grouped[plan].sort((a, b) =>
          getToothOrderIndex(a.toothSurface) - getToothOrderIndex(b.toothSurface)
        );
      });

      return (
        <>
          {Object.entries(grouped).map(([plan, list]) => (
            <div key={plan}>
              <strong>- (ต่อเนื่อง) {plan}</strong>: {list.map(i => i.toothSurface).join(', ')}
            </div>
          ))}
        </>
      );
    }

    // 👉 Default: planAndName
    const grouped = {};

    plans.forEach(io => {
      const plan = io.continue_tx_list?.name || 'ไม่ระบุแผน';
      const name = 'On-going';
      const tooth = io.tooth || '';
      const surface = (io.surface || '').replaceAll(',', '');
      const toothSurface = `${tooth}${surface}`;

      if (!grouped[plan]) grouped[plan] = {};
      if (!grouped[plan][name]) grouped[plan][name] = [];

      grouped[plan][name].push({ toothSurface });
    });

    // Sort each plan/name
    Object.keys(grouped).forEach(plan => {
      Object.keys(grouped[plan]).forEach(name => {
        grouped[plan][name].sort(
          (a, b) => getToothOrderIndex(a.toothSurface) - getToothOrderIndex(b.toothSurface)
        );
      });
    });

    return (
      <>
        {Object.entries(grouped).map(([plan, names]) => (
          <li key={plan}>
            <strong>(ต่อเนื่อง) {plan}</strong>
            {Object.entries(names).map(([name, toothList]) => (
              <div key={name}>
                - {name} {toothList.length > 0 && `(${toothList.map(i => i.toothSurface).join(', ')})`}
              </div>
            ))}
          </li>
        ))}
      </>
    );
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

        {/* 👇 7. เพิ่มส่วนแสดงผลรูปภาพ */}
        <div style={{ marginBottom: '2rem' }}>
          <h3>คลังภาพ X-Ray</h3>
          {patientImages.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
              {patientImages.map(image => (
                <div key={image.id} style={{ border: '1px solid #ddd', padding: '0.5rem', borderRadius: '8px', textAlign: 'center' }}>
                  <button
                    onClick={() => {
                      setSelectedImageId(image.id);
                      setSelectedImageUrl(image.url);
                      setShowFullImageModal(true);
                    }}
                    style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    <img src={image.url} alt={`ImageId ${image.id}`} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                  </button>
                  <small>
                    {new Date(image.takenAt).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' })}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <p>ยังไม่มีภาพ X-Ray</p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h3>ประวัติการรักษา</h3>
          {showHistoryFilter === 'Hide' && (
            <button
              onClick={() => {
                setShowHistoryFilter('Show');
              }}
              style={{
                marginLeft: '1rem',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >🔍 แสดงระบบกรอง</button>
          )}
          {showHistoryFilter === 'Show' && (
            <>
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
              <button
                onClick={() => {
                  setShowHistoryFilter('Hide');
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
              >❌ ซ่อนระบบกรอง</button>
            </>
          )}
        </div>

        {showHistoryFilter === 'Show' && (
          <>

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

          </>
        )}

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
                <th>
                  แผนการรักษา
                  {visitHistoryIoDisplayMode === 'planAndName' ? (
                    <button
                      className={`px-3 py-1 rounded ${
                        visitHistoryIoDisplayMode === 'planOnly' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                      }`}
                      onClick={() => setVisitHistoryIoDisplayMode('planOnly')}
                      style={{
                        marginLeft: '1rem',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      ซ่อน I/O
                    </button>
                  ) : (
                    <button
                      className={`px-3 py-1 rounded ${
                        visitHistoryIoDisplayMode === 'planAndName' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                      }`}
                      onClick={() => setVisitHistoryIoDisplayMode('planAndName')}
                      style={{
                        marginLeft: '1rem',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      แสดง I/O
                    </button>
                  )}
                </th>
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
                  <td style={{ whiteSpace: 'pre-wrap' }}>
                    {getIoPlansForVisit(v, visitHistoryIoDisplayMode)}{getContinueTxForVisit(v, visitHistoryIoDisplayMode)}
                  </td>
                  <td style={{ whiteSpace: 'pre-wrap' }}>{v.next_visit || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showFullImageModal && (
        <FullImageModal
          imageId={selectedImageId}
          imageUrl={selectedImageUrl}
          onClose={() => setShowFullImageModal(false)}
          onDeleteSuccess={() => fetchPatientImages()}
        />
      )}
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
