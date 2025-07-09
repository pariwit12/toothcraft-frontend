// 📁 frontend/src/pages/df_summary_report.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
const API_URL = process.env.REACT_APP_API_URL;

export default function DfSummaryReport() {
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok'});

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      alert('กรุณาระบุวันที่เริ่มต้นและสิ้นสุด');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_URL}/money-received/by-date-range-group-by-doctor?start=${startDate}&end=${endDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }

      const data = await res.json();
      setReportData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>รายงานสรุป DF</h2>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          วันที่เริ่มต้น:{' '}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label style={{ marginLeft: '1rem' }}>
          วันที่สิ้นสุด:{' '}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
        <button
          onClick={fetchReport}
          style={{ marginLeft: '1rem' }}
          disabled={loading}
        >
          {loading ? 'กำลังโหลด...' : '🔍 ค้นหา'}
        </button>

        <button
          onClick={() => navigate('/dashboard/staff')}
          style={{ marginLeft: '1rem' }}
        >
          🔙 กลับหน้าหลัก
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          เกิดข้อผิดพลาด: {error}
        </div>
      )}

      {reportData && (
        <>
          <p>
            รายงานตั้งแต่ {startDate} ถึง {endDate} <br />
            จำนวนหมอที่มีรายงาน: {reportData.countDoctors}
          </p>

          {reportData.doctors.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '1rem' }}>ไม่มีข้อมูล</p>
          ) : (
            reportData.doctors.map((doc) => (
              <div key={doc.doctorId} style={{ marginBottom: '3rem' }}>
                {/* ตารางสรุปของหมอแต่ละคน */}
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    border: '1px solid #ddd',
                    marginBottom: '1rem',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: '#f5f5f5',
                        borderBottom: '1px solid #ddd',
                        textAlign: 'left',
                      }}
                    >
                      <th style={{ padding: '0.5rem 1rem' }}>ชื่อหมอ</th>
                      <th style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>DF รวม (บาท)</th>
                      <th style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>
                        จำนวนรายการเงินรับ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.5rem 1rem' }}>{doc.doctorName || '-'}</td>
                      <td style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>
                        {doc.totalDF.toFixed(2).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>
                        {doc.moneyReceivedItems.length}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* ตารางแสดงรายการ money_received ของหมอคนนั้น */}
                <h4>รายการเงินรับของ {doc.doctorName || '-'}</h4>
                {doc.moneyReceivedItems.length === 0 ? (
                  <p style={{ fontStyle: 'italic' }}>ไม่มีรายการเงินรับ</p>
                ) : (
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      border: '1px solid #ccc',
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: '#fafafa' }}>
                        <th style={{ padding: '0.4rem 0.8rem', borderBottom: '1px solid #ddd' }}>วันที่</th>
                        <th style={{ padding: '0.4rem 0.8rem', borderBottom: '1px solid #ddd' }}>HN</th>
                        <th style={{ padding: '0.4rem 0.8rem', borderBottom: '1px solid #ddd' }}>ชื่อผู้ป่วย</th>
                        <th style={{ padding: '0.4rem 0.8rem', borderBottom: '1px solid #ddd' }}>หัตถการ</th>
                        <th style={{ padding: '0.4rem 0.8rem', borderBottom: '1px solid #ddd' }}>ฟัน</th>
                        <th style={{ padding: '0.4rem 0.8rem', borderBottom: '1px solid #ddd', textAlign: 'right' }}>จำนวนเงิน</th>
                        <th style={{ padding: '0.4rem 0.8rem', borderBottom: '1px solid #ddd' }}>ช่องทาง</th>
                        <th style={{ padding: '0.4rem 0.8rem', borderBottom: '1px solid #ddd' }}>DF (%)</th>
                        <th style={{ padding: '0.4rem 0.8rem', borderBottom: '1px solid #ddd', textAlign: 'right' }}>DF (บาท)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doc.moneyReceivedItems.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '0.4rem 0.8rem' }}>
                            {item.date_paid ? new Date(item.date_paid).toLocaleDateString('th-TH') : '-'}
                          </td>
                          <td style={{ padding: '0.4rem 0.8rem' }}>
                            {item.visit_procedures?.visits?.patient_id || '-'}
                          </td>
                          <td style={{ padding: '0.4rem 0.8rem' }}>
                            {item.visit_procedures?.visits?.patients
                              ? `${item.visit_procedures.visits.patients.first_name} ${item.visit_procedures.visits.patients.last_name}`
                              : '-'}
                          </td>
                          <td style={{ padding: '0.4rem 0.8rem' }}>
                            {item.visit_procedures?.procedures?.name || '-'}
                          </td>
                          <td style={{ padding: '0.4rem 0.8rem' }}>
                            {item.visit_procedures?.tooth || '-'}
                          </td>
                          <td style={{ padding: '0.4rem 0.8rem', textAlign: 'right' }}>
                            {Number(item.amount).toLocaleString()}
                          </td>
                          <td style={{ padding: '0.4rem 0.8rem' }}>
                            {item.payment_methods?.method || '-'}
                          </td>
                          <td style={{ padding: '0.4rem 0.8rem' }}>
                            {item.fee_percent ? `${item.fee_percent}%` : '-'}
                          </td>
                          <td style={{ padding: '0.4rem 0.8rem', textAlign: 'right' }}>
                            {item.fee_percent
                              ? Number((item.fee_percent * item.amount) / 100).toLocaleString()
                              : '0'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: '#f9f9f9', fontWeight: 'bold' }}>
                        <td colSpan="5" style={{ padding: '0.5rem 0.8rem', textAlign: 'right' }}>
                          รวมทั้งหมด:
                        </td>
                        <td style={{ padding: '0.5rem 0.8rem', textAlign: 'right' }}>
                          {doc.moneyReceivedItems
                            .reduce((sum, item) => sum + Number(item.amount || 0), 0)
                            .toLocaleString()}
                        </td>
                        <td></td>
                        <td></td>
                        <td style={{ padding: '0.5rem 0.8rem', textAlign: 'right' }}>
                          {doc.moneyReceivedItems
                            .reduce((sum, item) =>
                              sum + (item.fee_percent ? (item.amount * item.fee_percent) / 100 : 0), 0
                            ).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
