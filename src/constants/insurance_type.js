// 📁 constants/insurance_type.js
export const INSURANCE_TYPE = {
  SELF_PAY: { id: 1, label: 'ชำระเอง' },
  GOLD_CARD: { id: 2, label: 'บัตรทอง' },
  SOCIAL_SECURITY: { id: 3, label: 'ประกันสังคม' },
};

export const INSURANCE_TYPE_LIST = Object.values(INSURANCE_TYPE);

export const INSURANCE_TYPE_BY_ID = {
  1: 'ชำระเอง',
  2: 'บัตรทอง',
  3: 'ประกันสังคม',
};
