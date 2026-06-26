"use client";

import { CreditCard, Lock } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="flex flex-col gap-10 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-1 text-foreground">
            Billing & Subscription
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Manage your store's active subscription and billing details.
          </p>
        </div>
      </div>

      <div className="relative border border-border bg-card rounded-[40px] overflow-hidden min-h-[500px]">
        {/* Blurred background content mimicking a billing page */}
        <div className="absolute inset-0 p-8 flex flex-col gap-8 opacity-20 filter blur-[8px] pointer-events-none select-none">
          <div className="flex gap-4">
            <div className="h-32 w-full sm:w-1/3 bg-foreground/10 rounded-3xl"></div>
            <div className="h-32 w-full sm:w-1/3 bg-foreground/10 rounded-3xl"></div>
            <div className="h-32 w-full sm:w-1/3 bg-foreground/10 rounded-3xl"></div>
          </div>
          <div className="h-16 w-full bg-foreground/10 rounded-2xl"></div>
          <div className="h-64 w-full bg-foreground/10 rounded-3xl"></div>
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/30 backdrop-blur-[2px] p-6 text-center z-10">
          <div className="w-24 h-24 rounded-full brand-gradient flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(158,226,55,0.4)]">
            <Lock className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-black text-foreground mb-4">
            Subscription Billing
          </h2>
          <p className="text-muted-foreground text-base lg:text-lg max-w-md mx-auto font-medium leading-relaxed">
            We are rolling out our new ₦1,500/month subscription model very soon. This is where you will manage your store's access and view your payment history.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-muted border border-border text-foreground font-black text-sm tracking-widest uppercase">
            <CreditCard className="w-4 h-4" /> Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
}
