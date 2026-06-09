import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { verifySuperAdmin } from "@/lib/admin-auth";
import {
  calculatePlatformFee,
  calculateVendorPayout,
} from "@/lib/commission";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const auth = await verifySuperAdmin(supabase);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { orderId, settlementReference } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, status, total, payout_status")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "Paid" && order.status !== "Shipped") {
      return NextResponse.json(
        { error: "Only paid or shipped orders can be settled" },
        { status: 400 },
      );
    }

    if (order.payout_status === "settled") {
      return NextResponse.json(
        { error: "Payout already marked as settled" },
        { status: 400 },
      );
    }

    const platformFee = calculatePlatformFee(Number(order.total));
    const payoutAmount = calculateVendorPayout(Number(order.total));
    const now = new Date().toISOString();

    const { error: updateError } = await admin
      .from("orders")
      .update({
        payout_status: "settled",
        payout_amount: payoutAmount,
        platform_fee: platformFee,
        settled_at: now,
        settlement_reference: settlementReference || null,
      })
      .eq("id", orderId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      payoutAmount,
      platformFee,
      settledAt: now,
    });
  } catch (error: unknown) {
    console.error("Settle payout error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
