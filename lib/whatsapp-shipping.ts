/**
 * WhatsApp Shipping Message Generation
 * Generates prefilled WhatsApp messages for order shipping updates
 */

export interface ShippingMessageData {
  orderId: string;
  customerName: string;
  customerPhone: string;
  storeName: string;
  items: Array<{ name: string; quantity: number }>;
  total: number;
  trackingUrl?: string;
  deliveryNote?: string;
}

export function generateShippingMessage(data: ShippingMessageData): string {
  const itemsList = data.items
    .map((item) => `• ${item.name} x${item.quantity}`)
    .join("\n");

  const trackingLink = data.trackingUrl
    ? `\n\n🔗 Track Order: ${data.trackingUrl}`
    : "";

  const deliveryNote = data.deliveryNote ? `\n\n📝 ${data.deliveryNote}` : "";

  const message = `
Hi ${data.customerName} 👋

Great news! Your order from *${data.storeName}* has been shipped! 🚚

*Order Details:*
Order ID: #${data.orderId.slice(0, 8).toUpperCase()}

*Items:*
${itemsList}

*Total: ₦${data.total.toLocaleString()}*${trackingLink}${deliveryNote}

Thank you for shopping with us! 🙏
`.trim();

  return message;
}

export function generateWhatsAppLink(
  phoneNumber: string,
  message: string,
): string {
  // Format phone number for WhatsApp (remove non-digits, add country code if needed)
  const cleanPhone = phoneNumber.replace(/\D/g, "");
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

export function formatWhatsAppNumber(phone: string): string {
  // Remove all non-digit characters
  return phone.replace(/\D/g, "");
}
