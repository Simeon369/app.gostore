const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

export async function getPaystackBanks() {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack is not configured on the server");
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/bank?country=nigeria`, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
    next: { revalidate: 3600 },
  });
  const data = await response.json();

  if (!data.status || !Array.isArray(data.data)) {
    throw new Error(data.message || "Failed to load Nigerian banks from Paystack");
  }

  return data.data as Array<{ name: string; code: string }>;
}

export type PaystackResolvedAccount = {
  account_number: string;
  account_name: string;
};

export async function validatePaystackAccount(
  accountNumber: string,
  bankCode: string,
): Promise<PaystackResolvedAccount> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack is not configured on the server");
  }

  const cleanNumber = accountNumber.replace(/\D/g, "");
  if (cleanNumber.length !== 10) {
    throw new Error("Account number must be 10 digits");
  }

  const response = await fetch(
    `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${cleanNumber}&bank_code=${bankCode}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
      cache: "no-store",
    },
  );
  const data = await response.json();

  if (!data.status) {
    if (
      PAYSTACK_SECRET_KEY.startsWith("sk_test_") &&
      (data.message?.toLowerCase().includes("limit") ||
        data.message?.toLowerCase().includes("test bank"))
    ) {
      return { account_number: cleanNumber, account_name: "Test Settlement Account" };
    }
    throw new Error(data.message || "Could not resolve account");
  }

  return data.data as PaystackResolvedAccount;
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

export async function initializePaystackTransaction(payload: {
  amount: number;
  email: string;
  reference: string;
  callback_url: string;
  subaccount: string;
  metadata?: any;
  split?: any;
}) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  const data = await response.json();
  if (!data.status) {
    throw new Error(data.message || "Failed to initialize Paystack transaction");
  }
  return data.data; // { authorization_url, access_code, reference }
}
