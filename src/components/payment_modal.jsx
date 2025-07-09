import React, { useState, useEffect } from 'react';
const API_URL = process.env.REACT_APP_API_URL;

export default function PaymentModal({
  isOpen,
  onClose,
  patient,
  queueId,
  onConfirmOnly,       // ✅ เพิ่ม
  onConfirmAndDelete   // ✅ เพิ่ม
}) {
  const [unpaidProcedures, setUnpaidProcedures] = useState([]);
  const [selectedProcedures, setSelectedProcedures] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([{ methodId: null, methodName: '', amount: '' }]);
  const [availableMethods, setAvailableMethods] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [noPaymentMethods, setNoPaymentMethods] = useState(false);

  const token = localStorage.getItem('token');

  const [loading, setLoading] = useState(false); // ✅ เพิ่ม loading state

  const resetPaymentForm = () => {
    if (availableMethods.length > 0) {
      setPaymentMethods([{
        methodId: availableMethods[0].id,
        methodName: availableMethods[0].method,
        amount: ''
      }]);
    } else {
      setPaymentMethods([{ methodId: null, methodName: '', amount: '' }]);
    }
    setSelectedProcedures([]);
    setUnpaidProcedures([]);
  };

  const refreshModalData = async () => {
    try {
      const res = await fetch(`${API_URL}/visit-procedures/unpaid/patient/${patient.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUnpaidProcedures(data.map(p => ({ ...p, id: Number(p.id) })));
      setSelectedProcedures(data.map((p) => Number(p.id)));
    } catch (err) {
      console.error('เกิดข้อผิดพลาดในการโหลดข้อมูล:', err);
      setUnpaidProcedures([]);
    }
  };

  useEffect(() => {
    if (!isOpen || !patient?.id) return;

    const fetchData = async () => {
      setLoading(true); // 👉 เริ่ม loading

      try {
        // 👉 รัน 2 fetch พร้อมกัน
        const [proceduresRes, methodsRes] = await Promise.all([
          fetch(`${API_URL}/visit-procedures/unpaid/patient/${patient.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/payment-methods`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        // 👉 ตรวจสอบว่า fetch สำเร็จทั้งสอง
        if (!proceduresRes.ok) throw new Error('ไม่สามารถโหลดข้อมูลหัตถการ');
        if (!methodsRes.ok) throw new Error('ไม่สามารถโหลดข้อมูลช่องทางการชำระเงิน');

        const proceduresData = await proceduresRes.json();
        const methodsData = await methodsRes.json();

        // 👉 เซ็ตข้อมูลหัตถการ
        setUnpaidProcedures(proceduresData.map(p => ({ ...p, id: Number(p.id) })));
        setSelectedProcedures(proceduresData.map(p => Number(p.id)));

        // 👉 เซ็ตช่องทางการชำระเงิน
        if (methodsData.length === 0) {
          setNoPaymentMethods(true);
          setAvailableMethods([]);
          setPaymentMethods([]);
        } else {
          setNoPaymentMethods(false);
          setAvailableMethods(methodsData.map((m) => ({ id: m.id, method: m.method })));
          setPaymentMethods([{
            methodId: methodsData[0].id,
            methodName: methodsData[0].method,
            amount: ''
          }]);
        }

        setErrorMessage('');
      } catch (err) {
        console.error('เกิดข้อผิดพลาด:', err);
        setErrorMessage('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        setUnpaidProcedures([]);
        setAvailableMethods([]);
        setPaymentMethods([]);
        setNoPaymentMethods(true);
      }

      setLoading(false); // 👉 หยุด loading
    };

    fetchData();
  }, [isOpen, patient?.id, token]);

  if (!isOpen) return null;

  const handleProcedureToggle = (id) => {
    setSelectedProcedures((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleMethodChange = (index, field, value) => {
    const updated = [...paymentMethods];
    if (field === 'methodId') {
      const found = availableMethods.find(m => m.id === Number(value));
      updated[index].methodId = found ? found.id : null;
      updated[index].methodName = found ? found.method : '';
    } else if (field === 'amount') {
      updated[index].amount = value;
    }
    setPaymentMethods(updated);
  };

  const handleAddMethod = () => {
    if (paymentMethods.length >= availableMethods.length) {
      setErrorMessage('ไม่สามารถเพิ่มช่องทางได้อีก');
      return;
    }

    const selectedIds = paymentMethods.map(pm => pm.methodId).filter(Boolean);
    const nextAvailable = availableMethods.find(m => !selectedIds.includes(m.id));

    if (nextAvailable) {
      setPaymentMethods([...paymentMethods, { methodId: nextAvailable.id, methodName: nextAvailable.method, amount: '' }]);
    } else {
      setErrorMessage('ไม่สามารถเพิ่มช่องทางได้อีก');
    }
  };

  const handleRemoveMethod = (index) => {
    setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
  };

  const totalSelectedPrice = unpaidProcedures
    .filter((p) => selectedProcedures.includes(p.id))
    .reduce((sum, p) => sum + Number(p.price || 0), 0);

  const totalPaid = paymentMethods.reduce((sum, m) => sum + Number(m.amount || 0), 0);

  const isValid = totalPaid === totalSelectedPrice && selectedProcedures.length > 0;
  const isValidSaveAndClose = totalPaid === totalSelectedPrice;

  const buildSequentialPayments = () => {
    const procedures = unpaidProcedures.filter(p => selectedProcedures.includes(p.id));
    const methods = paymentMethods.map(pm => ({ ...pm, remaining: Number(pm.amount || 0) }));
    const paymentsMap = new Map();

    for (const proc of procedures) {
      let remaining = Number(proc.price);

      for (const method of methods) {
        if (remaining <= 0) break;
        if (method.remaining <= 0) continue;

        const pay = Math.min(remaining, method.remaining);
        method.remaining -= pay;
        remaining -= pay;

        if (!paymentsMap.has(method.methodId)) {
          paymentsMap.set(method.methodId, []);
        }

        paymentsMap.get(method.methodId).push({ procedureId: proc.id, amount: pay });
      }
    }

    return Array.from(paymentsMap.entries()).map(([payment_method_id, details]) => ({ payment_method_id, details }));
  };

  const submitPayment = async (shouldDeleteQueue) => {
    const hasSelectedProcedures = selectedProcedures.length > 0;
    const payments = hasSelectedProcedures ? buildSequentialPayments() : [];

    const isAmountMatching = totalPaid === totalSelectedPrice;

    // 🛡️ ป้องกันกรณีเลือกหัตถการแต่ยอดไม่ตรง
    if (hasSelectedProcedures && !isAmountMatching) {
      setErrorMessage('กรุณาตรวจสอบจำนวนเงินให้ตรงกับยอดที่เลือก');
      return;
    }

    // ✅ ถ้ามีรายการ selected → ส่ง paid
    if (hasSelectedProcedures) {
      try {
        const res = await fetch(`${API_URL}/visit-procedures/mark-paid`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ payments }),
        });

        if (!res.ok) {
          const err = await res.json();
          setErrorMessage(err.error || 'ไม่สามารถอัปเดตสถานะ paid ได้');
          return;
        }
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ paid:', error);
        setErrorMessage('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        return;
      }
    }

    // ✅ ถ้าต้องลบ queue หลังบันทึก
    if (shouldDeleteQueue) {
      if (onConfirmAndDelete) onConfirmAndDelete();
    } else {
      if (onConfirmOnly) onConfirmOnly(); // เดิมยังปิด modal
      resetPaymentForm();                 // ✅ ล้างฟอร์มให้เหมือนใหม่
      await refreshModalData();           // ✅ โหลดข้อมูลใหม่
    }

    setErrorMessage('');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div style={overlayStyle}>
      <div style={contentStyle}>
        {loading ? (
          // ✅ ถ้า loading เป็น true → แสดงข้อความกำลังโหลด
          <div style={{ textAlign: 'center', padding: '1rem', fontWeight: 'bold' }}>
            ⏳ กำลังโหลดข้อมูล...
          </div>
        ) : (
          // ✅ ถ้า loading เสร็จ → แสดงเนื้อหา modal ปกติ
          <>
            {/* 👇 ส่วนเดิมทั้งหมดที่แสดง modal */}
            <h2>
              บันทึกการชำระเงิน – {patient?.first_name} {patient?.last_name} (HN {patient?.id})
            </h2>

            <h4>เลือกรายการหัตถการ</h4>
            <table border="1" cellPadding="6" style={{ width: '100%', marginBottom: '1rem', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f0f0f0' }}>
                <tr>
                  <th>วันที่</th>
                  <th>เลือก</th>
                  <th>ชื่อหัตถการ</th>
                  <th>ซี่ฟัน</th>
                  <th>ราคา</th>
                </tr>
              </thead>
              <tbody>
                {unpaidProcedures.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center' }}>ไม่พบรายการที่ค้างชำระ</td>
                  </tr>
                ) : (
                  unpaidProcedures.map((proc) => (
                    <tr key={proc.id}>
                      <td>{proc.visits?.visit_time ? formatDate(proc.visits.visit_time) : '-'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedProcedures.includes(proc.id)}
                          onChange={() => handleProcedureToggle(proc.id)}
                        />
                      </td>
                      <td>{proc.procedures?.name || '-'}</td>
                      <td>{proc.tooth || '-'}</td>
                      <td>{proc.price} บาท</td>
                    </tr>
                  ))
                )}
              </tbody>
              {unpaidProcedures.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'right', fontWeight: 'bold' }}>รวมราคาทั้งหมด:</td>
                    <td style={{ fontWeight: 'bold' }}>{unpaidProcedures.reduce((sum, p) => sum + Number(p.price || 0), 0)} บาท</td>
                  </tr>
                </tfoot>
              )}
            </table>

            <h4>ช่องทางชำระเงิน</h4>
            {noPaymentMethods ? (
              <div style={{ color: 'red', fontWeight: 'bold', padding: '1rem', border: '1px solid red', borderRadius: '5px' }}>
                ยังไม่มีข้อมูลช่องทางการชำระเงิน กรุณาเพิ่มข้อมูลช่องทางชำระเงินก่อนใช้งาน
              </div>
            ) : (
              <>
                {paymentMethods.map((m, idx) => {
                  const selectedInOthers = paymentMethods
                    .filter((_, i) => i !== idx)
                    .map((pm) => pm.methodId)
                    .filter(Boolean);

                  const optionsForThisSelect = availableMethods.filter(
                    (method) => !selectedInOthers.includes(method.id) || method.id === m.methodId
                  );

                  return (
                    <div key={idx} style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                      <select
                        value={m.methodId || ''}
                        onChange={(e) => handleMethodChange(idx, 'methodId', e.target.value)}
                      >
                        <option value="" disabled>-- เลือกช่องทาง --</option>
                        {optionsForThisSelect.map((methodOption) => (
                          <option key={methodOption.id} value={methodOption.id}>
                            {methodOption.method}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="จำนวนเงิน"
                        value={m.amount}
                        onChange={(e) => handleMethodChange(idx, 'amount', e.target.value)}
                      />
                      {paymentMethods.length > 1 && (
                        <button onClick={() => handleRemoveMethod(idx)}>ลบ</button>
                      )}
                    </div>
                  );
                })}

                {paymentMethods.length < availableMethods.length && (
                  <button onClick={handleAddMethod}>+ เพิ่มช่องทาง</button>
                )}
              </>
            )}

            <div style={{ marginTop: '1rem' }}>
              <strong>รวมยอดที่เลือก: {totalSelectedPrice} บาท</strong>
              <br />
              <strong>รวมยอดที่ชำระ: {totalPaid} บาท</strong>
            </div>

            {errorMessage && (
              <div style={{ color: 'red', marginTop: '0.5rem' }}>{errorMessage}</div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '1rem' }}>
              <button onClick={onClose}>ยกเลิก</button>
              <button
                onClick={() => submitPayment(false)}
                disabled={!isValid || noPaymentMethods}
              >
                ✅ บันทึกการชำระเงิน
              </button>
              <button
                onClick={() => submitPayment(true)}
                disabled={!isValidSaveAndClose || noPaymentMethods}
              >
                💾 บันทึกและส่งออก
              </button>  
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const contentStyle = {
  background: 'white',
  padding: '2rem',
  borderRadius: '10px',
  width: '80%',
  maxHeight: '90vh',
  overflowY: 'auto',
};
