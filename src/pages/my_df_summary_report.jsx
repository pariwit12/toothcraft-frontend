// 📁 frontend/src/pages/my_df_summary_report.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MyDfSummaryReport() {
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
        `http://localhost:3000/money-received/my-df-summary?start=${startDate}&end=${endDate}`,
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
      <h2>รายงาน DF ของคุณ</h2>

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
          onClick={() => navigate('/dashboard/doctor')}
          style={{ marginLeft: '1rem' }}
        >
          🔙 กลับหน้าหลัก
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>เกิดข้อผิดพลาด: {error}</div>
      )}

      {reportData && (
        <>
          <p>
            รายงานตั้งแต่ {startDate} ถึง {endDate} <br />
            จำนวนรายการ: {reportData.count} | DF รวม: {reportData.totalDF.toLocaleString(undefined, { minimumFractionDigits: 2 })} บาท
          </p>

          {reportData.items.length === 0 ? (
            <p style={{ textAlign: 'center' }}>ไม่มีข้อมูล</p>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid #ccc',
              }}
            >
              <thead style={{ backgroundColor: '#f0f0f0' }}>
                <tr>
                  <th style={{ padding: '0.5rem' }}>วันที่</th>
                  <th style={{ padding: '0.5rem' }}>HN</th>
                  <th style={{ padding: '0.5rem' }}>ชื่อผู้ป่วย</th>
                  <th style={{ padding: '0.5rem' }}>หัตถการ</th>
                  <th style={{ padding: '0.5rem' }}>ฟัน</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>จำนวนเงิน</th>
                  <th style={{ padding: '0.5rem' }}>ช่องทาง</th>
                  <th style={{ padding: '0.5rem' }}>DF (%)</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>DF (บาท)</th>
                </tr>
              </thead>
              <tbody>
                {reportData.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '0.5rem' }}>{new Date(item.date_paid).toLocaleDateString('th-TH')}</td>
                    <td style={{ padding: '0.5rem' }}>{item.visit_procedures?.visits?.patient_id || '-'}</td>
                    <td style={{ padding: '0.5rem' }}>{`${item.visit_procedures?.visits?.patients?.first_name || ''} ${item.visit_procedures?.visits?.patients?.last_name || ''}`.trim()}</td>
                    <td style={{ padding: '0.5rem' }}>{item.visit_procedures?.procedures?.name || '-'}</td>
                    <td style={{ padding: '0.5rem' }}>{item.visit_procedures?.tooth || '-'}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{Number(item.amount).toLocaleString()}</td>
                    <td style={{ padding: '0.5rem' }}>{item.payment_methods?.method || '-'}</td>
                    <td style={{ padding: '0.5rem' }}>{item.fee_percent ? `${item.fee_percent}%` : '-'}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                      {item.fee_percent ? ((item.amount * item.fee_percent) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#f9f9f9', fontWeight: 'bold' }}>
                  <td colSpan="5" style={{ padding: '0.5rem', textAlign: 'right' }}>รวมทั้งหมด:</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                    {reportData.items
                      .reduce((sum, item) => sum + Number(item.amount || 0), 0)
                      .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                  <td></td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                    {reportData.items
                      .reduce((sum, item) =>
                        sum + (item.fee_percent ? (item.amount * item.fee_percent) / 100 : 0), 0
                      ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </>
      )}
    </div>
  );
}
