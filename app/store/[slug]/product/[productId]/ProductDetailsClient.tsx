"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Store, 
  ShoppingBag, 
  MessageCircle, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck, 
  Truck, 
  Zap,
  Share2
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { CheckoutModal } from "@/components/store/checkout-modal";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { Instagram, TikTok } from "@/components/icons";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";

const formatWhatsAppNumber = (phone: string): string => {
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('234')) return clean;
  if (clean.startsWith('0')) return '234' + clean.slice(1);
  if (!clean) return '';
  return '234' + clean;
};

export default function ProductDetailsClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;
  const productId = params.productId as string;
  const supabase = createClient();

  const [verifying, setVerifying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState<any>(null);

  // Load payment SDK scripts
  useEffect(() => {
    if (document.querySelector('script[src="https://sdk.monnify.com/plugin/monnify.js"]')) {
      return;
    }
    const script = document.createElement('script');
    script.src = "https://sdk.monnify.com/plugin/monnify.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const { data: storeData, isLoading } = useQuery({
    queryKey: ['store-product', slug, productId],
    queryFn: async () => {
      // 1. Fetch store by slug
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug)
        .single();

      if (storeError || !store) return null;

      // 2. Fetch the specific product
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('store_id', store.id)
        .single();

      if (productError || !product || product.tag === 'Archived' || product.tag === 'Deleted') return { store, product: null };

      // 3. Increment visits (with dynamic source tracking)
      const viewSource = searchParams.get('source') || 'Direct';
      supabase.rpc('increment_store_visits', { store_id: store.id, view_source: viewSource }).then();

      return { store, product };
    }
  });

  useEffect(() => {
    const paymentRef = searchParams.get('ref');
    const success = searchParams.get('success');

    if (success === 'true') {
      if (paymentRef) {
        const verifyPayment = async () => {
          setVerifying(true);
          try {
            const res = await fetch(`/api/payment/verify?ref=${paymentRef}`);
            const data = await res.json();
            if (data.status === 'success' || data.status === 'already_exists') {
              setShowSuccess(true);
              // Clean query parameters safely
              window.history.replaceState({}, '', window.location.pathname);
            }
          } catch (err) {
            console.error("Verification failed:", err);
          } finally {
            setVerifying(false);
          }
        };
        verifyPayment();
      } else {
        setShowSuccess(true);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  if (isLoading || verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        {verifying && (
          <p className="text-zinc-500 font-bold animate-pulse uppercase tracking-widest text-[10px]">
            Verifying your payment...
          </p>
        )}
      </div>
    );
  }

  if (!storeData?.store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Store Not Found</h1>
        <Link href="/" className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold">
          Go Home
        </Link>
      </div>
    );
  }

  const { store, product } = storeData;

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4">
        <h1 className="text-2xl font-black text-foreground">Product Not Found</h1>
        <p className="text-muted-foreground text-sm max-w-sm">This item may have been removed or is no longer available.</p>
        <Link href={`/store/${slug}`} className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold transition-all hover:scale-105">
          Back to Shop
        </Link>
      </div>
    );
  }

  const handleShareProduct = () => {
    if (!product || !store) return;
    const url = window.location.href;
    const title = `${product.name} | Buy for ₦${Number(product.price).toLocaleString()} | ${store.name}`;
    const text = product.description || `Check out ${product.name} at ${store.name} official storefront!`;

    if (navigator.share) {
      navigator.share({
        title,
        text,
        url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Product link copied to clipboard!");
    }
  };

  const handleWhatsAppInquiry = () => {
    const text = `Hi! I'm interested in the ${product.name} (₦${Number(product.price).toLocaleString()}) from your store: ${window.location.href}`;
    window.open(`https://wa.me/${formatWhatsAppNumber(store.whatsapp)}?text=${encodeURIComponent(text)}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24 lg:pb-10">
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
                <p className="text-[10px] font-bold opacity-90 uppercase tracking-widest">Check your email for the receipt.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Header */}
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link 
            href={`/store/${slug}`} 
            className="flex items-center gap-2 text-xs md:text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Shop
          </Link>

          <div className="flex items-center gap-3">
            {/* Small Brand Card */}
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border border-border">
              {store.logo && (
                <div className="w-5 h-5 rounded-full overflow-hidden relative">
                  <Image src={store.logo} alt={store.name} fill className="object-cover" />
                </div>
              )}
              <span className="text-[10px] font-bold text-foreground max-w-[100px] truncate">{store.name}</span>
            </div>
            
            <div className="bg-muted/50 rounded-full border border-border p-0.5">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Product Details Container */}
      <main className="max-w-5xl mx-auto w-full px-6 py-8 flex-1 flex flex-col gap-8 md:gap-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
          {/* Left Column: Product Image */}
          <div className="w-full relative aspect-square bg-card rounded-[32px] border border-border overflow-hidden shadow-xl">
            {product.image ? (
              <Image 
                src={product.image} 
                alt={product.name} 
                fill 
                priority
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                <ShoppingBag className="w-16 h-16 text-muted-foreground opacity-20" />
              </div>
            )}

            {product.tag && (
              <div className={cn(
                "absolute top-4 left-4 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest z-10 shadow-lg",
                product.tag === "Sold Out" ? "bg-red-500 text-white" : 
                product.tag === "Pre-order" ? "bg-orange-500 text-white" : 
                "bg-primary text-primary-foreground"
              )}>
                {product.tag}
              </div>
            )}
          </div>

          {/* Right Column: Info & Checkout */}
          <div className="flex flex-col gap-6 md:py-2">
            <div>
              {product.category && (
                <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
                  {product.category}
                </span>
              )}
              <h1 className="text-2xl md:text-4xl font-black text-foreground mt-4 leading-tight">
                {product.name}
              </h1>
              <p className="text-3xl font-black text-primary mt-3">
                ₦{Number(product.price).toLocaleString()}
              </p>
            </div>

            <div className="h-[1px] bg-border w-full" />

            {/* Description */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Product Description</h3>
              {product.description ? (
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              ) : (
                <p className="text-muted-foreground/60 text-sm italic">
                  No description provided for this product.
                </p>
              )}
            </div>

            <div className="h-[1px] bg-border w-full" />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setCheckoutProduct(product)}
                disabled={product.tag === "Sold Out"}
                className={cn(
                  "flex-1 py-4 px-6 rounded-[20px] font-black text-xs uppercase tracking-wider text-center transition-all shadow-lg flex items-center justify-center gap-2",
                  product.tag === "Sold Out"
                    ? "bg-muted-foreground/20 text-muted-foreground/60 cursor-not-allowed border border-border"
                    : "bg-primary hover:bg-primary/95 text-primary-foreground hover:scale-[1.01]"
                )}
              >
                <ShoppingBag className="w-4 h-4" />
                {product.tag === "Sold Out" ? "Sold Out" : "Buy Now"}
              </button>

              {store.whatsapp && (
                <button
                  onClick={handleWhatsAppInquiry}
                  className="py-4 px-6 rounded-[20px] bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat on WhatsApp
                </button>
              )}

              <button
                onClick={handleShareProduct}
                className="py-4 px-6 rounded-[20px] bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>

            {/* Trust Strip */}
            <div className="grid grid-cols-3 gap-2 bg-muted/30 border border-border p-4 rounded-2xl text-center mt-2">
              <div className="flex flex-col items-center gap-1">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider text-foreground">Instant Checkout</span>
              </div>
              <div className="flex flex-col items-center gap-1 border-x border-border">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider text-foreground">Secured Payment</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Truck className="w-4 h-4 text-primary" />
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider text-foreground">Direct Delivery</span>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Store Contacts Section */}
      <section className="max-w-5xl mx-auto w-full px-6 py-8 border-t border-border mt-12">
        <div className="flex flex-col items-center md:flex-row md:justify-between gap-6 text-center md:text-left">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Store Contact & Socials</h3>
            <p className="text-[11px] text-muted-foreground/80 mt-1">Have any questions about products or your order? Reach out directly!</p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3">
            {store.whatsapp && (
              <a 
                href={`https://wa.me/${formatWhatsAppNumber(store.whatsapp)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-xs font-bold transition-all shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>+{formatWhatsAppNumber(store.whatsapp)}</span>
              </a>
            )}
            
            {store.socials?.email && (
              <a 
                href={`mailto:${store.socials.email}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs font-bold transition-all shadow-sm"
              >
                <Store className="w-4 h-4" />
                <span>{store.socials.email}</span>
              </a>
            )}

            {store.socials?.instagram && (
              <a 
                href={`https://instagram.com/${store.socials.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-muted hover:bg-muted/80 border border-border text-muted-foreground text-xs font-bold transition-all"
              >
                <Instagram className="w-4 h-4" />
                <span>@{store.socials.instagram.replace('@', '')}</span>
              </a>
            )}

            {store.socials?.tiktok && (
              <a 
                href={`https://tiktok.com/@${store.socials.tiktok.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-muted hover:bg-muted/80 border border-border text-muted-foreground text-xs font-bold transition-all"
              >
                <TikTok className="w-4 h-4" />
                <span>@{store.socials.tiktok.replace('@', '')}</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="mt-auto py-10 flex flex-col items-center gap-4 text-center border-t border-border">
        <div className="flex items-center gap-2">
          <Image src="/gostore-logo.png" alt="GoStore" width={20} height={20} className="w-5 h-5 opacity-50" />
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Powered by GoStore</p>
        </div>
        <Link href="/" className="text-xs font-bold text-primary hover:underline">
          Create your own store in 5 minutes
        </Link>
      </footer>

      {/* Checkout Modal */}
      {checkoutProduct && (
        <CheckoutModal 
          product={checkoutProduct} 
          store={store} 
          onClose={() => setCheckoutProduct(null)} 
        />
      )}
    </div>
  );
}
