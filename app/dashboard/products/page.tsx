"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Filter, MoreVertical, Edit2, Trash2, ExternalLink, Package, Loader2, Copy, MessageCircle, Ban, Link2 } from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/utils/cn";
import { CreateProductModal } from "@/components/dashboard/create-product-modal";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Instagram, TikTok, WhatsApp } from "@/components/icons";
export default function ProductsPage() {
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [menuConfig, setMenuConfig] = useState<{ id: string, product: any, top: number, right: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: productsData, isLoading, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Get user's store
      const { data: store } = await supabase
        .from('stores')
        .select('id, slug, channels')
        .eq('user_id', user.id)
        .single();

      if (!store) return { products: [], store: null };

      // 2. Get products for this store
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      return { products: products || [], store };
    }
  });

  const products = productsData?.products || [];
  const store = productsData?.store;

  const handleDelete = async () => {
    if (!productToDelete) return;
    
    setDeletingId(productToDelete.id);

    try {
      // 1. Resolve image path from URL if image_path is not defined
      let storagePath = productToDelete.image_path;
      if (!storagePath && productToDelete.image) {
        const marker = '/product-images/';
        const index = productToDelete.image.indexOf(marker);
        if (index !== -1) {
          storagePath = productToDelete.image.substring(index + marker.length);
        }
      }

      // 2. Delete image from storage if path exists
      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from('product-images')
          .remove([storagePath]);
        
        if (storageError) console.error("Error deleting image:", storageError);
      }

      // 3. Try to delete product from database
      const { error: dbError } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);

      if (dbError) {
        console.warn("Delete blocked by RLS/constraints, falling back to archiving:", dbError);
        // Fallback: Archive product so it disappears from feed
        const { error: archiveError } = await supabase
          .from('products')
          .update({ tag: 'Archived', stock: 0 })
          .eq('id', productToDelete.id);

        if (archiveError) throw archiveError;
        toast.success(`"${productToDelete.name}" archived successfully`);
      } else {
        toast.success(`"${productToDelete.name}" deleted successfully`);
      }

      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product");
    } finally {
      setDeletingId(null);
      setProductToDelete(null);
    }
  };

  const handleMarkSoldOut = async (product: any) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: 0, is_preorder: false, tag: 'Sold Out' })
        .eq('id', product.id);

      if (error) throw error;
      toast.success(`"${product.name}" marked as Sold Out`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to update product");
    }
    setMenuConfig(null);
  };

  const handleCopyLink = (product: any, source?: string) => {
    if (!store?.slug) {
      toast.error("Store slug not found");
      return;
    }
    const baseUrl = `https://app-gostore.vercel.app/store/${store.slug}`;
    const url = source ? `${baseUrl}?source=${source}` : baseUrl;
    navigator.clipboard.writeText(url);
    toast.success(`${source || 'Direct'} link copied!`);
    setMenuConfig(null);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const filteredProducts = products?.filter(p => 
    p.tag !== 'Archived' &&
    p.tag !== 'Deleted' &&
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-1">Products</h1>
          <p className="text-muted-foreground text-sm">Manage your inventory and product listings.</p>
        </div>
        <button 
          onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
          className="px-5 py-3 rounded-2xl brand-gradient text-primary-foreground font-bold shadow-[0_0_20px_rgba(158,226,55,0.2)] transition-all flex items-center gap-2 w-fit text-sm"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 bg-card border border-border px-4 py-2 rounded-2xl w-full max-w-md focus-within:border-primary/50 transition-all group">
          <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground/50 text-foreground"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <button className="px-4 py-2 rounded-xl glass-card text-xs font-bold flex items-center gap-2 whitespace-nowrap">
            <Filter className="w-3.5 h-3.5" /> All Categories
          </button>
          <button className="px-4 py-2 rounded-xl glass-card text-xs font-bold flex items-center gap-2 whitespace-nowrap">
            Status: All
          </button>
        </div>
      </div>

      {/* Products Table/Grid */}
      <div className="glass-card rounded-2xl lg:rounded-[32px]">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-3 lg:px-8 lg:py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Product</th>
                <th className="px-3 py-3 lg:px-8 lg:py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Price</th>
                <th className="px-3 py-3 lg:px-8 lg:py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stock</th>
                <th className="px-3 py-3 lg:px-8 lg:py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="px-3 py-3 lg:px-8 lg:py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((product, i) => (
                <motion.tr 
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-white/[0.01] transition-all group"
                >
                  <td className="px-3 py-3 lg:px-8 lg:py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden relative border border-border bg-muted">
                        {product.image ? (
                          <Image src={product.image} alt={product.name} fill className="object-cover" />
                        ) : (
                          <Package className="w-6 h-6 m-auto text-muted-foreground opacity-20" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{product.name}</p>
                        {product.collections && product.collections.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {product.collections.map((c: string) => (
                              <span key={c} className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-bold text-muted-foreground uppercase tracking-wider border border-white/5">
                                {c}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground font-medium">{product.category}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 lg:px-8 lg:py-5 font-bold text-sm text-foreground">
                    ₦{Number(product.price).toLocaleString()}
                  </td>
                  <td className="px-3 py-3 lg:px-8 lg:py-5">
                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className={cn(
                        "text-sm font-bold",
                        product.is_preorder 
                          ? "text-primary" 
                          : Number(product.stock) < 5 ? "text-orange-500" : "text-muted-foreground"
                      )}>
                        {product.is_preorder ? "Pre-order" : `${product.stock} in stock`}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 lg:px-8 lg:py-5">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                      Number(product.stock) > 0 || product.is_preorder ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    )}>
                      {Number(product.stock) > 0 || product.is_preorder ? "Active" : "Out of Stock"}
                    </span>
                  </td>
                  <td className="px-3 py-3 lg:px-8 lg:py-5">
                    <div className="flex items-center gap-2">
                      {/* Edit Button */}
                      <button 
                        onClick={() => handleEdit(product)}
                        className="p-2 hover:bg-white/5 rounded-xl transition-all group-hover:text-primary"
                        title="Edit product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {/* Delete Button */}
                      <button 
                        onClick={() => setProductToDelete(product)}
                        className="p-2 hover:bg-red-500/5 rounded-xl transition-all hover:text-red-400"
                        title="Delete product"
                      >
                        {deletingId === product.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                      {/* 3-Dots Menu Trigger */}
                      <div>
                        <button 
                          data-menu-trigger="true"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (menuConfig?.id === product.id) {
                              setMenuConfig(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMenuConfig({
                                id: product.id,
                                product: product,
                                top: rect.bottom + 8,
                                right: window.innerWidth - rect.right
                              });
                            }
                          }}
                          className="p-2 hover:bg-white/5 rounded-xl transition-all"
                          title="More actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">No products found</h3>
            <p className="text-muted-foreground text-sm">Try searching for something else or add a new product.</p>
          </div>
        </div>
      )}

      <CreateProductModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingProduct(null); }}
        onSuccess={() => refetch()}
        editProduct={editingProduct}
      />

      {/* Global Dropdown Menu */}
      <AnimatePresence>
        {menuConfig && (
          <motion.div 
            key="dropdown-container"
            className="fixed inset-0 z-[90]"
          >
            {/* Invisible Backdrop to handle outside clicks */}
            <div 
              className="absolute inset-0"
              onClick={() => setMenuConfig(null)}
              onScroll={() => setMenuConfig(null)}
              onTouchMove={() => setMenuConfig(null)}
              onWheel={() => setMenuConfig(null)}
            />
            
            <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            style={{ 
              position: 'fixed', 
              top: menuConfig.top, 
              right: menuConfig.right 
            }}
            className="z-[100] w-56 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            <button
              onClick={() => handleMarkSoldOut(menuConfig.product)}
              disabled={Number(menuConfig.product.stock) === 0 && !menuConfig.product.is_preorder}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Ban className="w-4 h-4 text-red-400" />
              <span>Mark as Sold Out</span>
            </button>

            <div className="h-px bg-border" />

            <div className="px-4 py-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Copy Product Link</p>
            </div>

            <button
              onClick={() => handleCopyLink(menuConfig.product)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-all"
            >
              <Link2 className="w-4 h-4 text-primary" />
              <span>Direct Link</span>
            </button>

            {store?.channels?.whatsapp && (
              <button
                onClick={() => handleCopyLink(menuConfig.product, 'WhatsApp')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-all"
              >
                <WhatsApp className="w-4 h-4 text-emerald-500" />
                <span>WhatsApp Link</span>
              </button>
            )}

            {store?.channels?.instagram && (
              <button
                onClick={() => handleCopyLink(menuConfig.product, 'Instagram')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-all"
              >
                <Instagram className="w-4 h-4 text-pink-500" />
                <span>Instagram Link</span>
              </button>
            )}

            {store?.channels?.tiktok && (
              <button
                onClick={() => handleCopyLink(menuConfig.product, 'TikTok')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-all"
              >
                <TikTok className="w-4 h-4 text-sky-400" />
                <span>TikTok Link</span>
              </button>
            )}
          </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProductToDelete(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-md bg-card border-border shadow-2xl rounded-[32px] overflow-hidden relative z-10 flex flex-col p-6 gap-6"
            >
              <div className="flex flex-col items-center text-center gap-3 mt-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-foreground">Delete Product?</h2>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete <span className="font-bold text-foreground">"{productToDelete.name}"</span>? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                <button 
                  onClick={() => setProductToDelete(null)}
                  disabled={!!deletingId}
                  className="flex-1 px-6 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={!!deletingId}
                  className="flex-1 px-6 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {deletingId ? <Loader2 className="w-5 h-5 animate-spin" /> : "Yes, Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
