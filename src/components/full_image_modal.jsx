import React from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const getUserRole = (token) => {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch (err) {
    console.error('ไม่สามารถอ่าน token:', err);
    return null;
  }
};

const FullImageModal = ({ imageId, imageUrl, onClose, onDeleteSuccess }) => {
  const token = localStorage.getItem('token');
  const role = getUserRole(token);
  if (!imageUrl) return null;

  const handleDeleteImage = async () => {
    if (!imageId) {
      console.error('ไม่มี imageId สำหรับลบรูปภาพ');
      alert('ไม่สามารถลบรูปภาพได้ เนื่องจากไม่มีข้อมูลรูปภาพ');
      return;
    }

    try {
      // ⚠️ ยืนยันการลบก่อน
      if (!window.confirm('คุณต้องการลบรูปภาพนี้ใช่หรือไม่?')) {
        return;
      }

      const response = await axios.delete(`${API_URL}/gcs/image/${imageId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      alert('ลบรูปภาพสำเร็จ');
      onDeleteSuccess(); // เรียก callback เพื่อรีเฟรชรูปภาพใน patient_detail
      onClose(); // ปิด Modal หลังจากลบสำเร็จ
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการลบรูปภาพ:', error);
      alert('เกิดข้อผิดพลาดในการลบรูปภาพ');
    }
  };

  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <img src={imageUrl} alt="Full Screen" style={styles.image} />
        <button onClick={() => { window.open(imageUrl, '_blank'); }} style={styles.openInNewTabButton}>
          เปิดในแท็บใหม่
        </button>
        <button onClick={onClose} style={styles.closeButton}>
          ปิด
        </button>
        {(role === 'staff' || role === 'admin') && (
          <>
            <button onClick={() => handleDeleteImage()} style={styles.deleteButton}>✏️ ลบรูปภาพ</button>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white', // 'transparent'
    padding: '1rem',
    borderRadius: '8px',
    maxWidth: '90%',
    maxHeight: '90%',
    overflow: 'auto',
    position: 'relative',
    width: '100%',       // 👈 ปรับขนาด
    height: '100%',      // 👈 ปรับขนาด
  },
  image: {
    display: 'block',
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    width: 'auto',       // 👈 เพิ่ม
    height: 'auto',      // 👈 เพิ่ม
    position: 'absolute', // 👈 เพิ่ม
    top: '50%',           // 👈 เพิ่ม
    left: '50%',          // 👈 เพิ่ม
    transform: 'translate(-50%, -50%)', // 👈 เพิ่ม
  },
  closeButton: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    zIndex: 1001,
  },
  openInNewTabButton: {
    position: 'absolute',
    top: '1rem',
    left: '1rem',
    background: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    zIndex: 1001,
    textDecoration: 'none', // ลบเส้นใต้
  },
  deleteButton: {
    position: 'absolute',
    bottom: '1rem',
    right: '1rem',
    background: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    zIndex: 1001,
    textDecoration: 'none', // ลบเส้นใต้
  },
};

export default FullImageModal;