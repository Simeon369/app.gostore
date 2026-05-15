"use client";

import { motion } from "framer-motion";
import { Plus, Search, Filter, MoreVertical, Edit2, Trash2, ExternalLink, Package } from "lucide-react";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/utils/cn";
import { CreateProductModal } from "@/components/dashboard/create-product-modal";

export default function ProductsPage() {
  // For the MVP, we'll show products for store #1
  const products = MOCK_PRODUCTS["1"];
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                      <div className="w-12 h-12 rounded-xl overflow-hidden relative border border-border">
                        <Image src={product.image} alt={product.name} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{product.name}</p>
                        <p className="text-[11px] text-muted-foreground font-medium">{product.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 lg:px-8 lg:py-5 font-bold text-sm text-foreground">
                    ₦{product.price.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 lg:px-8 lg:py-5">
                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className={cn(
                        "text-sm font-bold",
                        product.is_preorder 
                          ? "text-primary" 
                          : product.stock < 5 ? "text-orange-500" : "text-muted-foreground"
                      )}>
                        {product.is_preorder ? "Pre-order" : `${product.stock} in stock`}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 lg:px-8 lg:py-5">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                      product.stock > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    )}>
                      {product.stock > 0 ? "Active" : "Out of Stock"}
                    </span>
                  </td>
                  <td className="px-3 py-3 lg:px-8 lg:py-5">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-white/5 rounded-xl transition-all group-hover:text-primary">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-red-500/5 rounded-xl transition-all hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
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
      />
    </div>
  );
}
