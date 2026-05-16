import { createClient } from "@/utils/supabase/server";
import { initializeTransaction } from "@/lib/monnify";
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

    // 2. Prepare Monnify Request
    const paymentReference = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const monnifyRequest = {
      amount: amount,
      customerName: customerName,
      customerEmail: customerEmail,
      paymentReference: paymentReference,
      paymentDescription: `Payment for order at ${store.name}`,
      currencyCode: "NGN",
      contractCode: process.env.MONNIFY_CONTRACT_CODE || "",
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/store/${storeSlug}?success=true&ref=${paymentReference}`,
      metadata: JSON.stringify({
        orderData: {
          store_id: store.id,
          customer_name: customerName,
          customer_phone: body.customerPhone,
          customer_address: body.customerAddress,
          items: body.items,
          total: amount,
          delivery_fee: body.deliveryFee,
          source: body.source || 'Direct'
        }
      })
    };

    const monnifyResponse = await initializeTransaction(monnifyRequest);

    return NextResponse.json(monnifyResponse);
  } catch (error: any) {
    console.error("Payment initialization error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
