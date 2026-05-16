"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Info, Loader2, Image as ImageIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateProductModal({ isOpen, onClose, onSuccess }: CreateProductModalProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [isPreorder, setIsPreorder] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("Fashion");
  const [tag, setTag] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      alert("Please upload a product image");
      return;
    }
    
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Get user's store
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!store) throw new Error("Store not found. Please complete onboarding.");

      // 2. Upload image to Supabase Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${store.id}/${Date.now()}-${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      // 4. Insert product into database
      const { error } = await supabase
        .from('products')
        .insert({
          store_id: store.id,
          name,
          price: Number(price),
          description,
          stock: isPreorder ? 0 : Number(stock),
          is_preorder: isPreorder,
          category,
          tag: isPreorder ? "Pre-order" : (tag || null),
          image: publicUrl,
          image_path: filePath
        });

      if (error) throw error;

      onSuccess?.();
      onClose();
      // Reset form
      setName("");
      setPrice("");
      setDescription("");
      setStock("");
      setIsPreorder(false);
      setImageFile(null);
      setImagePreview(null);
    } catch (error: any) {
      alert(error.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
          <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
            {/* Header - Fixed */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-card z-20 shrink-0">
              <div>
                <h2 className="text-xl font-black text-foreground">Add New Product</h2>
                <p className="text-xs text-muted-foreground mt-1">Create a new product listing for your store.</p>
              </div>
              <button 
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-full transition-all text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              <div className="flex flex-col gap-6">
                {/* Image Upload */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Product Image</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "w-full h-48 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer overflow-hidden relative",
                      imagePreview && "border-none"
                    )}
                  >
                    {imagePreview ? (
                      <>
                        <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-white font-bold text-sm">Change Image</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-muted-foreground" />
                        <p className="text-sm font-bold text-muted-foreground">Click to upload image</p>
                        <p className="text-xs text-muted-foreground">JPG, PNG, WEBP (Max 5MB)</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Product Name</label>
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Bone Straight 12A Wig"
                      className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Price (₦)</label>
                    <input 
                      type="number" 
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Description</label>
                  <textarea 
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
                      type="button"
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
                        <Info className="w-3 h-3" /> Note
                      </label>
                      <p className="text-xs text-muted-foreground px-1">This product will be marked as Pre-order on your storefront.</p>
                    </motion.div>
                  )}
                </div>
                
                {!isPreorder && (
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Stock Quantity</label>
                    <input 
                      type="number" 
                      required
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="0"
                      className="w-full px-5 py-4 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer - Fixed */}
            <div className="p-6 border-t border-border bg-card flex justify-end gap-3 shrink-0">
              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-4 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="px-8 py-4 rounded-2xl brand-gradient text-primary-foreground font-black flex items-center gap-2 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(158,226,55,0.2)] disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Product"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
