import type { Metadata, Viewport } from "next";
import "./globals.css";

import QueryProvider from "../providers/query-provider";
import { ThemeProvider } from "../providers/theme-provider";
import MotionProvider from "../providers/motion-provider";
import { ThemeAwareToaster } from "../components/theme-aware-toaster";

export const metadata: Metadata = {
  metadataBase: new URL("https://app-gostore.vercel.app"),
  title: "GoStore | Create Your WhatsApp Storefront in 5 Minutes",
  description: "Build a high-converting, professional online storefront for your business. Accept payments with Paystack, configure split payouts, and chat directly on WhatsApp.",
  openGraph: {
    title: "GoStore | Create Your WhatsApp Storefront in 5 Minutes",
    description: "Build a high-converting, professional online storefront for your business. Accept payments with Paystack, configure split payouts, and chat directly on WhatsApp.",
    url: "https://app-gostore.vercel.app",
    siteName: "GoStore",
    images: [
      {
        url: "https://app-gostore.vercel.app/app-preview.png",
        width: 1200,
        height: 630,
        alt: "GoStore - Create Your WhatsApp Storefront",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GoStore | Create Your WhatsApp Storefront in 5 Minutes",
    description: "Build a high-converting, professional online storefront for your business. Accept payments with Paystack, configure split payouts, and chat directly on WhatsApp.",
    images: ["https://app-gostore.vercel.app/app-preview.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col font-body bg-background text-foreground">
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="gostore-app-theme"
        >
          <QueryProvider>
            <MotionProvider>
              {children}
              <ThemeAwareToaster />
            </MotionProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
