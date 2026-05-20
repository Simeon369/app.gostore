import { ImageResponse } from 'next/og';
import { createClient } from "@/utils/supabase/server";
import fs from 'fs';
import path from 'path';

export const alt = 'Official Storefront | GoStore';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("name")
    .eq("slug", slug)
    .single();

  const storeName = store?.name || "Official Storefront";

  // Load the logo file and convert to base64
  let logoBase64 = "";
  try {
    const logoPath = path.join(process.cwd(), 'public', 'gostore-logo.png');
    const logoBuffer = fs.readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (err) {
    console.error("Failed to load logo inside OG generator:", err);
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: '#ffffff',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '60px',
        }}
      >
        {/* Subtle, premium border/glow container */}
        <div
          style={{
            position: 'absolute',
            inset: '24px',
            border: '2px solid #e4e4e7',
            borderRadius: '40px',
            display: 'flex',
          }}
        />

        {/* GoStore Logo */}
        {logoBase64 && (
          <img
            src={logoBase64}
            alt="GoStore Logo"
            style={{
              width: '120px',
              height: '120px',
              objectFit: 'contain',
              marginBottom: '24px',
            }}
          />
        )}

        {/* Store Name - Large & Bold */}
        <div
          style={{
            fontSize: '72px',
            fontWeight: '900',
            color: '#09090b',
            textAlign: 'center',
            fontFamily: 'sans-serif',
            marginBottom: '16px',
            letterSpacing: '-0.03em',
          }}
        >
          {storeName}
        </div>

        {/* Dynamic Tagline */}
        <div
          style={{
            fontSize: '22px',
            fontWeight: '600',
            color: '#71717a',
            textAlign: 'center',
            fontFamily: 'sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            marginBottom: '48px',
          }}
        >
          Official Storefront
        </div>

        {/* Bottom Feature Badges */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              background: '#f4f4f5',
              border: '1px solid #e4e4e7',
              borderRadius: '9999px',
              padding: '10px 24px',
              fontSize: '16px',
              fontWeight: '700',
              color: '#18181b',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            ⚡ Instant Checkout
          </div>
          <div
            style={{
              background: '#f4f4f5',
              border: '1px solid #e4e4e7',
              borderRadius: '9999px',
              padding: '10px 24px',
              fontSize: '16px',
              fontWeight: '700',
              color: '#18181b',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            💬 WhatsApp Integrated
          </div>
          <div
            style={{
              background: '#f4f4f5',
              border: '1px solid #e4e4e7',
              borderRadius: '9999px',
              padding: '10px 24px',
              fontSize: '16px',
              fontWeight: '700',
              color: '#18181b',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            🛒 Secure Split Payments
          </div>
        </div>

        {/* Footer branding */}
        <div
          style={{
            position: 'absolute',
            bottom: '48px',
            fontSize: '12px',
            fontWeight: '800',
            color: '#a1a1aa',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
          }}
        >
          Powered by GoStore
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
