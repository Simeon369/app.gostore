"use client";

import { DollarSign } from "lucide-react";

interface Order {
  id: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
  stores: {
    name: string;
    slug: string;
  } | null;
}

interface TransactionsClientProps {
  orders: Order[];
}

export default function TransactionsClient({
  orders,
}: TransactionsClientProps) {
  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Transactions & Orders
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          View all transactions and orders made across the platform.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5" /> All Orders ({orders.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold">Order ID</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Store</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">
                    {order.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-medium">{order.stores?.name || "—"}</td>
                  <td className="px-4 py-3">{order.customer_name}</td>
                  <td className="px-4 py-3 font-bold">
                    ₦{Number(order.total).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg ${
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
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
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
