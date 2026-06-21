import { createClient } from "@/utils/supabase/server";
import { verifyTransaction } from "@/lib/monnify";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentReference = searchParams.get('ref');

    if (!paymentReference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Verify with Monnify
    const transaction = await verifyTransaction(paymentReference);
    console.log("Full Monnify Verification Object:", JSON.stringify(transaction, null, 2));

    const status = transaction.paymentStatus || transaction.status || transaction.transactionStatus;
    const isPaid = status === 'PAID' || status === 'SUCCESS' || status === 'SUCCESSFUL';

    if (isPaid) {
      // 2. Check if order already exists (prevent duplicates)
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('payment_reference', paymentReference)
        .maybeSingle();

      if (existingOrder) {
        return NextResponse.json({ status: "already_exists", orderId: existingOrder.id });
      }

      // 3. Extract order data from metadata (Handle camelCase, lowercase, and stringified JSON)
      let meta = transaction.metaData || transaction.metadata || transaction.meta;
      
      if (typeof meta === 'string') {
        try {
          meta = JSON.parse(meta);
        } catch (e) {
          console.error("Metadata parse failed, attempting fallback");
        }
      }

      // If we don't have order data, we can't create it
      if (!meta || !meta.store_id) {
        console.error("CRITICAL: Monnify confirmed payment but order details are missing in metadata!", meta);
        throw new Error("Order details lost in transaction. Please check terminal logs.");
      }

      // 4. Create the NEW order as PAID
      const { data: newOrder, error: insertError } = await supabase
        .from('orders')
        .insert({
          store_id: meta.store_id,
          customer_name: meta.customer_name,
          customer_phone: meta.customer_phone,
          customer_address: meta.customer_address,
          items: typeof meta.items === 'string' ? JSON.parse(meta.items) : meta.items,
          total: meta.total,
          delivery_fee: meta.delivery_fee ?? 0,
          delivery_method: meta.delivery_method || 'dispatch',
          customer_latitude: meta.customer_latitude ?? null,
          customer_longitude: meta.customer_longitude ?? null,
          payment_reference: paymentReference,
          status: 'Paid',
          source: meta.source || 'Direct'
        })
        .select()
        .single();

      if (insertError) {
        console.error("Supabase Insert Error:", insertError);
        throw insertError;
      }

      return NextResponse.json({ status: "success", orderId: newOrder.id });
    }

    return NextResponse.json({ status: "pending", message: `Status is ${status}` });
  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
