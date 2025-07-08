import React from 'react';

export default function ConfirmModal({
  visible,
  onClose,
  onConfirm,
  formData,
  formatThaiDate,
  calculateAge,
  idNumberValid,
}) {
  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: 8,
        padding: '1.5rem',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
      }}>
        <h3>ยืนยันข้อมูลคนไข้</h3>

        <p><strong>ชื่อ - นามสกุล:</strong> {formData.first_name} {formData.last_name}</p>
        <p><strong>เบอร์โทร:</strong> {formData.telephone || '-'}</p>
        <p>
          <strong>เลขบัตรประชาชน:</strong> {formData.id_number || '-'} <br />
          <span style={{ color: idNumberValid ? 'green' : 'red' }}>
            {idNumberValid ? 'เลขบัตรประชาชนถูกต้องตามรูปแบบ' : 'เลขบัตรประชาชนไม่ถูกต้องตามรูปแบบ'}
          </span>
        </p>
        <p><strong>วันเกิด:</strong> {formatThaiDate(formData.birth_day)}</p>
        <p><strong>อายุ:</strong> {calculateAge(formData.birth_day)} ปี</p>

        <div style={{ marginTop: '1rem', textAlign: 'right' }}>
          <button onClick={onClose} style={{ marginRight: 10 }}>ยกเลิก</button>
          <button onClick={onConfirm}>ยืนยันและลงทะเบียน</button>
        </div>
      </div>
    </div>
  );
}
