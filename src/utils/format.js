// utils/format.js

export function formatAge(birthDateStr) {
  if (!birthDateStr) return '-';
  const birthDate = new Date(birthDateStr);
  const now = new Date();
  let years = now.getFullYear() - birthDate.getFullYear();
  let months = now.getMonth() - birthDate.getMonth();
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return `${years} ปี ${months} เดือน`;
}

export function formatTime(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('th-TH');
}

export function formatProcedures(visit) {
  if (!visit.visit_procedures || visit.visit_procedures.length === 0) return '-';

  return visit.visit_procedures.map((vp, idx) => {
    const procName = vp.procedures?.name || 'ไม่มีชื่อหัตถการ';
    const tooth = vp.tooth ?
      vp.surface ?
        `#${vp.tooth}(${vp.surface.replaceAll(',', '')})`
        : `#${vp.tooth}`
      : ''
    ;
    const price = vp.price ? `(${vp.price})` : '';
    const paidStatus = vp.paid ? '' : '❌ยังไม่ชำระ';

    const displayText = [procName, tooth, price].filter(Boolean).join(' ');
    const statusText = paidStatus ? ` - ${paidStatus}` : '';

    return (
      <>
        {'- ' + displayText + statusText}
        {idx !== visit.visit_procedures.length - 1 && <br />}
      </>
    );
  });
}
