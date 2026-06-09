import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  generatePaymentReference,
  RECEIPT_ALLOWED_TYPES,
  RECEIPT_MAX_BYTES,
  isManualTransferMode,
} from "@/lib/payment-config";

export async function POST(req: Request) {
  try {
    if (!isManualTransferMode()) {
      return NextResponse.json(
        { error: "Manual order creation is disabled in paystack mode" },
        { status: 400 },
      );
    }

    const formData = await req.formData();
    const receipt = formData.get("receipt") as File | null;

    if (!receipt || receipt.size === 0) {
      return NextResponse.json(
        { error: "Payment receipt is required to complete checkout" },
        { status: 400 },
      );
    }

    if (!RECEIPT_ALLOWED_TYPES.includes(receipt.type)) {
      return NextResponse.json(
        { error: "Receipt must be JPG, PNG, WebP, or PDF" },
        { status: 400 },
      );
    }

    if (receipt.size > RECEIPT_MAX_BYTES) {
      return NextResponse.json(
        { error: "Receipt must be under 5MB" },
        { status: 400 },
      );
    }

    const storeId = formData.get("store_id") as string;
    const storeSlug = formData.get("store_slug") as string;
    const customerName = formData.get("customer_name") as string;
    const customerPhone = formData.get("customer_phone") as string;
    const customerEmail = formData.get("customer_email") as string;
    const customerAddress = formData.get("customer_address") as string;
    const itemsRaw = formData.get("items") as string;
    const total = Number(formData.get("total"));
    const deliveryFee = Number(formData.get("delivery_fee") || 0);
    const source = (formData.get("source") as string) || "Direct";

    if (
      !storeId ||
      !storeSlug ||
      !customerName ||
      !customerPhone ||
      !customerAddress ||
      !itemsRaw ||
      !total
    ) {
      return NextResponse.json(
        { error: "Missing required order fields" },
        { status: 400 },
      );
    }

    let items: unknown;
    try {
      items = JSON.parse(itemsRaw);
    } catch {
      return NextResponse.json({ error: "Invalid items payload" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const clientRef = formData.get("payment_reference") as string | null;
    const paymentReference =
      clientRef && /^GS-[A-Z0-9]{8}$/.test(clientRef)
        ? clientRef
        : generatePaymentReference();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        store_id: storeId,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        customer_address: customerAddress,
        items,
        total,
        delivery_fee: deliveryFee,
        status: "Pending",
        payment_reference: paymentReference,
        payment_method: "manual_transfer",
        payout_status: "unsettled",
        source,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Order insert error:", orderError);
      return NextResponse.json(
        { error: orderError?.message || "Failed to create order" },
        { status: 500 },
      );
    }

    const ext = receipt.name.split(".").pop() || "jpg";
    const receiptPath = `${storeId}/${order.id}/receipt.${ext}`;

    const buffer = Buffer.from(await receipt.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("payment-receipts")
      .upload(receiptPath, buffer, {
        contentType: receipt.type,
        upsert: false,
      });

    if (uploadError) {
      await supabase.from("orders").delete().eq("id", order.id);
      console.error("Receipt upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload receipt. Please try again." },
        { status: 500 },
      );
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        receipt_path: receiptPath,
        receipt_uploaded_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateError) {
      await supabase.storage.from("payment-receipts").remove([receiptPath]);
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Failed to finalize order" },
        { status: 500 },
      );
    }

    const shortId = order.id.split("-")[0].toUpperCase();

    return NextResponse.json({
      success: true,
      orderId: order.id,
      shortId,
      paymentReference,
      redirectUrl: `/store/${storeSlug}/track?orderId=${shortId}`,
    });
  } catch (error: unknown) {
    console.error("Create order error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
