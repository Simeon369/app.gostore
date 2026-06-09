export type PaymentMode = "manual_transfer" | "paystack";

export function getPaymentMode(): PaymentMode {
  const mode =
    process.env.NEXT_PUBLIC_PAYMENT_MODE ||
    process.env.PAYMENT_MODE ||
    "manual_transfer";
  return mode === "paystack" ? "paystack" : "manual_transfer";
}

export function isManualTransferMode(): boolean {
  return getPaymentMode() === "manual_transfer";
}

export interface PlatformBankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export function getPlatformBankDetails(): PlatformBankDetails {
  return {
    bankName:
      process.env.NEXT_PUBLIC_OPAY_BANK_NAME ||
      process.env.OPAY_BANK_NAME ||
      "OPay",
    accountNumber:
      process.env.NEXT_PUBLIC_OPAY_ACCOUNT_NUMBER ||
      process.env.OPAY_ACCOUNT_NUMBER ||
      "",
    accountName:
      process.env.NEXT_PUBLIC_OPAY_ACCOUNT_NAME ||
      process.env.OPAY_ACCOUNT_NAME ||
      "GoStore",
  };
}

export function generatePaymentReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 8; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `GS-${suffix}`;
}

export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;
export const RECEIPT_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
