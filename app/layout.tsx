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
  title: "GoStore | Manage Your Stores",
  description: "The premium platform for managing your storefronts.",
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
