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

const formatWhatsAppNumber = (phone: string): string => {
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('234')) return clean;
  if (clean.startsWith('0')) return '234' + clean.slice(1);
  if (!clean) return '';
  return '234' + clean;
};

// Brand Icons
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("w-6 h-6 fill-current", className)}>
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.118-2.905-6.993-1.876-1.875-4.355-2.907-6.992-2.908-5.44 0-9.866 4.418-9.87 9.865-.001 1.645.428 3.25 1.241 4.667l-.993 3.627 3.731-.979zm11.587-6.425c-.29-.145-1.72-.848-1.986-.944-.266-.096-.46-.145-.654.145-.193.291-.748.944-.919 1.138-.17.194-.34.218-.63.073-.29-.145-1.229-.453-2.34-1.444-.863-.77-1.446-1.72-1.615-2.012-.17-.29-.018-.448.127-.592.13-.13.29-.34.436-.509.145-.17.193-.29.29-.485.097-.194.048-.364-.025-.509-.072-.145-.654-1.577-.896-2.158-.236-.569-.475-.492-.654-.5-.17-.008-.364-.01-.557-.01-.194 0-.509.072-.774.364-.266.291-1.015.993-1.015 2.422 0 1.43 1.039 2.81 1.184 3.004.145.194 2.045 3.123 4.954 4.378.692.298 1.233.477 1.654.61.695.22 1.328.19 1.829.115.558-.085 1.72-.702 1.962-1.38.242-.678.242-1.26.17-1.38-.073-.12-.266-.194-.557-.34z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("w-6 h-6 fill-none stroke-current stroke-2", className)}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("w-6 h-6 fill-current", className)}>
      <path d="M12.525.02c1.31-.032 2.612-.008 3.914-.013.116 1.177.587 2.32 1.393 3.175.764.81 1.792 1.34 2.914 1.488V8.47c-1.322-.057-2.617-.488-3.7-.1.013 3.655.012 7.31-.005 10.965-.05 1.573-.66 3.11-1.785 4.168-1.57 1.468-3.957 2.007-6.02 1.442-2.316-.628-4.22-2.688-4.63-5.06-.575-3.195 1.405-6.527 4.546-7.228.324-.075.656-.118.988-.135v3.9c-.83.053-1.688.388-2.222.998-.823.95-.733 2.508.204 3.328 1.05.9 2.766.723 3.593-.418.318-.456.452-.996.442-1.558.005-4.475-.002-8.95.008-13.425.01-.137-.015-.29-.028-.426z" />
    </svg>
  );
}

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
      const raw = sessionStorage.getItem("gostore_signup_store");
      if (!raw) return "";
      const parsed = JSON.parse(raw) as { storeName?: string };
      sessionStorage.removeItem("gostore_signup_store");
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

      if (!bankAccount.isVerified || !bankAccount.accountName) {
        throw new Error("Please verify your bank account with Paystack before launching.");
      }

      // Re-check with Paystack before saving
      const verifyRes = await fetch(
        `/api/banks/validate?accountNumber=${bankAccount.accountNumber}&bankCode=${bankAccount.bankCode}`,
      );
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.accountName) {
        throw new Error(verifyData.error || "Bank account could not be verified. Please try again.");
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
          account_name: verifyData.accountName,
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
            accountName: verifyData.accountName,
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
      alert(message);
      setLoading(false);
    }
  };

  const copyLink = () => {
    const slug = slugifyStoreName(storeName);
    const url = `https://app-gostore.vercel.app/store/${slug}?src=wa`;
    navigator.clipboard.writeText(url);
    alert("Link copied!");
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
        <div className="flex items-center justify-between mb-8">
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
                    Your URL: app-gostore.vercel.app/store/{slugifyStoreName(storeName)}
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
                    <WhatsAppIcon className="w-6 h-6" />
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
                    <InstagramIcon className="w-6 h-6" />
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
                    <TikTokIcon className="w-6 h-6" />
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
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    readOnly
                    value={`https://app-gostore.vercel.app/store/${slugifyStoreName(storeName)}?src=wa`}
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
