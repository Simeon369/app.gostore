import type { DeliveryMethod } from "./types";

export function getDeliveryMethodLabel(method?: DeliveryMethod | string | null): string {
  if (method === "pickup") return "Pickup";
  if (method === "dispatch") return "Dispatch";
  return "Dispatch (legacy)";
}

export function formatOrderDeliveryFee(
  deliveryFee: number,
  deliveryMethod?: DeliveryMethod | string | null,
): string {
  if (deliveryMethod === "pickup") return "Free (pickup)";
  if (deliveryMethod === "dispatch" && Number(deliveryFee) === 0) {
    return "Paid to rider on arrival";
  }
  return `₦${Number(deliveryFee).toLocaleString()}`;
}
