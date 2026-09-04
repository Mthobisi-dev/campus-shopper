-- ================================================================
-- CampusShopper v3.3 â€” 4th Normal Form (4NF) Database Schema
-- Fixed: Added updated_at ALTER to pre-existing tables
-- ================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- â”€â”€ Ensure all columns exist on pre-existing tables & drop legacy arrays â”€â”€â”€â”€â”€
DO $$ BEGIN
  -- Add missing product columns if products table pre-existed
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_url text;
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS merchant_name text;
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shipping_cost_zar numeric(10,2) NOT NULL DEFAULT 0;
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_count int NOT NULL DEFAULT 100;
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_serp_result boolean NOT NULL DEFAULT false;
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

  -- Add missing preference columns if preferences table pre-existed
  ALTER TABLE public.preferences ADD COLUMN IF NOT EXISTS ai_persona_summary text;
  ALTER TABLE public.preferences ADD COLUMN IF NOT EXISTS ai_survey_answers jsonb NOT NULL DEFAULT '{}';
  ALTER TABLE public.preferences ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

  -- Drop legacy array columns from products & preferences
  ALTER TABLE public.products DROP COLUMN IF EXISTS colours;
  ALTER TABLE public.products DROP COLUMN IF EXISTS sizes;
  ALTER TABLE public.preferences DROP COLUMN IF EXISTS fav_colours;
  ALTER TABLE public.preferences DROP COLUMN IF EXISTS fav_sizes;
  ALTER TABLE public.preferences DROP COLUMN IF EXISTS fav_vendors;
  ALTER TABLE public.preferences DROP COLUMN IF EXISTS interests;
  ALTER TABLE public.preferences DROP COLUMN IF EXISTS fav_categories;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- â”€â”€ VENDORS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.vendors (
  id               uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             text         NOT NULL,
  primary_category text         NOT NULL DEFAULT 'general',
  lat              float8       NOT NULL,
  lng              float8       NOT NULL,
  suburb           text         NOT NULL,
  city             text         NOT NULL DEFAULT 'Durban',
  logo_url         text,
  website_url      text,
  phone            text,
  rating           numeric(3,2) NOT NULL DEFAULT 4.0 CHECK (rating BETWEEN 0 AND 5),
  is_active        boolean      NOT NULL DEFAULT true,
  created_at       timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vendor_categories (
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  category  text NOT NULL,
  PRIMARY KEY (vendor_id, category)
);

-- â”€â”€ PRODUCTS (4NF â€” no array columns) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.products (
  id                uuid          PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id         uuid          REFERENCES public.vendors(id) ON DELETE CASCADE,
  name              text          NOT NULL,
  description       text,
  category          text          NOT NULL DEFAULT 'groceries',
  price_zar         numeric(10,2) NOT NULL DEFAULT 0 CHECK (price_zar >= 0),
  image_url         text,
  product_url       text,
  merchant_name     text,
  shipping_cost_zar numeric(10,2) NOT NULL DEFAULT 0 CHECK (shipping_cost_zar >= 0),
  rating            numeric(3,2)  NOT NULL DEFAULT 4.0 CHECK (rating BETWEEN 0 AND 5),
  stock_count       int           NOT NULL DEFAULT 100 CHECK (stock_count >= 0),
  is_active         boolean       NOT NULL DEFAULT true,
  is_serp_result    boolean       NOT NULL DEFAULT false,
  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_colours (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  colour     text NOT NULL,
  PRIMARY KEY (product_id, colour)
);

CREATE TABLE IF NOT EXISTS public.product_sizes (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size       text NOT NULL,
  PRIMARY KEY (product_id, size)
);

-- â”€â”€ PROFILES & PREFERENCES (4NF) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.profiles (
  id                 uuid          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_number     text          UNIQUE,
  display_name       text,
  university         text          NOT NULL DEFAULT 'Durban University of Technology',
  faculty            text,
  year_of_study      int           NOT NULL DEFAULT 1 CHECK (year_of_study BETWEEN 1 AND 6),
  suburb             text          NOT NULL DEFAULT 'Glenwood',
  lat                float8        NOT NULL DEFAULT -29.8650,
  lng                float8        NOT NULL DEFAULT 30.9822,
  monthly_budget_zar numeric(10,2) NOT NULL DEFAULT 1500.00 CHECK (monthly_budget_zar > 0),
  budget_reset_day   int           NOT NULL DEFAULT 1 CHECK (budget_reset_day BETWEEN 1 AND 28),
  avatar_url         text,
  bio                text,
  phone              text,
  created_at         timestamptz   NOT NULL DEFAULT now(),
  updated_at         timestamptz   NOT NULL DEFAULT now()
);

-- ── ADMINS ────────────────────────────────────────────────────────
-- Only users listed here can access /admin and modify student budgets
CREATE TABLE IF NOT EXISTS public.admins (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Administrator',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.preferences (
  profile_id          uuid          PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  max_shipping_zar    numeric(10,2) NOT NULL DEFAULT 100.00 CHECK (max_shipping_zar >= 0),
  max_distance_km     float8        NOT NULL DEFAULT 50.0 CHECK (max_distance_km >= 0),
  notify_budget       boolean       NOT NULL DEFAULT true,
  notify_deals       boolean       NOT NULL DEFAULT true,
  ai_persona_summary  text,
  ai_survey_answers   jsonb         NOT NULL DEFAULT '{}',
  created_at          timestamptz   NOT NULL DEFAULT now(),
  updated_at          timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.preference_colours (
  profile_id uuid NOT NULL REFERENCES public.preferences(profile_id) ON DELETE CASCADE,
  colour     text NOT NULL,
  PRIMARY KEY (profile_id, colour)
);

CREATE TABLE IF NOT EXISTS public.preference_sizes (
  profile_id uuid NOT NULL REFERENCES public.preferences(profile_id) ON DELETE CASCADE,
  size       text NOT NULL,
  PRIMARY KEY (profile_id, size)
);

CREATE TABLE IF NOT EXISTS public.preference_vendors (
  profile_id uuid NOT NULL REFERENCES public.preferences(profile_id) ON DELETE CASCADE,
  vendor_id  uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, vendor_id)
);

CREATE TABLE IF NOT EXISTS public.preference_interests (
  profile_id uuid NOT NULL REFERENCES public.preferences(profile_id) ON DELETE CASCADE,
  interest   text NOT NULL,
  PRIMARY KEY (profile_id, interest)
);

CREATE TABLE IF NOT EXISTS public.preference_categories (
  profile_id uuid NOT NULL REFERENCES public.preferences(profile_id) ON DELETE CASCADE,
  category   text NOT NULL,
  PRIMARY KEY (profile_id, category)
);

-- â”€â”€ FAVOURITES, PURCHASES, SEARCHES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.favourites (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id  uuid        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  note        text,
  saved_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.purchases (
  id                uuid          PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id        uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id        uuid          REFERENCES public.products(id) ON DELETE SET NULL,
  product_name      text          NOT NULL,
  vendor_name       text          NOT NULL DEFAULT 'Durban Store',
  product_image_url text,
  product_url       text,
  category          text          NOT NULL DEFAULT 'groceries',
  quantity          int           NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price        numeric(10,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  shipping_cost     numeric(10,2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  total_zar         numeric(10,2) NOT NULL DEFAULT 0 CHECK (total_zar >= 0),
  budget_before     numeric(10,2),
  budget_after      numeric(10,2),
  purchased_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.searches (
  id                 uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id         uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  query              text        NOT NULL,
  filters            jsonb       NOT NULL DEFAULT '{}',
  result_count       int         NOT NULL DEFAULT 0,
  clicked_product_id uuid        REFERENCES public.products(id) ON DELETE SET NULL,
  searched_at        timestamptz NOT NULL DEFAULT now()
);

-- â”€â”€ INDEXES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE INDEX IF NOT EXISTS idx_products_vendor       ON public.products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category     ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_price        ON public.products(price_zar);
CREATE INDEX IF NOT EXISTS idx_products_active       ON public.products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_rating       ON public.products(rating DESC);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm    ON public.products USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_desc_trgm    ON public.products USING gin(description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_prod_colours_product  ON public.product_colours(product_id);
CREATE INDEX IF NOT EXISTS idx_prod_sizes_product    ON public.product_sizes(product_id);
CREATE INDEX IF NOT EXISTS idx_pref_colours_profile  ON public.preference_colours(profile_id);
CREATE INDEX IF NOT EXISTS idx_pref_sizes_profile    ON public.preference_sizes(profile_id);
CREATE INDEX IF NOT EXISTS idx_pref_vendors_profile  ON public.preference_vendors(profile_id);
CREATE INDEX IF NOT EXISTS idx_pref_interests_prof   ON public.preference_interests(profile_id);
CREATE INDEX IF NOT EXISTS idx_pref_categories_prof  ON public.preference_categories(profile_id);
CREATE INDEX IF NOT EXISTS idx_favs_profile          ON public.favourites(profile_id);
CREATE INDEX IF NOT EXISTS idx_purchases_profile      ON public.purchases(profile_id);
CREATE INDEX IF NOT EXISTS idx_purchases_at          ON public.purchases(purchased_at DESC);
CREATE INDEX IF NOT EXISTS idx_searches_profile       ON public.searches(profile_id);

-- ================================================================
-- VIEWS (EXPLICIT COLUMNS â€” NO p.* or pr.* TO PREVENT DUPLICATES)
-- ================================================================

CREATE OR REPLACE VIEW public.v_products AS
SELECT
  p.id,
  p.vendor_id,
  p.name,
  p.description,
  p.category,
  p.price_zar,
  p.image_url,
  p.product_url,
  p.merchant_name,
  p.shipping_cost_zar,
  p.rating,
  p.stock_count,
  p.is_active,
  p.is_serp_result,
  p.created_at,
  p.updated_at,

  -- derived attributes
  COALESCE(array_agg(DISTINCT pc.colour) FILTER (WHERE pc.colour IS NOT NULL), '{}'::text[]) AS colours,
  COALESCE(array_agg(DISTINCT ps.size)   FILTER (WHERE ps.size IS NOT NULL),   '{}'::text[]) AS sizes,

  row_to_json(v.*) AS vendor
FROM public.products p
LEFT JOIN public.product_colours pc ON pc.product_id = p.id
LEFT JOIN public.product_sizes   ps ON ps.product_id = p.id
LEFT JOIN public.vendors          v  ON v.id = p.vendor_id
GROUP BY
  p.id, p.vendor_id, p.name, p.description, p.category, p.price_zar,
  p.image_url, p.product_url, p.merchant_name, p.shipping_cost_zar,
  p.rating, p.stock_count, p.is_active, p.is_serp_result, p.created_at, p.updated_at, v.id;

CREATE OR REPLACE VIEW public.v_preferences AS
SELECT
  pr.profile_id,
  pr.max_shipping_zar,
  pr.max_distance_km,
  pr.notify_budget,
  pr.notify_deals,
  pr.ai_persona_summary,
  pr.ai_survey_answers,
  pr.created_at,
  pr.updated_at,

  -- derived attributes
  COALESCE(array_agg(DISTINCT pc.colour)          FILTER (WHERE pc.colour IS NOT NULL),          '{}'::text[]) AS fav_colours,
  COALESCE(array_agg(DISTINCT ps.size)            FILTER (WHERE ps.size IS NOT NULL),            '{}'::text[]) AS fav_sizes,
  COALESCE(array_agg(DISTINCT pv.vendor_id::text) FILTER (WHERE pv.vendor_id IS NOT NULL),        '{}'::text[]) AS fav_vendors,
  COALESCE(array_agg(DISTINCT pi.interest)        FILTER (WHERE pi.interest IS NOT NULL),        '{}'::text[]) AS interests,
  COALESCE(array_agg(DISTINCT pcat.category)      FILTER (WHERE pcat.category IS NOT NULL),      '{}'::text[]) AS fav_categories
FROM public.preferences pr
LEFT JOIN public.preference_colours    pc   ON pc.profile_id = pr.profile_id
LEFT JOIN public.preference_sizes      ps   ON ps.profile_id = pr.profile_id
LEFT JOIN public.preference_vendors    pv   ON pv.profile_id = pr.profile_id
LEFT JOIN public.preference_interests  pi   ON pi.profile_id = pr.profile_id
LEFT JOIN public.preference_categories pcat ON pcat.profile_id = pr.profile_id
GROUP BY
  pr.profile_id, pr.max_shipping_zar, pr.max_distance_km, pr.notify_budget,
  pr.notify_deals, pr.ai_persona_summary, pr.ai_survey_answers, pr.created_at, pr.updated_at;

-- ================================================================
-- STORED PROCEDURE
-- ================================================================
CREATE OR REPLACE FUNCTION public.save_preferences(
  p_profile_id    uuid,
  p_max_shipping  numeric,
  p_max_distance  float8,
  p_ai_summary    text,
  p_ai_answers    jsonb,
  p_colours       text[],
  p_sizes         text[],
  p_vendors       uuid[],
  p_interests     text[],
  p_categories    text[]
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.preferences (profile_id, max_shipping_zar, max_distance_km, ai_persona_summary, ai_survey_answers)
  VALUES (p_profile_id, p_max_shipping, p_max_distance, p_ai_summary, p_ai_answers)
  ON CONFLICT (profile_id) DO UPDATE SET
    max_shipping_zar   = EXCLUDED.max_shipping_zar,
    max_distance_km    = EXCLUDED.max_distance_km,
    ai_persona_summary = EXCLUDED.ai_persona_summary,
    ai_survey_answers  = EXCLUDED.ai_survey_answers,
    updated_at         = now();

  DELETE FROM public.preference_colours    WHERE profile_id = p_profile_id;
  DELETE FROM public.preference_sizes      WHERE profile_id = p_profile_id;
  DELETE FROM public.preference_vendors    WHERE profile_id = p_profile_id;
  DELETE FROM public.preference_interests  WHERE profile_id = p_profile_id;
  DELETE FROM public.preference_categories WHERE profile_id = p_profile_id;

  IF array_length(p_colours, 1) > 0 THEN
    INSERT INTO public.preference_colours (profile_id, colour) SELECT p_profile_id, unnest(p_colours) ON CONFLICT DO NOTHING;
  END IF;
  IF array_length(p_sizes, 1) > 0 THEN
    INSERT INTO public.preference_sizes (profile_id, size) SELECT p_profile_id, unnest(p_sizes) ON CONFLICT DO NOTHING;
  END IF;
  IF array_length(p_vendors, 1) > 0 THEN
    INSERT INTO public.preference_vendors (profile_id, vendor_id) SELECT p_profile_id, unnest(p_vendors) ON CONFLICT DO NOTHING;
  END IF;
  IF array_length(p_interests, 1) > 0 THEN
    INSERT INTO public.preference_interests (profile_id, interest) SELECT p_profile_id, unnest(p_interests) ON CONFLICT DO NOTHING;
  END IF;
  IF array_length(p_categories, 1) > 0 THEN
    INSERT INTO public.preference_categories (profile_id, category) SELECT p_profile_id, unnest(p_categories) ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

-- RLS PERMISSIONS
ALTER TABLE public.vendors              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preferences          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favourites           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.searches             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins               ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE r record;
BEGIN
  FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

CREATE POLICY "public_read_vendors"   ON public.vendors   FOR SELECT USING (true);
CREATE POLICY "public_read_products"  ON public.products  FOR SELECT USING (true);

CREATE POLICY "svc_all_vendors"   ON public.vendors     FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc_all_products"  ON public.products    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc_all_profiles"  ON public.profiles    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc_all_prefs"     ON public.preferences FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc_all_favs"      ON public.favourites  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc_all_purchases" ON public.purchases   FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc_all_searches"  ON public.searches    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc_all_admins"    ON public.admins      FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated students: select + limited update (NO budget update)
CREATE POLICY "own_profile_select" ON public.profiles    FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own_profile_insert" ON public.profiles    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
-- Students can update their own profile BUT NOT monthly_budget_zar (enforced in API)
CREATE POLICY "own_profile_update" ON public.profiles    FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
CREATE POLICY "own_prefs_select"   ON public.preferences FOR SELECT TO authenticated USING (auth.uid() = profile_id);
CREATE POLICY "own_prefs_insert"   ON public.preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "own_prefs_update"   ON public.preferences FOR UPDATE TO authenticated USING (auth.uid() = profile_id);
CREATE POLICY "own_favs_all"       ON public.favourites  FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "own_purchases_all"  ON public.purchases   FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "own_searches_all"   ON public.searches    FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

-- Admins can read their own admin record
CREATE POLICY "admin_read_self"    ON public.admins      FOR SELECT TO authenticated USING (auth.uid() = id);
-- Admins can read ALL student profiles (for the admin panel)
CREATE POLICY "admin_read_profiles" ON public.profiles   FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- ================================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- This trigger fires every time a new user signs up via Supabase Auth
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, student_number, display_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'student_number',
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

NOTIFY pgrst, 'reload schema';

COMMIT;