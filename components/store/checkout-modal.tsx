"use client";

import { motion } from "framer-motion";
import { X, MapPin, Truck, Phone, User, Home, Loader2, ArrowRight, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface CheckoutModalProps {
  product: any;
  store: any;
  onClose: () => void;
}

export function CheckoutModal({ product, store, onClose }: CheckoutModalProps) {
  const supabase = createClient();
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Delivery Info, 2: Payment Prep

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const zones = store.delivery_zones || store.deliveryZones || [];
  const isPayOnArrival = store.delivery_payment_option === "arrival";

  const deliveryFee = selectedZone ? Number(selectedZone.price) : 0;
  const total = Number(product.price) + deliveryFee;
  const checkoutTotal = isPayOnArrival ? Number(product.price) : total;

  // Load Paystack SDK
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedZone && zones?.length > 0) {
      toast.error("Please select a delivery zone");
      return;
    }

    setLoading(true);
    
    try {
      // 1. Generate a reference
      const paymentReference = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // 2. Open Paystack Inline SDK
      // @ts-ignore
      if (!window.PaystackPop) {
        throw new Error("Payment gateway is still loading. Please wait a moment and try again.");
      }

      // @ts-ignore
      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: customerEmail,
        amount: Math.round(checkoutTotal * 100), // Paystack expects kobo
        currency: "NGN",
        ref: paymentReference,
        subaccount: store.paystack_sub_account_code || undefined,
        metadata: {
          store_id: store.id,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          customer_address: customerAddress,
          items: JSON.stringify([{ 
            productId: product.id, 
            quantity: 1, 
            price: product.price,
            variants: {
              size_or_length: product.selectedSize || undefined,
              color: product.selectedColor || undefined,
              texture: product.selectedTexture || undefined,
              type: product.selectedType || undefined
            }
          }]),
          total: checkoutTotal,
          delivery_fee: deliveryFee,
          source: new URLSearchParams(window.location.search).get('source') || 'Direct'
        },
        callback: function(response: any) {
          console.log("Paystack Response:", response);
          // Redirect to verification
          window.location.href = `/api/payment/verify/paystack?ref=${response.reference}&storeId=${store.id}`;
        },
        onClose: function() {
          setLoading(false);
          toast.error("Payment window closed");
        }
      });
      handler.openIframe();
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
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
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold">Secure Checkout</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 no-scrollbar">
          {/* Summary */}
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
              
              {/* Show Selected Variations */}
              {(product.selectedSize || product.selectedColor || product.selectedTexture || product.selectedType) && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {product.selectedSize && (
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-zinc-400">
                      Size: {product.selectedSize}
                    </span>
                  )}
                  {product.selectedColor && (
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-zinc-400">
                      Color: {product.selectedColor}
                    </span>
                  )}
                  {product.selectedTexture && (
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-zinc-400">
                      Texture: {product.selectedTexture}
                    </span>
                  )}
                  {product.selectedType && (
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-zinc-400">
                      Type: {product.selectedType}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleCheckout} className="flex flex-col gap-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-primary" />
                <h3 className="font-bold uppercase text-[10px] tracking-widest text-zinc-500">Customer Details</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-2">
                  <input 
                    type="text" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full Name" 
                    required 
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 outline-none transition-all placeholder:text-zinc-600 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <input 
                    type="email" 
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Email Address (for receipt)" 
                    required 
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 outline-none transition-all placeholder:text-zinc-600 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <input 
                    type="tel" 
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Phone Number" 
                    required 
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 outline-none transition-all placeholder:text-zinc-600 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
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
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-primary" />
                <h3 className="font-bold uppercase text-[10px] tracking-widest text-zinc-500">Delivery Zone</h3>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {zones?.map((zone: any) => (
                  <button
                    key={zone.name}
                    type="button"
                    onClick={() => setSelectedZone(zone)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all text-sm",
                      selectedZone?.name === zone.name 
                        ? "bg-primary/10 border-primary text-primary font-bold" 
                        : "bg-white/5 border-white/10 text-zinc-400 hover:border-white/20"
                    )}
                  >
                    <span>{zone.name}</span>
                    <span className="flex flex-col items-end">
                      <span>+ ₦{Number(zone.price).toLocaleString()}</span>
                      {isPayOnArrival && <span className="text-[9px] text-zinc-500 font-medium">Pay on arrival</span>}
                    </span>
                  </button>
                ))}
                {zones.length === 0 && (
                   <p className="text-xs text-zinc-500 p-4 bg-white/5 rounded-2xl italic">No delivery zones configured. Shipping is free.</p>
                )}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex flex-col gap-3">
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Subtotal</span>
                <span>₦{Number(product.price).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Delivery Fee</span>
                <span>
                  {selectedZone ? (
                    isPayOnArrival ? (
                      <span className="text-right block">
                        ₦{deliveryFee.toLocaleString()}
                        <span className="text-[10px] text-zinc-500 block">Pay to courier on arrival</span>
                      </span>
                    ) : (
                      `₦${deliveryFee.toLocaleString()}`
                    )
                  ) : (
                    "Select Zone"
                  )}
                </span>
              </div>
              <div className="h-[1px] bg-white/10 my-1" />
              <div className="flex justify-between items-center">
                <span className="font-bold">Total to Pay Now</span>
                <span className="text-xl font-black text-primary">₦{checkoutTotal.toLocaleString()}</span>
              </div>
            </div>

            <button
              disabled={(!selectedZone && zones?.length > 0) || loading}
              className="w-full py-5 rounded-[24px] brand-gradient text-primary-foreground font-black text-lg shadow-[0_0_30px_rgba(158,226,55,0.3)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>Pay Now <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
