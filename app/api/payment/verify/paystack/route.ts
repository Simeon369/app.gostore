import { verifyPaystackTransaction } from "@/lib/paystack";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('ref');
    const storeId = searchParams.get('storeId');

    if (!reference) {
      return NextResponse.json({ error: "No reference provided" }, { status: 400 });
    }

    // 1. Verify with Paystack
    const transaction = await verifyPaystackTransaction(reference);

    if (transaction.status !== 'success') {
      return NextResponse.json({ error: "Transaction not successful" }, { status: 400 });
    }

    const metadata = transaction.metadata;
    const supabase = await createClient();

    // 2. Check if order already exists to avoid duplicates
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('payment_reference', reference)
      .single();

    if (existingOrder) {
      const { data: store } = await supabase
        .from('stores')
        .select('slug')
        .eq('id', storeId)
        .single();
        
      return NextResponse.redirect(`${new URL(req.url).origin}/store/${store?.slug}?success=true`);
    }

    // 3. Create the order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        store_id: storeId,
        customer_name: metadata.customer_name,
        customer_phone: metadata.customer_phone,
        customer_email: metadata.customer_email || null,
        customer_address: metadata.customer_address,
        items: JSON.parse(metadata.items),
        total: metadata.total,
        delivery_fee: metadata.delivery_fee,
        status: 'Paid',
        payment_reference: reference,
        source: metadata.source || 'Direct'
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 4. Redirect to success page
    const { data: store } = await supabase
      .from('stores')
      .select('slug')
      .eq('id', storeId)
      .single();

    return NextResponse.redirect(`${new URL(req.url).origin}/store/${store?.slug}?success=true`);

  } catch (error: any) {
    console.error("Paystack Verification Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
