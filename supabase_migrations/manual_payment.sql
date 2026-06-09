-- Manual Opay payment flow migration
-- Run this against your Supabase project

-- New order columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receipt_path TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receipt_uploaded_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receipt_deleted_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'manual_transfer';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_confirmed_by UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'unsettled';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payout_amount NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS platform_fee NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS settlement_reference TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS vendor_notified_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_paid_notified_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Storage bucket for payment receipts (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-receipts',
  'payment-receipts',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;
