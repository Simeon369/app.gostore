import { validatePaystackAccount } from "@/lib/paystack";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountNumber = searchParams.get('accountNumber');
    const bankCode = searchParams.get('bankCode');

    if (!accountNumber || !bankCode) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const result = await validatePaystackAccount(accountNumber, bankCode);
    return NextResponse.json({ accountName: result.account_name });
  } catch (error: any) {
    console.error("Account Validation Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
