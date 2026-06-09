"use client";

import { motion } from "framer-motion";
import {
  X,
  Truck,
  Phone,
  User,
  Loader2,
  ArrowRight,
  Mail,
  Building2,
  Copy,
  Upload,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/utils/cn";
import { toast } from "sonner";
import { getPlatformBankDetails, isManualTransferMode } from "@/lib/payment-config";

interface CheckoutModalProps {
  product: any;
  store: any;
  onClose: () => void;
}

export function CheckoutModal({ product, store, onClose }: CheckoutModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const zones = store.delivery_zones || store.deliveryZones || [];
  const isPayOnArrival = store.delivery_payment_option === "arrival";
  const manualMode = isManualTransferMode();
  const bankDetails = getPlatformBankDetails();

  const deliveryFee = selectedZone ? Number(selectedZone.price) : 0;
  const total = Number(product.price) + deliveryFee;
  const checkoutTotal = isPayOnArrival ? Number(product.price) : total;

  const canPlaceOrder =
    manualMode &&
    receiptFile !== null &&
    (zones.length === 0 || selectedZone !== null) &&
    customerName &&
    customerPhone &&
    customerEmail &&
    customerAddress;

  useEffect(() => {
    if (manualMode) {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let suffix = "";
      for (let i = 0; i < 8; i++) {
        suffix += chars[Math.floor(Math.random() * chars.length)];
      }
      setPaymentReference(`GS-${suffix}`);
    }
  }, [manualMode]);

  useEffect(() => {
    if (!receiptFile) {
      setReceiptPreview(null);
      return;
    }
    if (receiptFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(receiptFile);
      setReceiptPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setReceiptPreview(null);
  }, [receiptFile]);

  // Load Paystack SDK only in paystack mode
  useEffect(() => {
    if (manualMode) return;
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [manualMode]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      toast.error("Please upload JPG, PNG, WebP, or PDF");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }
    setReceiptFile(file);
  };

  const handlePaystackCheckout = async () => {
    const paymentRef = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // @ts-ignore
    if (!window.PaystackPop) {
      throw new Error("Payment gateway is still loading. Please wait a moment and try again.");
    }

    // @ts-ignore
    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email: customerEmail,
      amount: Math.round(checkoutTotal * 100),
      currency: "NGN",
      ref: paymentRef,
      subaccount: store.paystack_sub_account_code || undefined,
      metadata: {
        store_id: store.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        customer_address: customerAddress,
        items: JSON.stringify([
          {
            productId: product.id,
            quantity: 1,
            price: product.price,
            variants: {
              size_or_length: product.selectedSize || undefined,
              color: product.selectedColor || undefined,
              texture: product.selectedTexture || undefined,
              type: product.selectedType || undefined,
            },
          },
        ]),
        total: checkoutTotal,
        delivery_fee: deliveryFee,
        source: new URLSearchParams(window.location.search).get("source") || "Direct",
      },
      callback: function (response: { reference: string }) {
        window.location.href = `/api/payment/verify/paystack?ref=${response.reference}&storeId=${store.id}`;
      },
      onClose: function () {
        setLoading(false);
        toast.error("Payment window closed");
      },
    });
    handler.openIframe();
  };

  const handleManualCheckout = async () => {
    if (!receiptFile) {
      toast.error("Please upload your payment receipt");
      return;
    }

    const formData = new FormData();
    formData.append("receipt", receiptFile);
    formData.append("store_id", store.id);
    formData.append("store_slug", store.slug);
    formData.append("customer_name", customerName);
    formData.append("customer_phone", customerPhone);
    formData.append("customer_email", customerEmail);
    formData.append("customer_address", customerAddress);
    formData.append(
      "items",
      JSON.stringify([
        {
          productId: product.id,
          quantity: 1,
          price: product.price,
          name: product.name,
          variants: {
            size_or_length: product.selectedSize || undefined,
            color: product.selectedColor || undefined,
            texture: product.selectedTexture || undefined,
            type: product.selectedType || undefined,
          },
        },
      ]),
    );
    formData.append("total", String(checkoutTotal));
    formData.append("delivery_fee", String(isPayOnArrival ? 0 : deliveryFee));
    formData.append(
      "source",
      new URLSearchParams(window.location.search).get("source") || "Direct",
    );
    formData.append("payment_reference", paymentReference);

    const res = await fetch("/api/orders/create", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to place order");
    }

    toast.success("Order placed! Payment is being reviewed.");
    onClose();
    router.push(data.redirectUrl);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedZone && zones?.length > 0) {
      toast.error("Please select a delivery zone");
      return;
    }

    if (manualMode && !receiptFile) {
      toast.error("Please upload your payment receipt to complete checkout");
      return;
    }

    setLoading(true);

    try {
      if (manualMode) {
        await handleManualCheckout();
      } else {
        await handlePaystackCheckout();
      }
    } catch (error: unknown) {
      console.error("Checkout error:", error);
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="bg-background w-full max-w-lg rounded-t-[32px] sm:rounded-[40px] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {manualMode ? "Bank Transfer Checkout" : "Secure Checkout"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 no-scrollbar">
          <div className="flex gap-4 p-4 rounded-3xl glass-card">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
              {product.image ? (
                <Image src={product.image} alt={product.name} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 bg-muted flex items-center justify-center" />
              )}
            </div>
            <div className="flex flex-col justify-center gap-1">
              <h3 className="font-bold text-sm leading-tight">{product.name}</h3>
              <p className="text-primary font-black">₦{Number(product.price).toLocaleString()}</p>
            </div>
          </div>

          <form onSubmit={handleCheckout} className="flex flex-col gap-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-primary" />
                <h3 className="font-bold uppercase text-[10px] tracking-widest text-zinc-500">
                  Customer Details
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full Name"
                  required
                  className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 outline-none transition-all placeholder:text-zinc-600 text-sm"
                />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Email Address"
                  required
                  className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 outline-none transition-all placeholder:text-zinc-600 text-sm"
                />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone Number"
                  required
                  className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 outline-none transition-all placeholder:text-zinc-600 text-sm"
                />
                <textarea
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Delivery Address"
                  required
                  rows={2}
                  className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 outline-none transition-all placeholder:text-zinc-600 text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-primary" />
                <h3 className="font-bold uppercase text-[10px] tracking-widest text-zinc-500">
                  Delivery Zone
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {zones?.map((zone: { name: string; price: number }) => (
                  <button
                    key={zone.name}
                    type="button"
                    onClick={() => setSelectedZone(zone)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all text-sm",
                      selectedZone?.name === zone.name
                        ? "bg-primary/10 border-primary text-primary font-bold"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:border-white/20",
                    )}
                  >
                    <span>{zone.name}</span>
                    <span>+ ₦{Number(zone.price).toLocaleString()}</span>
                  </button>
                ))}
                {zones.length === 0 && (
                  <p className="text-xs text-zinc-500 p-4 bg-white/5 rounded-2xl italic">
                    No delivery zones configured. Shipping is free.
                  </p>
                )}
              </div>
            </div>

            {manualMode && (
              <>
                <div className="flex flex-col gap-4 p-5 rounded-3xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <h3 className="font-bold uppercase text-[10px] tracking-widest text-primary">
                      Transfer to this account
                    </h3>
                  </div>

                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Bank</span>
                      <span className="font-bold">{bankDetails.bankName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Account Name</span>
                      <span className="font-bold">{bankDetails.accountName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Account Number</span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(bankDetails.accountNumber, "Account number")
                        }
                        className="font-bold flex items-center gap-1.5 hover:text-primary transition-colors"
                      >
                        {bankDetails.accountNumber}
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Amount</span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(String(checkoutTotal), "Amount")
                        }
                        className="font-black text-primary flex items-center gap-1.5"
                      >
                        ₦{checkoutTotal.toLocaleString()}
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Reference</span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(paymentReference, "Reference")
                        }
                        className="font-mono font-bold flex items-center gap-1.5 hover:text-primary transition-colors"
                      >
                        {paymentReference}
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Use the reference above in your transfer narration, then upload your receipt below.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-primary" />
                    <h3 className="font-bold uppercase text-[10px] tracking-widest text-zinc-500">
                      Upload Payment Receipt *
                    </h3>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleReceiptChange}
                    className="hidden"
                  />

                  {!receiptFile ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-8 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 flex flex-col items-center gap-2 transition-all"
                    >
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm font-bold text-muted-foreground">
                        Tap to upload receipt
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        JPG, PNG, WebP or PDF — max 5MB
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                      {receiptPreview ? (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                          <Image
                            src={receiptPreview}
                            alt="Receipt preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {receiptFile.name}
                        </p>
                        <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Receipt attached
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="text-xs font-bold text-muted-foreground hover:text-foreground"
                      >
                        Change
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex flex-col gap-3">
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Subtotal</span>
                <span>₦{Number(product.price).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Delivery Fee</span>
                <span>
                  {selectedZone
                    ? `₦${deliveryFee.toLocaleString()}`
                    : zones.length === 0
                      ? "Free"
                      : "Select Zone"}
                </span>
              </div>
              <div className="h-[1px] bg-white/10 my-1" />
              <div className="flex justify-between items-center">
                <span className="font-bold">Total to Pay</span>
                <span className="text-xl font-black text-primary">
                  ₦{checkoutTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={(!selectedZone && zones?.length > 0) || loading || (manualMode && !canPlaceOrder)}
              className="w-full py-5 rounded-[24px] brand-gradient text-primary-foreground font-black text-lg shadow-[0_0_30px_rgba(158,226,55,0.3)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : manualMode ? (
                <>Place Order <ArrowRight className="w-5 h-5" /></>
              ) : (
                <>Pay Now <ArrowRight className="w-5 h-5" /></>
              )}
            </button>

            {manualMode && !receiptFile && (
              <p className="text-center text-[11px] text-amber-500 font-medium">
                Upload your payment receipt to enable checkout
              </p>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}
