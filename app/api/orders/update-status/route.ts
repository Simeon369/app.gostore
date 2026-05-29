import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Verify Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get the order and verify the store belongs to the user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, stores(user_id, name, slug)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // @ts-ignore
    if (order.stores?.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized to modify this order" }, { status: 403 });
    }

    // 3. Update the order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (updateError) {
      throw updateError;
    }

    // 4. Send Email if status is "Shipped" and customer email is available
    if (status === 'Shipped' && order.customer_email) {
      const shortId = order.id.split('-')[0].toUpperCase();
      const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/store/${order.stores.slug}/track?orderId=${shortId}`;
      
      try {
        await resend.emails.send({
          from: 'GoStore <onboarding@resend.dev>', // Use Resend testing domain
          to: order.customer_email,
          subject: `Your order from ${order.stores.name} has been shipped!`,
          html: `
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Great news, ${order.customer_name}!</h1>
              <p>Your recent order (<strong>#${shortId}</strong>) from <strong>${order.stores.name}</strong> is now on its way.</p>
              <div style="margin: 30px 0;">
                <a href="${trackingUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Track Your Order
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">If you have any questions, please contact the store directly.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
              <p style="color: #999; font-size: 12px;">Powered by GoStore</p>
            </div>
          `
        });
      } catch (emailError) {
        console.error("Failed to send shipping email:", emailError);
        // We don't fail the API call if email fails, since status is already updated
      }
    }

    return NextResponse.json({ success: true, order });

  } catch (error: any) {
    console.error("Update Status Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
