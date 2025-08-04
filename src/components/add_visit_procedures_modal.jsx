import React, { useEffect, useState } from 'react';
import ToothSelectModal from '../components/tooth_select_modal';

const API_URL = process.env.REACT_APP_API_URL;

export default function AddVisitProceduresModal({ isOpen, onClose, visitId, onSuccess }) {
  const [availableProcedures, setAvailableProcedures] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  const [isToothModalOpen, setIsToothModalOpen] = useState(false);
  const [editingProcedureIndex, setEditingProcedureIndex] = useState(null);
  const [editingIoFindingIndex, setEditingIoFindingIndex] = useState(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (isOpen) {
      fetch(`${API_URL}/procedures`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          const sorted = Array.isArray(data) ? data.sort((a, b) => a.id - b.id) : [];
          setAvailableProcedures(sorted);
        });
      setProcedures([]);
      setSelectedCategory('');
    }
  }, [isOpen]);

  const handleAddProcedure = (p) => {
    setProcedures((prev) => [
      {
        procedure_id: p.id,
        tooth: '',
        price: p.default_price || '',
        paid: false,
      },
      ...prev,
    ]);
  };

  const handleChangeProcedure = (index, field, value) => {
    const newList = [...procedures];
    newList[index][field] = value;
    setProcedures(newList);
  };

  const handleRemoveProcedure = (index) => {
    setProcedures((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${API_URL}/visit-procedures/add-multiple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          visit_id: visitId,
          procedures,
        }),
      });

      if (!res.ok) throw new Error('เกิดข้อผิดพลาดในการเพิ่มหัตถการ');

      onClose();
      onSuccess(); // reload visits
    } catch (err) {
      alert(err.message);
    }
  };

  const allCategories = [...new Set(availableProcedures.map((p) => p.category?.trim()))];

  if (!isOpen) return null;

  const openToothModal = ({ type, index }) => {
    if (type === 'procedure') {
      setEditingProcedureIndex(index);
      setEditingIoFindingIndex(null);
    } else if (type === 'io') {
      setEditingProcedureIndex(null);
      setEditingIoFindingIndex(index);
    }
    setIsToothModalOpen(true);
  };

  const handleToothSelect = (value) => {
    if (editingProcedureIndex !== null) {
      const updated = [...procedures];
      updated[editingProcedureIndex].tooth = value;
      setProcedures(updated);
    }
    setEditingProcedureIndex(null);
    setEditingIoFindingIndex(null);
    setIsToothModalOpen(false);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        background: 'white', padding: '1.5rem', borderRadius: '8px', width: '80%', maxHeight: '90%', overflowY: 'auto',
        display: 'flex', gap: '1rem'
      }}>
        {/* เลือกหัตถการ - ฝั่งซ้าย */}
        <div style={{ flex: 1 }}>
          <h3>➕ เพิ่มหัตถการใหม่</h3>

          {/* Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory((prev) => (prev === cat ? '' : cat))}
                style={{
                  padding: '0.5rem 1rem',
                  background: selectedCategory === cat ? '#007bff' : '#eee',
                  color: selectedCategory === cat ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* รายการ procedures ตาม category */}
          {selectedCategory && (
            <div style={{ marginTop: '1rem' }}>
              {availableProcedures
                .filter((p) => p.category?.trim() === selectedCategory)
                .map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '3fr 1fr 0.5fr 1fr auto',
                      gap: '0.5rem',
                      alignItems: 'center',
                      padding: '0.25rem 0',
                    }}
                  >
                    <span>{p.name}</span>
                    <span style={{ textAlign: 'right' }}>{p.min_price}</span>
                    <span style={{ textAlign: 'center' }}>-</span>
                    <span style={{ textAlign: 'left' }}>{p.max_price}</span>
                    <button onClick={() => handleAddProcedure(p)} style={{ cursor: 'pointer' }}>➕ เพิ่ม</button>
                  </div>
                ))}
            </div>
          )}
        </div>
        
        {/* รายการหัตถการที่เลือก - ฝั่งขวา */}
        <div style={{ flex: 1 }}>
          <h4>รายการหัตถการที่เลือก</h4>
          {procedures.length === 0 ? (
            <p>ไม่มีรายการ</p>
          ) : (
            <div>
              {procedures.map((proc, index) => {
                const name =
                  availableProcedures.find((p) => p.id === Number(proc.procedure_id))?.name || '(ไม่พบ)';
                return (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.5rem 0',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: 3, minWidth: '150px' }}>
                      <b>{name}</b>
                    </div>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '120px' }}>
                      <label htmlFor={`tooth-${index}`}>ซี่ฟัน:</label>
                      <button
                        onClick={() => openToothModal({ type: 'procedure', index })}
                        style={{
                          padding: '4px 8px',
                          border: '1px solid #ccc',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          minWidth: '60px',
                          background: '#f9f9f9'
                        }}
                      >
                        {proc.tooth || 'เลือก'}
                      </button>
                    </div>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '120px' }}>
                      <label htmlFor={`price-${index}`}>ราคา:</label>
                      <input
                        id={`price-${index}`}
                        type="number"
                        value={proc.price}
                        onChange={(e) => handleChangeProcedure(index, 'price', e.target.value)}
                        style={{
                          width: '80px',
                          padding: '4px 6px',
                          borderRadius: '5px',
                          border: '1px solid #ccc',
                        }}
                      />
                    </div>

                    <div>
                      <button
                        onClick={() => handleRemoveProcedure(index)}
                        style={{
                          color: 'red',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontSize: '1.2rem',
                          userSelect: 'none',
                        }}
                        title="ลบรายการ"
                      >
                        ❌ ลบ
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={async () => {
                // 🔒 ตรวจสอบการเลือกซี่ฟันให้ครบทุกหัตถการ
                const missingTooth = procedures.some((p) => !p.tooth || p.tooth.trim() === '');
                if (missingTooth) {
                  alert('กรุณาเลือกซี่ฟันให้ครบทุกหัตถการ');
                  return;
                }
                handleSubmit();
              }}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              💾 บันทึก
            </button>{' '}
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: '#ccc',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              ❌ ยกเลิก
            </button>
          </div>
        </div>
      </div>
      <ToothSelectModal
        isOpen={isToothModalOpen}
        onClose={() => setIsToothModalOpen(false)}
        onSelect={handleToothSelect}
      />
    </div>
  );
}
