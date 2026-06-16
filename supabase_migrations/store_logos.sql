-- Store logo upload: bucket + logo_path column
-- Run this against your Supabase project

ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS logo_path TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-logos',
  'store-logos',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Vendors can upload logos to their own store folder
CREATE POLICY "Store owners can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'store-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.stores WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Store owners can update their logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'store-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.stores WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Store owners can delete their logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'store-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.stores WHERE user_id = auth.uid()
  )
);

-- Public read for storefront display
CREATE POLICY "Public can view store logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'store-logos');
