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
  const [insuranceInputs, setInsuranceInputs] = useState({});
  const [savedInsurance, setSavedInsurance] = useState({});
  const [lockedDoctors, setLockedDoctors] = useState({});
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

  const handleInsuranceChange = (doctorId, date, value) => {
    setInsuranceInputs((prev) => ({
      ...prev,
      [`${doctorId}_${date}`]: value,
    }));
  };
  
  const handleSaveInsuranceAll = (doctorId, dailySummary) => {
    const newSaved = {};
    dailySummary.forEach((day) => {
      const key = `${doctorId}_${day.date}`;
      const value = insuranceInputs[key] || '0';
      newSaved[key] = value;
    });

    setSavedInsurance((prev) => ({
      ...prev,
      ...newSaved,
    }));

    setLockedDoctors((prev) => ({
      ...prev,
      [doctorId]: true,
    }));
  };

  const handleEditInsurance = (doctorId, dailySummary) => {
    setLockedDoctors((prev) => ({
      ...prev,
      [doctorId]: false,
    }));

    // เติมค่าเดิมกลับไปใน input เพื่อให้แก้ไขต่อได้
    const newInputs = {};
    dailySummary.forEach((day) => {
      const key = `${doctorId}_${day.date}`;
      newInputs[key] = savedInsurance[key] || '';
    });

    setInsuranceInputs((prev) => ({
      ...prev,
      ...newInputs,
    }));
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

                {doc.dailySummary && doc.dailySummary.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>สรุป DF รายวัน:</strong>
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        marginTop: '0.5rem',
                        border: '1px solid #ccc',
                      }}
                    >
                      <thead>
                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                          <th style={{ padding: '0.4rem', border: '1px solid #ccc' }}>วันที่</th>
                          <th style={{ padding: '0.4rem', border: '1px solid #ccc', textAlign: 'right' }}>DF (บาท)</th>
                          <th style={{ padding: '0.4rem', border: '1px solid #ccc', textAlign: 'center' }}>ประกัน (บาท)</th>
                          <th style={{ padding: '0.4rem', border: '1px solid #ccc', textAlign: 'right' }}>จ่ายจริง (บาท)</th>
                          <th style={{ padding: '0.4rem', border: '1px solid #ccc' }}>หมายเหตุ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doc.dailySummary.map((day, i) => {
                          // ตรวจสอบว่าวันนี้เป็นวันทำงานของหมอไหม (มีในตารางทำงาน)
                          const isWorkingDay = doc.workingDates.some((wd) => {
                            const wdDateStr = new Date(wd.start_time).toLocaleDateString('en-CA', {
                              timeZone: 'Asia/Bangkok',
                            });
                            return wdDateStr === day.date; // ตั้งค่า isWorkingDay เป็น true ถ้าวันนี้มีในตารางทำงาน และ false ถ้าไม่มี
                          });

                          // เติมค่าเริ่มต้นใน input ถ้ายังไม่มี
                          if (insuranceInputs[`${doc.doctorId}_${day.date}`] === undefined)
                          handleInsuranceChange(doc.doctorId, day.date, day.guaranteeIncome);

                          return (
                            <tr
                              key={i}
                              style={{
                                backgroundColor: isWorkingDay ? 'white' : '#ffe6e6',
                                fontWeight: isWorkingDay ? 'normal' : 'bold',
                              }}
                            >
                              <td style={{ padding: '0.4rem', border: '1px solid #ccc' }}>{day.date}</td>
                              <td style={{ padding: '0.4rem', border: '1px solid #ccc', textAlign: 'right' }}>
                                {Number(day.totalDF).toLocaleString()}
                              </td>
                              <td style={{ padding: '0.4rem', border: '1px solid #ccc', textAlign: 'center' }}>
                                {lockedDoctors[doc.doctorId] ? (
                                  <span>{Number(savedInsurance[`${doc.doctorId}_${day.date}`] || 0).toLocaleString()} บาท</span>
                                ) : (
                                  <input
                                    type="number"
                                    value={insuranceInputs[`${doc.doctorId}_${day.date}`] || ''}
                                    onChange={(e) => handleInsuranceChange(doc.doctorId, day.date, e.target.value)}
                                    style={{
                                      width: '100px',
                                      padding: '0.2rem',
                                      borderRadius: '4px',
                                      border: '1px solid #ccc',
                                      marginBottom: '0.2rem',
                                    }}
                                  />
                                )}
                              </td>
                              <td style={{ padding: '0.4rem', border: '1px solid #ccc', textAlign: 'right' }}>
                                {(() => {
                                  const df = Number(day.totalDF || 0);
                                  const key = `${doc.doctorId}_${day.date}`;
                                  const insurance = Number(savedInsurance[key] || insuranceInputs[key] || 0);
                                  const actual = Math.max(df, insurance);
                                  return actual.toLocaleString();
                                })()}
                              </td>
                              <td style={{ padding: '0.4rem', border: '1px solid #ccc' }}>
                                {!isWorkingDay && '⚠️ ไม่ได้ลงตารางทำงาน'}
                              </td>
                            </tr>
                          );
                        })}

                        <tr style={{ backgroundColor: '#e8f5e9', fontWeight: 'bold' }}>
                          <td style={{ padding: '0.4rem', border: '1px solid #ccc' }}>รวม</td>
                          <td style={{ padding: '0.4rem', border: '1px solid #ccc', textAlign: 'right' }}>
                            {doc.dailySummary.reduce((sum, day) => sum + Number(day.totalDF || 0), 0).toLocaleString()}
                          </td>
                          <td></td>
                          <td style={{ padding: '0.4rem', border: '1px solid #ccc', textAlign: 'right' }}>
                            {(() => {
                              return doc.dailySummary.reduce((sum, day) => {
                                const df = Number(day.totalDF || 0);
                                const key = `${doc.doctorId}_${day.date}`;
                                const insurance = Number(savedInsurance[key] || insuranceInputs[key] || 0);
                                return sum + Math.max(df, insurance);
                              }, 0).toLocaleString();
                            })()}
                          </td>
                          <td></td>
                        </tr>

                        {/* ✅ แถวปุ่มบันทึก */}
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'right', padding: '0.6rem' }}>
                            {lockedDoctors[doc.doctorId] ? (
                              <button
                                onClick={() => handleEditInsurance(doc.doctorId, doc.dailySummary)}
                                style={{
                                  fontSize: '1rem',
                                  padding: '0.4rem 1rem',
                                  backgroundColor: '#ffc107',
                                  color: '#000',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                }}
                              >
                                ✏️ แก้ไข
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSaveInsuranceAll(doc.doctorId, doc.dailySummary)}
                                style={{
                                  fontSize: '1rem',
                                  padding: '0.4rem 1rem',
                                  backgroundColor: '#007bff',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                }}
                              >
                                💾 บันทึก
                              </button>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

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
                            {item.visit_procedures.surface && (<>({item.visit_procedures.surface.replaceAll(',', '')})</>)}
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
