/**
 * Monnify Integration Utility
 * Handles authentication and transaction initialization for split payments.
 */

const MONNIFY_BASE_URL = process.env.MONNIFY_BASE_URL || 'https://sandbox.monnify.com/api/v1';
const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY;
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY;

export async function getMonnifyToken() {
  if (!MONNIFY_API_KEY || !MONNIFY_SECRET_KEY) {
    throw new Error("Monnify API keys are not configured");
  }

  const authString = Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`).toString('base64');

  const response = await fetch(`${MONNIFY_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
    },
  });

  const data = await response.json();
  console.log("Monnify Auth Response:", JSON.stringify(data, null, 2));

  const isSuccess = 
    data.requestSuccessful === true ||
    data.requestStatus === 'SUCCESSFUL' || 
    data.requestStatus === 'SUCCESS' || 
    data.status === 'SUCCESSFUL' ||
    data.status === 'SUCCESS';

  if (!response.ok || !isSuccess) {
    const errorMsg = data.responseMessage || data.message || "Failed to authenticate with Monnify";
    console.error(`Monnify Auth Error: ${errorMsg}`, data);
    throw new Error(`${errorMsg} (requestSuccessful: ${data.requestSuccessful})`);
  }

  return data.responseBody.accessToken;
}

export interface MonnifyTransactionRequest {
  amount: number;
  customerName: string;
  customerEmail: string;
  paymentReference: string;
  paymentDescription: string;
  currencyCode: string;
  contractCode: string;
  redirectUrl: string;
  incomeSplitConfig?: any[];
}

export async function initializeTransaction(request: MonnifyTransactionRequest) {
  const token = await getMonnifyToken();

  const response = await fetch(`${MONNIFY_BASE_URL}/merchant/transactions/init-transaction`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();
  console.log("Monnify Init Response:", JSON.stringify(data, null, 2));

  const isSuccess = 
    data.requestSuccessful === true ||
    data.requestStatus === 'SUCCESSFUL' || 
    data.requestStatus === 'SUCCESS' || 
    data.status === 'SUCCESSFUL' ||
    data.status === 'SUCCESS';

  if (!response.ok || !isSuccess) {
    const errorMsg = data.responseMessage || data.message || "Failed to initialize Monnify transaction";
    console.error(`Monnify Init Error: ${errorMsg}`, data);
    throw new Error(`${errorMsg} (requestSuccessful: ${data.requestSuccessful})`);
  }

  return data.responseBody;
}

export async function verifyTransaction(paymentReference: string) {
  const token = await getMonnifyToken();

  const response = await fetch(`${MONNIFY_BASE_URL}/merchant/transactions/query?paymentReference=${paymentReference}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  const isSuccess = 
    data.requestSuccessful === true ||
    data.requestStatus === 'SUCCESSFUL' || 
    data.requestStatus === 'SUCCESS' || 
    data.status === 'SUCCESSFUL' ||
    data.status === 'SUCCESS';

  if (!response.ok || !isSuccess) {
    throw new Error(data.responseMessage || "Failed to verify Monnify transaction");
  }

  return data.responseBody;
}

export async function getBanks() {
  const token = await getMonnifyToken();
  const response = await fetch(`${MONNIFY_BASE_URL}/banks`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  return data.responseBody;
}

export async function registerSubAccount(payload: {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  email: string;
  displayName: string;
}) {
  const token = await getMonnifyToken();
  
  const cleanPayload = [{
    currencyCode: "NGN",
    bankCode: payload.bankCode.trim(),
    accountNumber: payload.accountNumber.trim(),
    accountName: payload.accountName.trim(),
    email: payload.email.trim(),
    displayName: payload.displayName.trim().substring(0, 50),
    splitPercentage: 100,
    defaultSplitPercentage: 100
  }];

  console.log("Sending to Monnify Sub-account API (Array Mode):", JSON.stringify(cleanPayload, null, 2));
  
  // Note: Registration is usually v1
  const response = await fetch(`${MONNIFY_BASE_URL}/sub-accounts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cleanPayload)
  });

  const data = await response.json();
  if (!data.requestSuccessful) {
    console.error("Monnify Sub-account Error Detail:", JSON.stringify(data, null, 2));
    throw new Error(data.responseMessage || "Failed to register sub-account");
  }

  return data.responseBody;
}

export async function validateAccount(accountNumber: string, bankCode: string) {
  // MOCK FOR SANDBOX: If using the test account, return a fake success
  // This is because many sandbox keys don't have "MPE_VALIDATE_ACCOUNT" permission enabled by default.
  if (["0000000001", "0000000002", "0123456789"].includes(accountNumber)) {
    console.log("MOCKING Validation for Sandbox test account...");
    return {
      accountName: "MONNIFY TEST ACCOUNT",
      accountNumber: accountNumber,
      bankCode: bankCode
    };
  }

  const token = await getMonnifyToken();
  const url = `https://sandbox.monnify.com/api/v1/merchant/bank-details/validate-account?accountNumber=${accountNumber}&bankCode=${bankCode}`;
  
  console.log("Attempting Validation at:", url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  
  if (!data.requestSuccessful) {
    console.error("Monnify Validation Failed. Response:", JSON.stringify(data, null, 2));
    throw new Error(data.responseMessage || "Failed to validate account");
  }
  
  return data.responseBody;
}
