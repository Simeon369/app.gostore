"use client";

import { motion } from "framer-motion";
import { ShoppingBag, Eye, TrendingUp, ArrowUpRight, ArrowDownRight, Plus, Copy, Check, MessageCircle, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/utils/cn";

const platformData = [
  {
    platform: "WhatsApp",
    color: "bg-emerald-500",
    lightColor: "bg-emerald-500/10",
    textColor: "text-emerald-500",
    sales: 85000,
    orders: 6,
    views: 312,
  },
  {
    platform: "Instagram",
    color: "bg-pink-500",
    lightColor: "bg-pink-500/10",
    textColor: "text-pink-500",
    sales: 42000,
    orders: 3,
    views: 841,
  },
  {
    platform: "TikTok",
    color: "bg-sky-400",
    lightColor: "bg-sky-400/10",
    textColor: "text-sky-400",
    sales: 28000,
    orders: 2,
    views: 2043,
  },
];

const totalSales = platformData.reduce((a, b) => a + b.sales, 0);
const totalOrders = platformData.reduce((a, b) => a + b.orders, 0);
const totalViews = platformData.reduce((a, b) => a + b.views, 0);

const storeSlug = "luxe";
const storeUrl = `https://gostore.ee/${storeSlug}`;

const socialLinks = [
  { id: "wa", label: "WhatsApp", icon: MessageCircle, color: "text-emerald-500", bg: "bg-emerald-500/10", borderActive: "border-emerald-500/30", url: `${storeUrl}?src=wa` },
  { id: "ig", label: "Instagram", icon: Share2, color: "text-pink-500", bg: "bg-pink-500/10", borderActive: "border-pink-500/30", url: `${storeUrl}?src=ig` },
  { id: "tt", label: "TikTok", icon: Share2, color: "text-sky-400", bg: "bg-sky-400/10", borderActive: "border-sky-400/30", url: `${storeUrl}?src=tt` },
];

export default function DashboardPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2 italic">Overview</h1>
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
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Today&apos;s Sales</p>
            <h3 className="text-3xl font-black mt-1 text-foreground">₦{totalSales.toLocaleString()}</h3>
          </div>
          {/* Platform breakdown bar */}
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
            {platformData.map((p) => (
              <div
                key={p.platform}
                className={`${p.color} rounded-full`}
                style={{ flex: p.sales }}
              />
            ))}
          </div>
          <div className="flex items-center gap-4">
            {platformData.map((p) => (
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
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Today&apos;s Orders</p>
            <h3 className="text-3xl font-black mt-1 text-foreground">{totalOrders}</h3>
          </div>
          <div className="flex flex-col gap-2 mt-auto">
            {platformData.map((p) => (
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
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Today&apos;s Views</p>
            <h3 className="text-3xl font-black mt-1 text-foreground">{totalViews.toLocaleString()}</h3>
          </div>
          <div className="flex flex-col gap-2 mt-auto">
            {platformData.map((p) => (
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
          {platformData.map((p, i) => (
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
                  {((p.orders / p.views) * 100).toFixed(1)}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
