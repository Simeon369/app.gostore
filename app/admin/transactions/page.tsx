"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  DollarSign,
  MessageCircle,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import { createClient } from "../../../utils/supabase/client";
import {
  generateShippingMessage,
  generateWhatsAppLink,
  formatWhatsAppNumber,
} from "../../../lib/whatsapp-shipping";

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  status: string;
  created_at: string;
  stores: { name: string; slug: string } | null;
  items: any[];
}

export default function AdminTransactionsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sendingWhatsApp, setSendingWhatsApp] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*, stores(name, slug)")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching orders:", error);
        } else {
          setOrders(data || []);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [supabase]);

  // Calculate platform metrics
  const totalVolume = orders.reduce(
    (sum, order) => sum + (order.total || 0),
    0,
  );
  const platformRevenue = orders.reduce(
    (sum, order) => sum + (order.total || 0) * 0.05,
    0,
  );

  // Orders needing shipping (Paid but not Shipped)
  const ordersNeedingShipping = orders.filter(
    (order) => order.status === "Paid",
  );

  const handleSendWhatsApp = (order: Order) => {
    if (!order.customer_phone) {
      alert("No phone number available for this customer");
      return;
    }

    setSendingWhatsApp(order.id);

    const shippingMessage = generateShippingMessage({
      orderId: order.id,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      storeName: order.stores?.name || "Our Store",
      items: order.items || [],
      total: order.total,
      trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/store/${order.stores?.slug}/track?orderId=${order.id.slice(0, 8).toUpperCase()}`,
    });

    const whatsappLink = generateWhatsAppLink(
      formatWhatsAppNumber(order.customer_phone),
      shippingMessage,
    );

    // Open WhatsApp in new tab
    window.open(whatsappLink, "_blank");

    // Reset after opening
    setTimeout(() => setSendingWhatsApp(null), 1000);
  };

  const handleMarkShipped = async (orderId: string) => {
    try {
      const res = await fetch("/api/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: "Shipped" }),
      });

      if (res.ok) {
        // Update local state
        setOrders(
          orders.map((order) =>
            order.id === orderId ? { ...order, status: "Shipped" } : order,
          ),
        );
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Error updating order status");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Global Transactions & Shipping
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Monitor checkouts and manage manual shipping notifications.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className="p-6 rounded-[24px] bg-card border border-border flex flex-col gap-4 shadow-sm">
          <p className="text-sm font-semibold text-muted-foreground">
            Total Processed Volume
          </p>
          <h3 className="text-4xl font-bold tracking-tight text-foreground">
            ₦{totalVolume.toLocaleString()}
          </h3>
        </div>
        <div className="p-6 rounded-[24px] bg-primary/10 border border-primary/20 flex flex-col gap-4 shadow-sm">
          <p className="text-sm font-semibold text-primary">
            Estimated Platform Revenue (5%)
          </p>
          <h3 className="text-4xl font-bold tracking-tight text-primary">
            ₦{platformRevenue.toLocaleString()}
          </h3>
        </div>
        <div className="p-6 rounded-[24px] bg-amber-500/10 border border-amber-500/20 flex flex-col gap-4 shadow-sm">
          <p className="text-sm font-semibold text-amber-500">
            Awaiting Shipping Notification
          </p>
          <h3 className="text-4xl font-bold tracking-tight text-amber-500">
            {ordersNeedingShipping.length}
          </h3>
        </div>
      </div>

      {/* Orders Needing Shipping */}
      {ordersNeedingShipping.length > 0 && (
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSendWhatsApp(order)}
                          disabled={sendingWhatsApp === order.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 text-xs font-medium"
                          title="Send shipping notification via WhatsApp"
                        >
                          {sendingWhatsApp === order.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <MessageCircle className="w-3.5 h-3.5" />
                          )}
                          WhatsApp
                        </button>
                        <button
                          onClick={() => handleMarkShipped(order.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors text-xs font-medium"
                          title="Mark order as shipped"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
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

      {/* All Transactions */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border bg-muted/50">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            All Transactions ({orders.length})
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
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders && orders.length > 0 ? (
                orders.map((order) => (
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No transactions found.
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
