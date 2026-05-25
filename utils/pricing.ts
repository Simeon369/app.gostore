/**
 * Calculates the gross amount to charge a customer so that after Paystack 
 * deducts their transaction fee, the exact intended base price remains.
 * 
 * Paystack Local Fees: 1.5% + ₦100 (₦100 waived if under ₦2,500), capped at ₦2,000.
 * 
 * @param basePrice The exact amount the vendor/platform wants to receive (in NGN)
 * @returns The gross amount to charge the customer (in NGN)
 */
export function calculateGrossAmount(basePrice: number): number {
  let grossAmount = 0;

  // Case A: Transactions where Gross < ₦2,500 (Paystack waives the ₦100 flat fee)
  // Threshold: Base Price < 2462.5 NGN
  if (basePrice < 2462.5) {
    grossAmount = basePrice / 0.985;
  }
  
  // Case C: High-value transactions where the Paystack fee caps out at ₦2,000
  // Threshold: Base Price > 124666.67 NGN
  else if (basePrice > 124666.67) {
    grossAmount = basePrice + 2000;
  }
  
  // Case B: Standard transactions (1.5% + ₦100 applies)
  // Threshold: 2462.5 <= Base Price <= 124666.67
  else {
    grossAmount = (basePrice + 100) / 0.985;
  }

  // Round UP to the nearest integer to completely avoid fractional kobo losses.
  // Using Math.ceil ensures the receiving end NEVER receives a kobo less than requested.
  return Math.ceil(grossAmount);
}
