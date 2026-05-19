"use client";

import { motion } from "framer-motion";
import { User, Store, Truck, Shield, CheckCircle2, Loader2, Plus, Trash2, Edit2, Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/utils/cn";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const formatWhatsAppNumber = (phone: string): string => {
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('234')) return clean;
  if (clean.startsWith('0')) return '234' + clean.slice(1);
  if (!clean) return '';
  return '234' + clean;
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("store");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Store Details State
  const [storeName, setStoreName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [storeDesc, setStoreDesc] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [socials, setSocials] = useState({ email: "", instagram: "", tiktok: "" });
  const [channels, setChannels] = useState({ whatsapp: true, instagram: false, tiktok: false });

  // Bank State
  const [banks, setBanks] = useState<any[]>([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isEditingBank, setIsEditingBank] = useState(false);

  // Delivery State
  const [deliveryZones, setDeliveryZones] = useState<any[]>([]);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZonePrice, setNewZonePrice] = useState("");
  const [newZonePayOnArrival, setNewZonePayOnArrival] = useState(true);
  const [deliveryPaymentOption, setDeliveryPaymentOption] = useState("checkout");

  const { data: store, isLoading } = useQuery({
    queryKey: ['settings-store'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      return storeData;
    }
  });

  // Init state from query
  useEffect(() => {
    if (store) {
      setStoreName(store.name || "");
      setStoreSlug(store.slug || "");
      setStoreDesc(store.description || "");
      setWhatsapp(store.whatsapp || "");
      setSocials({
        email: store.socials?.email || "",
        instagram: store.socials?.instagram || "",
        tiktok: store.socials?.tiktok || ""
      });
      setChannels(store.channels || { whatsapp: true, instagram: false, tiktok: false });
      setSelectedBank(store.bank_code || "");
      setAccountNumber(store.account_number || "");
      setAccountName(store.account_name || "");
      setDeliveryZones(store.delivery_zones || []);
      setDeliveryPaymentOption(store.delivery_payment_option || "checkout");
    }
  }, [store]);

  const tabs = [
    { id: "store", name: "Store Details", icon: Store },
    { id: "bank", name: "Bank Account", icon: Wallet },
    { id: "delivery", name: "Delivery", icon: Truck },
    { id: "security", name: "Security", icon: Shield },
  ];

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
          if (!res.ok) throw new Error(data.error || "Validation failed");
          if (data.accountName) setAccountName(data.accountName);
        } catch (err) {
          console.error("Validation error:", err);
        } finally {
          setIsValidating(false);
        }
      };
      validate();
    }
  }, [selectedBank, accountNumber]);

  const handleSaveStoreDetails = async () => {
    if (!store) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          name: storeName,
          slug: storeSlug,
          description: storeDesc,
          whatsapp: formatWhatsAppNumber(whatsapp),
          socials: socials,
          channels: channels
        })
        .eq('id', store.id);

      if (error) throw error;
      toast.success("Store details updated successfully!");
    } catch (err: any) {
      toast.error("Failed to update store: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayout = async () => {
    if (!selectedBank || !accountNumber || !accountName) {
      toast.error("Please fill all bank details");
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
        toast.success("Settlement account registered successfully!");
        setIsEditingBank(false);
        router.refresh();
      } else {
        throw new Error(data.error || "Failed to register account");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddDeliveryZone = () => {
    if (!newZoneName || !newZonePrice) return;
    const newZone = {
      id: Math.random().toString(36).substring(7),
      name: newZoneName,
      price: Number(newZonePrice),
      payOnArrival: newZonePayOnArrival
    };
    setDeliveryZones([...deliveryZones, newZone]);
    setNewZoneName("");
    setNewZonePrice("");
    setNewZonePayOnArrival(true);
  };

  const handleRemoveDeliveryZone = (id: string) => {
    setDeliveryZones(deliveryZones.filter(z => z.id !== id));
  };

  const handleSaveDeliveryZones = async () => {
    if (!store) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({ 
          delivery_zones: deliveryZones,
          delivery_payment_option: deliveryPaymentOption
        })
        .eq('id', store.id);
      if (error) throw error;
      toast.success("Delivery configuration saved successfully!");
    } catch (err: any) {
      toast.error("Failed to save delivery configuration: " + err.message);
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
        <div className="glass-card rounded-[24px] lg:rounded-[40px] p-5 lg:p-10 min-h-[500px]">
          
          {/* TAB: STORE DETAILS */}
          {activeTab === "store" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8">
              <div>
                <h2 className="text-xl lg:text-2xl font-black text-foreground mb-1">Store Details</h2>
                <p className="text-xs lg:text-sm text-muted-foreground">Update your store&apos;s public information and appearance.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Store Name</label>
                  <input 
                    type="text" 
                    value={storeName}
                    onChange={(e) => {
                      setStoreName(e.target.value);
                      setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                    }}
                    placeholder="Enter store name"
                    className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground text-sm lg:text-base"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Subdomain (Read-Only)</label>
                  <input 
                    type="text" 
                    value={storeSlug}
                    readOnly
                    placeholder="subdomain"
                    className="w-full px-5 py-4 rounded-2xl bg-muted border border-border outline-none opacity-70 font-bold text-foreground text-sm lg:text-base cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Store Description</label>
                <textarea 
                  rows={4}
                  value={storeDesc}
                  onChange={(e) => setStoreDesc(e.target.value)}
                  placeholder="Describe what you sell..."
                  className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all text-sm resize-none text-foreground font-medium leading-relaxed"
                />
              </div>

              <div className="h-[1px] bg-border my-2" />

              <div>
                <h3 className="text-lg lg:text-xl font-black mb-1 text-foreground">Sales Channels</h3>
                <p className="text-xs text-muted-foreground mb-4">Select the social media channels you actively sell on to configure your dashboard overview.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label className="flex items-center gap-3 p-4 rounded-2xl bg-muted/40 border border-border cursor-pointer hover:border-primary/30 transition-all">
                    <input 
                      type="checkbox" 
                      checked={channels.whatsapp}
                      onChange={(e) => setChannels({...channels, whatsapp: e.target.checked})}
                      className="w-5 h-5 rounded border-border text-primary focus:ring-primary accent-primary"
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-foreground">WhatsApp</span>
                      <span className="text-[10px] text-muted-foreground">Sell directly in DMs</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 rounded-2xl bg-muted/40 border border-border cursor-pointer hover:border-primary/30 transition-all">
                    <input 
                      type="checkbox" 
                      checked={channels.instagram}
                      onChange={(e) => setChannels({...channels, instagram: e.target.checked})}
                      className="w-5 h-5 rounded border-border text-primary focus:ring-primary accent-primary"
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-foreground">Instagram</span>
                      <span className="text-[10px] text-muted-foreground">Sell via bio or stories</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 rounded-2xl bg-muted/40 border border-border cursor-pointer hover:border-primary/30 transition-all">
                    <input 
                      type="checkbox" 
                      checked={channels.tiktok}
                      onChange={(e) => setChannels({...channels, tiktok: e.target.checked})}
                      className="w-5 h-5 rounded border-border text-primary focus:ring-primary accent-primary"
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-foreground">TikTok</span>
                      <span className="text-[10px] text-muted-foreground">Sell via videos or bio</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="h-[1px] bg-border my-2" />

              <div>
                <h3 className="text-lg lg:text-xl font-black mb-1 text-foreground">Contact & Socials</h3>
                <p className="text-xs text-muted-foreground mb-4">Let customers know how to reach you.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">WhatsApp Number</label>
                    <input 
                      type="text" 
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+234..."
                      className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                    <input 
                      type="email" 
                      value={socials.email}
                      onChange={(e) => setSocials({...socials, email: e.target.value})}
                      placeholder="hello@store.com"
                      className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Instagram Username</label>
                    <input 
                      type="text" 
                      value={socials.instagram}
                      onChange={(e) => setSocials({...socials, instagram: e.target.value})}
                      placeholder="@yourbrand"
                      className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">TikTok Username</label>
                    <input 
                      type="text" 
                      value={socials.tiktok}
                      onChange={(e) => setSocials({...socials, tiktok: e.target.value})}
                      placeholder="@yourbrand"
                      className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="h-[1px] bg-border my-2" />

              <div>
                <h3 className="text-lg lg:text-xl font-black mb-1 text-foreground">Branding <span className="text-xs ml-2 text-primary uppercase tracking-widest font-black">Coming Soon</span></h3>
                <p className="text-xs text-muted-foreground mb-4">Customize your store's visual identity.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50 pointer-events-none">
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Color Theme</label>
                    <div className="w-full px-5 py-4 rounded-2xl bg-muted border border-border flex items-center justify-between">
                      <span className="font-bold text-sm">Default Dark</span>
                      <div className="w-6 h-6 rounded-full bg-primary" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Store Logo</label>
                    <div className="w-full px-5 py-4 rounded-2xl bg-muted border border-border font-bold text-sm text-center border-dashed">
                      Upload Image (Max 2MB)
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <button 
                  onClick={handleSaveStoreDetails}
                  disabled={saving}
                  className="w-full px-8 py-5 rounded-[24px] brand-gradient text-primary-foreground font-black flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(158,226,55,0.3)] text-xs lg:text-sm uppercase tracking-wider disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Store Details"}
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB: BANK ACCOUNT */}
          {activeTab === "bank" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl lg:text-2xl font-black text-foreground mb-1">Settlement Account</h2>
                  <p className="text-xs lg:text-sm text-muted-foreground">Verified payouts are sent directly to this account.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      setSelectedBank("058");
                      setAccountNumber("0000000002"); 
                      setAccountName(""); 
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

              {(!store?.account_number || isEditingBank) ? (
                <>
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
                          {banks.map((bank, index) => (
                            <option key={`${bank.code}-${index}`} value={bank.code}>{bank.name}</option>
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

                  <div className="mt-4 flex gap-4">
                    {store?.account_number && (
                      <button 
                        onClick={() => setIsEditingBank(false)}
                        type="button"
                        className="px-8 py-5 rounded-[24px] bg-muted text-muted-foreground font-black hover:bg-white/5 transition-all text-xs lg:text-sm uppercase tracking-wider"
                      >
                        Cancel
                      </button>
                    )}
                    <button 
                      onClick={handleSavePayout}
                      disabled={saving}
                      className="flex-1 px-8 py-5 rounded-[24px] brand-gradient text-primary-foreground font-black flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(158,226,55,0.3)] text-xs lg:text-sm uppercase tracking-wider disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Settlement Details"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-6 lg:p-8 rounded-[32px] border border-border bg-card/50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Current Settlement Account</p>
                    <h4 className="text-lg lg:text-xl font-bold text-foreground">{store.account_name}</h4>
                    <p className="text-sm font-medium text-muted-foreground">{store.bank_name} • {store.account_number}</p>
                  </div>
                  <button 
                    onClick={() => setIsEditingBank(true)}
                    type="button"
                    className="px-6 py-3 rounded-2xl bg-muted hover:bg-white/5 border border-border text-foreground text-xs lg:text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap"
                  >
                    Edit Details
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: DELIVERY */}
          {activeTab === "delivery" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8">
              <div>
                <h2 className="text-xl lg:text-2xl font-black text-foreground mb-1">Delivery Settings</h2>
                <p className="text-xs lg:text-sm text-muted-foreground">Configure how delivery fees are paid and manage delivery locations.</p>
              </div>

              {/* Delivery Payment Option */}
              <div className="flex flex-col gap-4 p-5 lg:p-6 rounded-[32px] bg-muted/30 border border-border">
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-1">Delivery Fee Payment Method</h3>
                  <p className="text-xs text-muted-foreground">Decide if customers pay shipping during online checkout or directly to your courier.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border cursor-pointer hover:border-primary/30 transition-all">
                    <input 
                      type="radio" 
                      name="deliveryPaymentOption"
                      value="checkout"
                      checked={deliveryPaymentOption === "checkout"}
                      onChange={() => setDeliveryPaymentOption("checkout")}
                      className="w-4 h-4 text-primary focus:ring-primary accent-primary"
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-foreground">Pay at Checkout</span>
                      <span className="text-[10px] text-muted-foreground">Added to order total and paid online</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border cursor-pointer hover:border-primary/30 transition-all">
                    <input 
                      type="radio" 
                      name="deliveryPaymentOption"
                      value="arrival"
                      checked={deliveryPaymentOption === "arrival"}
                      onChange={() => setDeliveryPaymentOption("arrival")}
                      className="w-4 h-4 text-primary focus:ring-primary accent-primary"
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-foreground">Pay on Arrival</span>
                      <span className="text-[10px] text-muted-foreground">Paid directly to the courier when product arrives</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Add New Zone */}
              <div className="p-5 lg:p-6 rounded-[32px] bg-muted/30 border border-border flex flex-col gap-4">
                <h3 className="text-sm font-bold text-foreground">Add Delivery Zone</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    placeholder="e.g. Lagos Island"
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary/50 outline-none transition-all text-sm font-medium text-foreground"
                  />
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">₦</span>
                    <input 
                      type="number" 
                      value={newZonePrice}
                      onChange={(e) => setNewZonePrice(e.target.value)}
                      placeholder="3500"
                      className="w-full pl-8 pr-4 py-3 rounded-xl bg-background border border-border focus:border-primary/50 outline-none transition-all text-sm font-medium text-foreground"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end mt-2">
                  <button 
                    onClick={handleAddDeliveryZone}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background font-bold text-xs hover:bg-foreground/90 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Zone
                  </button>
                </div>
              </div>

              {/* Zone List */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-foreground px-1">Configured Delivery Zones</h3>
                {deliveryZones.map((zone) => (
                  <div key={zone.id} className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card/50">
                    <div className="flex flex-col gap-1">
                      <h4 className="font-bold text-sm text-foreground">{zone.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Fee: <span className="font-bold text-foreground">₦{zone.price.toLocaleString()}</span>
                      </p>
                    </div>
                    <button 
                      onClick={() => handleRemoveDeliveryZone(zone.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {deliveryZones.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground italic">
                    No delivery zones configured yet.
                  </div>
                )}
              </div>

              <div className="mt-4">
                <button 
                  onClick={handleSaveDeliveryZones}
                  disabled={saving}
                  className="w-full px-8 py-5 rounded-[24px] brand-gradient text-primary-foreground font-black flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(158,226,55,0.3)] text-xs lg:text-sm uppercase tracking-wider disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Delivery Configuration"}
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB: SECURITY */}
          {activeTab === "security" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-32 text-center gap-6">
              <div className="w-20 h-20 rounded-[32px] bg-muted flex items-center justify-center border border-border">
                <Shield className="w-10 h-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-black text-xl text-foreground tracking-tight mb-2">Coming Soon</h3>
                <p className="text-muted-foreground text-sm max-w-[240px] mx-auto font-medium">Security options and password management will be available here.</p>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
