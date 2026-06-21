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
  delivery_method?: string | null;
  customer_address?: string | null;
}

interface StoreMessageData {
  name: string;
  whatsapp?: string | null;
  slug?: string;
  address_formatted?: string | null;
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
  const isPickup = order.delivery_method === "pickup";
  const deliveryLine = isPickup
    ? `\n*Delivery:* Pickup — customer will collect from your store${store.address_formatted ? `\n*Pickup address:* ${store.address_formatted}` : ""}`
    : `\n*Delivery:* Dispatch — delivery address: ${order.customer_address || "Not provided"}\n*Delivery fee:* Paid to rider on arrival`;

  return `
New paid order for *${store.name}*!

*Order ID:* #${orderRef}
*Customer:* ${order.customer_name}
*Phone:* ${order.customer_phone || "N/A"}${deliveryLine}

*Items:*
${formatItemsList(items)}

*Total:* ₦${Number(order.total).toLocaleString()}

Please prepare this order${isPickup ? ". When ready, mark it as *Set for Pickup* from your GoStore dashboard" : ". When shipped, mark it as *Shipped* from your GoStore dashboard"}.
`.trim();
}

export function generateCustomerPaymentConfirmedMessage(
  order: OrderMessageData,
  store: StoreMessageData,
): string {
  const items = parseItems(order.items);
  const orderRef = order.id.split("-")[0].toUpperCase();
  const isPickup = order.delivery_method === "pickup";
  const trackingUrl = store.slug
    ? `${process.env.NEXT_PUBLIC_APP_URL}/store/${store.slug}/track?orderId=${orderRef}`
    : undefined;
  const deliveryNote = isPickup
    ? `You chose *Pickup* — you'll collect this order directly from the vendor's store.${store.address_formatted ? `\n📍 *Pickup address:* ${store.address_formatted}` : ""}`
    : `You chose *Doorstep Delivery* — the delivery fee will be paid directly to the rider when your order arrives.`;

  return `
Hi ${order.customer_name} 👋

Your payment for order *#${orderRef}* from *${store.name}* has been confirmed! ✅

*Items:*
${formatItemsList(items)}

*Total Paid:* ₦${Number(order.total).toLocaleString()}

${deliveryNote}

The vendor is now preparing your order. We'll notify you when it's ${isPickup ? "ready for pickup" : "shipped"}.${trackingUrl ? `\n\nTrack your order: ${trackingUrl}` : ""}

Thank you for shopping with us! 🙏
`.trim();
}

export function generateShippingMessageForOrder(
  order: OrderMessageData,
  store: StoreMessageData,
  trackingUrl?: string,
): string {
  const items = parseItems(order.items);
  const isPickup = order.delivery_method === "pickup";
  const deliveryNote = isPickup
    ? store.address_formatted
      ? `Your order is ready for pickup! Collect from: ${store.address_formatted}`
      : "Your order is ready for pickup at the vendor's store."
    : "Delivery fee to be paid to the rider on arrival.";

  return generateShippingMessage({
    orderId: order.id,
    customerName: order.customer_name,
    customerPhone: order.customer_phone || "",
    storeName: store.name,
    items,
    total: Number(order.total),
    trackingUrl,
    deliveryNote,
    isPickup,
  });
}
