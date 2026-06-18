"use client";

import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Store,
  ShoppingBag,
  MessageCircle,
  ArrowLeft,
  Search,
  ExternalLink,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { Instagram, TikTok } from "../../../components/icons";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { CheckoutModal } from "@/components/store/checkout-modal";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { isManualTransferMode } from "@/lib/payment-config";
import { getSessionItem, setSessionItem } from "@/lib/safe-storage";

const formatWhatsAppNumber = (phone: string): string => {
  let clean = phone.replace(/\D/g, "");
  if (clean.startsWith("234")) return clean;
  if (clean.startsWith("0")) return "234" + clean.slice(1);
  if (!clean) return "";
  return "234" + clean;
};

export default function StorefrontClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const supabase = createClient();

  const queryString = searchParams.toString();
  const querySuffix = queryString ? `?${queryString}` : "";

  useEffect(() => {
    // Check if script already exists
    if (
      document.querySelector(
        'script[src="https://sdk.monnify.com/plugin/monnify.js"]',
      )
    ) {
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.monnify.com/plugin/monnify.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const { data: storeData, isLoading } = useQuery({
    queryKey: ["store", slug],
    queryFn: async () => {
      // 1. Fetch store by slug
      const { data: store, error: storeError } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", slug)
        .single();

      if (storeError || !store) return null;

      // 2. Fetch products for this store
      const { data: products } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", store.id);

      return { store, products: products || [] };
    },
  });

  const [verifying, setVerifying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Accurate session-based store views tracking
  useEffect(() => {
    if (storeData?.store?.id) {
      const trackView = async () => {
        const storeId = storeData.store.id;
        const sessionKey = `visited_store_${storeId}`;

        if (!getSessionItem(sessionKey)) {
          // Check if current user is owner or super admin
          const {
            data: { user },
          } = await supabase.auth.getUser();
          const isOwner = user?.id === storeData.store.user_id;
          const isSuperAdmin = user?.email === "gostoreng@gmail.com";

          if (!isOwner && !isSuperAdmin) {
            const viewSource =
              searchParams.get("src") || searchParams.get("source") || "Direct";
            supabase
              .rpc("increment_store_visits", {
                store_id: storeId,
                view_source: viewSource,
              })
              .then();
          }
          setSessionItem(sessionKey, "true");
        }
      };

      trackView();
    }
  }, [storeData?.store?.id, searchParams, supabase]);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  useEffect(() => {
    if (isManualTransferMode()) return;

    const paymentRef = searchParams.get("ref");
    const success = searchParams.get("success");

    if (success === "true") {
      if (paymentRef) {
        const verifyPayment = async () => {
          setVerifying(true);
          try {
            const res = await fetch(`/api/payment/verify?ref=${paymentRef}`);
            const data = await res.json();
            if (data.status === "success" || data.status === "already_exists") {
              setShowSuccess(true);
              window.history.replaceState({}, "", window.location.pathname);
            }
          } catch (err) {
            console.error("Verification failed:", err);
          } finally {
            setVerifying(false);
          }
        };
        verifyPayment();
      } else {
        // Already verified by popup
        setShowSuccess(true);
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [checkoutProduct, setCheckoutProduct] = useState<any>(null);

  const handleShareStore = () => {
    if (!storeData?.store) return;
    const url = window.location.href;
    const title = `${storeData.store.name} | Official Storefront`;
    const text =
      storeData.store.description ||
      `Check out ${storeData.store.name} official storefront on GoStore!`;

    if (navigator.share) {
      navigator
        .share({
          title,
          text,
          url,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Store link copied to clipboard!");
    }
  };

  const categories = useMemo(() => {
    if (!storeData?.store) return ["All"];
    const cats = new Set<string>();

    if (storeData.store.collections) {
      storeData.store.collections.forEach((c: string) => cats.add(c));
    }

    if (storeData.products) {
      storeData.products.forEach((p) => {
        // Ignore the old hardcoded "Fashion" category
        if (p.category && p.category !== "Fashion") cats.add(p.category);
        if (p.collections) p.collections.forEach((c: string) => cats.add(c));
      });
    }

    return ["All", ...Array.from(cats)];
  }, [storeData]);

  const filteredProducts = useMemo(() => {
    if (!storeData?.products) return [];
    return storeData.products.filter((p) => {
      if (p.tag === "Archived" || p.tag === "Deleted") return false;

      const matchesCategory =
        selectedCategory === "All" ||
        p.category === selectedCategory ||
        (p.collections && p.collections.includes(selectedCategory));

      const matchesSearch = p.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [storeData?.products, selectedCategory, searchQuery]);

  if (isLoading || verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        {verifying && (
          <p className="text-muted-foreground font-bold animate-pulse uppercase tracking-widest text-[10px]">
            Verifying your payment...
          </p>
        )}
      </div>
    );
  }

  if (!storeData?.store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold mb-4 text-foreground">
          Store Not Found
        </h1>
        <p className="text-muted-foreground mb-8">
          The link you followed might be broken or the store has been moved.
        </p>
        <Link
          href="/"
          className="px-6 py-3 brand-gradient text-primary-foreground font-bold rounded-2xl"
        >
          Back to GoStore
        </Link>
      </div>
    );
  }

  const { store } = storeData;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-6 left-4 right-4 z-50 flex justify-center pointer-events-none"
          >
            <div className="bg-emerald-500 text-white px-6 py-4 rounded-[24px] shadow-2xl flex items-center gap-3 border border-emerald-400/20 pointer-events-auto">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-sm">Order Successful!</p>
                <p className="text-[10px] font-bold opacity-90 uppercase tracking-widest">
                  Check your email for the receipt.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="px-6 md:px-10 max-w-6xl mx-auto py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full overflow-hidden">
              <Image
                src="/gostore-logo.png"
                alt="GoStore"
                width={24}
                height={24}
                className="w-10 h-10"
              />
            </div>

            <span className="text-xs font-black uppercase tracking-wider text-primary hidden sm:inline">
              GoStore
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShareStore}
              className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 border border-border text-muted-foreground transition-all"
              title="Share Store"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Store Hero Section */}
      <section className="px-6 md:px-10 py-10 md:py-16 max-w-6xl mx-auto w-full flex flex-col items-center gap-6 text-center">
        {/* Store Logo */}
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-background p-1 shadow-xl border border-border overflow-hidden flex items-center justify-center">
          {store.logo ? (
            <Image
              src={store.logo}
              alt={store.name}
              width={128}
              height={128}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
              <Store className="w-10 h-10 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Store Name & Badge */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-3xl md:text-4xl font-black text-foreground">
            {store.name}
          </h1>
          {/* <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Now Open
          </span> */}
        </div>

        {/* Store Description */}
        {store.description && (
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-2xl">
            {store.description}
          </p>
        )}

        {/* Action Buttons */}
        {/* <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {store.whatsapp && (
            <a
              href={`https://wa.me/${formatWhatsAppNumber(store.whatsapp)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-bold transition-all shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </a>
          )}
          {store.socials?.instagram &&
            typeof store.socials.instagram === "string" && (
              <a
                href={`https://instagram.com/${store.socials.instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-2xl bg-muted hover:bg-muted/80 border border-border text-muted-foreground transition-all"
              >
                <Instagram className="w-4 h-4" />
              </a>
            )}
          {store.socials?.tiktok &&
            typeof store.socials.tiktok === "string" && (
              <a
                href={`https://tiktok.com/@${store.socials.tiktok.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-2xl bg-muted hover:bg-muted/80 border border-border text-muted-foreground transition-all"
              >
                <TikTok className="w-4 h-4" />
              </a>
            )}
        </div> */}
      </section>

      {/* Categories & Search */}
      <section className="px-6 md:px-10 py-6 max-w-6xl mx-auto w-full flex flex-col gap-4">
        {/* Search Input - Full Width */}
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-muted border border-border focus:border-primary/50 text-foreground text-sm font-semibold outline-none transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>

        {/* Categories pills - Scrollable */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all border uppercase tracking-wider",
                selectedCategory === cat
                  ? "bg-primary border-primary text-primary-foreground shadow-lg"
                  : "bg-muted border-border text-muted-foreground hover:border-muted-foreground/30",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Product Grid - 2 Columns Mobile, 4 Columns Desktop */}
      <main className="flex-1 px-6 md:px-10 max-w-6xl mx-auto w-full py-8">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative aspect-square rounded-[20px] overflow-hidden group bg-card border border-border transition-all duration-300"
              >
                {/* Clickable Card link */}
                <Link
                  href={`/store/${slug}/product/${product.id}${querySuffix}`}
                  className="absolute inset-0 z-10"
                />

                {/* Product Image */}
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    priority={i < 4}
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out z-0"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted z-0">
                    <ShoppingBag className="w-10 h-10 text-muted-foreground opacity-30" />
                  </div>
                )}

                {/* Dynamic Tag Overlay */}
                {product.tag && (
                  <div
                    className={cn(
                      "absolute top-3 left-3 px-2.5 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest z-20 shadow-lg border border-border backdrop-blur-md",
                      product.tag === "Sold Out"
                        ? "bg-red-500/80 text-white"
                        : product.tag === "Pre-order"
                          ? "bg-orange-500/80 text-white"
                          : "bg-primary/80 text-primary-foreground",
                    )}
                  >
                    {product.tag}
                  </div>
                )}

                {/* Smooth Dark Vignette Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/45 to-transparent pointer-events-none z-10 transition-opacity duration-300 group-hover:opacity-90" />

                {/* Info Text overlays */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 flex flex-col gap-1 z-20 pointer-events-none">
                  <h3 className="font-bold text-xs sm:text-base md:text-lg text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-primary font-black text-xs sm:text-sm md:text-base tracking-wide">
                    ₦{Number(product.price).toLocaleString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <ShoppingBag className="w-12 h-12 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground font-bold">
              No products found in this category.
            </p>
          </div>
        )}
      </main>

      {/* Floating Checkout Button */}
      <AnimatePresence>
        {checkoutProduct && (
          <CheckoutModal
            product={checkoutProduct}
            store={store}
            onClose={() => setCheckoutProduct(null)}
          />
        )}
      </AnimatePresence>

      {/* Store Contacts & Footer */}
      <section className="border-t border-border mt-12 py-10">
        <div className="px-6 md:px-10 max-w-6xl mx-auto w-full flex flex-col gap-8">
          {/* Contact Section */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Get in Touch
              </h3>
              <p className="text-[11px] text-muted-foreground/80 max-w-sm">
                Have questions about a product or your order? Reach out directly
                to the store.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {store.whatsapp && (
                <a
                  href={`https://wa.me/${formatWhatsAppNumber(store.whatsapp)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              )}

              {store.socials?.email && (
                <a
                  href={`mailto:${store.socials.email}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-[10px] font-bold transition-all"
                >
                  <Store className="w-3.5 h-3.5" />
                  Email
                </a>
              )}

              {store.socials?.instagram &&
                typeof store.socials.instagram === "string" && (
                  <a
                    href={`https://instagram.com/${store.socials.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 border border-border text-muted-foreground text-[10px] font-bold transition-all"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    Instagram
                  </a>
                )}

              {store.socials?.tiktok &&
                typeof store.socials.tiktok === "string" && (
                  <a
                    href={`https://tiktok.com/@${store.socials.tiktok.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 border border-border text-muted-foreground text-[10px] font-bold transition-all"
                  >
                    <TikTok className="w-3.5 h-3.5" />
                    TikTok
                  </a>
                )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Footer Branding */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
              <Image
                src="/gostore-logo.png"
                alt="GoStore"
                width={16}
                height={16}
                className="w-4 h-4 opacity-60"
              />
              Powered by GoStore
            </div>

            <Link
              href="/"
              className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
            >
              Create Your Store in 5 Minutes →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
