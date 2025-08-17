// 📁 frontend/src/pages/patient_my_plan.jsx
import React, { useEffect, useState, useMemo } from 'react';
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

export default function PatientMyPlan() {
  const [lastIoExams, setLastIoExams] = useState([]);
  const [activeContinueTx, setActiveContinueTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [displayMode, setDisplayMode] = useState('planOnly'); // 'planAndName' | 'planOnly' | 'byTooth'
  const [format, setFormat] = useState('by-date'); // 'by-date', 'by-tooth'
  const [quadrantToShow, setQuadrantToShow] = useState('Q1'); // 'Q1', 'Q2', 'Q3', 'Q4'

  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/liff_patient_select";
      return;
    }

    const fetchLastIoExamsAndConTx = async () => {
      try {
        // ดึงข้อมูลผู้ป่วยจาก token
        const meRes = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (meRes.data.role !== "patient") {
          alert("คุณไม่มีสิทธิ์เข้าหน้านี้");
          localStorage.removeItem("token");
          window.location.href = "/liff_patient_select";
          return;
        }

        setPatient(meRes.data.data);

        // ดึง io_exam ของผู้ป่วย
        const appRes = await axios.get(
          `${API_URL}/io-exam-patient/last/${meRes.data.data.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setLastIoExams(Array.isArray(appRes.data) ? appRes.data : []);

        // ดึง continue_tx ของผู้ป่วย
        const appRes2 = await axios.get(
          `${API_URL}/continue-tx-patient/last/${meRes.data.data.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setActiveContinueTx(Array.isArray(appRes2.data) ? appRes2.data : []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching io_exam", error);
        localStorage.removeItem("token");
        window.location.href = "/liff_patient_select";
      }
    };

    fetchLastIoExamsAndConTx();
  }, []);

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

      if (!grouped[tooth]) grouped[tooth] = {};
      if (!grouped[tooth][plan]) grouped[tooth][plan] = {};
      if (!grouped[tooth][plan][name]) grouped[tooth][plan][name] = [];
      
      grouped[tooth][plan][name].push({
        id: item.id,
        surface,
        toothSurface,
        io_finding_list: item.io_finding_list,
      });
    });

    // เรียง toothSurface ภายในแต่ละ group
    Object.keys(grouped).forEach(tooth => {
      if (grouped[tooth]) { // เพิ่มการตรวจสอบเพื่อป้องกัน error
        Object.keys(grouped[tooth]).forEach(plan => {
          if (grouped[tooth][plan]) { // เพิ่มการตรวจสอบเพื่อป้องกัน error
            Object.keys(grouped[tooth][plan]).forEach(name => {
              grouped[tooth][plan][name].sort((a, b) => getToothOrderIndex(a.toothSurface) - getToothOrderIndex(b.toothSurface));
            });
          }
        });
      }
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
  }, [activeContinueTx]);

  if (loading) return <p>กำลังโหลด...</p>;

  // Ensure patient data is available before rendering
  if (!patient) return <p>ไม่พบข้อมูลผู้ป่วย...</p>;

  return (
    <div style={{ padding: "1rem", maxWidth: "800px", margin: "0 auto" }}>
      <h2>📋 ผลการตรวจและแผนการรักษาของ {patient.first_name} {patient.last_name}</h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setDisplayMode('planOnly')}
          style={{
            padding: '0.5rem 1rem',
            background: displayMode === 'planOnly' ? '#007bff' : '#eee',
            color: displayMode === 'planOnly' ? 'white' : 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          แผนรักษา
        </button>
        <button
          onClick={() => setDisplayMode('planAndName')}
          style={{
            padding: '0.5rem 1rem',
            background: displayMode === 'planAndName' ? '#007bff' : '#eee',
            color: displayMode === 'planAndName' ? 'white' : 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          แผน & ผลตรวจ
        </button>
      </div>

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
          <div style={{ marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
            {textValue.trim()}
          </div>
        );
      })()}

      {displayMode === 'planAndName' && (() => {
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
          <div style={{ marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
            {textValue.trim()}
          </div>
        );
      })()}

      {displayMode === 'byTooth' && (() => {
        let textValue = '';

        Object.entries(groupedByTooth).forEach(([tooth, items]) => {
          textValue += `\n🚨 ${tooth}`;

          Object.entries(items).forEach(([plan, items]) => {
            Object.entries(items).forEach(([name, arr]) => {
              textValue += `\n- ${plan} (${arr.map(item => item.toothSurface).join(', ')}) - ${name}`;
            });
          });

        });

        return (
          <div style={{ marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
            {textValue.trim()}
          </div>
        );
      })()}

      
    </div>
  );
}