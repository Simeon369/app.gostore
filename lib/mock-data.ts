export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  tag?: "Pre-order" | "Sold Out" | "New";
  description: string;
  stock: number;
  is_preorder: boolean;
  estimated_delivery?: string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
  whatsapp: string;
  socials: {
    instagram?: string;
    tiktok?: string;
  };
  deliveryZones: {
    name: string;
    price: number;
  }[];
  color?: string;
  status: "Live" | "Draft";
  sales: string;
  visits: string;
}

export const MOCK_STORES: Store[] = [
  {
    id: "1",
    name: "Luxe Premium",
    slug: "luxe",
    logo: "/gostore-logo.png",
    description: "Premium hair and beauty products for the modern woman.",
    whatsapp: "2348123456789",
    socials: {
      instagram: "luxepremium",
      tiktok: "luxepremium_tt"
    },
    deliveryZones: [
      { name: "Lagos Mainland", price: 1500 },
      { name: "Lagos Island / Lekki", price: 2500 },
      { name: "Abuja", price: 3500 },
      { name: "Port Harcourt", price: 3500 },
      { name: "Other States", price: 5000 },
    ],
    color: "from-purple-500/20 to-blue-500/20",
    status: "Live",
    sales: "₦1,240,000",
    visits: "420"
  }
];

export const MOCK_PRODUCTS: Record<string, Product[]> = {
  "1": [
    {
      id: "p1",
      name: "Bone Straight Wig - 22 Inch",
      price: 125000,
      image: "https://images.unsplash.com/photo-1595475241949-069e1626382d?auto=format&fit=crop&q=80&w=400",
      category: "Wigs",
      tag: "New",
      description: "Grade 12A double drawn bone straight wig. Silky, smooth and reusable for years.",
      stock: 5,
      is_preorder: false
    },
    {
      id: "p2",
      name: "Luxe Edge Control",
      price: 4500,
      image: "https://images.unsplash.com/photo-1594125356681-36072ccb6f50?auto=format&fit=crop&q=80&w=400",
      category: "Hair Care",
      description: "24-hour hold with zero flakes. Enriched with castor oil and honey.",
      stock: 50,
      is_preorder: false
    },
    {
      id: "p3",
      name: "Curly Bob Unit",
      price: 85000,
      image: "https://images.unsplash.com/photo-1595475883503-4c67ad766755?auto=format&fit=crop&q=80&w=400",
      category: "Wigs",
      tag: "Sold Out",
      description: "The perfect summer look. 12-inch deep wave bob.",
      stock: 0,
      is_preorder: false
    },
    {
      id: "p4",
      name: "Satin Hair Bonnet",
      price: 2500,
      image: "https://images.unsplash.com/photo-1620331311520-246422ff82f9?auto=format&fit=crop&q=80&w=400",
      category: "Accessories",
      tag: "Pre-order",
      description: "Protect your hair while you sleep. Premium silk satin.",
      stock: 20,
      is_preorder: true,
      estimated_delivery: "Ships in 5-7 business days"
    }
  ],
  "2": [
    {
      id: "p5",
      name: "Air Jordan 1 Retro High",
      price: 95000,
      image: "https://images.unsplash.com/photo-1584735175315-9d5df23860e6?auto=format&fit=crop&q=80&w=400",
      category: "Sneakers",
      description: "The iconic AJ1. High-quality leather and classic colorway.",
      stock: 3,
      is_preorder: false
    }
  ]
};

export interface Order {
  id: string;
  storeId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: { productId: string; quantity: number; price: number }[];
  total: number;
  deliveryFee: number;
  status: "Pending" | "Paid" | "Shipped" | "Delivered";
  createdAt: string;
  source?: "Instagram" | "TikTok" | "WhatsApp" | "Direct";
}

export const MOCK_ORDERS: Order[] = [
  {
    id: "ORD-001",
    storeId: "1",
    customerName: "Blessing Okoro",
    customerPhone: "08012345678",
    customerAddress: "12, Opebi Link Road, Ikeja, Lagos",
    items: [{ productId: "p1", quantity: 1, price: 125000 }],
    total: 126500,
    deliveryFee: 1500,
    status: "Paid",
    createdAt: "2024-05-14T08:00:00Z",
    source: "Instagram"
  },
  {
    id: "ORD-002",
    storeId: "1",
    customerName: "David Adeleke",
    customerPhone: "09012345678",
    customerAddress: "Banana Island, Ikoyi, Lagos",
    items: [{ productId: "p2", quantity: 2, price: 4500 }],
    total: 11500,
    deliveryFee: 2500,
    status: "Paid",
    createdAt: "2024-05-14T09:30:00Z",
    source: "TikTok"
  }
];
