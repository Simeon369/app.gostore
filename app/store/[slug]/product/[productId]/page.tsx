import { createClient } from "@/utils/supabase/server";
import ProductDetailsClient from "./ProductDetailsClient";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string; productId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const productId = resolvedParams.productId;
  const supabase = await createClient();

  // 1. Fetch store by slug
  const { data: store } = await supabase
    .from("stores")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (!store) {
    return {
      title: "Store Not Found | GoStore",
      description: "This store does not exist on GoStore.",
    };
  }

  // 2. Fetch product by ID
  const { data: product } = await supabase
    .from("products")
    .select("name, description, price, image")
    .eq("id", productId)
    .eq("store_id", store.id)
    .single();

  if (!product) {
    return {
      title: `Product Not Found | ${store.name}`,
      description: "This product is not found or is no longer available.",
    };
  }

  const title = `${product.name} | Buy for ₦${Number(product.price).toLocaleString()} | ${store.name}`;
  const description = product.description || `Buy ${product.name} online at ${store.name} official storefront. Instant Checkout and Direct WhatsApp support.`;
  const imageUrl = product.image || "https://app-gostore.vercel.app/gostore-logo.png";

  return {
    metadataBase: new URL("https://app-gostore.vercel.app"),
    title,
    description,
    openGraph: {
      title: `${product.name} - ₦${Number(product.price).toLocaleString()}`,
      description,
      url: `https://app-gostore.vercel.app/store/${slug}/product/${productId}`,
      siteName: `${store.name} on GoStore`,
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} - ₦${Number(product.price).toLocaleString()}`,
      description,
      images: [imageUrl],
    },
  };
}

export default function Page() {
  return <ProductDetailsClient />;
}
