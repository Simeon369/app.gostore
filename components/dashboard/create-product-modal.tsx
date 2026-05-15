"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Info } from "lucide-react";
import { useState } from "react";
import { cn } from "@/utils/cn";

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProductModal({ isOpen, onClose }: CreateProductModalProps) {
  const [isPreorder, setIsPreorder] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass-card w-full max-w-2xl bg-card border-border shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh] rounded-[32px]"
        >
          <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card z-20">
            <div>
              <h2 className="text-xl font-black text-foreground">Add New Product</h2>
              <p className="text-xs text-muted-foreground mt-1">Create a new product listing for your store.</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-all text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex flex-col gap-6">
            {/* Image Upload */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Product Images</label>
              <div className="w-full h-40 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                <Upload className="w-6 h-6 text-muted-foreground" />
                <p className="text-sm font-bold text-muted-foreground">Click or drag images to upload</p>
                <p className="text-xs text-muted-foreground">JPG, PNG, WEBP up to 5MB</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Product Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Bone Straight 12A Wig"
                  className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground placeholder:text-muted-foreground/50"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Price (₦)</label>
                <input 
                  type="number" 
                  placeholder="0.00"
                  className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Description</label>
              <textarea 
                rows={4}
                placeholder="Describe your product..."
                className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all text-sm resize-none text-foreground placeholder:text-muted-foreground/50"
              />
            </div>

            {/* Pre-order Toggle */}
            <div className="p-5 rounded-2xl border border-primary/20 bg-primary/[0.02] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-foreground">Enable Pre-order</p>
                  <p className="text-xs text-muted-foreground mt-1">Allow customers to buy this before it's in stock.</p>
                </div>
                <button 
                  onClick={() => setIsPreorder(!isPreorder)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    isPreorder ? "bg-primary" : "bg-muted border border-border"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full bg-background absolute top-1 transition-all",
                    isPreorder ? "left-7" : "left-1"
                  )} />
                </button>
              </div>

              {isPreorder && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex flex-col gap-2 pt-2 border-t border-border"
                >
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Estimated Delivery
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Ships in 5-7 business days"
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary/50 outline-none transition-all text-sm text-foreground"
                  />
                </motion.div>
              )}
            </div>
            
            {!isPreorder && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Stock Quantity</label>
                <input 
                  type="number" 
                  placeholder="0"
                  className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground placeholder:text-muted-foreground/50"
                />
              </div>
            )}
          </div>

          <div className="p-6 border-t border-border bg-card flex justify-end gap-3 sticky bottom-0 z-20">
            <button 
              onClick={onClose}
              className="px-6 py-4 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all"
            >
              Cancel
            </button>
            <button className="px-8 py-4 rounded-2xl brand-gradient text-primary-foreground font-black flex items-center gap-2 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(158,226,55,0.2)]">
              Create Product
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
