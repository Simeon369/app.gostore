"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  DollarSign,
  MessageCircle,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Package,
  Truck,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import {
  generateShippingMessageForOrder,
  generateVendorPaidNotification,
  generateCustomerPaymentConfirmedMessage,
  generateWhatsAppLink,
  formatWhatsAppNumber,
} from "@/lib/whatsapp-messages";
import { calculatePlatformFee, calculateVendorPayout } from "@/lib/commission";
import { getDeliveryMethodLabel } from "@/lib/delivery-utils";

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_address: string | null;
  total: number;
  delivery_fee: number;
  delivery_method?: string | null;
  status: string;
  source: string | null;
  created_at: string;
  payment_reference: string | null;
  payout_amount: number | null;
  platform_fee: number | null;
  payout_status: string | null;
  settled_at: string | null;
  settlement_reference: string | null;
  vendor_notified_at: string | null;
  customer_paid_notified_at: string | null;
  whatsapp_sent?: boolean;
  rejection_reason?: string | null;
  stores: {
    name: string;
    slug: string;
    whatsapp: string | null;
    bank_name: string | null;
    account_number: string | null;
    account_name: string | null;
  } | null;
  items: Array<{
    productId?: string;
    name?: string;
    quantity: number;
    price?: number;
    variants?: Record<string, string>;
  }>;
}

type TabId =
  | "review"
  | "awaiting_shipment"
  | "shipped"
  | "completed"
  | "rejected";

interface TransactionsClientProps {
  orders: Order[];
}

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "review", label: "Review Payments", icon: Clock },
  { id: "awaiting_shipment", label: "Awaiting Shipment", icon: Package },
  { id: "shipped", label: "Shipped", icon: Truck },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
  { id: "rejected", label: "Rejected", icon: XCircle },
];

export default function TransactionsClient({
  orders: initialOrders,
}: TransactionsClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [activeTab, setActiveTab] = useState<TabId>("review");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [receiptUrls, setReceiptUrls] = useState<Record<string, string>>({});

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const tabOrders = useMemo(() => {
    switch (activeTab) {
      case "review":
        return orders.filter((o) => o.status === "Pending");
      case "awaiting_shipment":
        return orders.filter((o) => o.status === "Paid");
      case "shipped":
        return orders.filter((o) => o.status === "Shipped" && !o.whatsapp_sent);
      case "completed":
        return orders.filter((o) => o.status === "Shipped" && o.whatsapp_sent);
      case "rejected":
        return orders.filter((o) => o.status === "Rejected");
      default:
        return orders;
    }
  }, [orders, activeTab]);

  const tabCounts = useMemo(
    () => ({
      review: orders.filter((o) => o.status === "Pending").length,
      awaiting_shipment: orders.filter((o) => o.status === "Paid").length,
      shipped: orders.filter((o) => o.status === "Shipped" && !o.whatsapp_sent)
        .length,
      completed: orders.filter((o) => o.status === "Shipped" && o.whatsapp_sent)
        .length,
      rejected: orders.filter((o) => o.status === "Rejected").length,
    }),
    [orders],
  );

  const loadReceipt = async (orderId: string) => {
    if (receiptUrls[orderId]) return;
    try {
      const res = await fetch(`/api/admin/orders/receipt-url?orderId=${orderId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReceiptUrls((prev) => ({ ...prev, [orderId]: data.url }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load receipt";
      toast.error(message);
    }
  };

  const handleConfirm = async (order: Order) => {
    setLoadingId(order.id);
    try {
      const res = await fetch("/api/admin/orders/confirm-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                status: "Paid",
                payout_status: "unsettled",
                payout_amount: data.payoutAmount,
                platform_fee: data.platformFee,
                settled_at: null,
              }
            : o,
        ),
      );

      setActiveTab("awaiting_shipment");
      setExpandedId(order.id);
      toast.success(
        "Payment confirmed. Send WhatsApp notifications to the vendor and customer.",
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to confirm";
      toast.error(message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleSendVendorWhatsApp = async (order: Order) => {
    if (!order.stores?.whatsapp) {
      toast.error("No vendor WhatsApp number on file");
      return;
    }

    const message = generateVendorPaidNotification(order, {
      name: order.stores.name,
      slug: order.stores.slug,
      whatsapp: order.stores.whatsapp,
    });
    const link = generateWhatsAppLink(
      formatWhatsAppNumber(order.stores.whatsapp),
      message,
    );
    window.open(link, "_blank");

    try {
      const res = await fetch("/api/orders/mark-whatsapp-sent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, type: "payment_vendor" }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? { ...o, vendor_notified_at: new Date().toISOString() }
              : o,
          ),
        );
      }
    } catch {
      // WhatsApp opened; marking sent is best-effort
    }
  };

  const handleSendCustomerPaidWhatsApp = async (order: Order) => {
    if (!order.customer_phone) {
      toast.error("No customer phone number");
      return;
    }

    const message = generateCustomerPaymentConfirmedMessage(order, {
      name: order.stores?.name || "GoStore",
      slug: order.stores?.slug,
    });
    const link = generateWhatsAppLink(
      formatWhatsAppNumber(order.customer_phone),
      message,
    );
    window.open(link, "_blank");

    try {
      const res = await fetch("/api/orders/mark-whatsapp-sent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, type: "payment_customer" }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? { ...o, customer_paid_notified_at: new Date().toISOString() }
              : o,
          ),
        );
      }
    } catch {
      // WhatsApp opened; marking sent is best-effort
    }
  };

  const handleReject = async (order: Order) => {
    const reason = window.prompt(
      "Reason for rejection (optional):",
      "Payment could not be verified",
    );
    if (reason === null) return;

    setLoadingId(order.id);
    try {
      const res = await fetch("/api/admin/orders/reject-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, rejectionReason: reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Order rejected");
      window.location.reload();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reject";
      toast.error(message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleSendShippingWhatsApp = (order: Order) => {
    if (!order.customer_phone) {
      toast.error("No customer phone number");
      return;
    }

    const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/store/${order.stores?.slug}/track?orderId=${order.id.split("-")[0].toUpperCase()}`;
    const message = generateShippingMessageForOrder(
      order,
      { name: order.stores?.name || "GoStore", slug: order.stores?.slug },
      trackingUrl,
    );
    const link = generateWhatsAppLink(
      formatWhatsAppNumber(order.customer_phone),
      message,
    );
    window.open(link, "_blank");
  };

  const handleMarkShippingSent = async (orderId: string) => {
    setLoadingId(orderId);
    try {
      const res = await fetch("/api/orders/mark-whatsapp-sent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, type: "shipping" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success("Marked shipping message as sent");
      window.location.reload();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update";
      toast.error(message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleMarkAsSettled = async (order: Order) => {
    setLoadingId(order.id);
    try {
      const res = await fetch("/api/admin/orders/settle-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                payout_status: "settled",
                payout_amount: data.payoutAmount,
                platform_fee: data.platformFee,
                settled_at: data.settledAt,
              }
            : o,
        ),
      );

      toast.success("Vendor payout marked as settled");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to settle";
      toast.error(message);
    } finally {
      setLoadingId(null);
    }
  };

  const toggleExpand = (order: Order) => {
    const next = expandedId === order.id ? null : order.id;
    setExpandedId(next);
    if (next && order.status === "Pending") {
      loadReceipt(order.id);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Transactions Command Center
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Confirm payments, notify vendors and customers, and manage shipping.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const count = tabCounts[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted border border-border"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    activeTab === tab.id
                      ? "bg-primary-foreground/20"
                      : "bg-muted"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4">
        {tabOrders.length === 0 ? (
          <div className="p-12 text-center bg-card border border-border rounded-2xl">
            <p className="text-muted-foreground text-sm">
              No orders in this queue.
            </p>
          </div>
        ) : (
          tabOrders.map((order) => {
            const isExpanded = expandedId === order.id;
            const fee =
              order.platform_fee ?? calculatePlatformFee(Number(order.total));
            const payout =
              order.payout_amount ?? calculateVendorPayout(Number(order.total));
            const isLoading = loadingId === order.id;

            return (
              <div
                key={order.id}
                className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => toggleExpand(order)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                    <span className="font-mono text-xs text-muted-foreground">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="font-semibold text-foreground">
                      {order.customer_name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {order.stores?.name}
                    </span>
                    <span className="font-bold text-foreground">
                      ₦{Number(order.total).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {formatDistanceToNow(new Date(order.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-border pt-4 flex flex-col gap-6">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                          Customer
                        </p>
                        <p className="font-semibold">{order.customer_name}</p>
                        <p className="text-muted-foreground">
                          {order.customer_phone || "No phone"}
                        </p>
                        <p className="text-muted-foreground text-xs mt-1">
                          {order.delivery_method === "pickup"
                            ? "Pickup at vendor store"
                            : order.customer_address}
                        </p>
                        <p className="text-[10px] font-bold text-primary mt-1 uppercase tracking-wider">
                          {getDeliveryMethodLabel(order.delivery_method)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                          Vendor
                        </p>
                        <p className="font-semibold">{order.stores?.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {order.stores?.bank_name}
                        </p>
                        {order.stores?.account_number ? (
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(
                                order.stores!.account_number!,
                                "Account number",
                              )
                            }
                            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-foreground hover:text-primary transition-colors mt-0.5"
                          >
                            {order.stores.account_number}
                            <Copy className="w-3 h-3" />
                          </button>
                        ) : (
                          <p className="text-muted-foreground text-xs">
                            No account number
                          </p>
                        )}
                        <p className="text-muted-foreground text-xs mt-0.5">
                          {order.stores?.account_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                          Amounts
                        </p>
                        <p>
                          Total:{" "}
                          <span className="font-bold">
                            ₦{Number(order.total).toLocaleString()}
                          </span>
                        </p>
                        <p className="text-emerald-500">
                          Fee (5%): ₦{fee.toLocaleString()}
                        </p>
                        <p className="text-primary font-bold">
                          Vendor payout: ₦{payout.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {order.status === "Pending" && receiptUrls[order.id] && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                          Payment Receipt
                        </p>
                        <a
                          href={receiptUrls[order.id]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary font-bold hover:underline"
                        >
                          <Eye className="w-4 h-4" /> View receipt
                        </a>
                        <div className="mt-3 rounded-xl overflow-hidden border border-border max-w-xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={receiptUrls[order.id]}
                            alt="Receipt"
                            className="w-full h-auto max-h-64 object-contain bg-muted"
                          />
                        </div>
                      </div>
                    )}

                    {order.status === "Pending" && !receiptUrls[order.id] && (
                      <button
                        onClick={() => loadReceipt(order.id)}
                        className="inline-flex items-center gap-2 text-sm text-primary font-bold"
                      >
                        <Eye className="w-4 h-4" /> Load receipt
                      </button>
                    )}

                    {order.status === "Rejected" && order.rejection_reason && (
                      <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-xl">
                        {order.rejection_reason}
                      </p>
                    )}

                    {(order.status === "Paid" || order.status === "Shipped") &&
                      order.payout_status !== "settled" && (
                        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <p className="text-xs font-black uppercase tracking-widest text-amber-600">
                            Vendor payout — transfer ₦{payout.toLocaleString()}{" "}
                            then mark as settled
                          </p>
                          <button
                            onClick={() => handleMarkAsSettled(order)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 text-sm font-bold disabled:opacity-50 whitespace-nowrap"
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            Mark as Settled
                          </button>
                        </div>
                      )}

                    {order.payout_status === "settled" && (
                      <p className="text-xs font-bold text-emerald-500">
                        Payout settled
                        {order.settled_at &&
                          ` · ${new Date(order.settled_at).toLocaleString()}`}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {order.status === "Pending" && (
                        <>
                          <button
                            onClick={() => handleConfirm(order)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-sm font-bold disabled:opacity-50"
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            Confirm Payment
                          </button>
                          <button
                            onClick={() => handleReject(order)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-sm font-bold disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}

                      {order.status === "Paid" && (
                        <div className="w-full p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col gap-3">
                          <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
                            Notify vendor &amp; customer
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleSendVendorWhatsApp(order)}
                              disabled={!order.stores?.whatsapp}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-sm font-bold disabled:opacity-40"
                            >
                              <MessageCircle className="w-4 h-4" />
                              WhatsApp Vendor
                            </button>
                            <button
                              onClick={() => handleSendCustomerPaidWhatsApp(order)}
                              disabled={!order.customer_phone}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 text-sm font-bold disabled:opacity-40"
                            >
                              <MessageCircle className="w-4 h-4" />
                              WhatsApp Customer
                            </button>
                          </div>
                        </div>
                      )}

                      {order.status === "Shipped" && !order.whatsapp_sent && (
                        <>
                          <button
                            onClick={() => handleSendShippingWhatsApp(order)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-sm font-bold"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Send Shipping WhatsApp
                          </button>
                          <button
                            onClick={() => handleMarkShippingSent(order.id)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 text-sm font-bold disabled:opacity-50"
                          >
                            Mark Sent
                          </button>
                        </>
                      )}

                      {order.vendor_notified_at && (
                        <span className="text-xs text-emerald-500 font-bold self-center">
                          Vendor notified
                        </span>
                      )}
                      {order.customer_paid_notified_at && (
                        <span className="text-xs text-emerald-500 font-bold self-center">
                          Customer notified
                        </span>
                      )}
                      {order.whatsapp_sent && (
                        <span className="text-xs text-emerald-500 font-bold self-center">
                          Shipping message sent
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5" /> All Orders ({orders.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Store</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">
                    {order.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3">{order.stores?.name}</td>
                  <td className="px-4 py-3 font-bold">
                    ₦{Number(order.total).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-md ${
                        order.status === "Paid"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : order.status === "Shipped"
                            ? "bg-blue-500/10 text-blue-500"
                            : order.status === "Pending"
                              ? "bg-orange-500/10 text-orange-500"
                              : order.status === "Rejected"
                                ? "bg-red-500/10 text-red-500"
                                : "bg-gray-500/10 text-gray-500"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {order.payout_status === "settled"
                      ? `₦${Number(order.payout_amount || 0).toLocaleString()}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
