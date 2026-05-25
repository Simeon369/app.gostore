"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, Truck, CheckCircle2, ArrowLeft, Store, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import Image from "next/image";

export default function OrderTrackingClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const initialOrderId = searchParams.get("orderId") || "";
  
  const [orderIdInput, setOrderIdInput] = useState(initialOrderId);
  const [activeSearchId, setActiveSearchId] = useState(initialOrderId);
  
  const supabase = createClient();

  const { data: storeData } = useQuery({
    queryKey: ['store', slug],
    queryFn: async () => {
      const { data: store } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug)
        .single();
      return store;
    }
  });

  const { data: orderData, isLoading: isSearching, error, isError } = useQuery({
    queryKey: ['order-track', activeSearchId],
    queryFn: async () => {
      if (!activeSearchId || !storeData?.id) return null;
      
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', activeSearchId)
        .eq('store_id', storeData.id)
        .single();
        
      if (error || !order) {
        throw new Error("Order not found");
      }
      return order;
    },
    enabled: !!activeSearchId && !!storeData?.id,
    retry: false
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderIdInput.trim()) {
      setActiveSearchId(orderIdInput.trim());
      // Update URL without reloading
      window.history.replaceState({}, '', `?orderId=${orderIdInput.trim()}`);
    }
  };

  const steps = [
    { id: "Paid", label: "Order Placed & Paid", icon: Package },
    { id: "Shipped", label: "Order Shipped", icon: Truck },
  ];

  const currentStepIndex = orderData ? steps.findIndex(s => s.id === orderData.status) : -1;
  // If status is Delivered or something else, default to last step for simplicity in MVP
  const activeIndex = currentStepIndex === -1 && orderData?.status ? steps.length - 1 : currentStepIndex;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link 
            href={`/store/${slug}`} 
            className="flex items-center gap-2 text-xs md:text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Shop
          </Link>

          <div className="flex items-center gap-3">
            {storeData?.logo && (
              <div className="w-6 h-6 rounded-full overflow-hidden relative border border-border">
                <Image src={storeData.logo} alt={storeData.name} fill sizes="24px" className="object-cover" />
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 md:py-20 flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full text-center space-y-6"
        >
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 text-primary rounded-full mb-2">
            <Truck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">Track Your Order</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Enter your order ID below to see the current shipping status of your package.
          </p>

          <form onSubmit={handleSearch} className="relative max-w-md mx-auto mt-8">
            <input
              type="text"
              placeholder="e.g. ORD-1718293..."
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              className="w-full pl-6 pr-32 py-4 rounded-full bg-card border-2 border-border focus:border-primary/50 text-foreground text-sm font-bold outline-none transition-all shadow-sm"
              required
            />
            <button 
              type="submit"
              disabled={isSearching || !orderIdInput.trim()}
              className="absolute right-2 top-2 bottom-2 px-6 rounded-full brand-gradient text-primary-foreground font-black text-xs uppercase tracking-wider disabled:opacity-50 transition-all flex items-center justify-center min-w-[100px]"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Track"}
            </button>
          </form>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {activeSearchId && !isSearching && (
            <motion.div
              key={activeSearchId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md mx-auto mt-12"
            >
              {isError ? (
                <div className="p-6 text-center border-2 border-dashed border-red-500/20 bg-red-500/5 rounded-[32px]">
                  <p className="text-red-500 font-bold mb-1">Order Not Found</p>
                  <p className="text-xs text-muted-foreground">Please double check your order ID and try again.</p>
                </div>
              ) : orderData ? (
                <div className="p-6 md:p-8 bg-card border border-border rounded-[32px] shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 brand-gradient" />
                  
                  <div className="flex justify-between items-start mb-8 border-b border-border pb-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Order ID</p>
                      <p className="text-sm font-bold text-foreground">{orderData.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Date</p>
                      <p className="text-sm font-bold text-foreground">{new Date(orderData.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="relative pl-4 space-y-8">
                    {/* Vertical Line */}
                    <div className="absolute top-2 left-[23px] bottom-4 w-0.5 bg-border rounded-full" />
                    {activeIndex >= 0 && (
                      <div 
                        className="absolute top-2 left-[23px] w-0.5 brand-gradient rounded-full transition-all duration-1000"
                        style={{ height: activeIndex === 0 ? '0%' : '100%' }}
                      />
                    )}

                    {steps.map((step, index) => {
                      const isActive = index <= activeIndex;
                      const Icon = step.icon;
                      
                      return (
                        <div key={step.id} className="relative flex items-center gap-6">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors duration-500 shadow-sm",
                            isActive ? "brand-gradient text-primary-foreground" : "bg-muted border border-border text-muted-foreground"
                          )}>
                            {isActive ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                          </div>
                          <div>
                            <h4 className={cn(
                              "text-sm font-black transition-colors duration-500",
                              isActive ? "text-foreground" : "text-muted-foreground"
                            )}>{step.label}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {isActive && index === 0 ? "Payment confirmed." : 
                               isActive && index === 1 ? "Your package is on the way!" : "Pending"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
