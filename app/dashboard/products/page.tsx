"use client";

import { motion } from "framer-motion";
import { Plus, Search, Filter, MoreVertical, Edit2, Trash2, ExternalLink, Package, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/utils/cn";
import { CreateProductModal } from "@/components/dashboard/create-product-modal";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function ProductsPage() {
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: productsData, isLoading, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Get user's store
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!store) return [];

      // 2. Get products for this store
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      return products || [];
    }
  });

  const handleDelete = async (product: any) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    setDeletingId(product.id);

    try {
      // 1. Delete image from storage if image_path exists
      if (product.image_path) {
        const { error: storageError } = await supabase.storage
          .from('product-images')
          .remove([product.image_path]);
        
        if (storageError) console.error("Error deleting image:", storageError);
      }

      // 2. Delete product from database
      const { error: dbError } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (dbError) throw dbError;

      refetch();
    } catch (error: any) {
      alert(error.message || "Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProducts = productsData?.filter(p => 
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
          onClick={() => setIsModalOpen(true)}
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
      <div className="glass-card rounded-2xl lg:rounded-[32px] overflow-hidden">
        <div className="overflow-x-auto">
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
                        <p className="text-[11px] text-muted-foreground font-medium">{product.category}</p>
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
                      <button className="p-2 hover:bg-white/5 rounded-xl transition-all group-hover:text-primary">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product)}
                        disabled={deletingId === product.id}
                        className="p-2 hover:bg-red-500/5 rounded-xl transition-all hover:text-red-400 disabled:opacity-50"
                      >
                        {deletingId === product.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                      <button className="p-2 hover:bg-white/5 rounded-xl transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
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
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
