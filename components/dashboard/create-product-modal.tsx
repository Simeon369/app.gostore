"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Info, Loader2, Image as ImageIcon, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { toast } from "sonner";
import { calculateGrossAmount } from "@/utils/pricing";
import {
  buildProductImagePayload,
  deleteProductImagesFromStorage,
  getProductImages,
  MAX_PRODUCT_IMAGES,
  uploadProductImage,
} from "@/lib/product-images";
import { generateId } from "@/lib/id";

type ImageDraft = {
  id: string;
  preview: string;
  path?: string;
  file?: File;
};

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editProduct?: any;
}

export function CreateProductModal({ isOpen, onClose, onSuccess, editProduct }: CreateProductModalProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [isPreorder, setIsPreorder] = useState(false);
  
  const isEditing = !!editProduct;

  // Form State
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [collections, setCollections] = useState<string[]>([]);
  const [storeCollections, setStoreCollections] = useState<string[]>([]);
  const [newCollectionInput, setNewCollectionInput] = useState("");
  const [tag, setTag] = useState("");
  const [imageDrafts, setImageDrafts] = useState<ImageDraft[]>([]);
  const [removedImagePaths, setRemovedImagePaths] = useState<string[]>([]);

  // Universal Variants State
  const [showVariantsSection, setShowVariantsSection] = useState(false);
  const [activeVariantCategory, setActiveVariantCategory] = useState<string | null>(null); // 'size', 'color', 'texture', 'type'
  
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [textures, setTextures] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  
  const [sizeInput, setSizeInput] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [textureInput, setTextureInput] = useState("");
  const [typeInput, setTypeInput] = useState("");

  const handleAddSize = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = sizeInput.trim();
    if (val && !sizes.includes(val)) {
      setSizes([...sizes, val]);
    }
    setSizeInput("");
  };

  const handleAddColor = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = colorInput.trim();
    if (val && !colors.includes(val)) {
      setColors([...colors, val]);
    }
    setColorInput("");
  };

  const handleAddTexture = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = textureInput.trim();
    if (val && !textures.includes(val)) {
      setTextures([...textures, val]);
    }
    setTextureInput("");
  };

  const handleAddType = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = typeInput.trim();
    if (val && !types.includes(val)) {
      setTypes([...types, val]);
    }
    setTypeInput("");
  };

  // Pre-fill form when editing
  useEffect(() => {
    if (editProduct && isOpen) {
      setName(editProduct.name || "");
      setPrice(String(editProduct.price || ""));
      setDescription(editProduct.description || "");
      setStock(String(editProduct.stock || ""));
      setCategory(editProduct.category || "");
      setCollections(editProduct.collections || []);
      setTag(editProduct.tag || "");
      setIsPreorder(editProduct.is_preorder || false);
      setImageDrafts(
        getProductImages(editProduct).map((img) => ({
          id: img.path || img.url,
          preview: img.url,
          path: img.path,
        })),
      );
      setRemovedImagePaths([]);

      // Pre-fill variants
      const preSizes = editProduct.sizes_or_lengths || [];
      const preColors = editProduct.colors || [];
      const preTextures = editProduct.textures || [];
      const preTypes = editProduct.types || [];
      
      setSizes(preSizes);
      setColors(preColors);
      setTextures(preTextures);
      setTypes(preTypes);

      if (
        preSizes.length > 0 ||
        preColors.length > 0 ||
        preTextures.length > 0 ||
        preTypes.length > 0
      ) {
        setShowVariantsSection(true);
      } else {
        setShowVariantsSection(false);
      }
    }
  }, [editProduct, isOpen]);

  // Fetch store collections
  useEffect(() => {
    if (isOpen) {
      const fetchCollections = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: store } = await supabase.from('stores').select('collections').eq('user_id', user.id).single();
          if (store && store.collections) {
            setStoreCollections(store.collections);
          }
        }
      };
      fetchCollections();
    }
  }, [isOpen, supabase]);

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

  const clearImageDrafts = () => {
    imageDrafts.forEach((draft) => {
      if (draft.preview.startsWith("blob:")) {
        URL.revokeObjectURL(draft.preview);
      }
    });
    setImageDrafts([]);
    setRemovedImagePaths([]);
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setDescription("");
    setStock("");
    setIsPreorder(false);
    clearImageDrafts();
    setCategory("");
    setCollections([]);
    setNewCollectionInput("");
    setTag("");
    
    // Clear variants
    setShowVariantsSection(false);
    setActiveVariantCategory(null);
    setSizes([]);
    setColors([]);
    setTextures([]);
    setTypes([]);
    setSizeInput("");
    setColorInput("");
    setTextureInput("");
    setTypeInput("");
  };

  const handleAddCollection = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    const val = newCollectionInput.trim();
    if (val && !collections.includes(val)) {
      setCollections([...collections, val]);
    }
    setNewCollectionInput("");
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (imageDrafts.length + files.length > MAX_PRODUCT_IMAGES) {
      toast.error(`You can upload up to ${MAX_PRODUCT_IMAGES} images per product`);
      e.target.value = "";
      return;
    }

    const newDrafts = files.map((file) => ({
      id: generateId(),
      preview: URL.createObjectURL(file),
      file,
    }));

    setImageDrafts((prev) => [...prev, ...newDrafts]);
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    const draft = imageDrafts[index];
    if (draft.path) {
      setRemovedImagePaths((prev) => [...prev, draft.path!]);
    }
    if (draft.preview.startsWith("blob:")) {
      URL.revokeObjectURL(draft.preview);
    }
    setImageDrafts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMakeLeadImage = (index: number) => {
    if (index === 0) return;
    setImageDrafts((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.unshift(item);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (imageDrafts.length === 0) {
      toast.error("Please upload at least one product image");
      return;
    }
    
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Get user's store
      const { data: store } = await supabase
        .from('stores')
        .select('id, collections')
        .eq('user_id', user.id)
        .single();

      if (!store) throw new Error("Store not found. Please complete onboarding.");

      const uploadedImages = [];
      for (const draft of imageDrafts) {
        if (draft.file) {
          const uploaded = await uploadProductImage(supabase, store.id, draft.file);
          uploadedImages.push(uploaded);
        } else if (draft.path) {
          uploadedImages.push({ url: draft.preview, path: draft.path });
        }
      }

      await deleteProductImagesFromStorage(supabase, removedImagePaths);

      const imagePayload = buildProductImagePayload(uploadedImages);

      // 3. Update store collections if there are new ones
      const currentStoreCollections = store.collections || [];
      const newForStore = collections.filter(c => !currentStoreCollections.includes(c));
      if (newForStore.length > 0) {
        const updatedStoreCollections = [...currentStoreCollections, ...newForStore];
        await supabase.from('stores').update({ collections: updatedStoreCollections }).eq('id', store.id);
      }

      const productData = {
        name,
        price: Number(price),
        description,
        stock: isPreorder ? 0 : Number(stock),
        is_preorder: isPreorder,
        category,
        collections,
        tag: isPreorder ? "Pre-order" : (tag || null),
        ...imagePayload,
        sizes_or_lengths: showVariantsSection ? sizes : [],
        colors: showVariantsSection ? colors : [],
        textures: showVariantsSection ? textures : [],
        types: showVariantsSection ? types : []
      };

      if (isEditing) {
        // UPDATE existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editProduct.id);

        if (error) throw error;
        toast.success("Product updated successfully!");
      } else {
        // INSERT new product
        const { error } = await supabase
          .from('products')
          .insert({
            store_id: store.id,
            ...productData
          });

        if (error) throw error;
        toast.success("Product created successfully!");
      }

      onSuccess?.();
      onClose();
      resetForm();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isEditing ? 'update' : 'create'} product`);
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
          onClick={() => { onClose(); resetForm(); }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl bg-card border border-border shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh] rounded-[32px]"
        >
          <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
            {/* Header - Fixed */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-card z-20 shrink-0">
              <div>
                <h2 className="text-xl font-black text-foreground">{isEditing ? "Edit Product" : "Add New Product"}</h2>
                <p className="text-xs text-muted-foreground mt-1">{isEditing ? "Update your product details below." : "Create a new product listing for your store."}</p>
              </div>
              <button 
                type="button"
                onClick={() => { onClose(); resetForm(); }}
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
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Product Images
                  </label>
                  <p className="text-xs text-muted-foreground ml-1">
                    The first image is your lead photo on the storefront.
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFilesChange}
                  />

                  {imageDrafts.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {imageDrafts.map((draft, index) => (
                        <div
                          key={draft.id}
                          className="relative aspect-square rounded-2xl overflow-hidden border border-border bg-muted"
                        >
                          <Image
                            src={draft.preview}
                            alt={`Product image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          {index === 0 && (
                            <span className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest">
                              Lead
                            </span>
                          )}
                          <div className="absolute top-2 right-2 flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                              title="Remove image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMakeLeadImage(index)}
                              className="absolute bottom-2 left-2 right-2 px-2 py-1.5 rounded-lg bg-black/60 text-white text-[10px] font-bold hover:bg-black/80 transition-colors"
                            >
                              Make lead photo
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {imageDrafts.length < MAX_PRODUCT_IMAGES && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "w-full h-36 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer",
                      )}
                    >
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <p className="text-sm font-bold text-muted-foreground">
                        {imageDrafts.length === 0
                          ? "Click to upload images"
                          : "Add more images"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG, WEBP (Max 5MB each)
                      </p>
                    </div>
                  )}
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

                {/* Collections Section */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Collections</label>
                  
                  {/* Selected Collections */}
                  {collections.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-1">
                      {collections.map(c => (
                        <span key={c} className="px-3 py-1.5 bg-primary/10 text-primary font-bold text-xs rounded-full flex items-center gap-1">
                          {c}
                          <button type="button" onClick={() => setCollections(collections.filter(x => x !== c))} className="hover:text-primary/70">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Input for new collection */}
                  <div className="flex flex-col gap-2">
                    <input 
                      type="text" 
                      value={newCollectionInput}
                      onChange={(e) => setNewCollectionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          handleAddCollection();
                        }
                      }}
                      placeholder="e.g. Summer Sale, New Arrivals"
                      className="w-full px-5 py-3 rounded-2xl bg-muted border border-border focus:border-primary/50 outline-none transition-all font-bold text-sm text-foreground placeholder:text-muted-foreground/50"
                    />
                    <button 
                      type="button" 
                      onClick={handleAddCollection}
                      className="w-full py-3 rounded-2xl bg-primary/10 text-primary font-black hover:bg-primary/20 transition-all text-sm cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  {/* Suggestions */}
                  {storeCollections.filter(c => !collections.includes(c)).length > 0 && (
                    <div className="mt-2 p-4 rounded-2xl border border-border bg-card">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Suggestions</p>
                      <div className="flex flex-wrap gap-2">
                        {storeCollections.filter(c => !collections.includes(c)).map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setCollections([...collections, c])}
                            className="px-3 py-1.5 bg-muted border border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-all font-bold text-xs rounded-full"
                          >
                            + {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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

                {/* Product Variants Section */}
                <div className="border-t border-border pt-6 mt-2 flex flex-col gap-4">
                  {!showVariantsSection ? (
                    <div className="p-6 rounded-2xl border-2 border-dashed border-border bg-card flex flex-col items-center justify-center gap-3 text-center">
                      
                      <div>
                        <h4 className="font-bold text-sm text-foreground">Add Universal Product Variants</h4>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm">Does this product have different sizes/lengths, colors, textures, or types?</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowVariantsSection(true)}
                        className="px-5 py-3 rounded-2xl border border-primary/20 hover:border-primary/50 bg-primary/5 text-primary text-xs font-black transition-all hover:bg-primary/10 cursor-pointer shadow-sm"
                      >
                        Add Variants
                      </button>
                    </div>
                  ) : (
                    <div className="p-5 rounded-[24px] border border-border bg-card/50 flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-black text-sm text-foreground">Universal Variants</h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Select a category and add options one by one.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            toast("Disable Variants?", {
                              description: "Are you sure? Any added variants will be cleared.",
                              action: {
                                label: "Disable",
                                onClick: () => {
                                  setShowVariantsSection(false);
                                  setSizes([]);
                                  setColors([]);
                                  setTextures([]);
                                  setTypes([]);
                                  setActiveVariantCategory(null);
                                  toast.success("Variants disabled");
                                }
                              },
                              cancel: {
                                label: "Cancel",
                                onClick: () => {}
                              }
                            });
                          }}
                          className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-600 rounded-xl transition-colors cursor-pointer"
                          title="Disable Variants"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Category Selection Buttons */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { key: "size", label: "Size/Length" },
                          { key: "color", label: "Color" },
                          { key: "texture", label: "Texture" },
                          { key: "type", label: "Type" }
                        ].map((cat) => (
                          <button
                            key={cat.key}
                            type="button"
                            onClick={() => setActiveVariantCategory(cat.key)}
                            className={cn(
                              "px-3 py-3 rounded-xl border font-bold text-xs transition-all uppercase tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer",
                              activeVariantCategory === cat.key
                                ? "bg-primary border-primary text-primary-foreground shadow-md"
                                : "bg-muted border-border text-muted-foreground hover:border-muted-foreground/30"
                            )}
                          >
                            <span>+ {cat.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Active Input Fields */}
                      <AnimatePresence mode="wait">
                        {activeVariantCategory === "size" && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col gap-2 p-4 bg-muted/30 rounded-2xl border border-border"
                          >
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                              Add Size/Length option
                            </label>
                            <div className="flex flex-col gap-2">
                              <input
                                type="text"
                                value={sizeInput}
                                onChange={(e) => setSizeInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddSize();
                                  }
                                }}
                                placeholder="e.g. M, L, XL or 12 inches, 16 inches"
                                className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border focus:border-primary/50 outline-none text-xs font-bold text-foreground placeholder:text-muted-foreground/30"
                              />
                              <button
                                type="button"
                                onClick={handleAddSize}
                                className="w-full py-2.5 rounded-xl bg-primary/10 text-primary font-black hover:bg-primary/20 transition-all text-xs cursor-pointer"
                              >
                                Add
                              </button>
                            </div>
                          </motion.div>
                        )}

                        {activeVariantCategory === "color" && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col gap-2 p-4 bg-muted/30 rounded-2xl border border-border"
                          >
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                              Add Color option
                            </label>
                            <div className="flex flex-col gap-2">
                              <input
                                type="text"
                                value={colorInput}
                                onChange={(e) => setColorInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddColor();
                                  }
                                }}
                                placeholder="e.g. Black, Burgundy, Ash"
                                className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border focus:border-primary/50 outline-none text-xs font-bold text-foreground placeholder:text-muted-foreground/30"
                              />
                              <button
                                type="button"
                                onClick={handleAddColor}
                                className="w-full py-2.5 rounded-xl bg-primary/10 text-primary font-black hover:bg-primary/20 transition-all text-xs cursor-pointer"
                              >
                                Add
                              </button>
                            </div>
                          </motion.div>
                        )}

                        {activeVariantCategory === "texture" && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col gap-2 p-4 bg-muted/30 rounded-2xl border border-border"
                          >
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                              Add Texture option
                            </label>
                            <div className="flex flex-col gap-2">
                              <input
                                type="text"
                                value={textureInput}
                                onChange={(e) => setTextureInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddTexture();
                                  }
                                }}
                                placeholder="e.g. Straight, Bouncy Curls, Suede"
                                className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border focus:border-primary/50 outline-none text-xs font-bold text-foreground placeholder:text-muted-foreground/30"
                              />
                              <button
                                type="button"
                                onClick={handleAddTexture}
                                className="w-full py-2.5 rounded-xl bg-primary/10 text-primary font-black hover:bg-primary/20 transition-all text-xs cursor-pointer"
                              >
                                Add
                              </button>
                            </div>
                          </motion.div>
                        )}

                        {activeVariantCategory === "type" && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col gap-2 p-4 bg-muted/30 rounded-2xl border border-border"
                          >
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                              Add Type option
                            </label>
                            <div className="flex flex-col gap-2">
                              <input
                                type="text"
                                value={typeInput}
                                onChange={(e) => setTypeInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddType();
                                  }
                                }}
                                placeholder="e.g. Frontal, Closure, Vintage Tee"
                                className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border focus:border-primary/50 outline-none text-xs font-bold text-foreground placeholder:text-muted-foreground/30"
                              />
                              <button
                                type="button"
                                onClick={handleAddType}
                                className="w-full py-2.5 rounded-xl bg-primary/10 text-primary font-black hover:bg-primary/20 transition-all text-xs cursor-pointer"
                              >
                                Add
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Display Added Options */}
                      <div className="flex flex-col gap-4 mt-2">
                        {/* Sizes */}
                        {sizes.length > 0 && (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Sizes / Lengths</span>
                            <div className="flex flex-wrap gap-1.5">
                              {sizes.map((s) => (
                                <span
                                  key={s}
                                  className="px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold rounded-lg flex items-center gap-1"
                                >
                                  {s}
                                  <button
                                    type="button"
                                    onClick={() => setSizes(sizes.filter((x) => x !== s))}
                                    className="hover:opacity-70 transition-opacity ml-0.5 text-[10px] cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Colors */}
                        {colors.length > 0 && (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Colors</span>
                            <div className="flex flex-wrap gap-1.5">
                              {colors.map((c) => (
                                <span
                                  key={c}
                                  className="px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold rounded-lg flex items-center gap-1"
                                >
                                  {c}
                                  <button
                                    type="button"
                                    onClick={() => setColors(colors.filter((x) => x !== c))}
                                    className="hover:opacity-70 transition-opacity ml-0.5 text-[10px] cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Textures */}
                        {textures.length > 0 && (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Textures</span>
                            <div className="flex flex-wrap gap-1.5">
                              {textures.map((t) => (
                                <span
                                  key={t}
                                  className="px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold rounded-lg flex items-center gap-1"
                                >
                                  {t}
                                  <button
                                    type="button"
                                    onClick={() => setTextures(textures.filter((x) => x !== t))}
                                    className="hover:opacity-70 transition-opacity ml-0.5 text-[10px] cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Types */}
                        {types.length > 0 && (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Types</span>
                            <div className="flex flex-wrap gap-1.5">
                              {types.map((tp) => (
                                <span
                                  key={tp}
                                  className="px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold rounded-lg flex items-center gap-1"
                                >
                                  {tp}
                                  <button
                                    type="button"
                                    onClick={() => setTypes(types.filter((x) => x !== tp))}
                                    className="hover:opacity-70 transition-opacity ml-0.5 text-[10px] cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer - Fixed */}
            <div className="p-6 border-t border-border bg-card flex justify-end gap-3 shrink-0">
              <button 
                type="button"
                onClick={() => { onClose(); resetForm(); }}
                className="px-6 py-4 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="px-8 py-4 rounded-2xl brand-gradient text-primary-foreground font-black flex items-center gap-2 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(158,226,55,0.2)] disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditing ? "Save Changes" : "Create Product")}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
