-- Multiple product images: JSONB array + image_path for lead photo
-- Run this against your Supabase project

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_path TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Backfill images array from existing single image column
UPDATE public.products
SET images = jsonb_build_array(
  jsonb_build_object(
    'url', image,
    'path', COALESCE(
      image_path,
      NULLIF(
        regexp_replace(image, '^.*/product-images/', ''),
        image
      )
    )
  )
)
WHERE image IS NOT NULL
  AND (images IS NULL OR images = '[]'::jsonb);
