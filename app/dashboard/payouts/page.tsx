"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft, Building2, CheckCircle2, Clock } from "lucide-react";

export default function PayoutsPage() {
  const mockPayouts = [
    { id: "1", date: "Today, 10:45 AM", amount: 45000, status: "completed", ref: "MON-REF-001X", bank: "Guaranty Trust Bank" },
    { id: "2", date: "Yesterday, 04:20 PM", amount: 12500, status: "completed", ref: "MON-REF-002Y", bank: "Guaranty Trust Bank" },
    { id: "3", date: "May 12, 09:15 AM", amount: 89000, status: "completed", ref: "MON-REF-003Z", bank: "Guaranty Trust Bank" },
    { id: "4", date: "May 10, 02:30 PM", amount: 150000, status: "completed", ref: "MON-REF-004A", bank: "Guaranty Trust Bank" },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight mb-1 italic">Payouts</h1>
        <p className="text-muted-foreground font-medium text-sm">Track your 95% net revenue automatically split to your bank.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        <div className="glass-card p-4 lg:p-8 rounded-2xl lg:rounded-[40px] flex flex-col gap-4 border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total Settled</p>
            <h3 className="text-3xl font-black mt-1 text-emerald-500">₦296,500</h3>
          </div>
        </div>

        <div className="glass-card p-4 lg:p-8 rounded-2xl lg:rounded-[40px] flex flex-col gap-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-muted text-muted-foreground">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Account</p>
              <p className="font-bold text-sm">GTB ••••5678</p>
            </div>
          </div>
          <div className="mt-auto pt-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Payouts are processed instantly upon successful customer payment via Monnify's Split Payment architecture. Your 95% lands directly in your settlement account.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl lg:rounded-[40px] p-4 lg:p-8 flex flex-col gap-6">
        <h3 className="text-xl font-black text-foreground">Completed Splits</h3>
        
        <div className="flex flex-col gap-3">
          {mockPayouts.map((payout) => (
            <motion.div 
              key={payout.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 rounded-2xl bg-muted border border-border hover:border-primary/20 transition-all group cursor-default"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center">
                  <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">Payout to <span className="hidden sm:inline">{payout.bank}</span><span className="sm:hidden">GTB</span></p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground font-medium">{payout.date}</p>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-black text-lg text-emerald-500">+₦{payout.amount.toLocaleString()}</p>
                <p className="text-[10px] font-mono text-muted-foreground mt-1">Ref: {payout.ref}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
