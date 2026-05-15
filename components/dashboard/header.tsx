"use client";

import { Bell, Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { Sidebar } from "./sidebar";

export function Header({ user }: { user: any }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="h-16 lg:h-20 border-b border-border bg-background/50 backdrop-blur-md px-4 lg:px-10 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 hover:bg-muted rounded-xl transition-all"
          >
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>

          <div className="hidden md:flex items-center gap-3 bg-card border border-border px-4 py-2 rounded-2xl w-full max-w-md focus-within:border-primary/50 transition-all group">
            <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search orders, products..."
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground/50 text-foreground"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button className="p-2 hover:bg-muted rounded-xl transition-all relative group">
            <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background" />
          </button>

          <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-foreground leading-tight">{user.user_metadata?.store_name || "New Store"}</p>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Creator</p>
            </div>
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-2xl brand-gradient flex items-center justify-center text-primary-foreground font-bold shadow-lg text-sm">
              {user.email?.[0].toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="relative w-72 h-full bg-background border-r border-border shadow-2xl flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-muted rounded-xl transition-all z-10"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
            <Sidebar user={user} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
