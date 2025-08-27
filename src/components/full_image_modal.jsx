import React from 'react';

const FullImageModal = ({ imageUrl, onClose }) => {
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
};

export default FullImageModal;