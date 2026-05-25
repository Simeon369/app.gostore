"use client";

import { motion } from "framer-motion";
import { Search, Filter, Phone, MapPin, User, ExternalLink, MoreVertical, Copy, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const res = await fetch('/api/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update order status');
      }
      return res.json();
    },
    onMutate: ({ orderId }) => {
      setUpdatingOrderId(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success("Order marked as shipped!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled: () => {
      setUpdatingOrderId(null);
    }
  });

  const handleShipOrder = (orderId: string) => {
    updateOrderStatus.mutate({ orderId, status: 'Shipped' });
  };

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      // 1. Get current user & store
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!store) return { orders: [], products: [] };

      // 2. Fetch orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      // 3. Fetch products (to map names)
      const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .eq('store_id', store.id);

      return { 
        orders: orders || [], 
        products: products || [] 
      };
    }
  });

  const orders = ordersData?.orders || [];
  const products = ordersData?.products || [];

  const filteredOrders = orders.filter(order => 
    order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getProduct = (productId: string) => {
    return products.find(p => p.id === productId);
  };

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
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-1 text-foreground">Orders</h1>
          <p className="text-muted-foreground text-sm font-medium">View and manage your recent sales and customer details.</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm font-bold text-muted-foreground">{orders.length} Total Orders</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 bg-card border border-border px-4 py-2 rounded-2xl w-full sm:max-w-sm focus-within:border-primary/50 transition-all group">
          <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors flex-shrink-0" />
          <input 
            type="text" 
            placeholder="Search customer, order ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground/50 text-foreground"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button className="px-4 py-2 rounded-xl glass-card text-xs font-bold flex items-center gap-2 whitespace-nowrap">
            <Filter className="w-3.5 h-3.5" /> All Status
          </button>
          <button className="px-4 py-2 rounded-xl glass-card text-xs font-bold flex items-center gap-2 whitespace-nowrap">
            Source: All
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredOrders.length > 0 ? filteredOrders.map((order, i) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-2xl lg:rounded-[32px] p-5 lg:p-8 flex flex-col gap-6 hover:border-primary/30 transition-all group border border-white/5"
          >
            {/* Order Identity & Status */}
            <div className="flex flex-col gap-3 border-b border-border pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{order.id}</span>
                <div className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                  order.status === "Paid" ? "bg-emerald-500/10 text-emerald-400" : 
                  order.status === "Shipped" ? "bg-blue-500/10 text-blue-400" :
                  "bg-orange-500/10 text-orange-400"
                )}>
                  {order.status === "Paid" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {order.status}
                </div>
              </div>
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Created</p>
                  <p className="text-sm font-bold text-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Source</p>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold text-foreground">
                    {order.source || "Direct"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-8">
              {/* Customer Info */}
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <h3 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Customer</h3>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-base font-bold text-foreground">{order.customer_name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" /> {order.customer_phone}
                    <button onClick={() => {
                      navigator.clipboard.writeText(order.customer_phone);
                      toast.success("Copied!");
                    }} className="p-1 hover:bg-muted rounded-md transition-all">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground font-medium">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <p className="leading-relaxed">{order.customer_address}</p>
                  </div>
                </div>
              </div>

              {/* Items Summary */}
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <PackageIcon className="w-4 h-4 text-primary" />
                  <h3 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Items</h3>
                </div>
                <div className="space-y-2.5">
                  {(order.items as any[]).map((item, idx) => {
                    const product = getProduct(item.productId);
                    return (
                      <div key={idx} className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-black text-primary mt-0.5">x{item.quantity}</span>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground truncate max-w-[180px]">{product?.name || "Unknown Product"}</span>
                            {item.variants && Object.values(item.variants).some(Boolean) && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.variants.size_or_length && (
                                  <span className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase">
                                    Size: {item.variants.size_or_length}
                                  </span>
                                )}
                                {item.variants.color && (
                                  <span className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase">
                                    Color: {item.variants.color}
                                  </span>
                                )}
                                {item.variants.texture && (
                                  <span className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase">
                                    Texture: {item.variants.texture}
                                  </span>
                                )}
                                {item.variants.type && (
                                  <span className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase">
                                    Type: {item.variants.type}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-foreground mt-0.5">₦{Number(item.price).toLocaleString()}</span>
                      </div>
                    );
                  })}
                  <div className="h-px bg-border my-1" />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                    <span>DELIVERY FEE</span>
                    <span>₦{Number(order.delivery_fee).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-black text-muted-foreground">TOTAL</span>
                    <span className="text-xl font-black text-primary">₦{Number(order.total).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {order.status !== "Shipped" && (
                <button 
                  onClick={() => handleShipOrder(order.id)}
                  disabled={updatingOrderId === order.id}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-2xl brand-gradient hover:opacity-90 transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-primary-foreground disabled:opacity-50"
                >
                  {updatingOrderId === order.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" /> 
                  )}
                  {updatingOrderId === order.id ? "Shipping..." : "Ship Order"}
                </button>
              )}
              <button className="p-3 rounded-2xl glass-card hover:bg-muted transition-all flex items-center justify-center">
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </motion.div>
        )) : (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4 glass-card rounded-[40px]">
            <Clock className="w-12 h-12 text-muted-foreground opacity-20" />
            <div>
              <p className="text-foreground font-bold">No orders yet</p>
              <p className="text-muted-foreground text-sm">When customers buy from your store, they will appear here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v1.5" />
      <path d="M21 16.5V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.5" />
      <path d="M12 12h.01" />
      <path d="M4.35 12h15.3" />
    </svg>
  );
}
