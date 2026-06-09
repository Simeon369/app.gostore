import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { verifySuperAdmin } from "@/lib/admin-auth";

export async function POST(req: Request) {
  try {
    const { orderId, type = "shipping" } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const supabase = await createClient();
    const auth = await verifySuperAdmin(supabase);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const admin = createAdminClient();
    const now = new Date().toISOString();

    const updates: Record<string, unknown> = {};
    if (type === "payment_vendor") {
      updates.vendor_notified_at = now;
    } else if (type === "payment_customer") {
      updates.customer_paid_notified_at = now;
    } else {
      updates.whatsapp_sent = true;
      updates.whatsapp_sent_at = now;
    }

    const { error } = await admin.from("orders").update(updates).eq("id", orderId);

    if (error) {
      console.error("Failed to mark whatsapp sent:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update order" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Mark WhatsApp sent error:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 },
    );
  }
}
