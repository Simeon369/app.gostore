import { getPaystackBanks } from "@/lib/paystack";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const banks = await getPaystackBanks();
    return NextResponse.json(banks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
