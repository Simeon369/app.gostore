"use client";

import { motion } from "framer-motion";
import { User, Store, Truck, Bell, Shield, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/utils/cn";
import { useQuery } from "@tanstack/react-query";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("store");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const { data: store, isLoading } = useQuery({
    queryKey: ['settings-store'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: store } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      return store;
    }
  });

  const tabs = [
    { id: "store", name: "Store Details", icon: Store },
    { id: "profile", name: "Profile", icon: User },
    { id: "delivery", name: "Delivery Zones", icon: Truck },
    { id: "security", name: "Security", icon: Shield },
  ];

  const [banks, setBanks] = useState<any[]>([]);
  const [selectedBank, setSelectedBank] = useState(store?.bank_code || "");
  const [accountNumber, setAccountNumber] = useState(store?.account_number || "");
  const [accountName, setAccountName] = useState(store?.account_name || "");
  const [isValidating, setIsValidating] = useState(false);

  // Fetch banks on mount
  useEffect(() => {
    fetch('/api/banks')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setBanks(data);
      })
      .catch(err => console.error("Failed to fetch banks:", err));
  }, []);

  // Automatic account validation
  useEffect(() => {
    if (selectedBank && accountNumber.length === 10) {
      const validate = async () => {
        setIsValidating(true);
        try {
          const res = await fetch(`/api/banks/validate?accountNumber=${accountNumber}&bankCode=${selectedBank}`);
          const data = await res.json();
          
          if (!res.ok) {
            throw new Error(data.error || "Validation failed");
          }

          if (data.accountName) {
            setAccountName(data.accountName);
          } else {
            console.warn("Account name not found in response:", data);
          }
        } catch (err) {
          console.error("Validation error:", err);
          // Don't alert here to avoid annoying the user if they're just typing or in sandbox
        } finally {
          setIsValidating(false);
        }
      };
      validate();
    }
  }, [selectedBank, accountNumber]);

  const handleSavePayout = async () => {
    if (!selectedBank || !accountNumber || !accountName) {
      alert("Please fill all bank details");
      return;
    }

    setSaving(true);
    try {
      const bank = banks.find(b => b.code === selectedBank);
      const res = await fetch('/api/payout/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankCode: selectedBank,
          bankName: bank?.name || selectedBank,
          accountNumber,
          accountName,
          storeId: store.id
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        alert("Settlement account registered successfully!");
        router.refresh();
      } else {
        throw new Error(data.error || "Failed to register account");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-10">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight mb-1 italic text-foreground">Settings</h1>
        <p className="text-muted-foreground font-medium text-xs lg:text-sm">Manage your store preferences and account settings.</p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Horizontal Navigation Tabs */}
        <div className="w-full relative overflow-hidden">
          <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide no-scrollbar -mx-1 px-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 lg:gap-3 px-5 lg:px-6 py-2.5 lg:py-3 rounded-2xl transition-all text-[11px] lg:text-sm font-bold whitespace-nowrap border shrink-0",
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(158,226,55,0.15)]"
                    : "hover:bg-muted text-muted-foreground border-transparent hover:border-border bg-card/50"
                )}
              >
                <tab.icon className="w-3.5 h-3.5 lg:w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="glass-card rounded-[24px] lg:rounded-[40px] p-5 lg:p-10">
          {activeTab === "store" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-8"
            >
              <div>
                <h2 className="text-xl lg:text-2xl font-black text-foreground mb-1">Store Details</h2>
                <p className="text-xs lg:text-sm text-muted-foreground">Update your store&apos;s public information and appearance.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Store Name</label>
                  <input 
                    type="text" 
                    defaultValue={store?.name || ""}
                    placeholder="Enter store name"
                    className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground text-sm lg:text-base"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Subdomain</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      defaultValue={store?.slug || ""}
                      placeholder="subdomain"
                      className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold pr-24 lg:pr-32 text-foreground text-sm lg:text-base"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] lg:text-xs font-bold pointer-events-none opacity-50">
                      .gostore.ee
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Store Description</label>
                <textarea 
                  rows={4}
                  defaultValue={store?.description || ""}
                  placeholder="Describe what you sell..."
                  className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all text-sm resize-none text-foreground font-medium leading-relaxed"
                />
              </div>

              <div className="h-[1px] bg-border my-2" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg lg:text-xl font-black mb-1 text-foreground">Settlement Account</h3>
                  <p className="text-xs text-muted-foreground">Verified payouts are sent directly to this account.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      setSelectedBank("058"); // GTBank (Common for Paystack tests)
                      setAccountNumber("0000000002"); 
                      setAccountName(""); // Let it auto-fetch
                    }}
                    className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors border border-primary/20"
                  >
                    Quick Fill Test Account
                  </button>
                  {store?.paystack_sub_account_code ? (
                    <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider w-fit border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider w-fit border border-amber-500/20">
                      Pending
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Bank Name</label>
                  <div className="relative">
                    <select 
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold appearance-none text-foreground text-sm lg:text-base pr-10"
                    >
                      <option value="">Select Bank</option>
                      {banks.map(bank => (
                        <option key={bank.code} value={bank.code}>{bank.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Account Number</label>
                  <input 
                    type="text" 
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    maxLength={10}
                    placeholder="0000000000"
                    className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground text-sm lg:text-base"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Account Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder={isValidating ? "Validating..." : "John Doe"}
                    className={cn(
                      "w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground text-sm lg:text-base",
                      isValidating && "opacity-50"
                    )}
                  />
                  {isValidating && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <button 
                  onClick={handleSavePayout}
                  disabled={saving}
                  className="w-full px-8 py-5 rounded-[24px] brand-gradient text-primary-foreground font-black flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(158,226,55,0.3)] text-xs lg:text-sm uppercase tracking-wider disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Settlement Details"}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab !== "store" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-32 text-center gap-6"
            >
              <div className="w-20 h-20 rounded-[32px] bg-muted flex items-center justify-center border border-border">
                <Shield className="w-10 h-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-black text-xl text-foreground tracking-tight mb-2">Coming Soon</h3>
                <p className="text-muted-foreground text-sm max-w-[240px] mx-auto font-medium">This section is currently under development. Stay tuned!</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
