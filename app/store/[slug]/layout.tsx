import { createClient } from "@/utils/supabase/server";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
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

  return {
    metadataBase: new URL("https://app-gostore.vercel.app"),
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://app-gostore.vercel.app/store/${slug}`,
      siteName: "GoStore",
      images: [
        {
          url: `https://app-gostore.vercel.app/store/${slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${store.name} Storefront`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`https://app-gostore.vercel.app/store/${slug}/opengraph-image`],
    },
  };
}

export default function StoreLayout({
  children,
}: Props) {
  return <>{children}</>;
}
