"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  BarChart3, 
  Settings, 
  LogOut,
  Package,
  ExternalLink,
  Store,
  ShieldCheck
} from "lucide-react";
import { cn } from "../../utils/cn";
import { createClient } from "../../utils/supabase/client";
import { useRouter } from "next/navigation";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { name: "Products", href: "/dashboard/products", icon: Package },
  { name: "Payouts", href: "/dashboard/payouts", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar({ user, store, onNavigate }: { user: any; store: any; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const storeUrl = store ? `/store/${store.slug}` : "/onboarding";

  return (
    <div className="flex flex-col h-full p-6">
      {/* Logo / Store Name */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center overflow-hidden">
          {store?.logo ? (
            <Image src={store.logo} alt={store.name} width={32} height={32} className="w-full h-full object-cover" />
          ) : (
            <Store className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black tracking-tight leading-none truncate max-w-[140px]">
            {store?.name || "GoStore"}
          </span>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Vendor</span>
        </div>
      </div>

      {/* Nav Links */}
      <div className="flex-1 px-2 flex flex-col gap-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-semibold text-[15px] border",
                isActive 
                  ? "bg-primary/10 text-primary border-primary/20" 
                  : "text-muted-foreground hover:bg-muted border-transparent hover:border-border"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}

        <div className="h-px bg-border my-2" />

        <Link
          href={storeUrl}
          target="_blank"
          onClick={onNavigate}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-semibold text-[15px] border text-muted-foreground hover:bg-primary/10 hover:text-primary border-transparent hover:border-primary/20 group"
        >
          <ExternalLink className="w-5 h-5" />
          View Store
        </Link>

        {user?.email === "gostoreng@gmail.com" && (
          <Link
            href="/admin"
            onClick={onNavigate}
            className="flex items-center gap-3 px-4 py-3 mt-2 rounded-2xl transition-all font-bold text-[15px] border text-foreground bg-card border-border hover:bg-muted group shadow-lg"
          >
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            Super Admin
          </Link>
        )}
      </div>


      {/* User & Logout */}
      <div className="p-2 border-t border-border">
        <div className="px-4 mb-4 pt-4">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Signed in as</p>
          <p className="text-xs font-bold truncate text-foreground">{user.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-semibold text-[15px]">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
