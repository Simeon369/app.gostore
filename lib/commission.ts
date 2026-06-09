const COMMISSION_RATE = 0.05;
const COMMISSION_CAP = 10000;

export function calculatePlatformFee(total: number): number {
  const fee = total * COMMISSION_RATE;
  return Math.min(Math.round(fee), COMMISSION_CAP);
}

export function calculateVendorPayout(total: number): number {
  return total - calculatePlatformFee(total);
}
