import { createAdminClient } from "../../utils/supabase/admin";
import { Users2, Store, Package, DollarSign } from "lucide-react";
import Link from "next/link";

export default async function AdminOverviewPage() {
  const supabase = createAdminClient();

  // Fetch counts in parallel and avoid failing the page when one query errors
  const results = await Promise.allSettled([
    supabase.from("waitlist").select("*", { count: "exact", head: true }),
    supabase.from("stores").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
  ]);

  const [waitlistCount, storeCount, productCount, orderCount] = results.map(
    (result, index) => {
      if (result.status === "fulfilled") {
        return result.value.count || 0;
      }

      console.error(
        `Admin stats query failed for index ${index}:`,
        result.reason,
      );
      return 0;
    },
  );

  const stats = [
    {
      name: "Total Waitlist",
      value: waitlistCount || 0,
      icon: Users2,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      href: "/admin/waitlist",
    },
    {
      name: "Registered Stores",
      value: storeCount || 0,
      icon: Store,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      href: "/admin/merchants",
    },
    {
      name: "Total Products",
      value: productCount || 0,
      icon: Package,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      href: "/admin/merchants", // Could link to a products page if added later
    },
    {
      name: "Total Orders",
      value: orderCount || 0,
      icon: DollarSign,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      href: "/admin/transactions",
    },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Platform Overview
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          A high-level view of GoStore's performance and growth.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat) => (
          <Link href={stat.href} key={stat.name} className="block">
            <div className="p-6 rounded-[24px] bg-card border border-border flex flex-col gap-4 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-muted-foreground">
                  {stat.name}
                </p>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg}`}
                >
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <h3 className="text-4xl font-bold tracking-tight text-foreground">
                  {stat.value.toLocaleString()}
                </h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
