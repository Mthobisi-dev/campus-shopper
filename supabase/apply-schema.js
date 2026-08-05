// Apply schema using the pg module with Supabase's connection string
// Using the service role JWT as the password with the REST API workaround
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0]?.replace('https://', '') || 'czzlkgnekogmltbhzhvq';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Try multiple pooler connection string formats for Supabase
const configs = [
  // Session mode pooler (port 5432) - use postgres.{project} as user
  {
    host: `aws-0-eu-central-1.pooler.supabase.com`,
    port: 5432,
    database: 'postgres',
    user: `postgres.${PROJECT_ID}`,
    password: SERVICE_KEY,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000
  },
  // Transaction mode pooler (port 6543)
  {
    host: `aws-0-eu-central-1.pooler.supabase.com`,
    port: 6543,
    database: 'postgres',
    user: `postgres.${PROJECT_ID}`,
    password: SERVICE_KEY,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000
  },
  // Direct connection
  {
    host: `db.${PROJECT_ID}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: SERVICE_KEY,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000
  },
];

// Split SQL into individual statements to run them one by one
const SQL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS profiles (
    id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    student_number      text UNIQUE,
    display_name        text,
    university          text DEFAULT 'University of KwaZulu-Natal',
    suburb              text DEFAULT 'Glenwood',
    lat                 float8 DEFAULT -29.8650,
    lng                 float8 DEFAULT 30.9822,
    monthly_budget_zar  numeric(10,2) DEFAULT 1500.00,
    budget_reset_day    int DEFAULT 1,
    avatar_url          text,
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS preferences (
    id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id       uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    fav_colours      text[] DEFAULT '{}',
    fav_sizes        text[] DEFAULT '{}',
    fav_vendors      uuid[] DEFAULT '{}',
    interests        text[] DEFAULT '{}',
    max_shipping_zar numeric(10,2) DEFAULT 100.00,
    max_distance_km  float8 DEFAULT 50.0,
    created_at       timestamptz DEFAULT now(),
    updated_at       timestamptz DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS favourites (
    id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id  uuid REFERENCES profiles(id) ON DELETE CASCADE,
    product_id  uuid REFERENCES products(id) ON DELETE CASCADE,
    saved_at    timestamptz DEFAULT now(),
    UNIQUE(profile_id, product_id)
  )`,
  `CREATE TABLE IF NOT EXISTS purchases (
    id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id   uuid REFERENCES profiles(id) ON DELETE CASCADE,
    product_id   uuid REFERENCES products(id) ON DELETE SET NULL,
    product_name text NOT NULL,
    vendor_name  text NOT NULL,
    quantity     int NOT NULL DEFAULT 1,
    unit_price   numeric(10,2) NOT NULL,
    total_zar    numeric(10,2) NOT NULL,
    category     text NOT NULL,
    purchased_at timestamptz DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS searches (
    id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id   uuid REFERENCES profiles(id) ON DELETE CASCADE,
    query        text NOT NULL,
    filters      jsonb DEFAULT '{}',
    result_count int DEFAULT 0,
    searched_at  timestamptz DEFAULT now()
  )`,
  `ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE preferences ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE favourites  ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE purchases   ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE searches    ENABLE ROW LEVEL SECURITY`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can view own profile') THEN
      CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can insert own profile') THEN
      CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can update own profile') THEN
      CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='preferences' AND policyname='Users can manage own preferences') THEN
      CREATE POLICY "Users can manage own preferences" ON preferences FOR ALL USING (auth.uid() = profile_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='favourites' AND policyname='Users can manage own favourites') THEN
      CREATE POLICY "Users can manage own favourites" ON favourites FOR ALL USING (auth.uid() = profile_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='purchases' AND policyname='Users can manage own purchases') THEN
      CREATE POLICY "Users can manage own purchases" ON purchases FOR ALL USING (auth.uid() = profile_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='searches' AND policyname='Users can manage own searches') THEN
      CREATE POLICY "Users can manage own searches" ON searches FOR ALL USING (auth.uid() = profile_id);
    END IF;
  END $$`,
  `CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.profiles (id, display_name, student_number)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
      new.raw_user_meta_data->>'student_number'
    );
    INSERT INTO public.preferences (profile_id) VALUES (new.id);
    RETURN new;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER`,
  `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`,
  `CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user()`,
  `CREATE INDEX IF NOT EXISTS idx_favourites_profile ON favourites(profile_id)`,
  `CREATE INDEX IF NOT EXISTS idx_purchases_profile  ON purchases(profile_id)`,
  `CREATE INDEX IF NOT EXISTS idx_searches_profile   ON searches(profile_id)`,
];

async function applySchema() {
  for (const config of configs) {
    const client = new Client(config);
    try {
      console.log(`Trying ${config.host}:${config.port} as ${config.user}...`);
      await client.connect();
      console.log('✅ Connected!\n');

      for (const stmt of SQL_STATEMENTS) {
        const preview = stmt.trim().split('\n')[0].slice(0, 60);
        try {
          await client.query(stmt);
          console.log(`  ✅ ${preview}`);
        } catch (e) {
          if (e.message.includes('already exists')) {
            console.log(`  ⚠️  Already exists: ${preview}`);
          } else {
            console.log(`  ❌ ${preview}`);
            console.log(`     Error: ${e.message}`);
          }
        }
      }

      await client.end();
      console.log('\n🎉 Schema applied successfully!');
      return;
    } catch (e) {
      console.log(`  Failed: ${e.message}`);
      await client.end().catch(() => {});
    }
  }
  
  console.log('\n❌ Could not connect directly. Please run supabase/schema.sql manually in the Supabase SQL Editor:');
  console.log('   https://czzlkgnekogmltbhzhvq.supabase.co');
}

applySchema().catch(console.error);
