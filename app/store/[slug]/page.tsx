import { createClient } from "@/utils/supabase/server";
import StorefrontClient from "./StorefrontClient";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("name, description, logo")
    .eq("slug", slug)
    .single();

  if (!store) {
    return {
      title: "Store Not Found | GoStore",
      description: "This store does not exist on GoStore.",
    };
  }

  const title = `${store.name} | Official Storefront`;
  const description = store.description || `Browse and shop high-quality items directly from ${store.name} on GoStore.`;
  const logoUrl = store.logo || "https://app-gostore.vercel.app/gostore-logo.png";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://app-gostore.vercel.app/store/${slug}`,
      siteName: "GoStore",
      images: [
        {
          url: logoUrl,
          width: 800,
          height: 800,
          alt: `${store.name} Logo`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [logoUrl],
    },
  };
}

export default function Page() {
  return <StorefrontClient />;
}
