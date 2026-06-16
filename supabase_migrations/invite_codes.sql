-- One-time invite codes for controlled beta signup
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id),
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No public access to invite codes" ON public.invite_codes;
CREATE POLICY "No public access to invite codes" ON public.invite_codes
  FOR ALL USING (false) WITH CHECK (false);

CREATE INDEX IF NOT EXISTS invite_codes_created_at_idx ON public.invite_codes (created_at DESC);
