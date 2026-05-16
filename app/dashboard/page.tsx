"use client";

import { motion } from "framer-motion";
import { Store, ShoppingBag, Eye, TrendingUp, ArrowUpRight, ArrowDownRight, Plus, Copy, Check, MessageCircle, Share2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function DashboardPage() {
  const supabase = createClient();
  const [copied, setCopied] = useState<string | null>(null);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch store
      const { data: store } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!store) return { store: null };

      // Fetch orders for this store
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', store.id);

      // Calculate stats
      const totalSales = orders?.reduce((acc, order) => acc + (order.status === 'Paid' ? Number(order.total) : 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const totalViews = store.visits || 0;

      // Group orders by source (simulating platform breakdown)
      const platformBreakdown = [
        {
          platform: "WhatsApp",
          color: "bg-emerald-500",
          lightColor: "bg-emerald-500/10",
          textColor: "text-emerald-500",
          sales: orders?.filter(o => o.source === 'WhatsApp' && o.status === 'Paid').reduce((acc, o) => acc + Number(o.total), 0) || 0,
          orders: orders?.filter(o => o.source === 'WhatsApp').length || 0,
          views: Math.floor(totalViews * 0.4), // Simulated breakdown for now
        },
        {
          platform: "Instagram",
          color: "bg-pink-500",
          lightColor: "bg-pink-500/10",
          textColor: "text-pink-500",
          sales: orders?.filter(o => o.source === 'Instagram' && o.status === 'Paid').reduce((acc, o) => acc + Number(o.total), 0) || 0,
          orders: orders?.filter(o => o.source === 'Instagram').length || 0,
          views: Math.floor(totalViews * 0.3),
        },
        {
          platform: "TikTok",
          color: "bg-sky-400",
          lightColor: "bg-sky-400/10",
          textColor: "text-sky-400",
          sales: orders?.filter(o => o.source === 'TikTok' && o.status === 'Paid').reduce((acc, o) => acc + Number(o.total), 0) || 0,
          orders: orders?.filter(o => o.source === 'TikTok').length || 0,
          views: Math.floor(totalViews * 0.3),
        },
      ];

      return {
        store,
        totalSales,
        totalOrders,
        totalViews,
        platformBreakdown
      };
    }
  });

  const copyLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dashboardData?.store) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-2">
          <Store className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-foreground">No store found</h2>
          <p className="text-muted-foreground mt-1">You haven't set up your storefront yet.</p>
        </div>
        <Link 
          href="/onboarding" 
          className="px-8 py-4 rounded-2xl brand-gradient text-primary-foreground font-bold shadow-[0_0_20px_rgba(158,226,55,0.2)] hover:scale-105 transition-all"
        >
          Setup My Store 🚀
        </Link>
      </div>
    );
  }

  const { 
    store, 
    totalSales = 0, 
    totalOrders = 0, 
    totalViews = 0, 
    platformBreakdown = [] 
  } = dashboardData;
  const storeUrl = `https://gostore.ee/${store.slug}`;

  const socialLinks = [
    { id: "wa", label: "WhatsApp", icon: MessageCircle, color: "text-emerald-500", bg: "bg-emerald-500/10", borderActive: "border-emerald-500/30", url: `${storeUrl}?src=wa` },
    { id: "ig", label: "Instagram", icon: Share2, color: "text-pink-500", bg: "bg-pink-500/10", borderActive: "border-pink-500/30", url: `${storeUrl}?src=ig` },
    { id: "tt", label: "TikTok", icon: Share2, color: "text-sky-400", bg: "bg-sky-400/10", borderActive: "border-sky-400/30", url: `${storeUrl}?src=tt` },
  ];

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2 italic">
            {store?.name || "Overview"}
          </h1>
          <p className="text-muted-foreground font-medium">Here&apos;s how your store is performing today.</p>
        </div>
        <Link
          href="/dashboard/products"
          className="px-5 py-3 rounded-2xl brand-gradient text-primary-foreground text-sm font-bold shadow-[0_0_20px_rgba(158,226,55,0.2)] hover:shadow-[0_0_30px_rgba(158,226,55,0.4)] transition-all flex items-center gap-2 w-fit"
        >
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {/* Today's 3 KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Today's Sales */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="glass-card rounded-[32px] p-4 lg:p-8 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-emerald-500 text-xs font-black">
              <ArrowUpRight className="w-3.5 h-3.5" /> +18%
            </div>
          </div>
          <div>
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total Sales</p>
            <h3 className="text-3xl font-black mt-1 text-foreground">₦{totalSales.toLocaleString()}</h3>
          </div>
          {/* Platform breakdown bar */}
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
            {platformBreakdown.map((p) => (
              <div
                key={p.platform}
                className={`${p.color} rounded-full`}
                style={{ flex: Math.max(p.sales, 1) }}
              />
            ))}
          </div>
          <div className="flex items-center gap-4">
            {platformBreakdown.map((p) => (
              <div key={p.platform} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${p.color}`} />
                <span className="text-[10px] font-bold text-muted-foreground">{p.platform}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Today's Orders */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="glass-card rounded-[32px] p-4 lg:p-8 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-muted text-muted-foreground">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-emerald-500 text-xs font-black">
              <ArrowUpRight className="w-3.5 h-3.5" /> +3 today
            </div>
          </div>
          <div>
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total Orders</p>
            <h3 className="text-3xl font-black mt-1 text-foreground">{totalOrders}</h3>
          </div>
          <div className="flex flex-col gap-2 mt-auto">
            {platformBreakdown.map((p) => (
              <div key={p.platform} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${p.color}`} />
                  <span className="text-xs font-bold text-muted-foreground">{p.platform}</span>
                </div>
                <span className={`text-xs font-black ${p.textColor}`}>{p.orders} orders</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Today's Views */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="glass-card rounded-[32px] p-4 lg:p-8 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-muted text-muted-foreground">
              <Eye className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-orange-400 text-xs font-black">
              <ArrowDownRight className="w-3.5 h-3.5" /> -5% vs yesterday
            </div>
          </div>
          <div>
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total Views</p>
            <h3 className="text-3xl font-black mt-1 text-foreground">{totalViews.toLocaleString()}</h3>
          </div>
          <div className="flex flex-col gap-2 mt-auto">
            {platformBreakdown.map((p) => (
              <div key={p.platform} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${p.color}`} />
                  <span className="text-xs font-bold text-muted-foreground">{p.platform}</span>
                </div>
                <span className={`text-xs font-black ${p.textColor}`}>{p.views.toLocaleString()} views</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Share Your Store */}
      <div className="glass-card rounded-2xl lg:rounded-[32px] p-4 lg:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="font-black text-foreground text-sm">Share your store link</p>
          <p className="text-xs text-muted-foreground mt-0.5">Copy your tracked link and paste it on your socials</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {socialLinks.map((s) => (
            <button
              key={s.id}
              onClick={() => copyLink(s.id, s.url)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-xs font-bold",
                copied === s.id
                  ? `${s.bg} ${s.borderActive} ${s.color}`
                  : "bg-muted border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              )}
            >
              {copied === s.id ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Per-Platform Deep Dive */}
      <div>
        <h2 className="text-base lg:text-lg font-black text-foreground mb-4">Breakdown by Platform</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {platformBreakdown.map((p, i) => (
            <motion.div
              key={p.platform}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="glass-card rounded-[32px] p-4 lg:p-6 flex flex-col gap-5"
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${p.color}`} />
                <p className="font-black text-foreground">{p.platform}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className={`${p.lightColor} rounded-2xl p-3 flex flex-col gap-1`}>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Sales</p>
                  <p className={`text-sm font-black ${p.textColor}`}>₦{(p.sales / 1000).toFixed(0)}k</p>
                </div>
                <div className={`${p.lightColor} rounded-2xl p-3 flex flex-col gap-1`}>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Orders</p>
                  <p className={`text-sm font-black ${p.textColor}`}>{p.orders}</p>
                </div>
                <div className={`${p.lightColor} rounded-2xl p-3 flex flex-col gap-1`}>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Views</p>
                  <p className={`text-sm font-black ${p.textColor}`}>{p.views >= 1000 ? `${(p.views / 1000).toFixed(1)}k` : p.views}</p>
                </div>
              </div>

              {/* Conversion rate */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Conversion</span>
                <span className={`text-sm font-black ${p.textColor}`}>
                  {p.views > 0 ? ((p.orders / p.views) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
