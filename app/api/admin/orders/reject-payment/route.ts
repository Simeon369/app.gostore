import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { verifySuperAdmin } from "@/lib/admin-auth";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const auth = await verifySuperAdmin(supabase);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { orderId, rejectionReason } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "Pending") {
      return NextResponse.json(
        { error: "Only pending orders can be rejected" },
        { status: 400 },
      );
    }

    const { error: updateError } = await admin
      .from("orders")
      .update({
        status: "Rejected",
        rejection_reason: rejectionReason || "Payment could not be verified",
      })
      .eq("id", orderId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Reject payment error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
