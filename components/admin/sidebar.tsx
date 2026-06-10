"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Users2, 
  DollarSign, 
  Settings, 
  LogOut,
  ShieldCheck,
  ArrowLeft
} from "lucide-react";
import { cn } from "../../utils/cn";
import { createClient } from "../../utils/supabase/client";
import { useRouter } from "next/navigation";

const navigation = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Waitlist", href: "/admin/waitlist", icon: Users2 },
  { name: "Merchants", href: "/admin/merchants", icon: Users },
  { name: "Transactions", href: "/admin/transactions", icon: DollarSign },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar({ user, onNavigate }: { user: any; onNavigate?: () => void }) {
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
      {/* Logo / Title */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
          <ShieldCheck className="w-5 h-5 text-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black tracking-tight leading-none text-foreground">
            Super Admin
          </span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">GoStore Root</span>
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
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-semibold text-[15px] border text-muted-foreground hover:bg-muted border-transparent hover:border-border group"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </Link>
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
