// 📁 frontend/src/pages/money_received_report.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
const API_URL = process.env.REACT_APP_API_URL;

function SummaryModal({ isOpen, onClose, summaryData, startDate, endDate }) {
  if (!isOpen) return null;

  const { methods = {}, total = 0, df = 0 } = summaryData || {};

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const dateRangeText =
    startDate === endDate
      ? formatDate(startDate)
      : `${formatDate(startDate)} - ${formatDate(endDate)}`;

  const hasData = Object.keys(methods).length > 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        }}
      >
        <h2>สรุปรวมรายรับวันที่ ({dateRangeText})</h2>

        {hasData ? (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ccc' }}>
                  <th style={{ textAlign: 'left', padding: '8px' }}>ช่องทาง</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(methods).map(([method, sum]) => (
                  <tr key={method} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{method}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{sum.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid #000', fontWeight: 'bold' }}>
                  <td style={{ padding: '8px' }}>รวม</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>

            {df > 0 && (
              <h3 style={{ marginTop: '1rem' }}>รวม DF ทั้งหมด: {df.toLocaleString()} บาท</h3>
            )}
          </>
        ) : (
          <p style={{ textAlign: 'center', marginTop: '2rem', fontStyle: 'italic' }}>
            ไม่มีรายการ
          </p>
        )}

        <button onClick={onClose} style={{ marginTop: '1.5rem' }}>
          ปิด
        </button>
      </div>
    </div>
  );
}

export default function MoneyReceivedReport() {
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok'});

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [reportData, setReportData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const fetchData = async () => {
    if (!startDate || !endDate) {
      alert('กรุณาระบุวันที่เริ่มต้นและสิ้นสุด');
      return false;
    }

    try {
      const res = await fetch(
        `${API_URL}/money-received/by-date-range?start=${startDate}&end=${endDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setReportData(data.items || []);

      // คำนวณสรุป
      const methods = {};
      let total = 0;
      let df = 0;

      (data.items || []).forEach((item) => {
        const method = item.payment_methods?.method || 'ไม่ระบุ';
        const amount = Number(item.amount || 0);
        const fee = ((item.fee_percent || 0) * amount) / 100;

        methods[method] = (methods[method] || 0) + amount;
        total += amount;
        df += fee;
      });

      setSummaryData({ methods, total, df });
      return true;
    } catch (err) {
      console.error('เกิดข้อผิดพลาดในการโหลดข้อมูล:', err);
      alert('โหลดข้อมูลไม่สำเร็จ');
      return false;
    }
  };

  const onClickSummary = async () => {
    const success = await fetchData();
    if (success) {
      setIsSummaryOpen(true);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>รายงานรายการเงินรับ</h2>
      <div style={{ marginBottom: '1rem' }}>
        <label>วันที่เริ่มต้น: </label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <label style={{ marginLeft: '1rem' }}>ถึง: </label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button onClick={fetchData} style={{ marginLeft: '1rem' }}>🔍 ค้นหา</button>

        <button
          onClick={onClickSummary}
          style={{ marginLeft: '1rem' }}
        >
          📊 ดูสรุป
        </button>

        <button onClick={() => navigate('/dashboard/staff')} style={{ marginLeft: '1rem' }}>
          🔙 กลับหน้าหลัก
        </button>
      </div>

      <table border="1" cellPadding="8" style={{ width: '100%', marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>วันที่</th>
            <th>HN</th>
            <th>ชื่อผู้ป่วย</th>
            <th>หัตถการ</th>
            <th>ฟัน</th>
            <th>จำนวนเงิน</th>
            <th>ช่องทาง</th>
            <th>หมอ</th>
            <th>DF</th>
          </tr>
        </thead>
        <tbody>
          {reportData.length === 0 ? (
            <tr>
              <td colSpan="9" align="center">ไม่มีข้อมูล</td>
            </tr>
          ) : (
            reportData.map((item, index) => (
              <tr key={index}>
                <td>{new Date(item.date_paid).toLocaleString('th-TH')}</td>
                <td>{item.visit_procedures.visits.patients.id}</td>
                <td>{item.visit_procedures.visits.patients.first_name} {item.visit_procedures.visits.patients.last_name}</td>
                <td>{item.visit_procedures.procedures.name}</td>
                <td>{item.visit_procedures.tooth || '-'}</td>
                <td>{Number(item.amount).toLocaleString()} บาท</td>
                <td>{item.payment_methods?.method || '-'}</td>
                <td>{item.visit_procedures.visits.doctors
                  ? `${item.visit_procedures.visits.doctors.first_name} ${item.visit_procedures.visits.doctors.last_name}`
                  : '-'}</td>
                <td>
                  {Number(((item?.fee_percent || 0) * (item?.amount || 0)) / 100).toLocaleString()} บาท
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <SummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        summaryData={summaryData}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
}
