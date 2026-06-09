import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { verifySuperAdmin } from "@/lib/admin-auth";
import {
  calculatePlatformFee,
  calculateVendorPayout,
} from "@/lib/commission";
import { deductStockForOrder } from "@/lib/order-stock";
import {
  generateVendorPaidNotification,
  generateCustomerPaymentConfirmedMessage,
  generateWhatsAppLink,
  formatWhatsAppNumber,
} from "@/lib/whatsapp-messages";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const auth = await verifySuperAdmin(supabase);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("*, stores(name, slug, whatsapp)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "Pending") {
      return NextResponse.json(
        { error: "Only pending orders can be confirmed" },
        { status: 400 },
      );
    }

    if (!order.receipt_path) {
      return NextResponse.json(
        { error: "Order has no receipt on file" },
        { status: 400 },
      );
    }

    const platformFee = calculatePlatformFee(Number(order.total));
    const payoutAmount = calculateVendorPayout(Number(order.total));
    const now = new Date().toISOString();

    const { error: deleteError } = await admin.storage
      .from("payment-receipts")
      .remove([order.receipt_path]);

    if (deleteError) {
      console.error("Receipt delete error:", deleteError);
    }

    const { error: updateError } = await admin
      .from("orders")
      .update({
        status: "Paid",
        payment_confirmed_at: now,
        payment_confirmed_by: auth.user.id,
        receipt_url: null,
        receipt_path: null,
        receipt_deleted_at: now,
        payout_status: "unsettled",
        payout_amount: payoutAmount,
        platform_fee: platformFee,
      })
      .eq("id", orderId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await deductStockForOrder(admin, order);

    const store = order.stores as {
      name: string;
      slug: string;
      whatsapp: string | null;
    };

    const vendorMessage = generateVendorPaidNotification(order, store);
    const customerMessage = generateCustomerPaymentConfirmedMessage(order, store);

    const vendorWhatsAppUrl = store.whatsapp
      ? generateWhatsAppLink(formatWhatsAppNumber(store.whatsapp), vendorMessage)
      : null;

    const customerWhatsAppUrl = order.customer_phone
      ? generateWhatsAppLink(
          formatWhatsAppNumber(order.customer_phone),
          customerMessage,
        )
      : null;

    return NextResponse.json({
      success: true,
      platformFee,
      payoutAmount,
      vendorWhatsAppUrl,
      customerWhatsAppUrl,
    });
  } catch (error: unknown) {
    console.error("Confirm payment error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
