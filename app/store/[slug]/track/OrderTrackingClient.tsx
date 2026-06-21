"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Clock,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { cn } from "@/utils/cn";
import { formatOrderDeliveryFee } from "@/lib/delivery-utils";

function getTrackingSteps(deliveryMethod?: string | null) {
  const shippedLabel =
    deliveryMethod === "pickup" ? "Set for Pickup" : "Shipped";
  const shippedDescription =
    deliveryMethod === "pickup"
      ? "Your order is ready to collect from the vendor."
      : "Your package is on the way!";

  return [
    {
      id: "Pending",
      label: "Payment Under Review",
      description: "We're verifying your bank transfer.",
      icon: Clock,
    },
    {
      id: "Paid",
      label: "Payment Confirmed",
      description: "Vendor is preparing your order.",
      icon: Package,
    },
    {
      id: "Shipped",
      label: shippedLabel,
      description: shippedDescription,
      icon: Truck,
    },
  ];
}

function getActiveStepIndex(status: string): number {
  if (status === "Pending") return 0;
  if (status === "Paid") return 1;
  if (status === "Shipped" || status === "Delivered") return 2;
  return -1;
}

export default function OrderTrackingClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const initialOrderId = (searchParams.get("orderId") || "")
    .trim()
    .toUpperCase();

  const [orderIdInput, setOrderIdInput] = useState(initialOrderId);
  const [activeSearchId, setActiveSearchId] = useState(initialOrderId);

  const supabase = createClient();

  const { data: storeData } = useQuery({
    queryKey: ["store", slug],
    queryFn: async () => {
      const { data: store } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", slug)
        .single();
      return store;
    },
  });

  const {
    data: orderData,
    isLoading: isSearching,
    isError,
  } = useQuery({
    queryKey: ["order-track", slug, activeSearchId],
    queryFn: async () => {
      if (!activeSearchId || !slug) return null;

      const ref = activeSearchId.trim();
      const res = await fetch(
        `/api/orders/track?orderId=${encodeURIComponent(ref)}&storeSlug=${encodeURIComponent(slug)}`,
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Order not found");
      }
      return data;
    },
    enabled: !!activeSearchId && !!slug,
    retry: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const ref = orderIdInput.trim().toUpperCase();
    if (ref) {
      setOrderIdInput(ref);
      setActiveSearchId(ref);
      window.history.replaceState({}, "", `?orderId=${encodeURIComponent(ref)}`);
    }
  };

  const activeIndex = orderData ? getActiveStepIndex(orderData.status) : -1;
  const isRejected = orderData?.status === "Rejected";
  const trackingSteps = getTrackingSteps(orderData?.delivery_method);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href={`/store/${slug}`}
            className="flex items-center gap-2 text-xs md:text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Shop
          </Link>

          {storeData?.logo && (
            <div className="w-6 h-6 rounded-full overflow-hidden relative border border-border">
              <Image
                src={storeData.logo}
                alt={storeData.name}
                fill
                sizes="24px"
                className="object-cover"
              />
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 md:py-20 flex flex-col items-center">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="w-full text-center space-y-6"
        >
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 text-primary rounded-full mb-2">
            <Truck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
            Track Your Order
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Enter your order ID to see payment and shipping status.
          </p>

          <form
            onSubmit={handleSearch}
            className="relative max-w-md mx-auto mt-8"
          >
            <input
              type="text"
              placeholder="e.g. A1B2C3D4"
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
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Track"
              )}
            </button>
          </form>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeSearchId && !isSearching && (
            <motion.div
              key={activeSearchId}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md mx-auto mt-12"
            >
              {isError ? (
                <div className="p-6 text-center border-2 border-dashed border-red-500/20 bg-red-500/5 rounded-[32px]">
                  <p className="text-red-500 font-bold mb-1">Order Not Found</p>
                  <p className="text-xs text-muted-foreground">
                    Please double check your order ID and try again.
                  </p>
                </div>
              ) : orderData ? (
                <div className="p-6 md:p-8 bg-card border border-border rounded-[32px] shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 brand-gradient" />

                  {isRejected && (
                    <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-red-500">
                          Payment Not Confirmed
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {orderData.rejection_reason ||
                            "We could not verify your payment. Please contact the store."}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-8 border-b border-border pb-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                        Order ID
                      </p>
                      <p className="text-sm font-bold text-foreground uppercase">
                        {orderData.id.split("-")[0].toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                        Total
                      </p>
                      <p className="text-sm font-bold text-primary">
                        ₦{Number(orderData.total).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatOrderDeliveryFee(orderData.delivery_fee, orderData.delivery_method)}
                      </p>
                    </div>
                  </div>

                  {!isRejected && (
                    <div className="relative pl-4 space-y-8">
                      <div className="absolute top-2 left-[23px] bottom-4 w-0.5 bg-border rounded-full" />
                      {activeIndex >= 0 && (
                        <div
                          className="absolute top-2 left-[23px] w-0.5 brand-gradient rounded-full transition-all duration-1000"
                          style={{
                            height:
                              activeIndex === 0
                                ? "0%"
                                : activeIndex === 1
                                  ? "50%"
                                  : "100%",
                          }}
                        />
                      )}

                      {trackingSteps.map((step, index) => {
                        const isActive = index <= activeIndex;
                        const Icon = step.icon;

                        return (
                          <div
                            key={step.id}
                            className="relative flex items-center gap-6"
                          >
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors duration-500 shadow-sm",
                                isActive
                                  ? "brand-gradient text-primary-foreground"
                                  : "bg-muted border border-border text-muted-foreground",
                              )}
                            >
                              {isActive ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <Icon className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <h4
                                className={cn(
                                  "text-sm font-black transition-colors duration-500",
                                  isActive
                                    ? "text-foreground"
                                    : "text-muted-foreground",
                                )}
                              >
                                {step.label}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {isActive
                                  ? step.description
                                  : "Pending"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
