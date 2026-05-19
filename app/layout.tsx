import type { Metadata } from "next";
import { Space_Grotesk, Outfit } from "next/font/google";
import "./globals.css";

import QueryProvider from "../providers/query-provider";
import { ThemeProvider } from "../providers/theme-provider";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-header",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
});

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
        url: "https://app-gostore.vercel.app/gostore-logo.png",
        width: 800,
        height: 800,
        alt: "GoStore Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GoStore | Create Your WhatsApp Storefront in 5 Minutes",
    description: "Build a high-converting, professional online storefront for your business. Accept payments with Paystack, configure split payouts, and chat directly on WhatsApp.",
    images: ["https://app-gostore.vercel.app/gostore-logo.png"],
  },
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body">
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster position="top-center" richColors />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
