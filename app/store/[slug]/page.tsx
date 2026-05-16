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
  CheckCircle2
} from "lucide-react";
import { Instagram } from "../../../components/icons";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { CheckoutModal } from "@/components/store/checkout-modal";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function StorefrontPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const supabase = createClient();

  useEffect(() => {
    // Check if script already exists
    if (document.querySelector('script[src="https://sdk.monnify.com/plugin/monnify.js"]')) {
      return;
    }
    const script = document.createElement('script');
    script.src = "https://sdk.monnify.com/plugin/monnify.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);
  
  const { data: storeData, isLoading } = useQuery({
    queryKey: ['store', slug],
    queryFn: async () => {
      // 1. Fetch store by slug
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug)
        .single();

      if (storeError || !store) return null;

      // 2. Fetch products for this store
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id);

      // 3. Increment visits (Fire and forget)
      supabase.rpc('increment_store_visits', { store_id: store.id }).then();

      return { store, products: products || [] };
    }
  });

  const [verifying, setVerifying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

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
        // Already verified by popup
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
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [checkoutProduct, setCheckoutProduct] = useState<any>(null);

  const categories = useMemo(() => {
    if (!storeData?.products) return ["All"];
    const cats = ["All", ...new Set(storeData.products.map(p => p.category).filter(Boolean))];
    return cats;
  }, [storeData?.products]);

  const filteredProducts = useMemo(() => {
    if (!storeData?.products) return [];
    return storeData.products.filter(p => {
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [storeData?.products, selectedCategory, searchQuery]);

  if (isLoading || verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        {verifying && <p className="text-zinc-500 font-bold animate-pulse uppercase tracking-widest text-[10px]">Verifying your payment...</p>}
      </div>
    );
  }

  if (!storeData?.store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Store Not Found</h1>
        <p className="text-muted-foreground mb-8">The link you followed might be broken or the store has been moved.</p>
        <Link href="/" className="px-6 py-3 brand-gradient text-primary-foreground font-bold rounded-2xl">
          Back to GoStore
        </Link>
      </div>
    );
  }

  const { store } = storeData;
  
  return (
    <div className="min-h-screen bg-background flex flex-col pb-24 lg:pb-10">
      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-20 left-4 right-4 z-50 flex justify-center pointer-events-none"
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

      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl glass-card flex items-center justify-center overflow-hidden border-white/10">
            {store.logo ? (
              <Image src={store.logo} alt={store.name} width={40} height={40} className="w-full h-full object-cover" />
            ) : (
              <Store className="w-5 h-5 text-zinc-500" />
            )}
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">{store.name}</h1>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Official Store</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {store.socials?.instagram && (
            <a href={`https://instagram.com/${store.socials.instagram}`} className="p-2 hover:bg-white/5 rounded-xl transition-all">
              <Instagram className="w-5 h-5 text-zinc-400" />
            </a>
          )}
          <button className="p-2 hover:bg-white/5 rounded-xl transition-all">
            <Search className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
      </header>

      {/* Hero / Description */}
      <section className="p-6 md:p-10 flex flex-col gap-4 max-w-5xl mx-auto w-full">
        <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
          {store.description || `Welcome to ${store.name}. Shop our premium collection.`}
        </p>
        
        {/* Categories Scroller */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                selectedCategory === cat 
                  ? "bg-primary border-primary text-black" 
                  : "bg-white/5 border-white/10 text-zinc-400 hover:border-white/20"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Product Grid */}
      <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {filteredProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col gap-3 group"
              >
                <div 
                  onClick={() => setCheckoutProduct(product)}
                  className="relative aspect-square rounded-[24px] overflow-hidden glass-card cursor-pointer group-hover:border-primary/50 transition-all shadow-xl"
                >
                  {product.image ? (
                    <Image 
                      src={product.image} 
                      alt={product.name} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <ShoppingBag className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  {product.tag && (
                    <div className={cn(
                      "absolute top-3 left-3 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest z-10 shadow-lg",
                      product.tag === "Sold Out" ? "bg-red-500 text-white" : 
                      product.tag === "Pre-order" ? "bg-orange-500 text-white" : 
                      "bg-primary text-black"
                    )}>
                      {product.tag}
                    </div>
                  )}
                  {/* Quick Add Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white text-black px-4 py-2 rounded-full font-bold text-xs">Buy Now</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1 px-1">
                  <h3 className="font-bold text-sm md:text-base line-clamp-1">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-primary font-black text-sm">₦{Number(product.price).toLocaleString()}</p>
                    <button 
                      onClick={() => {
                        const text = `Hi! I'm interested in the ${product.name} (₦${Number(product.price).toLocaleString()}) from your GoStore. ${window.location.href}`;
                        window.open(`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(text)}`);
                      }}
                      className="p-1.5 hover:bg-white/5 rounded-lg transition-all"
                    >
                      <MessageCircle className="w-4 h-4 text-zinc-500" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <ShoppingBag className="w-12 h-12 text-muted-foreground opacity-20" />
            <p className="text-zinc-500 font-bold">No products found in this category.</p>
          </div>
        )}
      </main>

      {/* Floating Checkout Button (If multiple items were supported) */}
      <AnimatePresence>
        {checkoutProduct && (
          <CheckoutModal 
            product={checkoutProduct} 
            store={store} 
            onClose={() => setCheckoutProduct(null)} 
          />
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <footer className="mt-auto py-10 flex flex-col items-center gap-4 text-center border-t border-white/5">
        <div className="flex items-center gap-2">
          <Image src="/gostore-logo.png" alt="GoStore" width={20} height={20} className="w-5 h-5 opacity-50" />
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Powered by GoStore</p>
        </div>
        <Link href="/" className="text-xs font-bold text-primary hover:underline">
          Create your own store in 5 minutes
        </Link>
      </footer>
    </div>
  );
}
