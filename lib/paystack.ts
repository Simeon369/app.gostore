const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

export async function getPaystackBanks() {
  const response = await fetch(`${PAYSTACK_BASE_URL}/bank?country=nigeria`, {
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`
    }
  });
  const data = await response.json();
  return data.data; // Array of { name, code }
}

export async function validatePaystackAccount(accountNumber: string, bankCode: string) {
  const response = await fetch(
    `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    }
  );
  const data = await response.json();
  if (!data.status) {
    if (PAYSTACK_SECRET_KEY?.startsWith('sk_test_') && (data.message?.toLowerCase().includes('limit') || data.message?.toLowerCase().includes('test bank'))) {
      return { account_number: accountNumber, account_name: "Test Settlement Account" };
    }
    throw new Error(data.message || "Could not resolve account");
  }
  return data.data; // { account_number, account_name }
}

export async function createPaystackSubaccount(payload: {
  business_name: string;
  settlement_bank: string;
  account_number: string;
  percentage_charge: number; // Percentage for the platform (e.g. 10)
}) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/subaccount`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!data.status) {
    throw new Error(data.message || "Failed to create subaccount");
  }
  return data.data; // { subaccount_code, ... }
}

export async function verifyPaystackTransaction(reference: string) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`
    }
  });
  const data = await response.json();
  if (!data.status) {
    throw new Error(data.message || "Transaction verification failed");
  }
  return data.data; // Full transaction object
}
