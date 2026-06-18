"use client";

import { motion } from "framer-motion";
import { DollarSign, ArrowUpRight, TrendingUp, Info } from "lucide-react";
import { MOCK_ORDERS } from "@/lib/mock-data";

export function RevenueCard() {
  // Calculate stats from mock orders
  const totalRevenue = MOCK_ORDERS.reduce((acc, order) => acc + order.total, 0);
  const goStoreFee = totalRevenue * 0.05;
  const netPayout = totalRevenue - goStoreFee;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 rounded-[40px] flex flex-col gap-4 border-primary/20 bg-primary/[0.02]"
      >
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-2xl bg-primary/20 text-primary">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
            <ArrowUpRight className="w-3 h-3" /> +12.5%
          </div>
        </div>
        <div>
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Gross Sales</p>
          <h3 className="text-3xl font-black mt-1">₦{totalRevenue.toLocaleString()}</h3>
        </div>
      </motion.div>

      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-8 rounded-[40px] flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-2xl bg-muted text-muted-foreground">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="group relative z-10">
            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
            <div className="absolute bottom-full right-0 mb-2 w-56 p-4 rounded-2xl bg-popover border border-border text-[11px] text-popover-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl leading-relaxed">
              GoStore takes a flat 5% fee which covers payment processing and platform maintenance. You keep 95% of every sale.
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">GoStore Fee (5%)</p>
          <h3 className="text-3xl font-black mt-1 text-red-500">₦{goStoreFee.toLocaleString()}</h3>
        </div>
      </motion.div>

      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-8 rounded-[40px] flex flex-col gap-4 border-emerald-500/20"
      >
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <CheckBadgeIcon className="w-6 h-6" />
          </div>
        </div>
        <div>
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Net Payout (Vendor)</p>
          <h3 className="text-3xl font-black mt-1 text-emerald-500">₦{netPayout.toLocaleString()}</h3>
        </div>
      </motion.div>
    </div>
  );
}

function CheckBadgeIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="currentColor"
    >
      <path 
        fillRule="evenodd" 
        d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.491 4.491 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" 
        clipRule="evenodd" 
      />
    </svg>
  );
}
