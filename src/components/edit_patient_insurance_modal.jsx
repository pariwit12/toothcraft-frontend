import React, { useState } from 'react';
import { INSURANCE_TYPE_LIST, INSURANCE_TYPE } from '../constants/insurance_type';
import { useEffect } from 'react';

export default function EditPatientInsuranceModal({ patient, onClose, onSave }) {
  const [insuranceType, setInsuranceType] = useState(patient.insurance_type || '');
  const [balance, setBalance] = useState(patient.insurance_balance || '');
  const [error, setError] = useState('');

  const GOLD_CARD_ID = INSURANCE_TYPE.GOLD_CARD.id;
  const SOCIAL_SECURITY_ID = INSURANCE_TYPE.SOCIAL_SECURITY.id;
  const isGoldCard = parseInt(insuranceType) === GOLD_CARD_ID;
  const requiresBalance = [GOLD_CARD_ID, SOCIAL_SECURITY_ID].includes(parseInt(insuranceType));

  // 🔵 useEffect สำหรับ reset ค่าเมื่อ patient เปลี่ยน
  useEffect(() => {
    setInsuranceType(patient.insurance_type || '');
    setBalance(patient.insurance_balance || '');
    setError('');
  }, [patient]);

  const handleSubmit = () => {
    if (!insuranceType) {
      setError('กรุณาเลือกสิทธิการรักษา');
      return;
    }

    if (requiresBalance && (balance === '' || isNaN(balance))) {
      setError('กรุณากรอกวงเงินคงเหลือ');
      return;
    }

    const updatedFields = {
      insurance_type: parseInt(insuranceType),
      insurance_balance: requiresBalance ? parseFloat(balance) : null,
    };

    onSave(updatedFields);
    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3>🏥 แก้ไขสิทธิการรักษา</h3>

        <div style={styles.field}>
          <label>สิทธิการรักษา:</label><br />
          <select
            value={insuranceType}
            onChange={(e) => {
              const value = e.target.value;
              setInsuranceType(value);
              setError('');

              // ล้าง balance ถ้าสิทธิไม่ต้องใช้วงเงิน
              const intValue = parseInt(value);
              if (intValue === GOLD_CARD_ID) {
                setBalance('2100'); // กำหนดค่าเริ่มต้นวงเงินบัตรทอง
              } else if (intValue === SOCIAL_SECURITY_ID) {
                setBalance('900');  // เคลียร์วงเงิน หรือกำหนดค่าเริ่มต้นถ้าต้องการ
              } else {
                setBalance('');  // สิทธิอื่น ๆ ไม่ต้องมีวงเงิน
              }
            }}
          >
            <option value="" disabled hidden>-- กรุณาเลือกสิทธิ --</option>
            {INSURANCE_TYPE_LIST.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </div>

        {requiresBalance && (
          <div style={styles.field}>
            <label>วงเงินคงเหลือ:</label><br />

            {isGoldCard ? (
              // ✅ ถ้าเป็นสิทธิบัตรทอง ให้เลือกจาก dropdown
              <select
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              >
                <option value="" disabled hidden>-- เลือกวงเงิน --</option>
                {[2100, 1400, 700, 0].map((amount) => (
                  <option key={amount} value={amount}>{amount.toLocaleString()} บาท (เหลือสิทธิ {amount/700} ครั้ง)</option>
                ))}
              </select>
            ) : (
              // ✅ ถ้าเป็นสิทธิอื่น (ประกันสังคม) ให้ใช้ input number
              <input
                type="number"
                value={balance}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (isNaN(value)) {
                    setBalance('');
                  } else if (value < 0) {
                    setBalance(0);
                  } else if (value > 900) {
                    setBalance(900);
                  } else {
                    setBalance(value);
                  }
                }}
                step="0.01"
                min={0}
                max={900}
                placeholder="ระบุจำนวนเงิน (0 - 900)"
              />
            )}
          </div>
        )}

        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

        <div style={styles.actions}>
          <button onClick={handleSubmit}>💾 บันทึก</button>
          <button onClick={onClose}>❌ ยกเลิก</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '10px',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
  },
  field: {
    marginBottom: '1rem'
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
    marginTop: '1.5rem'
  }
};
