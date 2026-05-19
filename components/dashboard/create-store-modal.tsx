"use client";

import { motion } from "framer-motion";
import { X, Store as StoreIcon, Globe, Loader2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useStore } from "../../store/use-store";
import { cn } from "../../utils/cn";

export function CreateStoreModal({ onClose }: { onClose: () => void }) {
  const { addStore } = useStore();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate creation
    setTimeout(() => {
      addStore({
        id: Math.random().toString(),
        name,
        slug: slug.toLowerCase().replace(/\s+/g, "-"),
        logo: "/gostore-logo.png",
        description: "A new GoStore shop.",
        whatsapp: "2348000000000",
        socials: {},
        deliveryZones: [
          { name: "Lagos Mainland", price: 1500 },
          { name: "Lagos Island", price: 2500 },
        ],
        status: "Draft",
        sales: "₦0",
        visits: "0",
        color: "from-zinc-500/20 to-black/20"
      });
      setLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background w-full max-w-md rounded-[40px] border border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-xl text-primary">
              <StoreIcon className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black italic">Launch New Store</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-all">
            <X className="w-6 h-6 text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Store Name</label>
              <input 
                type="text" 
                placeholder="e.g. Luxe Beauty" 
                required 
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                }}
                className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 outline-none transition-all placeholder:text-zinc-700 font-bold"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Store Link slug</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="luxe-beauty" 
                  required 
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 outline-none transition-all placeholder:text-zinc-700 font-bold"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex gap-3">
            <Globe className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
              Your store will be instantly live at <span className="text-white font-bold">app-gostore.vercel.app/store/{slug || "..."}</span>
            </p>
          </div>

          <button
            disabled={loading}
            className="w-full py-5 rounded-[24px] brand-gradient text-primary-foreground font-black text-lg shadow-[0_0_30px_rgba(158,226,55,0.2)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Launch Store <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
