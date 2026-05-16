import { createClient } from "@/utils/supabase/server";
import { verifyTransaction } from "@/lib/monnify";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const signature = req.headers.get('monnify-signature');
    
    // For production, you MUST verify the signature:
    /*
    const secretKey = process.env.MONNIFY_SECRET_KEY;
    const computedSignature = crypto
      .createHmac('sha512', secretKey!)
      .update(JSON.stringify(body))
      .digest('hex');
    
    if (signature !== computedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    */

    const { paymentReference, paymentStatus, transactionReference } = body.eventData;

    if (paymentStatus === 'PAID') {
      const supabase = await createClient();

      // Update order status
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'Paid',
          payment_reference: transactionReference // Store the official transaction ref
        })
        .eq('payment_reference', paymentReference);

      if (error) throw error;
    }

    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
