import { createPaystackSubaccount } from "@/lib/paystack";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bankCode, accountNumber, accountName, storeId } = body;

    if (!bankCode || !accountNumber || !accountName || !storeId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Register Sub-account with Paystack
    const subAccountData = await createPaystackSubaccount({
      business_name: accountName,
      settlement_bank: bankCode,
      account_number: accountNumber,
      percentage_charge: 5 // Gostore takes 5% commission
    });

    const subAccountCode = subAccountData.subaccount_code;

    if (!subAccountCode) {
      throw new Error("Failed to retrieve sub-account code from Paystack");
    }

    // 2. Update the store in Supabase
    const { error: updateError } = await supabase
      .from('stores')
      .update({
        bank_name: body.bankName,
        bank_code: bankCode,
        account_number: accountNumber,
        account_name: accountName,
        paystack_sub_account_code: subAccountCode
      })
      .eq('id', storeId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ 
      status: "success", 
      subAccountCode 
    });

  } catch (error: any) {
    console.error("Sub-account registration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
