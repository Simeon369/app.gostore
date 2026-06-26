import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify order belongs to a store owned by this user
    const { data: order, error } = await admin
      .from("orders")
      .select("receipt_path, stores(user_id)")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // @ts-ignore
    if (order.stores?.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!order.receipt_path) {
      return NextResponse.json(
        { error: "Receipt no longer available" },
        { status: 404 },
      );
    }

    const { data: signed, error: signError } = await admin.storage
      .from("payment-receipts")
      .createSignedUrl(order.receipt_path, 300);

    if (signError || !signed?.signedUrl) {
      return NextResponse.json(
        { error: "Failed to generate receipt URL" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: signed.signedUrl });
  } catch (error: unknown) {
    console.error("Receipt URL error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
