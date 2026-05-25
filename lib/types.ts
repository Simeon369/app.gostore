export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  tag?: "Pre-order" | "Sold Out" | "New" | "Archived" | "Deleted" | null;
  description: string;
  stock: number;
  is_preorder: boolean;
  estimated_delivery?: string;
  
  // Universal MVP Variants (Stored as arrays of strings)
  sizes_or_lengths?: string[]; // e.g., ["M", "L", "XL"] or ["12 inches", "16 inches"]
  colors?: string[];           // e.g., ["Black", "Burgundy", "Ash"]
  textures?: string[];         // e.g., ["Straight", "Bouncy Curls", "Suede"]
  types?: string[];            // e.g., ["Frontal", "Closure", "Vintage Tee"]
}

export interface Order {
  id: string;
  storeId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: { 
    productId: string; 
    quantity: number; 
    price: number;
    variants?: {
      size_or_length?: string;
      color?: string;
      texture?: string;
      type?: string;
    };
  }[];
  total: number;
  deliveryFee: number;
  status: "Pending" | "Paid" | "Shipped" | "Delivered";
  createdAt: string;
  source?: "Instagram" | "TikTok" | "WhatsApp" | "Direct";
}
