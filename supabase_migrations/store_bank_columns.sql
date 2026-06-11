-- Bank + Paystack settlement fields on stores (used by onboarding & settings)
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS bank_code TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS paystack_sub_account_code TEXT;
