// 📁 frontend/src/pages/patient_appointments.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

export default function PatientMyVisitProcedures() {
  const [visitProcedures, setVisitProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
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

    const fetchVisitProcedures = async () => {
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

        // ดึง visit_procedures ของผู้ป่วย
        const appRes = await axios.get(
          `${API_URL}/visit-procedures/${meRes.data.data.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setVisitProcedures(Array.isArray(appRes.data) ? appRes.data : []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching visit_procedures", error);
        localStorage.removeItem("token");
        window.location.href = "/liff_patient_select";
      }
    };

    fetchVisitProcedures();
  }, []);

  if (loading) return <p>กำลังโหลด...</p>;

  // 🗂 Group ข้อมูลตามวันที่ visit_time
  const groupedByDate = visitProcedures.reduce((acc, vp) => {
    const dateKey = new Date(vp.visits.visit_time)
      .toLocaleDateString("th-TH", { timeZone: 'Asia/Bangkok',});
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(vp);
    return acc;
  }, {});

  return (
    <div style={{ padding: "1rem", maxWidth: "800px", margin: "0 auto" }}>
      <h2>📋 ประวัติหัตถการรักษาของ {patient.first_name} {patient.last_name}</h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setFormat('by-date')}
          style={{
            padding: '0.5rem 1rem',
            background: format === 'by-date' ? '#007bff' : '#eee',
            color: format === 'by-date' ? 'white' : 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          ดูทั้งหมด
        </button>
        <button
          onClick={() => setFormat('by-tooth')}
          style={{
            padding: '0.5rem 1rem',
            background: format === 'by-tooth' ? '#007bff' : '#eee',
            color: format === 'by-tooth' ? 'white' : 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          ดูตามซี่ฟัน
        </button>
      </div>

      {format === 'by-date' && (
        Object.keys(groupedByDate).length === 0 ? (
          <p>ไม่มีข้อมูลหัตถการ</p>
        ) : (
          Object.keys(groupedByDate).map((date) => (
            <div key={date} style={{ marginBottom: "1rem" }}>
              <h3 style={{ background: "#f0f0f0", padding: "0.5rem" }}>{date}</h3>
              <table border="1" width="100%" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th width="15%">เวลา</th>
                    <th width="40%">หัตถการ</th>
                    <th width="10%">ซี่ฟัน</th>
                    <th width="25%">หมอ</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedByDate[date].map((vp) => (
                    <tr key={vp.id}>
                      <td>
                        {new Date(vp.visits.visit_time).toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                      </td>
                      <td>{vp.procedures?.name || "-"}</td>
                      <td>{vp.tooth || "-"}</td>
                      <td>
                        {vp.visits.doctors
                          ? `${vp.visits.doctors.first_name} (${vp.visits.doctors.nickname})`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )
      )}

      {format === 'by-tooth' && (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: "1rem" }}>
            {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
              <button
                key={q}
                style={{
                  padding: '0.5rem 1rem',
                  background: quadrantToShow === q ? '#007bff' : '#eee',
                  color: quadrantToShow === q ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
                onClick={() => setQuadrantToShow(q)}
              >
                {q}
              </button>
            ))}
          </div>

          {/* สร้างข้อมูลซี่ใน Quadrant */}
          {(() => {
            const quadrantTeeth = {
              Q1: [11, 12, 13, 14, 15, 16, 17, 18],
              Q2: [21, 22, 23, 24, 25, 26, 27, 28],
              Q3: [31, 32, 33, 34, 35, 36, 37, 38],
              Q4: [41, 42, 43, 44, 45, 46, 47, 48],
            };

            // mapping คำอธิบายแต่ละซี่ (FDI Notation)
            const toothDescriptions = {
              // Quadrant 1 (ขวาบน)
              11: "ฟันหน้าตัดซี่กลาง",
              12: "ฟันหน้าตัดซี่ข้าง",
              13: "ฟันเขี้ยว",
              14: "ฟันกรามน้อยซี่แรก",
              15: "ฟันกรามน้อยซี่ที่สอง",
              16: "ฟันกรามซี่แรก",
              17: "ฟันกรามซี่ที่สอง",
              18: "ฟันกรามซี่ที่สาม",

              // Quadrant 2 (ซ้ายบน)
              21: "ฟันหน้าตัดซี่กลาง",
              22: "ฟันหน้าตัดซี่ข้าง",
              23: "ฟันเขี้ยว",
              24: "ฟันกรามน้อยซี่แรก",
              25: "ฟันกรามน้อยซี่ที่สอง",
              26: "ฟันกรามซี่แรก",
              27: "ฟันกรามซี่ที่สอง",
              28: "ฟันกรามซี่ที่สาม",

              // Quadrant 3 (ซ้ายล่าง)
              31: "ฟันหน้าตัดซี่กลาง",
              32: "ฟันหน้าตัดซี่ข้าง",
              33: "ฟันเขี้ยว",
              34: "ฟันกรามน้อยซี่แรก",
              35: "ฟันกรามน้อยซี่ที่สอง",
              36: "ฟันกรามซี่แรก",
              37: "ฟันกรามซี่ที่สอง",
              38: "ฟันกรามซี่ที่สาม",

              // Quadrant 4 (ขวาล่าง)
              41: "ฟันหน้าตัดซี่กลาง",
              42: "ฟันหน้าตัดซี่ข้าง",
              43: "ฟันเขี้ยว",
              44: "ฟันกรามน้อยซี่แรก",
              45: "ฟันกรามน้อยซี่ที่สอง",
              46: "ฟันกรามซี่แรก",
              47: "ฟันกรามซี่ที่สอง",
              48: "ฟันกรามซี่ที่สาม",
            };

            const teethInQuadrant = quadrantTeeth[quadrantToShow] || [];

            return (
              <>
                {quadrantToShow === 'Q1' && (
                  <h3>Quadrant 1 (ขวาบน)</h3>
                )}
                {quadrantToShow === 'Q2' && (
                  <h3>Quadrant 2 (ซ้ายบน)</h3>
                )}
                {quadrantToShow === 'Q3' && (
                  <h3>Quadrant 3 (ซ้ายล่าง)</h3>
                )}
                {quadrantToShow === 'Q4' && (
                  <h3>Quadrant 4 (ขวาล่าง)</h3>
                )}

                <table border="1" width="100%" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th>ซี่ฟัน</th>
                      <th>คำอธิบาย</th>
                      <th>ดูประวัติ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teethInQuadrant.map((tooth) => (
                      <tr key={tooth}>
                        <td>{tooth}</td>
                        <td>{toothDescriptions[tooth] || "-"}</td>
                        <td>
                          <button
                            onClick={() => {
                              const history = visitProcedures.filter(
                                (vp) => vp.tooth == tooth
                              );
                              setModalData(history);
                              setShowModal(true);
                            }}
                          >
                            ดูประวัติ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            );
          })()}
        </div>
      )}

      {/* Modal แสดงประวัติ */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            overflowY: "auto",
            padding: "1rem",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "1rem",
              maxWidth: "600px",
              width: "100%",
            }}
          >
            <h2 style={{ display: 'inline', marginRight: '1rem' }}>ประวัติหัตถการรักษา</h2>
            <button
              onClick={() => setShowModal(false)}
              style={{
                padding: '0.5rem 1rem',
                background: '#eee',
                color: 'black',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              ปิด
            </button>
            {modalData.length > 0 ? (
              (() => {
                // 🗂 Group ข้อมูลใน modal ตามวันที่ เหมือน format === 'by-date'
                const groupedModalData = modalData.reduce((acc, vp) => {
                  const dateKey = new Date(vp.visits.visit_time)
                    .toLocaleDateString("th-TH", { timeZone: 'Asia/Bangkok' });
                  if (!acc[dateKey]) acc[dateKey] = [];
                  acc[dateKey].push(vp);
                  return acc;
                }, {});

                return Object.keys(groupedModalData).map((date) => (
                  <div key={date} style={{ marginBottom: "1rem" }}>
                    <h3 style={{ background: "#f0f0f0", padding: "0.5rem" }}>{date}</h3>
                    <table border="1" width="100%" style={{ borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th width="15%">เวลา</th>
                          <th width="40%">หัตถการ</th>
                          <th width="10%">ซี่ฟัน</th>
                          <th width="25%">หมอ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedModalData[date]
                          .sort((a, b) => new Date(b.visits.visit_time) - new Date(a.visits.visit_time))
                          .map((vp) => (
                            <tr key={vp.id}>
                              <td>
                                {new Date(vp.visits.visit_time).toLocaleTimeString("th-TH", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                })}
                              </td>
                              <td>{vp.procedures?.name || "-"}</td>
                              <td>{vp.tooth || "-"}</td>
                              <td>
                                {vp.visits.doctors
                                  ? `${vp.visits.doctors.first_name} (${vp.visits.doctors.nickname})`
                                  : "-"}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ));
              })()
            ) : (
              <p>ไม่มีประวัติหัตถการรักษาของฟันซี่นี้</p>
            )}
            <button
              onClick={() => setShowModal(false)}
              style={{
                padding: '0.5rem 1rem',
                background: '#eee',
                color: 'black',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              ปิด
            </button>
          </div>
        </div>
      )}

    </div>
  );
}