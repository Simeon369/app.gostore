"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft, Building2, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function PayoutsPage() {
  const supabase = createClient();

  const { data: store, isLoading } = useQuery({
    queryKey: ['payout-store'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: store } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      return store;
    }
  });

  const mockPayouts = [
    { id: "1", date: "Today, 10:45 AM", amount: 45000, status: "completed", ref: "MON-REF-001X", bank: store?.bank_name || "GTB" },
    { id: "2", date: "Yesterday, 04:20 PM", amount: 12500, status: "completed", ref: "MON-REF-002Y", bank: store?.bank_name || "GTB" },
    { id: "3", date: "May 12, 09:15 AM", amount: 89000, status: "completed", ref: "MON-REF-003Z", bank: store?.bank_name || "GTB" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight mb-1 italic text-foreground">Payouts</h1>
        <p className="text-muted-foreground font-medium text-sm">Track your 95% net revenue automatically split to your bank.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        <div className="glass-card p-6 lg:p-8 rounded-[32px] flex flex-col gap-4 border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Settled</p>
            <h3 className="text-3xl font-black mt-1 text-emerald-500">₦146,500</h3>
          </div>
        </div>

        <div className="glass-card p-6 lg:p-8 rounded-[32px] flex flex-col gap-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-muted text-muted-foreground">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Account</p>
              <p className="font-bold text-sm text-foreground">{store?.bank_name || "Bank not set"}</p>
              <p className="text-xs text-muted-foreground">••••{store?.account_number?.slice(-4) || "0000"}</p>
            </div>
          </div>
          <div className="mt-auto pt-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Payouts are processed instantly upon successful customer payment via Monnify's Split Payment architecture. Your 95% lands directly in your settlement account: <span className="text-foreground font-bold">{store?.account_name}</span>.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-[32px] p-6 lg:p-8 flex flex-col gap-6">
        <h3 className="text-xl font-black text-foreground italic">Completed Splits</h3>
        
        <div className="flex flex-col gap-3">
          {mockPayouts.map((payout) => (
            <motion.div 
              key={payout.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border hover:border-primary/20 transition-all group cursor-default"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center border border-border">
                  <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">Payout to <span className="hidden sm:inline">{payout.bank}</span><span className="sm:hidden">{payout.bank.slice(0,4)}</span></p>
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
