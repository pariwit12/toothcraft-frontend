// 📁 constants/insurance_type.js
export const INSURANCE_TYPE = {
  CASH: { id: 1, label: 'เงินสด' },
  GOLD_CARD: { id: 2, label: 'บัตรทอง' },
  SOCIAL_SECURITY: { id: 3, label: 'ประกันสังคม' },
};

export const INSURANCE_TYPE_LIST = Object.values(INSURANCE_TYPE);

export const INSURANCE_TYPE_BY_ID = {
  1: 'เงินสด',
  2: 'บัตรทอง',
  3: 'ประกันสังคม',
};
