"use client";

import { motion } from "framer-motion";
import { User, Store, Truck, Shield, CheckCircle2, Loader2, Wallet, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/utils/cn";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { StoreLogoUpload } from "@/components/store-logo-upload";
import {
  BankAccountVerification,
  type BankAccountFields,
} from "@/components/bank-account-verification";
import {
  resolveLogoPathFromUrl,
  uploadStoreLogo,
  STORE_LOGOS_BUCKET,
} from "@/lib/store-logo";
import { AddressAutocomplete } from "@/components/maps/address-autocomplete";
import { StaticMapPreview } from "@/components/maps/static-map-preview";
import type { GeoLocation } from "@/lib/types";

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
  const queryClient = useQueryClient();

  // Store Details State
  const [storeName, setStoreName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [storeDesc, setStoreDesc] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [socials, setSocials] = useState({ email: "", instagram: "", tiktok: "" });
  const [channels, setChannels] = useState({ whatsapp: true, instagram: false, tiktok: false });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  // Bank State
  const [bankAccount, setBankAccount] = useState<BankAccountFields>({
    bankName: "",
    bankCode: "",
    accountNumber: "",
    accountName: "",
    isVerified: false,
  });
  const [isEditingBank, setIsEditingBank] = useState(false);

  // Delivery State
  const [shopAddress, setShopAddress] = useState<GeoLocation | null>(null);
  const [pickupEnabled, setPickupEnabled] = useState(false);
  const [dispatchEnabled, setDispatchEnabled] = useState(true);
  const [pickupRadiusKm, setPickupRadiusKm] = useState("5");

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
      setBankAccount({
        bankName: store.bank_name || "",
        bankCode: store.bank_code || "",
        accountNumber: store.account_number || "",
        accountName: store.account_name || "",
        isVerified: !!(store.bank_code && store.account_number && store.account_name),
      });
      if (store.address_formatted && store.latitude != null && store.longitude != null) {
        setShopAddress({
          formatted: store.address_formatted,
          placeId: store.address_place_id || undefined,
          lat: store.latitude,
          lng: store.longitude,
        });
      } else if (store.address_formatted) {
        setShopAddress({ formatted: store.address_formatted });
      } else {
        setShopAddress(null);
      }
      setPickupEnabled(!!store.pickup_enabled);
      setDispatchEnabled(store.dispatch_enabled !== false);
      setPickupRadiusKm(String(store.pickup_radius_km ?? 5));
      setLogoPreview(store.logo || null);
      setLogoFile(null);
      setRemoveLogo(false);
    }
  }, [store]);

  const tabs = [
    { id: "store", name: "Store Details", icon: Store },
    { id: "bank", name: "Bank Account", icon: Wallet },
    { id: "delivery", name: "Delivery", icon: Truck },
    { id: "security", name: "Security", icon: Shield },
  ];

  const handleSaveStoreDetails = async () => {
    if (!store) return;
    setSaving(true);
    try {
      let logo = store.logo;
      let logoPath = store.logo_path || resolveLogoPathFromUrl(store.logo);

      if (logoFile) {
        const uploaded = await uploadStoreLogo(
          supabase,
          store.id,
          logoFile,
          logoPath,
        );
        logo = uploaded.logoUrl;
        logoPath = uploaded.logoPath;
      } else if (removeLogo && logoPath) {
        await supabase.storage.from(STORE_LOGOS_BUCKET).remove([logoPath]);
        logo = null;
        logoPath = null;
      }

      const { error } = await supabase
        .from('stores')
        .update({
          name: storeName,
          slug: storeSlug,
          description: storeDesc,
          whatsapp: formatWhatsAppNumber(whatsapp),
          socials: socials,
          channels: channels,
          logo,
          logo_path: logoPath,
        })
        .eq('id', store.id);

      if (error) throw error;
      setLogoFile(null);
      setRemoveLogo(false);
      queryClient.invalidateQueries({ queryKey: ['settings-store'] });
      toast.success("Store details updated successfully!");
    } catch (err: any) {
      toast.error("Failed to update store: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayout = async () => {
    if (!store) return;
    if (
      !bankAccount.bankCode ||
      bankAccount.accountNumber.length !== 10 ||
      !bankAccount.accountName.trim()
    ) {
      toast.error("Please complete your bank details before saving");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/payout/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankCode: bankAccount.bankCode,
          bankName: bankAccount.bankName,
          accountNumber: bankAccount.accountNumber,
          accountName: bankAccount.accountName,
          storeId: store.id
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        toast.success("Settlement account registered successfully!");
        setIsEditingBank(false);
        queryClient.invalidateQueries({ queryKey: ['settings-store'] });
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

  const hasShopCoordinates =
    shopAddress?.lat != null && shopAddress?.lng != null;

  const handleSaveDeliverySettings = async () => {
    if (!store) return;
    if (!dispatchEnabled && !pickupEnabled) {
      toast.error("Enable at least one delivery method");
      return;
    }
    if (pickupEnabled && !hasShopCoordinates) {
      toast.error("Set your shop address before enabling pickup");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          address_formatted: shopAddress?.formatted || null,
          address_place_id: shopAddress?.placeId || null,
          latitude: shopAddress?.lat ?? null,
          longitude: shopAddress?.lng ?? null,
          pickup_enabled: pickupEnabled && hasShopCoordinates,
          dispatch_enabled: dispatchEnabled,
          pickup_radius_km: Number(pickupRadiusKm) || 5,
        })
        .eq('id', store.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['settings-store'] });
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
            <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8">
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
                <h3 className="text-lg lg:text-xl font-black mb-1 text-foreground">Branding</h3>
                <p className="text-xs text-muted-foreground mb-4">Customize your store&apos;s visual identity.</p>
                <div className="max-w-sm">
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Store Logo</label>
                    <StoreLogoUpload
                      compact
                      preview={logoPreview}
                      onFileSelect={(file, previewUrl) => {
                        setLogoFile(file);
                        setLogoPreview(previewUrl);
                        setRemoveLogo(false);
                      }}
                      onClear={() => {
                        setLogoFile(null);
                        setLogoPreview(null);
                        setRemoveLogo(true);
                      }}
                    />
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
            <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl lg:text-2xl font-black text-foreground mb-1">Settlement Account</h2>
                  <p className="text-xs lg:text-sm text-muted-foreground">Verified payouts are sent directly to this account.</p>
                </div>
                <div className="flex items-center gap-3">
                  
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
                  <BankAccountVerification value={bankAccount} onChange={setBankAccount} />

                  <div className="mt-4 flex gap-4">
                    {store?.account_number && (
                      <button 
                        onClick={() => {
                          setIsEditingBank(false);
                          if (store) {
                            setBankAccount({
                              bankName: store.bank_name || "",
                              bankCode: store.bank_code || "",
                              accountNumber: store.account_number || "",
                              accountName: store.account_name || "",
                              isVerified: !!(store.bank_code && store.account_number && store.account_name),
                            });
                          }
                        }}
                        type="button"
                        className="px-8 py-5 rounded-[24px] bg-muted text-muted-foreground font-black hover:bg-muted transition-all text-xs lg:text-sm uppercase tracking-wider"
                      >
                        Cancel
                      </button>
                    )}
                    <button 
                      onClick={handleSavePayout}
                      disabled={saving || !bankAccount.isVerified}
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
                    onClick={() => {
                      setIsEditingBank(true);
                      setBankAccount({
                        bankName: store.bank_name || "",
                        bankCode: store.bank_code || "",
                        accountNumber: store.account_number || "",
                        accountName: "",
                        isVerified: false,
                      });
                    }}
                    type="button"
                    className="px-6 py-3 rounded-2xl bg-muted hover:bg-muted border border-border text-foreground text-xs lg:text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap"
                  >
                    Edit Details
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: DELIVERY */}
          {activeTab === "delivery" && (
            <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8">
              <div>
                <h2 className="text-xl lg:text-2xl font-black text-foreground mb-1">Delivery Settings</h2>
                <p className="text-xs lg:text-sm text-muted-foreground">Set your shop location and choose how customers receive orders.</p>
              </div>

              <div className="flex flex-col gap-4 p-5 lg:p-6 rounded-[32px] bg-muted/30 border border-border">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Shop Address</h3>
                </div>
                <p className="text-xs text-muted-foreground">Required to offer pickup. Customers can get directions to your store.</p>
                <AddressAutocomplete
                  value={shopAddress?.formatted || ""}
                  onChange={setShopAddress}
                  placeholder="Search your shop address..."
                />
                {hasShopCoordinates && (
                  <StaticMapPreview
                    lat={shopAddress!.lat!}
                    lng={shopAddress!.lng!}
                    address={shopAddress!.formatted}
                  />
                )}
              </div>

              <div className="flex flex-col gap-4 p-5 lg:p-6 rounded-[32px] bg-muted/30 border border-border">
                <h3 className="text-sm font-bold text-foreground">Pickup Radius</h3>
                <p className="text-xs text-muted-foreground">Customers within this distance will see pickup recommended at checkout.</p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={pickupRadiusKm}
                    onChange={(e) => setPickupRadiusKm(e.target.value)}
                    className="w-24 px-4 py-3 rounded-xl bg-background border border-border focus:border-primary/50 outline-none text-sm font-medium text-foreground"
                  />
                  <span className="text-sm text-muted-foreground font-medium">km</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-bold text-foreground px-1">Delivery Methods</h3>
                <label className={cn(
                  "flex items-center gap-3 p-4 rounded-2xl bg-card border border-border transition-all",
                  !hasShopCoordinates ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-primary/30",
                )}>
                  <input
                    type="checkbox"
                    checked={pickupEnabled}
                    disabled={!hasShopCoordinates}
                    onChange={(e) => setPickupEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary accent-primary"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-foreground">Offer Pickup</span>
                    <span className="text-[10px] text-muted-foreground">
                      {hasShopCoordinates
                        ? "Customers collect from your shop — no delivery fee"
                        : "Save a shop address above to enable pickup"}
                    </span>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border cursor-pointer hover:border-primary/30 transition-all">
                  <input
                    type="checkbox"
                    checked={dispatchEnabled}
                    onChange={(e) => setDispatchEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary accent-primary"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-foreground">Offer Dispatch Delivery</span>
                    <span className="text-[10px] text-muted-foreground">Product paid online — delivery fee paid to rider on arrival</span>
                  </div>
                </label>
              </div>

              <div className="mt-4">
                <button
                  onClick={handleSaveDeliverySettings}
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
            <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-32 text-center gap-6">
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
