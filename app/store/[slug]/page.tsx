"use client";

import { useParams } from "next/navigation";
import { MOCK_STORES, MOCK_PRODUCTS } from "@/lib/mock-data";
import Image from "next/image";
import { 
  ShoppingBag, 
  MessageCircle, 
  ArrowLeft,
  Search,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { Instagram } from "../../../components/icons";
import Link from "next/link";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { CheckoutModal } from "@/components/store/checkout-modal";

export default function StorefrontPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const store = MOCK_STORES.find(s => s.slug === slug);
  const products = store ? MOCK_PRODUCTS[store.id] : [];
  
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [checkoutProduct, setCheckoutProduct] = useState<any>(null);

  const categories = useMemo(() => {
    const cats = ["All", ...new Set(products.map(p => p.category))];
    return cats;
  }, [products]);

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Store Not Found</h1>
        <p className="text-zinc-400 mb-8">The link you followed might be broken or the store has been moved.</p>
        <Link href="/" className="px-6 py-3 brand-gradient text-primary-foreground font-bold rounded-2xl">
          Back to GoStore
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24 lg:pb-10">
      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl glass-card flex items-center justify-center overflow-hidden border-white/10">
            <Image src={store.logo} alt={store.name} width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">{store.name}</h1>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Official Store</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {store.socials.instagram && (
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
          {store.description}
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
                <Image 
                  src={product.image} 
                  alt={product.name} 
                  fill 
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
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
                  <p className="text-primary font-black text-sm">₦{product.price.toLocaleString()}</p>
                  <button 
                    onClick={() => {
                      const text = `Hi! I'm interested in the ${product.name} (₦${product.price.toLocaleString()}) from your GoStore. ${window.location.href}`;
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
