import React, { useState } from 'react';

const UPPER_TEETH = [
  '18', '17', '16', '15', '14', '13', '12', '11',
  '21', '22', '23', '24', '25', '26', '27', '28',
];

const MILK_UPPER_TEETH = [
  '55', '54', '53', '52', '51',
  '61', '62', '63', '64', '65',
];

const MILK_LOWER_TEETH = [
  '85', '84', '83', '82', '81',
  '71', '72', '73', '74', '75',
];

const LOWER_TEETH = [
  '48', '47', '46', '45', '44', '43', '42', '41',
  '31', '32', '33', '34', '35', '36', '37', '38',
];

export default function ToothSelectModal({ isOpen, onClose, onSelect }) {
  const [selected, setSelected] = useState('');

  const mapToCode = (value) => {
    if (/^sectant-(\d)$/.test(value)) return 'S' + value.split('-')[1];
    if (/^quadrant-(\d)$/.test(value)) return 'Q' + value.split('-')[1];
    if (value === 'upper') return 'U';
    if (value === 'lower') return 'L';
    if (value === 'fullmouth') return 'FM';
    if (value === 'mesiodens') return 'MD';
    if (value === 'gingiva') return 'GV';
    return value;
  };

  const handleConfirm = () => {
    if (selected) {
      const mapped = mapToCode(selected);
      onSelect(mapped);
      setSelected('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '1rem',
        width: '90vw',
        maxWidth: '1000px',
        textAlign: 'center',
      }}>

        <h2 style={{ marginBottom: '1rem' }}>เลือกซี่ฟัน</h2>

        {/* ฟันบน */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(16, 1fr)',
            gap: '0.3rem',
            marginBottom: '0.5rem',
          }}>
            {UPPER_TEETH.map((tooth) => (
              <button
                key={tooth}
                onClick={() => setSelected(tooth)}
                style={{
                  padding: '0.4rem 0',
                  fontSize: '0.85rem',
                  backgroundColor: selected === tooth ? '#007bff' : '#eee',
                  color: selected === tooth ? 'white' : 'black',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  cursor: 'pointer',
                }}
              >
                {tooth}
              </button>
            ))}
          </div>
        </div>

        {/* ฟันน้ำนมบน */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(16, 1fr)',
            gap: '0.3rem',
            marginBottom: '0.5rem',
          }}>
            <div></div><div></div><div></div>
            {MILK_UPPER_TEETH.map((tooth) => (
              <button
                key={tooth}
                onClick={() => setSelected(tooth)}
                style={{
                  padding: '0.4rem 0',
                  fontSize: '0.85rem',
                  backgroundColor: selected === tooth ? '#007bff' : '#eee',
                  color: selected === tooth ? 'white' : 'black',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  cursor: 'pointer',
                }}
              >
                {tooth}
              </button>
            ))}
            <div></div><div></div><div></div>
          </div>
        </div>

        {/* ฟันน้ำนมล่าง */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(16, 1fr)',
            gap: '0.3rem',
            marginBottom: '0.5rem',
          }}>
            <div></div><div></div><div></div>
            {MILK_LOWER_TEETH.map((tooth) => (
              <button
                key={tooth}
                onClick={() => setSelected(tooth)}
                style={{
                  padding: '0.4rem 0',
                  fontSize: '0.85rem',
                  backgroundColor: selected === tooth ? '#007bff' : '#eee',
                  color: selected === tooth ? 'white' : 'black',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  cursor: 'pointer',
                }}
              >
                {tooth}
              </button>
            ))}
            <div></div><div></div><div></div>
          </div>
        </div>

        {/* ฟันล่าง */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(16, 1fr)',
            gap: '0.3rem',
            marginBottom: '0.5rem',
          }}>
            {LOWER_TEETH.map((tooth) => (
              <button
                key={tooth}
                onClick={() => setSelected(tooth)}
                style={{
                  padding: '0.4rem 0',
                  fontSize: '0.85rem',
                  backgroundColor: selected === tooth ? '#007bff' : '#eee',
                  color: selected === tooth ? 'white' : 'black',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  cursor: 'pointer',
                }}
              >
                {tooth}
              </button>
            ))}
          </div>
        </div>

        {/* Sectant Selector */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '0.5rem',
            marginBottom: '0.5rem',
          }}>
            {[1, 2, 3, 4, 5, 6].map((sectant) => (
              <button
                key={sectant}
                onClick={() => setSelected(`sectant-${sectant}`)}
                style={{
                  padding: '0.6rem 0',
                  fontSize: '1rem',
                  backgroundColor: selected === `sectant-${sectant}` ? '#28a745' : '#eee',
                  color: selected === `sectant-${sectant}` ? 'white' : 'black',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  cursor: 'pointer',
                }}
              >
                Sectant {sectant}
              </button>
            ))}
          </div>
        </div>

        {/* Quadrant Selector */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.5rem',
            marginBottom: '0.5rem',
          }}>
            {[1, 2, 3, 4].map((quadrant) => (
              <button
                key={quadrant}
                onClick={() => setSelected(`quadrant-${quadrant}`)}
                style={{
                  padding: '0.6rem 0',
                  fontSize: '1rem',
                  backgroundColor: selected === `quadrant-${quadrant}` ? '#ffc107' : '#eee',
                  color: selected === `quadrant-${quadrant}` ? 'white' : 'black',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  cursor: 'pointer',
                }}
              >
                Quadrant {quadrant}
              </button>
            ))}
          </div>
        </div>

        {/* Upper / Lower / Fullmouth Selector */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem',
            marginBottom: '0.5rem',
          }}>
            {['Upper', 'Lower', 'Fullmouth'].map((option) => (
              <button
                key={option}
                onClick={() => setSelected(option.toLowerCase())}
                style={{
                  padding: '0.6rem 0',
                  fontSize: '1rem',
                  backgroundColor: selected === option.toLowerCase() ? '#6f42c1' : '#eee',
                  color: selected === option.toLowerCase() ? 'white' : 'black',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  cursor: 'pointer',
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Mesiodens / Gingiva Selector */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: '0.5rem',
            marginBottom: '0.5rem',
          }}>
            {[
              { label: 'Mesiodens', value: 'mesiodens' },
              { label: 'Gingiva / Soft Tissue', value: 'gingiva' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSelected(option.value)}
                style={{
                  padding: '0.6rem 0',
                  fontSize: '1rem',
                  backgroundColor: selected === option.value ? '#dc3545' : '#eee',
                  color: selected === option.value ? 'white' : 'black',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  cursor: 'pointer',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* ปุ่ม */}
        <div>
          <button
            onClick={handleConfirm}
            disabled={!selected}
            style={{
              marginRight: '1rem',
              padding: '0.5rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: selected ? '#007bff' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: selected ? 'pointer' : 'not-allowed',
            }}
          >
            ✔ ยืนยัน
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
