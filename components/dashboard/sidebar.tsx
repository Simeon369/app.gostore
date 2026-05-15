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

export function Sidebar({ user, onNavigate }: { user: any; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex flex-col h-full p-6">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <Image
          src="/gostore-logo.png"
          alt="GoStore"
          width={32}
          height={32}
          className="w-8 h-8"
        />
        <span className="text-xl font-bold tracking-tight">GoStore</span>
      </div>

      {/* Nav Links */}
      <div className="flex-1 px-4 flex flex-col gap-1">
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
          href="/store/luxe"
          target="_blank"
          onClick={onNavigate}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-semibold text-[15px] border text-muted-foreground hover:bg-primary/10 hover:text-primary border-transparent hover:border-primary/20 group"
        >
          <ExternalLink className="w-5 h-5" />
          View Store
        </Link>
      </div>


      {/* User & Logout */}
      <div className="p-4 border-t border-border">
        <div className="px-4 mb-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Account</p>
          <p className="text-sm font-medium truncate text-foreground">{user.email}</p>
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
