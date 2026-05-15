"use client";

import { motion } from "framer-motion";
import { X, MapPin, Truck, Phone, User, Home, Loader2, ArrowRight } from "lucide-react";
import { Store, Product } from "@/lib/mock-data";
import { useState } from "react";
import Image from "next/image";
import { cn } from "@/utils/cn";

interface CheckoutModalProps {
  product: Product;
  store: Store;
  onClose: () => void;
}

export function CheckoutModal({ product, store, onClose }: CheckoutModalProps) {
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Delivery Info, 2: Payment Prep

  const deliveryFee = selectedZone ? selectedZone.price : 0;
  const total = product.price + deliveryFee;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate Monnify transaction creation
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1500);
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
              <Image src={product.image} alt={product.name} fill className="object-cover" />
            </div>
            <div className="flex flex-col justify-center gap-1">
              <h3 className="font-bold text-sm leading-tight">{product.name}</h3>
              <p className="text-primary font-black">₦{product.price.toLocaleString()}</p>
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
                    placeholder="Full Name" 
                    required 
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 outline-none transition-all placeholder:text-zinc-600 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <input 
                    type="tel" 
                    placeholder="Phone Number (WhatsApp preferred)" 
                    required 
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 outline-none transition-all placeholder:text-zinc-600 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <textarea 
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
                {store.deliveryZones.map((zone) => (
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
                    <span>+ ₦{zone.price.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex flex-col gap-3">
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Subtotal</span>
                <span>₦{product.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Delivery Fee</span>
                <span>{selectedZone ? `₦${deliveryFee.toLocaleString()}` : "Select Zone"}</span>
              </div>
              <div className="h-[1px] bg-white/10 my-1" />
              <div className="flex justify-between items-center">
                <span className="font-bold">Total</span>
                <span className="text-xl font-black text-primary">₦{total.toLocaleString()}</span>
              </div>
            </div>

            <button
              disabled={!selectedZone || loading}
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
