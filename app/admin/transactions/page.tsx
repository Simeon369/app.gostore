import { createAdminClient } from "../../../utils/supabase/admin";
import { formatDistanceToNow } from "date-fns";
import { DollarSign } from "lucide-react";
import { redirect } from "next/navigation";

export default async function AdminTransactionsPage() {
  let supabase;

  try {
    supabase = createAdminClient();
  } catch (error) {
    console.error("Admin transactions init error:", error);
    redirect("/dashboard");
  }

  // Fetch all orders
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*, stores(name, slug)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
  }

  // Calculate platform metrics
  const totalVolume =
    orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
  const platformRevenue =
    orders?.reduce((sum, order) => sum + (order.total || 0) * 0.05, 0) || 0;

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Global Transactions
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Monitor all checkouts happening across the platform in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
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
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Order ID</th>
                <th className="px-6 py-4 font-semibold">Store</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Fee (5%)</th>
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
                      {order.id.slice(0, 8)}...
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
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(order.created_at), {
                        addSuffix: true,
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
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
