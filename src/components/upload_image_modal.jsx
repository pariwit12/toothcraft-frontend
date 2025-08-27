// 📁 c:\Toothcraft\frontend\src\components\upload_image_modal.jsx

import React, { useState } from 'react';
import { DateTime } from 'luxon'; // 👈 Import Luxon

const API_URL = process.env.REACT_APP_API_URL;

export default function UploadImageModal({ patientId, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [isBackdate, setIsBackdate] = useState(false); // 👈 เพิ่ม state สำหรับ Checkbox อัปโหลดย้อนหลัง
  const [takenTime, setTakenTime] = useState(() => { // 👈 ปรับค่าเริ่มต้น
    const yesterday = DateTime.now().setZone('Asia/Bangkok').minus({ days: 1 }).toFormat('yyyy-MM-dd');
    return yesterday;
  });
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [errorDate, setErrorDate] = useState('');
  const [errorFile, setErrorFile] = useState('');
  const token = localStorage.getItem('token');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // ✅ เพิ่มการตรวจสอบชนิดไฟล์ที่นี่
      const allowedTypes = ['image/jpeg', 'image/heic', 'image/heif'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setErrorFile('ชนิดไฟล์ไม่ถูกต้อง อนุญาตเฉพาะไฟล์ JPEG หรือ HEIC');
        setFile(null); // ทำให้ค่า file เป็น null เพื่อให้ปุ่มอัปโหลดถูก disable
      } else {
        setFile(selectedFile);
        setErrorFile(''); // ล้างข้อความ error ถ้าไฟล์ถูกต้อง
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorFile('กรุณาเลือกไฟล์ก่อนอัปโหลด');
      return;
    }

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_id', patientId);

    // ✅ ส่ง taken_time เฉพาะเมื่อ isBackdate เป็น true
    if (isBackdate) {
      formData.append('taken_time', DateTime.fromFormat(takenTime, 'yyyy-MM-dd').toISO());
    }

    try {
      const res = await fetch(`${API_URL}/gcs/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'อัปโหลดไฟล์ไม่สำเร็จ');
      }

      alert('อัปโหลดไฟล์สำเร็จ');
      onUploadSuccess(); // เรียกฟังก์ชันเพื่อโหลดรูปภาพใหม่
      onClose(); // ปิด Modal
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ✅ ฟังก์ชันตรวจสอบวันที่
  const isDateValid = (dateString) => {
    // สร้าง DateTime Object โดยระบุ Timezone
    const selectedDate = DateTime.fromFormat(dateString, 'yyyy-MM-dd', { zone: 'Asia/Bangkok' });
    const today = DateTime.now().setZone('Asia/Bangkok').startOf('day');

    if (!selectedDate.isValid) {
      return false; // ไม่ใช่รูปแบบวันที่ที่ถูกต้อง
    }

    if (selectedDate >= today) {
      return false; // เป็นวันที่ปัจจุบัน หรือ อนาคต
    }

    return true; // เป็นวันที่ถูกต้อง (อดีต)
  };

  return (
    <div style={styles.modalBackdrop}>
      <div style={styles.modalContent}>
        <h3>อัปโหลดภาพ X-Ray</h3>
        <div style={styles.formGroup}>
          <label>เลือกไฟล์ภาพ:</label>
          {/* ✅ ปรับ accept เพื่อให้เบราว์เซอร์ช่วยกรองไฟล์เบื้องต้น */}
          <input type="file" accept=".jpg,.jpeg,.heic" onChange={handleFileChange} />
        </div>

        <div style={styles.formGroup}>
          <label>
            <input
              type="checkbox"
              checked={isBackdate}
              onChange={(e) => {
                setIsBackdate(e.target.checked);
                if (errorDate) {
                  setTakenTime(() => { // 👈 ปรับค่าเริ่มต้น
                    const yesterday = DateTime.now().setZone('Asia/Bangkok').minus({ days: 1 }).toFormat('yyyy-MM-dd');
                    return yesterday;
                  });
                  setErrorDate(''); // ล้าง error เมื่อเปลี่ยนสถานะ Checkbox เป็นปัจจุบัน
                }
              }}
            />
            อัปโหลดย้อนหลัง
          </label>
        </div>

        {/* ✅ แสดงช่องใส่เวลาเฉพาะเมื่อ isBackdate เป็น true */}
        {isBackdate && (
          <div style={styles.formGroup}>
            <label>วันที่ถ่ายภาพ:</label>
            <input
              type="date"
              value={takenTime}
              onChange={(e) => {
                const newDate = e.target.value;
                if (isDateValid(newDate)) {
                  setTakenTime(newDate);
                  setErrorDate('');
                } else {
                  setTakenTime(newDate);
                  setErrorDate('กรุณาเลือกวันที่ให้ถูกต้อง (อดีตเท่านั้น)');
                }
              }}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
        )}

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {errorDate && <p style={{ color: 'red' }}>{errorDate}</p>}
        {errorFile && <p style={{ color: 'red' }}>{errorFile}</p>}
        <div style={styles.buttonGroup}>
          <button onClick={onClose} disabled={isUploading}>
            ยกเลิก
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || !!errorDate || !!errorFile || !file} // ปรับ disabled เพื่อป้องกันการกดปุ่มถ้าไม่มีไฟล์หรือมี error
          >
            {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px',
  },
  formGroup: {
    marginBottom: '1rem',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginTop: '1.5rem',
  },
};