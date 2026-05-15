"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Store, Building2, Package, Rocket, ArrowRight, Loader2, CheckCircle2, Upload, Info, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { cn } from "@/utils/cn";

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Step 1 State
  const [storeName, setStoreName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [category, setCategory] = useState("Fashion");

  // Step 2 State
  const [bankName, setBankName] = useState("Guaranty Trust Bank (GTB)");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [verifyingBank, setVerifyingBank] = useState(false);

  // Step 3 State: Socials
  const [socials, setSocials] = useState({
    whatsapp: true,
    instagram: false,
    tiktok: false
  });

  // Step 3 State
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [isPreorder, setIsPreorder] = useState(false);

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const verifyBankAccount = (accNum: string) => {
    if (accNum.length < 10) return;
    setVerifyingBank(true);
    // Simulate Monnify account resolution
    setTimeout(() => {
      setAccountName("ADEKUNLE CHIDI");
      setVerifyingBank(false);
    }, 1500);
  };

  const handleLaunch = () => {
    setLoading(true);
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
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`https://gostore.ee/${storeName.toLowerCase().replace(/\s+/g, '-')}?src=wa`);
    // Optional: add a toast here
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="w-full max-w-xl mx-auto glass-card rounded-[40px] overflow-hidden shadow-2xl bg-card border-border relative min-h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-8 border-b border-border bg-card relative z-10">
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
      <div className="flex-1 p-8 overflow-y-auto relative">
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
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                  <Store className="w-3 h-3" /> Store Name
                </label>
                <input 
                  type="text" 
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. Kemi's Hair Bundles"
                  className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground placeholder:text-muted-foreground/50"
                />
                {storeName && (
                  <p className="text-xs text-primary font-medium ml-1">
                    Your URL: gostore.ee/{storeName.toLowerCase().replace(/\s+/g, '-')}
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
                  className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Primary Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold appearance-none text-foreground"
                >
                  <option>Fashion & Apparel</option>
                  <option>Hair & Beauty</option>
                  <option>Electronics</option>
                  <option>Digital Products</option>
                  <option>Pre-order Items</option>
                </select>
              </div>
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
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                  <Building2 className="w-3 h-3" /> Bank Name
                </label>
                <select 
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold appearance-none text-foreground"
                >
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
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value);
                    if (e.target.value.length === 10) {
                      verifyBankAccount(e.target.value);
                    } else {
                      setAccountName("");
                    }
                  }}
                  maxLength={10}
                  placeholder="0123456789"
                  className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground placeholder:text-muted-foreground/50"
                />
              </div>

              {verifyingBank && (
                <div className="flex items-center gap-3 text-primary text-sm font-bold bg-primary/10 p-4 rounded-2xl">
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying account...
                </div>
              )}

              {accountName && !verifyingBank && (
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 ml-1">Account Verified</label>
                  <div className="w-full px-5 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-black flex items-center justify-between">
                    <span>{accountName}</span>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
              )}
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
              <div className="bg-muted p-6 rounded-2xl border border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <CheckCircle2 className="w-6 h-6" />
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
                  "p-6 rounded-2xl border transition-all flex items-center justify-between text-left",
                  socials.instagram ? "bg-primary/5 border-primary" : "bg-card border-border hover:border-primary/30"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-xl transition-all",
                    socials.instagram ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <Store className="w-6 h-6" />
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
                  "p-6 rounded-2xl border transition-all flex items-center justify-between text-left",
                  socials.tiktok ? "bg-primary/5 border-primary" : "bg-card border-border hover:border-primary/30"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-xl transition-all",
                    socials.tiktok ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <Rocket className="w-6 h-6" />
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
                <p className="text-muted-foreground mt-2">Your store is ready to accept payments.</p>
              </div>

              <div className="w-full bg-muted border border-border rounded-2xl p-4 flex flex-col gap-3">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground text-left">Your WhatsApp Link</p>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    readOnly
                    value={`https://gostore.ee/${storeName.toLowerCase().replace(/\s+/g, '-')}?src=wa`}
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
      <div className="p-6 border-t border-border bg-card relative z-10 flex items-center justify-between">
        {step > 1 ? (
          <button 
            onClick={handleBack}
            className="px-6 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all"
          >
            Back
          </button>
        ) : (
          <div /> // Spacer
        )}

        {step < 4 ? (
          <button 
            onClick={handleNext}
            disabled={
              (step === 1 && (!storeName || !whatsapp)) ||
              (step === 2 && (!accountName))
            }
            className="px-8 py-3 rounded-[20px] brand-gradient text-primary-foreground font-black flex items-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(158,226,55,0.2)]"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button 
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
