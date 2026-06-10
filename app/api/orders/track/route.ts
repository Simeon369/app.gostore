import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

function normalizeTrackingRef(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderRef = searchParams.get("orderId");
    const storeSlug = searchParams.get("storeSlug");

    if (!orderRef || !storeSlug) {
      return NextResponse.json(
        { error: "Missing orderId or storeSlug" },
        { status: 400 },
      );
    }

    const normalized = normalizeTrackingRef(orderRef);
    if (normalized.length < 4) {
      return NextResponse.json(
        { error: "Order ID is too short" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    const { data: store, error: storeError } = await admin
      .from("stores")
      .select("id")
      .eq("slug", storeSlug)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const { data: orders, error: ordersError } = await admin
      .from("orders")
      .select("id, status, total, created_at, rejection_reason, payment_reference")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Track order query error:", ordersError);
      return NextResponse.json(
        { error: "Failed to look up order" },
        { status: 500 },
      );
    }

    const order = orders?.find((o) => {
      const shortId = o.id.split("-")[0].toUpperCase();
      const paymentRef = o.payment_reference?.toUpperCase();
      return shortId === normalized || paymentRef === normalized;
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: order.id,
      status: order.status,
      total: order.total,
      created_at: order.created_at,
      rejection_reason: order.rejection_reason,
    });
  } catch (error: unknown) {
    console.error("Track order error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
