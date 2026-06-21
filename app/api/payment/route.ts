import { createClient } from "@/utils/supabase/server";
import { initializePaystackTransaction } from "@/lib/paystack";
import { calculateGrossAmount } from "@/utils/pricing";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log("Payment API hit");
  try {
    const body = await req.json();
    console.log("Payment request body:", body);
    const { orderId, amount, customerName, customerEmail, storeSlug } = body;

    const supabase = await createClient();

    // 1. Get Store details for split payment
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', storeSlug)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (!store.paystack_sub_account_code) {
      return NextResponse.json({ error: "Store is not fully onboarded for payments" }, { status: 400 });
    }

    // 2. Calculate Pricing & Fees
    // 'amount' is the vendor's intended target base price (cart total)
    const grossAmount = calculateGrossAmount(amount);
    const amountInKobo = grossAmount * 100;
    
    // Platform fee: 5% of base price, capped at ₦10,000
    const PLATFORM_FEE_CAP = 10000;
    const platformFee = Math.min(amount * 0.05, PLATFORM_FEE_CAP);
    
    // Vendor gets base price minus the capped platform fee
    const vendorShare = amount - platformFee;
    const vendorShareInKobo = Math.floor(vendorShare * 100);

    // 3. Prepare Paystack Request
    const paymentReference = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const paystackPayload = {
      amount: amountInKobo,
      email: customerEmail,
      reference: paymentReference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/store/${storeSlug}?success=true&ref=${paymentReference}`,
      subaccount: store.paystack_sub_account_code, // Store's subaccount
      bearer: "account" as any, // Important: Main account bears the fee!
      split: {
        type: "flat",
        bearer_subaccount: "account",
        subaccounts: [
          {
            subaccount: store.paystack_sub_account_code,
            share: vendorShareInKobo
          }
        ]
      },
      metadata: {
        custom_fields: [
          {
            display_name: "Customer Name",
            variable_name: "customer_name",
            value: customerName
          }
        ],
        orderData: {
          store_id: store.id,
          customer_name: customerName,
          customer_phone: body.customerPhone,
          customer_address: body.customerAddress,
          customer_latitude: body.customerLatitude,
          customer_longitude: body.customerLongitude,
          delivery_method: body.deliveryMethod,
          items: body.items,
          total: amount,
          delivery_fee: body.deliveryFee ?? 0,
          source: body.source || 'Direct'
        }
      }
    };

    const paystackResponse = await initializePaystackTransaction(paystackPayload);

    return NextResponse.json(paystackResponse); // { authorization_url, access_code, reference }
  } catch (error: any) {
    console.error("Payment initialization error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

