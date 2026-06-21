-- Vendor location and pickup/dispatch settings
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS address_formatted TEXT,
  ADD COLUMN IF NOT EXISTS address_place_id TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS pickup_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS dispatch_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS pickup_radius_km NUMERIC DEFAULT 5;

-- Order delivery method and customer coordinates
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_method TEXT CHECK (delivery_method IN ('pickup', 'dispatch')),
  ADD COLUMN IF NOT EXISTS customer_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS customer_longitude DOUBLE PRECISION;
