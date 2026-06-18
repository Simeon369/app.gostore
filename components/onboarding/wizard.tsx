"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Store, 
  Rocket, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  Copy, 
  ChevronDown, 
  Check, 
  Search
} from "lucide-react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase/client";
import { slugifyStoreName } from "@/lib/store-slug";
import {
  BankAccountVerification,
  type BankAccountFields,
} from "@/components/bank-account-verification";
import { getPaymentMode } from "@/lib/payment-config";
import { StoreLogoUpload } from "@/components/store-logo-upload";
import { uploadStoreLogo } from "@/lib/store-logo";
import { FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";
import { toast } from "sonner";
import { getSessionItem, removeSessionItem } from "@/lib/safe-storage";
import { getAppHost, getStoreUrl } from "@/lib/urls";

const formatWhatsAppNumber = (phone: string): string => {
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('234')) return clean;
  if (clean.startsWith('0')) return '234' + clean.slice(1);
  if (!clean) return '';
  return '234' + clean;
};

// Custom Searchable Dropdown / Select Component
interface Option {
  label: string;
  value: string;
  code?: string;
}

function CustomSelect({ 
  options, 
  value, 
  onChange, 
  placeholder,
  searchPlaceholder = "Search...",
  searchable = false
}: { 
  options: Option[]; 
  value: string; 
  onChange: (opt: Option) => void;
  placeholder: string;
  searchPlaceholder?: string;
  searchable?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground flex items-center justify-between text-left shadow-sm"
      >
        <span className={selectedOption ? "text-foreground" : "text-muted-foreground/50"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="relative w-full mt-2 bg-muted/30 border border-border rounded-2xl shadow-inner max-h-64 overflow-hidden flex flex-col z-20">
            {searchable && (
              <div className="p-3 border-b border-border bg-muted/30 flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground/60" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent outline-none text-xs font-bold text-foreground placeholder:text-muted-foreground/50"
                />
              </div>
            )}
            <div className="overflow-y-auto flex-1 py-1 max-h-48">
              {filtered.length > 0 ? (
                filtered.map(opt => (
                  <button
                    key={`${opt.value}-${opt.code || ""}`}
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "w-full px-5 py-3.5 text-left text-xs font-black flex items-center justify-between hover:bg-muted/50 transition-colors uppercase tracking-wider",
                      opt.value === value ? "text-primary bg-primary/5" : "text-foreground"
                    )}
                  >
                    <span>{opt.label}</span>
                    {opt.value === value && <Check className="w-4 h-4 text-primary" />}
                  </button>
                ))
              ) : (
                <div className="px-5 py-4 text-xs text-muted-foreground text-center">No results found</div>
              )}
            </div>
          </div>
      )}
    </div>
  );
}

export function OnboardingWizard() {
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Step 1 State
  const [storeName, setStoreName] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const raw = getSessionItem("gostore_signup_store");
      if (!raw) return "";
      const parsed = JSON.parse(raw) as { storeName?: string };
      removeSessionItem("gostore_signup_store");
      return parsed.storeName ?? "";
    } catch {
      return "";
    }
  });
  const [whatsapp, setWhatsapp] = useState("");
  const [category, setCategory] = useState("Fashion & Apparel");
  const [otherCategory, setOtherCategory] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Step 2 State — verified via Paystack resolve API
  const [bankAccount, setBankAccount] = useState<BankAccountFields>({
    bankName: "",
    bankCode: "",
    accountNumber: "",
    accountName: "",
    isVerified: false,
  });

  // Step 3 State: Socials
  const [socials, setSocials] = useState({
    whatsapp: true,
    instagram: false,
    tiktok: false
  });

  const categoryOptions = [
    { label: "Fashion & Apparel", value: "Fashion & Apparel" },
    { label: "Hair & Beauty", value: "Hair & Beauty" },
    { label: "Electronics", value: "Electronics" },
    { label: "Home & Kitchen", value: "Home & Kitchen" },
    { label: "Groceries & Food", value: "Groceries & Food" },
    { label: "Books & Stationeries", value: "Books & Stationeries" },
    { label: "Toys & Games", value: "Toys & Games" },
    { label: "Fitness & Outdoors", value: "Fitness & Outdoors" },
    { label: "Handcrafted & Art", value: "Handcrafted & Art" },
    { label: "Digital Services", value: "Digital Services" },
    { label: "Other", value: "Other" }
  ];

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleLaunch = async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No user found. Please login.");
      }

      const slug = slugifyStoreName(storeName);
      const { data: existingStore } = await supabase
        .from("stores")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (existingStore) {
        throw new Error("That store name is already taken. Go back and choose another.");
      }

      const formattedWhatsapp = formatWhatsAppNumber(whatsapp);
      const finalCategory = category === "Other" ? otherCategory : category;

      if (
        !bankAccount.bankCode ||
        bankAccount.accountNumber.length !== 10 ||
        !bankAccount.accountName.trim()
      ) {
        throw new Error("Please complete your bank details before launching.");
      }

      // 1. Create the store
      const { data: newStore, error: storeError } = await supabase
        .from("stores")
        .insert({
          user_id: user.id,
          name: storeName,
          slug,
          category: finalCategory,
          whatsapp: formattedWhatsapp,
          bank_name: bankAccount.bankName,
          bank_code: bankAccount.bankCode,
          account_number: bankAccount.accountNumber,
          account_name: bankAccount.accountName,
          channels: socials,
          status: "Live",
        })
        .select("id")
        .single();

      if (storeError) throw storeError;

      if (logoFile && newStore?.id) {
        const { logoUrl, logoPath } = await uploadStoreLogo(supabase, newStore.id, logoFile);
        const { error: logoError } = await supabase
          .from("stores")
          .update({ logo: logoUrl, logo_path: logoPath })
          .eq("id", newStore.id);
        if (logoError) throw logoError;
      }

      if (getPaymentMode() === "paystack" && newStore?.id) {
        const payoutRes = await fetch("/api/payout/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bankCode: bankAccount.bankCode,
            bankName: bankAccount.bankName,
            accountNumber: bankAccount.accountNumber,
            accountName: bankAccount.accountName,
            storeId: newStore.id,
          }),
        });
        const payoutData = await payoutRes.json();
        if (!payoutRes.ok || payoutData.status !== "success") {
          throw new Error(payoutData.error || "Failed to register Paystack settlement account");
        }
      }

      // Trigger confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#86c02e", "#10b981", "#ffffff"]
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch (error: unknown) {
      console.error("Error launching store:", error);
      const message = error instanceof Error ? error.message : "Failed to create store. Please try again.";
      toast.error(message);
      setLoading(false);
    }
  };

  const copyLink = () => {
    const slug = slugifyStoreName(storeName);
    const url = getStoreUrl(slug, { src: "wa" });
    navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-card border border-border rounded-[40px] overflow-hidden shadow-2xl relative min-h-[500px] flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-8 border-b border-border bg-card relative z-10 rounded-t-[40px]">
        <div className="flex flex-col items-center justify-center gap-4 mb-8">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className={cn(
                  "h-2 w-12 rounded-full transition-all duration-500",
                  step >= i ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
          <span className="text-sm font-bold text-muted-foreground">Step {step} of 4</span>
        </div>

        <h1 className="text-3xl font-black text-foreground">
          {step === 1 && "The Brand"}
          {step === 2 && "The Payout"}
          {step === 3 && "Social Channels"}
          {step === 4 && "The Launch"}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          {step === 1 && "Let's set up your store identity and generate your unique link."}
          {step === 2 && "Where should we send your 95% split? We process this instantly."}
          {step === 3 && "Where do you mostly promote your products?"}
          {step === 4 && "You are live! Time to start making money."}
        </p>
      </div>

      {/* Content */}
      <div className="p-8 relative">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Store Logo <span className="normal-case font-medium text-muted-foreground/70">(optional)</span></label>
                <StoreLogoUpload
                  preview={logoPreview}
                  onFileSelect={(file, previewUrl) => {
                    setLogoFile(file);
                    setLogoPreview(previewUrl);
                  }}
                  onClear={() => {
                    setLogoFile(null);
                    setLogoPreview(null);
                  }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                  <Store className="w-3 h-3" /> Store Name
                </label>
                <input 
                  type="text" 
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. Kemi's Hair Bundles"
                  className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground placeholder:text-muted-foreground/50 shadow-sm"
                />
                {storeName && (
                  <p className="text-xs text-primary font-medium ml-1">
                    Your URL: {getAppHost()}/store/{slugifyStoreName(storeName)}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">WhatsApp Number</label>
                <input 
                  type="tel" 
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="08012345678"
                  className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground placeholder:text-muted-foreground/50 shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Primary Category</label>
                <CustomSelect 
                  options={categoryOptions}
                  value={category}
                  onChange={(opt) => setCategory(opt.value)}
                  placeholder="Select Category"
                />
              </div>

              {category === "Other" && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-2"
                >
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Specify Category</label>
                  <input 
                    type="text" 
                    value={otherCategory}
                    onChange={(e) => setOtherCategory(e.target.value)}
                    placeholder="e.g. Handmade Crafts"
                    required
                    className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground placeholder:text-muted-foreground/50 shadow-sm"
                  />
                </motion.div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col gap-6"
            >
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex gap-3 text-sm text-primary font-medium">
                <span className="text-xl leading-none">💡</span>
                <p>
                  <strong className="font-black">Simple Payouts:</strong> GoStore takes a flat 5% commission on your sales (capped at ₦10,000). Add your bank details here so we can settle your 95% after each confirmed payment.
                </p>
              </div>

              <BankAccountVerification value={bankAccount} onChange={setBankAccount} />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col gap-6"
            >
              <div className="bg-muted p-6 rounded-2xl border border-border flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <FaWhatsapp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">WhatsApp</p>
                    <p className="text-xs text-muted-foreground">Always active by default</p>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>

              <button 
                onClick={() => setSocials(s => ({ ...s, instagram: !s.instagram }))}
                className={cn(
                  "p-6 rounded-2xl border transition-all flex items-center justify-between text-left shadow-sm",
                  socials.instagram ? "bg-primary/5 border-primary" : "bg-card border-border hover:border-primary/30"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-xl transition-all",
                    socials.instagram ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <FaInstagram className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Instagram</p>
                    <p className="text-xs text-muted-foreground">I use Instagram to sell</p>
                  </div>
                </div>
                <div className={cn(
                  "w-6 h-6 rounded-full border flex items-center justify-center transition-all",
                  socials.instagram ? "bg-primary border-primary" : "border-border"
                )}>
                  {socials.instagram && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
                </div>
              </button>

              <button 
                onClick={() => setSocials(s => ({ ...s, tiktok: !s.tiktok }))}
                className={cn(
                  "p-6 rounded-2xl border transition-all flex items-center justify-between text-left shadow-sm",
                  socials.tiktok ? "bg-primary/5 border-primary" : "bg-card border-border hover:border-primary/30"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-xl transition-all",
                    socials.tiktok ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <FaTiktok className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">TikTok</p>
                    <p className="text-xs text-muted-foreground">I use TikTok to sell</p>
                  </div>
                </div>
                <div className={cn(
                  "w-6 h-6 rounded-full border flex items-center justify-center transition-all",
                  socials.tiktok ? "bg-primary border-primary" : "border-border"
                )}>
                  {socials.tiktok && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
                </div>
              </button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center justify-center py-10 text-center gap-6"
            >
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Rocket className="w-12 h-12 text-primary" />
              </div>
              
              <div>
                <h2 className="text-2xl font-black text-foreground">You are live! 🚀</h2>
                <p className="text-muted-foreground mt-2">Your store is ready to accept orders.</p>
              </div>

              <div className="w-full bg-muted border border-border rounded-2xl p-4 flex flex-col gap-3">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground text-left">Your WhatsApp Link</p>
                <div className="flex flex-col items-center justify-center gap-4">
                  <input 
                    type="text" 
                    readOnly
                    value={getStoreUrl(slugifyStoreName(storeName), { src: "wa" })}
                    className="flex-1 bg-background px-4 py-3 rounded-xl border border-border text-sm font-bold text-muted-foreground outline-none"
                  />
                  <button onClick={copyLink} className="p-3 bg-primary text-primary-foreground rounded-xl hover:scale-105 transition-all">
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Controls */}
      <div className="p-6 border-t border-border bg-card relative z-10 flex items-center justify-between rounded-b-[40px]">
        {step > 1 ? (
          <button 
            type="button"
            onClick={handleBack}
            className="px-6 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all"
          >
            Back
          </button>
        ) : (
          <span className="w-0" aria-hidden />
        )}

        {step < 4 ? (
          <button 
            type="button"
            onClick={handleNext}
            disabled={
              (step === 1 && (!storeName || !whatsapp || (category === "Other" && !otherCategory))) ||
              (step === 2 && !bankAccount.isVerified)
            }
            className="px-8 py-3 rounded-[20px] brand-gradient text-primary-foreground font-black flex items-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(158,226,55,0.2)]"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button 
            type="button"
            onClick={handleLaunch}
            disabled={loading}
            className="px-8 py-4 w-full md:w-auto rounded-[24px] brand-gradient text-primary-foreground font-black flex items-center justify-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(158,226,55,0.4)]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Go to Dashboard 🚀"}
          </button>
        )}
      </div>
    </div>
  );
}
