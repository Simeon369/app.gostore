import {
  generateShippingMessage,
  generateWhatsAppLink,
  formatWhatsAppNumber,
  type ShippingItem,
} from "./whatsapp-shipping";

export { generateWhatsAppLink, formatWhatsAppNumber };

interface OrderMessageData {
  id: string;
  customer_name: string;
  customer_phone?: string | null;
  total: number;
  items: ShippingItem[] | string;
  delivery_fee?: number;
}

interface StoreMessageData {
  name: string;
  whatsapp?: string | null;
  slug?: string;
}

function parseItems(items: ShippingItem[] | string): ShippingItem[] {
  return typeof items === "string" ? JSON.parse(items) : items;
}

function formatItemsList(items: ShippingItem[]): string {
  return items
    .map((item) => {
      const label = item.name || item.productId || "Item";
      return `• ${label} x${item.quantity}`;
    })
    .join("\n");
}

export function generateVendorPaidNotification(
  order: OrderMessageData,
  store: StoreMessageData,
): string {
  const items = parseItems(order.items);
  const orderRef = order.id.split("-")[0].toUpperCase();

  return `
New paid order for *${store.name}*!

*Order ID:* #${orderRef}
*Customer:* ${order.customer_name}
*Phone:* ${order.customer_phone || "N/A"}

*Items:*
${formatItemsList(items)}

*Total:* ₦${Number(order.total).toLocaleString()}

Please prepare this order for shipping. Mark the order as shipped from your GoStore dashboard when you have shipped the order.
`.trim();
}

export function generateCustomerPaymentConfirmedMessage(
  order: OrderMessageData,
  store: StoreMessageData,
): string {
  const items = parseItems(order.items);
  const orderRef = order.id.split("-")[0].toUpperCase();
  const trackingUrl = store.slug
    ? `${process.env.NEXT_PUBLIC_APP_URL}/store/${store.slug}/track?orderId=${orderRef}`
    : undefined;

  return `
Hi ${order.customer_name} 👋

Your payment for order *#${orderRef}* from *${store.name}* has been confirmed!

*Items:*
${formatItemsList(items)}

*Total Paid:* ₦${Number(order.total).toLocaleString()}

The vendor is now preparing your order. We'll notify you when it ships.${trackingUrl ? `\n\nTrack your order: ${trackingUrl}` : ""}

Thank you for shopping with us! 🙏
`.trim();
}

export function generateShippingMessageForOrder(
  order: OrderMessageData,
  store: StoreMessageData,
  trackingUrl?: string,
): string {
  const items = parseItems(order.items);

  return generateShippingMessage({
    orderId: order.id,
    customerName: order.customer_name,
    customerPhone: order.customer_phone || "",
    storeName: store.name,
    items,
    total: Number(order.total),
    trackingUrl,
  });
}
