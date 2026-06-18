"use client";

import { useState } from "react";
import { Menu, X, ShieldCheck } from "lucide-react";
import { AdminSidebar } from "./sidebar";
import { motion, AnimatePresence } from "framer-motion";

export function AdminHeader({ user }: { user: any }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="h-16 lg:h-20 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 lg:px-10 shrink-0 sticky top-0 z-40">
        
        {/* Mobile Left: Menu Toggle & Title */}
        <div className="flex items-center gap-3 lg:hidden">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-muted-foreground" />
            <span className="font-bold text-sm tracking-tight text-foreground">Admin</span>
          </div>
        </div>

        {/* Desktop Left: Title/Breadcrumb area (optional) */}
        <div className="hidden lg:flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Super Admin Console</h1>
        </div>

        {/* Right side: User Profile / Actions */}
        <div className="flex items-center gap-3 md:gap-4">
           {/* Add global search or notifications here in the future */}
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Drawer */}
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-background border-r border-border z-50 lg:hidden shadow-2xl"
            >
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <AdminSidebar user={user} onNavigate={() => setMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
