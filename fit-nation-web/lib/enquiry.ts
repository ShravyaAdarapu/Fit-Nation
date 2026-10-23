export const enquiryInterests = ['Membership and visit', 'Strength training', 'Yoga', 'Zumba'] as const;
export type EnquiryInterest = typeof enquiryInterests[number];

export function normalizeIndianPhone(value: string): string | null {
  if (!/^[+\d\s()-]+$/.test(value)) return null;
  let digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
}
