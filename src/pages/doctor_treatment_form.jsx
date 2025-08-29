// 📁 frontend/src/pages/doctor_treatment_form.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReferModal from '../components/refer_modal';
import ToothSelectModal from '../components/tooth_select_modal';
import { jwtDecode } from 'jwt-decode';
import FullImageModal from '../components/full_image_modal';
const API_URL = process.env.REACT_APP_API_URL;

export default function DoctorTreatmentForm() {
  const { queueId, patientId } = useParams();
  const [treatmentNote, setTreatmentNote] = useState('');
  const [nextVisit, setNextVisit] = useState('');
  const [procedures, setProcedures] = useState([]);
  const [availableProcedures, setAvailableProcedures] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [message, setMessage] = useState('');
  const [patient, setPatient] = useState(null);
  const [queueDetail, setQueueDetail] = useState(null);

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

  const [isReferOpen, setIsReferOpen] = useState(false);
  const [isToothModalOpen, setIsToothModalOpen] = useState(false);
  const [editingProcedureIndex, setEditingProcedureIndex] = useState(null);
  const [editingIoFindingIndex, setEditingIoFindingIndex] = useState(null);


  const [ioFindingListToInsert, setIoFindingListToInsert] = useState([]);
  const [availableIoFindingList, setAvailableIoFindingList] = useState([]);
  const [selectedIoPlan, setSelectedIoPlan] = useState('');


  const [lastIoExams, setLastIoExams] = useState([]);

  
  const [displayMode, setDisplayMode] = useState('planOnly'); // 'planAndName' | 'planOnly' | 'byTooth'


  const [selectedIoIdsToUpdateDateEnd, setSelectedIoIdsToUpdateDateEnd] = useState([]);

  const [patientIoExams, setPatientIoExams] = useState([]);
  const [patientContinueTx, setPatientContinueTx] = useState([]);
  const [activeContinueTx, setActiveContinueTx] = useState([]); // ✅ เก็บเฉพาะ date_end เป็น null


  const [visitHistoryIoDisplayMode, setVisitHistoryIoDisplayMode] = useState('planOnly'); // หรือ 'planAndName'

  
  const [patientImages, setPatientImages] = useState([]);

  const [showFullImageModal, setShowFullImageModal] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState('');
  const [selectedImageUrl, setSelectedImageUrl] = useState('');


  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const decoded = jwtDecode(token);

  useEffect(() => {
    fetchProcedures();
    fetchPatientInfo();
    fetchQueueDetail();
    fetchVisitHistory();
    fetchIoFindingList();
    fetchLastIoExam();
    fetchPatientIoExam();
    fetchPatientContinueTx();
    fetchPatientImages();
  }, []);

  const fetchPatientImages = async () => {
    try {
      const res = await fetch(`${API_URL}/gcs/patient/${patientId}`, {
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
      const res = await fetch(`${API_URL}/continue-tx-patient/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setPatientContinueTx(data); // เก็บข้อมูลเต็ม

        // ✅ กรองเฉพาะ date_end เป็น null
        const filtered = data.filter((item) => item.date_end === null);
        setActiveContinueTx(filtered);
      }
    } catch {
      console.error('ไม่สามารถโหลด continue_tx_patient ของคนไข้');
    }
  };

  const fetchPatientIoExam = async () => {
    try {
      const res = await fetch(`${API_URL}/io-exam-patient/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setPatientIoExams(data);
    } catch {
      console.error('ไม่สามารถโหลดผลการตรวจทั้งหมดของคนไข้');
    }
  };

  const fetchLastIoExam = async () => {
    try {
      const res = await fetch(`${API_URL}/io-exam-patient/last/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setLastIoExams(data);
    } catch {
      console.error('ไม่สามารถโหลดผลการตรวจล่าสุด');
    }
  };

  const fetchIoFindingList = async () => {
    try {
      const res = await fetch(`${API_URL}/io-finding-list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      setAvailableIoFindingList(data);
    } catch {
      console.error('ไม่สามารถโหลด io_finding_list');
    }
  };

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
  const allPlan = [...new Set(availableIoFindingList.map((p) => p.plan?.trim()))];

  const handleRemoveProcedure = (index) => {
    setProcedures((prev) => prev.filter((_, i) => i !== index));
  };
  

  const openToothModal = ({ type, index }) => {
    if (type === 'procedure') {
      setEditingProcedureIndex(index);
      setEditingIoFindingIndex(null);
    } else if (type === 'io') {
      setEditingProcedureIndex(null);
      setEditingIoFindingIndex(index);
    }
    setIsToothModalOpen(true);
  };

  const handleToothSelect = (value) => {
    if (editingProcedureIndex !== null) {
      const updated = [...procedures];
      updated[editingProcedureIndex].tooth = value;
      setProcedures(updated);
    } else if (editingIoFindingIndex !== null) {
      const updated = [...ioFindingListToInsert];
      updated[editingIoFindingIndex].tooth = value;
      setIoFindingListToInsert(updated);
    }
    setEditingProcedureIndex(null);
    setEditingIoFindingIndex(null);
    setIsToothModalOpen(false);
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


  const handleSaveIoFindings = async () => {
    setMessage('');

    if (ioFindingListToInsert.length === 0) {
      alert('ยังไม่มีรายการผลการตรวจ');
      return;
    }

    // ตรวจสอบว่าทุกรายการมีซี่ฟันครบ
    const missingTooth = ioFindingListToInsert.some((item) => !item.tooth || item.tooth.trim() === '');
    if (missingTooth) {
      alert('กรุณาเลือกซี่ฟันให้ครบทุกผลการตรวจ');
      return;
    }

    try {
      const payload = {
        patient_id: Number(patientId),
        doctor_id: decoded.id, // ดึงจาก token
        findings: ioFindingListToInsert,
      };

      const res = await fetch(`${API_URL}/io-exam-patient/multi-insert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error || 'เกิดข้อผิดพลาดในการบันทึกผลการตรวจ');
        return;
      }

      alert('บันทึกผลการตรวจเรียบร้อยแล้ว');
      setIoFindingListToInsert([]); // ล้างรายการที่เลือก
      setSelectedIoPlan('');  // ล้าง Plan ที่เลือก

      await fetchLastIoExam();
      
    } catch (err) {
      console.error('เกิดข้อผิดพลาด:', err);
      setMessage('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์');
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


  const groupedByPlanAndName = useMemo(() => {
    const grouped = {};

    lastIoExams.forEach(item => {
      const { plan, name } = item.io_finding_list;
      const tooth = item.tooth || '';
      const surface = (item.surface || '').replaceAll(',', '');
      const toothSurface = `${tooth}${surface}`;

      if (!grouped[plan]) grouped[plan] = {};
      if (!grouped[plan][name]) grouped[plan][name] = [];

      grouped[plan][name].push({
        id: item.id,
        toothSurface,
        tooth,
        surface,
      });
    });

    // เรียง toothSurface ภายในแต่ละ group
    Object.keys(grouped).forEach(plan => {
      Object.keys(grouped[plan]).forEach(name => {
        grouped[plan][name].sort((a, b) => getToothOrderIndex(a.toothSurface) - getToothOrderIndex(b.toothSurface));
      });
    });

    return grouped;
  }, [lastIoExams]);


  const groupedByPlan = useMemo(() => {
    const grouped = {};

    lastIoExams.forEach(item => {
      const { plan, name } = item.io_finding_list;
      const tooth = item.tooth || '';
      const surface = (item.surface || '').replaceAll(',', '');
      const toothSurface = `${tooth}${surface}`;

      if (!grouped[plan]) grouped[plan] = [];
      
      grouped[plan].push({
        id: item.id,
        tooth,
        surface,
        io_finding_list: item.io_finding_list,
      });
    });

    Object.keys(grouped).forEach(plan => {
      grouped[plan].sort((a, b) => getToothOrderIndex(`${a.tooth}${a.surface}`) - getToothOrderIndex(`${b.tooth}${b.surface}`));
    });

    return grouped;
  }, [lastIoExams]);


  const groupedByTooth = useMemo(() => {
    const grouped = {};

    lastIoExams.forEach(item => {
      const { plan, name } = item.io_finding_list;
      const tooth = item.tooth || '';
      const surface = (item.surface || '').replaceAll(',', '');
      const toothSurface = `${tooth}${surface}`;

      if (!grouped[tooth]) grouped[tooth] = [];
      
      grouped[tooth].push({
        id: item.id,
        surface,
        toothSurface,
        io_finding_list: item.io_finding_list,
      });
    });

    Object.keys(grouped).forEach(tooth => {
      grouped[tooth].sort((a, b) => {
        const sa = a.surface || '';
        const sb = b.surface || '';
        return sa.localeCompare(sb);
      });
    });

    // จัดเรียงลำดับซี่ฟันตามที่กำหนด
    const ordered = {};
    toothOrder.forEach(tooth => {
      if (grouped[tooth]) ordered[tooth] = grouped[tooth];
    });

    return ordered;
  }, [lastIoExams]);


  const activeContinueTxToShow = useMemo(() => {
    return activeContinueTx.reduce((acc, item) => {
      const plan = item.continue_tx_list?.name || 'ไม่ระบุแผน';
      if (!acc[plan]) acc[plan] = [];
      acc[plan].push(item);
      return acc;
    }, {});
  }, [activeContinueTx]); // คำนวณใหม่เฉพาะเมื่อ activeContinueTx เปลี่ยน



  const toggleIoSelectionToUpdateDateEnd = (id) => {
    setSelectedIoIdsToUpdateDateEnd(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
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


  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
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

            <label style={{ marginTop: '1rem', display: 'block' }}>แผนการรักษา:</label>

            {displayMode === 'planOnly' && (() => {
              let textValue = '';
              Object.entries(groupedByPlan).forEach(([plan, arr]) => {
                textValue += `\n- ${plan}:` + arr.map(item => ` ${item.tooth}${item.surface}`).join(',');
              });

              // ข้อมูล activeContinueTxToShow
              Object.entries(activeContinueTxToShow).forEach(([plan, arr]) => {
                textValue += `\n- (ต่อเนื่อง) ${plan}:` + arr.map(item => ` ${item.tooth || ''}${item.surface || ''}`).join(',');
              });

              return (
                <div style={{ marginBottom: '1rem' }}>
                  <textarea
                    value={textValue.trim()}
                    rows={6}
                    style={{ width: '100%' }}
                    readOnly
                  />
                </div>
              );
            })()}

            {(displayMode === 'planAndName' || displayMode === 'byTooth') && (() => {
              let textValue = '';

              Object.entries(groupedByPlanAndName).forEach(([plan, items]) => {
                Object.entries(items).forEach(([name, arr]) => {
                  textValue += `\n- ${plan} - ${arr.map(item => item.toothSurface).join(', ')} ${name}`;
                });
              });
              
              // ข้อมูล activeContinueTxToShow
              Object.entries(activeContinueTxToShow).forEach(([plan, arr]) => {
                textValue += `\n- (ต่อเนื่อง) ${plan}:` + arr.map(item => ` ${item.tooth || ''}${item.surface || ''}`).join(',');
              });

              return (
                <div style={{ marginBottom: '1rem' }}>
                  <textarea
                    value={textValue.trim()}
                    rows={6}
                    style={{ width: '100%' }}
                    readOnly
                  />
                </div>
              );
            })()}

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
                          onClick={() => openToothModal({ type: 'procedure', index })}
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
                // ✅ ตรวจสอบว่ามีผลการตรวจที่ยังไม่ได้บันทึกหรือไม่
                if (ioFindingListToInsert.length > 0) {
                  alert('กรุณาบันทึกผลการตรวจให้เรียบร้อยก่อนบันทึกการรักษา');
                  return;
                }
                
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

        {/* ให้ดัน content แยกกันในแนวบน-ล่าง (flexDirection: 'column') */}
        <div 
          style={{
            flex: 1,
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* ส่วนที่อยู่ชิดบน */}
          <div> 
            <div className="flex gap-2 mb-4" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <h2>แผนการรักษา</h2>
              <button
                onClick={() => {
                  setDisplayMode('planAndName');
                  setSelectedIoIdsToUpdateDateEnd([]);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: displayMode === 'planAndName' ? '#007bff' : '#eee',
                  color: displayMode === 'planAndName' ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',

                  marginLeft: '0.5rem',
                }}
              >
                ตาม I/O
              </button>
              <button
                onClick={() => {
                  setDisplayMode('planOnly');
                  setSelectedIoIdsToUpdateDateEnd([]);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: displayMode === 'planOnly' ? '#007bff' : '#eee',
                  color: displayMode === 'planOnly' ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                ตามแผน
              </button>
              <button
                onClick={() => {
                  setDisplayMode('byTooth');
                  setSelectedIoIdsToUpdateDateEnd([]);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: displayMode === 'byTooth' ? '#007bff' : '#eee',
                  color: displayMode === 'byTooth' ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                ตามซี่ฟัน
              </button>
            </div>


            {lastIoExams.length > 0 && (
              <>

                {displayMode === 'planAndName' && (
                  Object.entries(groupedByPlanAndName).map(([plan, items]) => (
                    <div key={plan}>
                      <h4 className="font-semibold text-md mb-1">🚨 {plan}</h4>
                      {Object.entries(items).map(([name, arr]) => (
                        <div key={name} className="ml-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                          - 
                          {arr.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => toggleIoSelectionToUpdateDateEnd(item.id)}
                              style={{
                                background: selectedIoIdsToUpdateDateEnd.includes(item.id) ? '#007bff' : '#eee',
                                color: selectedIoIdsToUpdateDateEnd.includes(item.id) ? 'white' : 'black',
                                border: 'none',
                                borderRadius: '5px',
                                padding: '2px 6px',
                                cursor: 'pointer',
                              }}
                            >
                              {item.toothSurface}
                            </button>
                          ))}
                          <span>{name}</span>
                        </div>
                      ))}
                    </div>
                  ))
                )}


                {displayMode === 'planOnly' && (
                  Object.entries(groupedByPlan).map(([plan, arr]) => (
                    <div key={plan}>
                      <div className="ml-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <div className="font-semibold text-md mb-1"><h4 style={{display: 'inline'}}>🚨 {plan}: </h4></div>
                        {arr.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => toggleIoSelectionToUpdateDateEnd(item.id)}
                            style={{
                              background: selectedIoIdsToUpdateDateEnd.includes(item.id) ? '#007bff' : '#eee',
                              color: selectedIoIdsToUpdateDateEnd.includes(item.id) ? 'white' : 'black',
                              border: 'none',
                              borderRadius: '5px',
                              padding: '2px 6px',
                              cursor: 'pointer',
                            }}
                          >
                            {`${item.tooth}${item.surface}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}

                {displayMode === 'byTooth' && (
                  Object.entries(groupedByTooth).map(([tooth, arr]) => (
                    <div key={tooth}>
                      <div className="font-semibold text-md mb-1" style={{marginTop: '0.25rem'}}><h4 style={{display: 'inline'}}>🚨 {tooth}</h4></div>
                      <div className="ml-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
                        {arr.map((item) => (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            - 
                            <button
                              key={item.id}
                              onClick={() => toggleIoSelectionToUpdateDateEnd(item.id)}
                              style={{
                                background: selectedIoIdsToUpdateDateEnd.includes(item.id) ? '#007bff' : '#eee',
                                color: selectedIoIdsToUpdateDateEnd.includes(item.id) ? 'white' : 'black',
                                border: 'none',
                                borderRadius: '5px',
                                padding: '2px 6px',
                                cursor: 'pointer',
                              }}
                            >
                              {item.io_finding_list.plan} {item.toothSurface ? `(${item.toothSurface})` : ''}
                            </button>
                            <span>- {item.io_finding_list.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}


              </>
            )}


            {selectedIoIdsToUpdateDateEnd.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <button
                  onClick={async () => {
                    try {
                      const payload = {
                        ids: selectedIoIdsToUpdateDateEnd,
                      };

                      const res = await fetch(`${API_URL}/io-exam-patient/update-multi-date-end`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(payload),
                      });

                      if (!res.ok) {
                        const data = await res.json();
                        alert(data.error || 'เกิดข้อผิดพลาดในการอัปเดต');
                        return;
                      }

                      alert('อัปเดต date_end เรียบร้อย');
                      setSelectedIoIdsToUpdateDateEnd([]);
                      await fetchLastIoExam();
                    } catch (err) {
                      console.error(err);
                      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์');
                    }
                  }}
                  style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  ✅ เสร็จสิ้น / ลบรายการ ({selectedIoIdsToUpdateDateEnd.length} รายการ)
                </button>
              </div>
            )}


            <h3>เพิ่มแผนการรักษา</h3>
            
            {/* แสดงแท็บหมวดหมู่ */}
            <div style={{ display: 'flex', flexWrap: 'wrap' , gap: '0.5rem' }}>
              {allPlan.map((plan) => (
                <button
                  key={plan}
                  onClick={() => setSelectedIoPlan((prev) => (prev === plan ? '' : plan))}
                  style={{
                    padding: '0.5rem 1rem',
                    background: selectedIoPlan === plan ? '#007bff' : '#eee',
                    color: selectedIoPlan === plan ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  {plan}
                </button>
              ))}
            </div>

            <div>
              {selectedIoPlan && (
                <div style={{ marginTop: '1rem' }}>
                  {availableIoFindingList
                    .filter((p) => p.plan?.trim() === selectedIoPlan)
                    .map((p) => (
                      <div
                        key={p.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1.5fr 1fr 0.5fr 1fr auto',
                          gap: '0.5rem',
                          alignItems: 'center',
                          padding: '0.25rem 0',
                        }}
                      >
                        <li>{p.name}</li>
                        <button
                          onClick={() =>
                            setIoFindingListToInsert((prev) => [
                              {
                                io_finding_id: p.id,
                                tooth: '',
                                surface: '',
                              },
                              ...prev,
                            ])
                          }
                          style={{ cursor: 'pointer' }}
                        >
                          ➕ เพิ่ม
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {ioFindingListToInsert.length > 0 && (
              <div>
                <h4>รายการผลการตรวจที่เลือก</h4>
                <div>
                  {ioFindingListToInsert.map((proc, index) => {
                    const name =
                      availableIoFindingList.find((p) => p.id === Number(proc.io_finding_id))?.name || '(ไม่พบ)';
                    const plan = 
                      availableIoFindingList.find((p) => p.id === Number(proc.io_finding_id))?.plan || '(ไม่พบ)';
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
                          <b>{plan} - {name}</b>
                        </div>

                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <label htmlFor={`tooth-${index}`}>ซี่ฟัน:</label>
                          <button
                            onClick={() => openToothModal({ type: 'io', index })}
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

                        {/* ✅ ปุ่มเลือกด้านฟัน */}
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {['O', 'M', 'D', 'I', 'B', 'Li'].map((side) => {
                            const current = ioFindingListToInsert[index].surface?.split(',') || [];
                            const isSelected = current.includes(side);

                            return (
                              <button
                                key={side}
                                onClick={() => {
                                  const updated = [...ioFindingListToInsert];
                                  const current = updated[index].surface?.split(',') || [];
                                  const has = current.includes(side);
                                  let newSurface = has
                                    ? current.filter((s) => s !== side)
                                    : [...current, side];

                                  const order = ['O', 'M', 'D', 'I', 'B', 'Li'];
                                  newSurface = order.filter((o) => newSurface.includes(o));
                                  updated[index].surface = newSurface.join(',');
                                  setIoFindingListToInsert(updated);
                                }}
                                style={{
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  border: '1px solid #aaa',
                                  background: isSelected ? '#007bff' : '#f0f0f0',
                                  color: isSelected ? '#fff' : '#000',
                                  fontWeight: 'bold',
                                  cursor: 'pointer'
                                }}
                              >
                                {side}
                              </button>
                            );
                          })}
                        </div>


                        <div>
                          <button
                            onClick={() => 
                              setIoFindingListToInsert((prev) => prev.filter((_, i) => i !== index))
                            }
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

            {ioFindingListToInsert.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <button
                  onClick={handleSaveIoFindings}
                  style={{
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  💾 บันทึกผลการตรวจ
                </button>
              </div>
            )}
          </div>

          {/* ส่วนที่อยู่ชิดล่าง */}
          <div>
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
              <h2>ประวัติการรักษา</h2>
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

                <div style={{ display: 'flex', gap: '2rem' }}>
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

          </div>
        </div>
      </div>
          <div style={{ marginTop: '1rem' }}>
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
                  <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>
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
                      {getIoPlansForVisit(v, visitHistoryIoDisplayMode)}{getContinueTxForVisit(v, visitHistoryIoDisplayMode)}
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
        {/* </div> */}
      {/* </div> */}
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