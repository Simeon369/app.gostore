"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  DollarSign,
  MessageCircle,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  MoreVertical,
  Copy,
  Phone,
  MapPin,
  User,
  ExternalLink,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import {
  generateShippingMessage,
  generateWhatsAppLink,
  formatWhatsAppNumber,
} from "../../../lib/whatsapp-shipping";

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_address: string | null;
  total: number;
  delivery_fee: number;
  status: string;
  source: string | null;
  created_at: string;
  stores: { name: string; slug: string } | null;
  whatsapp_sent?: boolean;
  items: Array<{
    productId?: string;
    name?: string;
    quantity: number;
    price?: number;
    variants?: Record<string, string>;
  }>;
}

interface TransactionsClientProps {
  orders: Order[];
}

const statusOptions = ["All", "Paid", "Shipped"] as const;

type StatusOption = (typeof statusOptions)[number];

export default function TransactionsClient({
  orders,
}: TransactionsClientProps) {
  const [filter, setFilter] = useState<StatusOption>("All");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [sendingOrderId, setSendingOrderId] = useState<string | null>(null);

  const statusCounts = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        const status = order.status || "Pending";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (filter === "All") return orders;
    return orders.filter((order) => order.status === filter);
  }, [orders, filter]);

  const ordersNeedingShipping = useMemo(
    () => orders.filter((order) => order.status === "Paid"),
    [orders],
  );

  const handleShipOrder = async (orderId: string) => {
    setUpdatingOrderId(orderId);

    try {
      const res = await fetch("/api/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: "Shipped" }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update order status");
      }

      toast.success("Order marked as shipped!");
      window.location.reload();
    } catch (error: any) {
      console.error("Order status update error:", error);
      toast.error(error?.message || "Unable to update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleSendWhatsApp = (order: Order) => {
    if (!order.customer_phone) {
      toast.error("No phone number available for this customer.");
      return;
    }

    setSendingOrderId(order.id);

    const shippingMessage = generateShippingMessage({
      orderId: order.id,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      storeName: order.stores?.name || "GoStore",
      items: order.items || [],
      total: order.total,
      trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/store/${order.stores?.slug}/track?orderId=${order.id.slice(0, 8).toUpperCase()}`,
    });

    const whatsappLink = generateWhatsAppLink(
      formatWhatsAppNumber(order.customer_phone),
      shippingMessage,
    );

    window.open(whatsappLink, "_blank");
    setTimeout(() => setSendingOrderId(null), 600);
  };

  const handleMarkWhatsAppSent = async (orderId: string) => {
    try {
      const res = await fetch("/api/orders/mark-whatsapp-sent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to mark as sent");
      }

      toast.success("Marked message as sent");
      window.location.reload();
    } catch (err: any) {
      console.error("Mark WhatsApp sent error:", err);
      toast.error(err?.message || "Unable to mark message as sent");
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Global Transactions
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          View all orders across the platform and filter by status.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 md:gap-6">
        <div className="p-6 rounded-[24px] bg-card border border-border flex flex-col gap-4 shadow-sm">
          <p className="text-sm font-semibold text-muted-foreground">
            Total orders
          </p>
          <h3 className="text-4xl font-bold tracking-tight text-foreground">
            {orders.length}
          </h3>
        </div>
        {statusOptions.slice(1).map((status) => (
          <div
            key={status}
            className="p-6 rounded-[24px] bg-card border border-border flex flex-col gap-4 shadow-sm"
          >
            <p className="text-sm font-semibold text-muted-foreground">
              {status}
            </p>
            <h3 className="text-4xl font-bold tracking-tight text-foreground">
              {statusCounts[status] || 0}
            </h3>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${
                filter === option
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredOrders.length} orders for "{filter}".
        </div>
      </div>

      {ordersNeedingShipping.length > 0 && filter !== "Shipped" && (
        <div className="bg-card border border-amber-500/20 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-amber-500/10 bg-amber-500/5">
            <h2 className="text-lg font-bold text-amber-500 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Orders Ready for Shipping ({ordersNeedingShipping.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Order ID</th>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Phone</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Store</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ordersNeedingShipping.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      {order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-foreground">
                        {order.customer_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      {order.customer_phone ? (
                        <span>
                          +{formatWhatsAppNumber(order.customer_phone)}
                        </span>
                      ) : (
                        <span className="text-red-500">No phone</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground">
                      ₦{(order.total || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        {order.stores?.name || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap text-xs">
                      {formatDistanceToNow(new Date(order.created_at), {
                        addSuffix: true,
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleShipOrder(order.id)}
                          disabled={updatingOrderId === order.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors disabled:opacity-50 text-xs font-medium"
                          title="Mark order as shipped"
                        >
                          {updatingOrderId === order.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Shipped
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border bg-muted/50">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-5 h-5" /> All Transactions
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Order ID</th>
                <th className="px-6 py-4 font-semibold">Store</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Fee (5%)</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      {order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-foreground">
                        {order.stores?.name || "Unknown Store"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground">
                      ₦{(order.total || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-500">
                      ₦{((order.total || 0) * 0.05).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-md inline-block ${
                          order.status === "Paid"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : order.status === "Shipped"
                              ? "bg-blue-500/10 text-blue-500"
                              : order.status === "Pending"
                                ? "bg-orange-500/10 text-orange-500"
                                : "bg-gray-500/10 text-gray-500"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap text-xs">
                      {formatDistanceToNow(new Date(order.created_at), {
                        addSuffix: true,
                      })}
                    </td>
                    <td className="px-6 py-4">
                      {order.status === "Shipped" ? (
                        <div className="flex items-center gap-2">
                          {!order.whatsapp_sent && (
                            <>
                              <button
                                onClick={() => handleSendWhatsApp(order)}
                                disabled={sendingOrderId === order.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 text-xs font-medium"
                                title="Send order message via WhatsApp"
                              >
                                {sendingOrderId === order.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <MessageCircle className="w-3.5 h-3.5" />
                                )}
                                WhatsApp
                              </button>

                              <button
                                onClick={() => handleMarkWhatsAppSent(order.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors text-xs font-medium"
                                title="Mark message as sent"
                              >
                                Mark Sent
                              </button>
                            </>
                          )}

                          {order.whatsapp_sent && (
                            <span className="text-xs font-bold text-emerald-500">
                              Message sent
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No transactions found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
