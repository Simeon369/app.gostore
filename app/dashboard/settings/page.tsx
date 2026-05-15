"use client";

import { motion } from "framer-motion";
import { User, Store, Truck, Bell, Shield, LogOut, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { createClient } from "../../../utils/supabase/client";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("store");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const tabs = [
    { id: "store", name: "Store Details", icon: Store },
    { id: "profile", name: "Profile", icon: User },
    { id: "delivery", name: "Delivery Zones", icon: Truck },
    { id: "security", name: "Security", icon: Shield },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight mb-1 italic">Settings</h1>
        <p className="text-muted-foreground font-medium text-sm">Manage your store preferences and account settings.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation - horizontal scroll on mobile */}
        <div className="w-full lg:w-56 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm font-bold ${
                activeTab === tab.id
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "hover:bg-muted text-muted-foreground border border-transparent hover:border-border"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
          
          <div className="h-[1px] bg-border my-4" />
          
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-500/10 text-red-400 transition-all text-sm font-bold border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 glass-card rounded-2xl lg:rounded-[40px] p-4 lg:p-8">
          {activeTab === "store" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6"
            >
              <div>
                <h2 className="text-xl font-bold mb-1">Store Details</h2>
                <p className="text-sm text-muted-foreground">Update your store's public information.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Store Name</label>
                  <input 
                    type="text" 
                    defaultValue="Luxe Premium"
                    className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Subdomain</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      defaultValue="luxe"
                      className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold pr-32 text-foreground"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold pointer-events-none">
                      .gostore.ee
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Store Description</label>
                <textarea 
                  rows={3}
                  defaultValue="Premium hair and beauty products for the modern woman."
                  className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all text-sm resize-none text-foreground"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">WhatsApp Number</label>
                <input 
                  type="text" 
                  defaultValue="2348123456789"
                  className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground"
                />
              </div>

              <div className="h-[1px] bg-border my-2" />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-1 text-foreground">Settlement Account</h3>
                  <p className="text-sm text-muted-foreground">Where your 95% payouts will be sent.</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-xl text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Verified
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Bank Name</label>
                  <select className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold appearance-none text-foreground">
                    <option>Guaranty Trust Bank (GTB)</option>
                    <option>Zenith Bank</option>
                    <option>Access Bank</option>
                    <option>United Bank for Africa (UBA)</option>
                    <option>Opay</option>
                    <option>Moniepoint</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Account Number</label>
                  <input 
                    type="text" 
                    defaultValue="0123456789"
                    maxLength={10}
                    className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Account Name (Auto-verified)</label>
                <input 
                  type="text" 
                  defaultValue="Luxe Premium Enterprise"
                  readOnly
                  className="w-full px-5 py-4 rounded-2xl bg-muted/50 border border-border outline-none transition-all font-bold text-muted-foreground cursor-not-allowed opacity-70"
                />
              </div>

              <div className="mt-4 flex justify-end">
                <button className="w-full sm:w-auto px-6 lg:px-8 py-3 lg:py-4 rounded-[24px] brand-gradient text-primary-foreground font-black flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(158,226,55,0.2)] text-sm">
                  Verify & Save Settlement Details
                </button>
              </div>
            </motion.div>
          )}

          {activeTab !== "store" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center gap-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <Shield className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">Coming Soon</h3>
                <p className="text-muted-foreground text-sm">This section is currently under development.</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
