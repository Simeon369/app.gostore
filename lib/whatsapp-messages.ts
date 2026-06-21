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
  const deliveryLine =
    order.delivery_method === "pickup"
      ? `\n*Delivery:* Pickup — customer will collect from your store${store.address_formatted ? `\n*Pickup address:* ${store.address_formatted}` : ""}`
      : `\n*Delivery:* Dispatch — delivery fee paid to rider on arrival`;

  return `
New paid order for *${store.name}*!

*Order ID:* #${orderRef}
*Customer:* ${order.customer_name}
*Phone:* ${order.customer_phone || "N/A"}${deliveryLine}

*Items:*
${formatItemsList(items)}

*Total:* ₦${Number(order.total).toLocaleString()}

Please prepare this order${order.delivery_method === "pickup" ? " for pickup" : " for shipping"}. Mark the order as shipped from your GoStore dashboard when ready.
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
  const deliveryNote =
    order.delivery_method === "pickup"
      ? "You'll collect this order from the vendor's store."
      : "Delivery fee will be paid directly to the rider when your order arrives.";

  return `
Hi ${order.customer_name} 👋

Your payment for order *#${orderRef}* from *${store.name}* has been confirmed!

*Items:*
${formatItemsList(items)}

*Total Paid:* ₦${Number(order.total).toLocaleString()}

${deliveryNote}

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
  const deliveryNote =
    order.delivery_method === "pickup"
      ? store.address_formatted
        ? `Collect from: ${store.address_formatted}`
        : "Your order is ready for pickup at the vendor store."
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
  });
}
