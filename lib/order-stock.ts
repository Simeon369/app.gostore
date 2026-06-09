import type { SupabaseClient } from "@supabase/supabase-js";

interface OrderItem {
  productId: string;
  quantity: number;
}

interface OrderWithItems {
  items: OrderItem[] | string;
}

export async function deductStockForOrder(
  supabase: SupabaseClient,
  order: OrderWithItems,
): Promise<void> {
  const items: OrderItem[] =
    typeof order.items === "string" ? JSON.parse(order.items) : order.items;

  for (const item of items) {
    const { data: product, error } = await supabase
      .from("products")
      .select("id, stock, is_preorder")
      .eq("id", item.productId)
      .single();

    if (error || !product || product.is_preorder) continue;

    const newStock = Math.max(0, Number(product.stock) - (item.quantity || 1));
    const updates: Record<string, unknown> = { stock: newStock };

    if (newStock === 0) {
      updates.tag = "Sold Out";
    }

    await supabase.from("products").update(updates).eq("id", product.id);
  }
}
