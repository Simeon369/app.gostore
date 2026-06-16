-- Enable RLS
-- STORES TABLE
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT,
    whatsapp TEXT,
    bank_name TEXT,
    account_number TEXT,
    account_name TEXT,
    channels JSONB DEFAULT '{"whatsapp": true, "instagram": false, "tiktok": false}'::jsonb,
    socials JSONB DEFAULT '{"email": "", "instagram": "", "tiktok": ""}'::jsonb,
    status TEXT DEFAULT 'Live',
    color TEXT,
    logo TEXT,
    logo_path TEXT,
    description TEXT,
    delivery_zones JSONB DEFAULT '[]'::jsonb,
    delivery_payment_option TEXT DEFAULT 'checkout',
    visits INTEGER DEFAULT 0,
    collections JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    category TEXT,
    image TEXT,
    description TEXT,
    stock INTEGER DEFAULT 0,
    is_preorder BOOLEAN DEFAULT false,
    tag TEXT,
    collections JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    customer_address TEXT,
    items JSONB NOT NULL, -- List of {productId, quantity, price}
    total NUMERIC NOT NULL,
    delivery_fee NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Pending', -- Pending, Paid, Shipped, Delivered, Rejected
    whatsapp_sent BOOLEAN DEFAULT false,
    whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
    source TEXT, -- Instagram, TikTok, WhatsApp, Direct
    payment_reference TEXT UNIQUE,
    payment_method TEXT DEFAULT 'manual_transfer',
    receipt_url TEXT,
    receipt_path TEXT,
    receipt_uploaded_at TIMESTAMP WITH TIME ZONE,
    receipt_deleted_at TIMESTAMP WITH TIME ZONE,
    payment_confirmed_at TIMESTAMP WITH TIME ZONE,
    payment_confirmed_by UUID,
    payout_status TEXT DEFAULT 'unsettled',
    payout_amount NUMERIC,
    platform_fee NUMERIC,
    settled_at TIMESTAMP WITH TIME ZONE,
    settlement_reference TEXT,
    vendor_notified_at TIMESTAMP WITH TIME ZONE,
    customer_paid_notified_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ROW LEVEL SECURITY (RLS) policies
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- STORES POLICIES
CREATE POLICY "Users can view their own store" ON public.stores
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own store" ON public.stores
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own store" ON public.stores
    FOR UPDATE USING (auth.uid() = user_id);

-- PRODUCTS POLICIES (Users manage their own products)
CREATE POLICY "Users can view their own products" ON public.products
    FOR SELECT USING (
        store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert their own products" ON public.products
    FOR INSERT WITH CHECK (
        store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update their own products" ON public.products
    FOR UPDATE USING (
        store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete their own products" ON public.products
    FOR DELETE USING (
        store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    );

-- Public viewing of products (for the storefront)
CREATE POLICY "Public can view products of any store" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Public can view any store" ON public.stores
    FOR SELECT USING (true);

-- ORDERS POLICIES
CREATE POLICY "Users can view orders for their own store" ON public.orders
    FOR SELECT USING (
        store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    );

-- Public can create orders (for checkout)
CREATE POLICY "Anyone can create an order" ON public.orders
    FOR INSERT WITH CHECK (true);

-- Order tracking uses /api/orders/track (service role). No public SELECT on orders.

-- Users can update orders for their own store
CREATE POLICY "Users can update orders for their own store" ON public.orders
    FOR UPDATE USING (
        store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    )
    WITH CHECK (
        store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    );

-- STORE VIEWS TABLE
CREATE TABLE IF NOT EXISTS public.store_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    source TEXT DEFAULT 'Direct',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.store_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view views for their own store" ON public.store_views
    FOR SELECT USING (
        store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Anyone can insert store views" ON public.store_views
    FOR INSERT WITH CHECK (true);

-- RPC FUNCTIONS
CREATE OR REPLACE FUNCTION increment_store_visits(store_id UUID, view_source TEXT DEFAULT 'Direct')
RETURNS VOID AS $$
BEGIN
    UPDATE public.stores
    SET visits = visits + 1
    WHERE id = increment_store_visits.store_id;

    INSERT INTO public.store_views (store_id, source) VALUES (increment_store_visits.store_id, increment_store_visits.view_source);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
