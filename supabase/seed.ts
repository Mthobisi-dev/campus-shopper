// ============================================================
// CampusShopper — Seed Data
// Run: npx ts-node supabase/seed.ts  (after applying schema.sql)
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://czzlkgnekogmltbhzhvq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================
// VENDORS — Durban, KwaZulu-Natal
// ============================================================
const vendors = [
  {
    name: 'FreshKart',
    category: 'grocery',
    lat: -29.8308,
    lng: 30.9343,
    suburb: 'Westville',
    city: 'Durban',
    logo_url: null,
  },
  {
    name: 'CampusBooks',
    category: 'books',
    lat: -29.8650,
    lng: 30.9822,
    suburb: 'Glenwood',
    city: 'Durban',
    logo_url: null,
  },
  {
    name: 'UrbanThreads',
    category: 'clothing',
    lat: -29.8557,
    lng: 30.9845,
    suburb: 'Musgrave',
    city: 'Durban',
    logo_url: null,
  },
  {
    name: 'TechNest',
    category: 'electronics',
    lat: -29.7300,
    lng: 31.0784,
    suburb: 'Umhlanga',
    city: 'Durban',
    logo_url: null,
  },
  {
    name: 'PharmaPlus',
    category: 'pharmacy',
    lat: -29.8175,
    lng: 30.8561,
    suburb: 'Pinetown',
    city: 'Durban',
    logo_url: null,
  },
];

// ============================================================
// PRODUCTS — 65 items across 6 categories
// ============================================================
// Vendor indices: 0=FreshKart, 1=CampusBooks, 2=UrbanThreads, 3=TechNest, 4=PharmaPlus
const productTemplates = [
  // ── GROCERIES (FreshKart) ──────────────────────────────────
  { vi: 0, name: 'White Rice 2kg', desc: 'Long grain white rice, great for daily meals', cat: 'groceries', price: 39.99, colours: [], sizes: ['2kg'], ship: 15, rating: 4.5 },
  { vi: 0, name: 'Brown Bread Loaf', desc: 'Wholesome brown bread, 700g sliced loaf', cat: 'groceries', price: 19.99, colours: [], sizes: ['700g'], ship: 15, rating: 4.2 },
  { vi: 0, name: 'Full Cream Milk 2L', desc: 'Fresh full cream milk — Clover brand', cat: 'groceries', price: 32.99, colours: [], sizes: ['2L'], ship: 15, rating: 4.7 },
  { vi: 0, name: 'Free Range Eggs x12', desc: '12 pack free range eggs', cat: 'groceries', price: 44.99, colours: [], sizes: ['x12'], ship: 15, rating: 4.8 },
  { vi: 0, name: 'Instant Noodles 6-pack', desc: 'Indomie chicken flavour instant noodles', cat: 'groceries', price: 34.99, colours: [], sizes: ['6-pack'], ship: 15, rating: 4.6 },
  { vi: 0, name: 'Peanut Butter 400g', desc: 'Smooth peanut butter, high protein', cat: 'groceries', price: 29.99, colours: [], sizes: ['400g'], ship: 15, rating: 4.4 },
  { vi: 0, name: 'Canned Baked Beans', desc: 'Koo baked beans in tomato sauce 410g', cat: 'groceries', price: 14.99, colours: [], sizes: ['410g'], ship: 15, rating: 4.3 },
  { vi: 0, name: 'Sunflower Oil 750ml', desc: 'Pure sunflower cooking oil', cat: 'groceries', price: 27.99, colours: [], sizes: ['750ml'], ship: 15, rating: 4.1 },
  { vi: 0, name: 'Pasta 500g', desc: 'Fatti\'s & Moni\'s spaghetti, 500g', cat: 'groceries', price: 17.99, colours: [], sizes: ['500g'], ship: 15, rating: 4.0 },
  { vi: 0, name: 'Tomato Sauce 450ml', desc: 'All Gold tomato sauce, classic', cat: 'groceries', price: 22.99, colours: [], sizes: ['450ml'], ship: 15, rating: 4.2 },
  { vi: 0, name: 'Canned Tuna x4 pack', desc: 'Lucky Star pilchards in tomato sauce, 4-pack', cat: 'groceries', price: 48.99, colours: [], sizes: ['x4'], ship: 15, rating: 4.5 },
  { vi: 0, name: 'Oats 1kg', desc: 'Jungle Oats — perfect for breakfast', cat: 'groceries', price: 34.99, colours: [], sizes: ['1kg'], ship: 15, rating: 4.6 },
  { vi: 0, name: 'Bananas (bunch ~1kg)', desc: 'Fresh ripe bananas, sold by bunch', cat: 'groceries', price: 19.99, colours: ['yellow'], sizes: ['~1kg'], ship: 15, rating: 4.4 },
  { vi: 0, name: 'Frozen Chicken Portions 1kg', desc: '1kg mixed chicken portions', cat: 'groceries', price: 79.99, colours: [], sizes: ['1kg'], ship: 20, rating: 4.3 },
  { vi: 0, name: 'Laundry Detergent 1kg', desc: 'Skip powder laundry detergent, 1kg', cat: 'groceries', price: 54.99, colours: [], sizes: ['1kg'], ship: 15, rating: 4.1 },

  // ── TEXTBOOKS & STATIONERY (CampusBooks) ─────────────────
  { vi: 1, name: 'A4 Hardcover Notebook', desc: '200 page ruled hardcover notebook', cat: 'textbooks', price: 49.99, colours: ['black', 'navy', 'red', 'green'], sizes: ['A4'], ship: 0, rating: 4.5 },
  { vi: 1, name: 'Ballpoint Pen 10-pack', desc: 'Kilometrico blue ballpoint pens', cat: 'textbooks', price: 24.99, colours: ['blue', 'black'], sizes: [], ship: 0, rating: 4.2 },
  { vi: 1, name: 'Scientific Calculator', desc: 'Casio FX-82ZA Plus II — CAPS approved', cat: 'textbooks', price: 259.99, colours: ['black'], sizes: [], ship: 30, rating: 4.9 },
  { vi: 1, name: 'Introduction to Business Management', desc: '8th Ed — du Toit, Erasmus & Strydom', cat: 'textbooks', price: 499.99, colours: [], sizes: [], ship: 0, rating: 4.3 },
  { vi: 1, name: 'Accounting Principles (SA Ed)', desc: 'Weygandt, Kimmel & Kieso, SA edition', cat: 'textbooks', price: 649.99, colours: [], sizes: [], ship: 0, rating: 4.4 },
  { vi: 1, name: 'A4 Sticky Notes 100pk', desc: 'Post-it style yellow sticky notes, 100 pack', cat: 'textbooks', price: 34.99, colours: ['yellow'], sizes: ['A4'], ship: 0, rating: 4.0 },
  { vi: 1, name: 'Highlighter Set 5-pack', desc: 'Neon highlighters in 5 colours', cat: 'textbooks', price: 39.99, colours: ['yellow', 'pink', 'green', 'orange', 'blue'], sizes: [], ship: 0, rating: 4.3 },
  { vi: 1, name: 'Lever Arch File A4', desc: 'PVC lever arch file, 70mm spine', cat: 'textbooks', price: 54.99, colours: ['black', 'navy', 'red'], sizes: ['A4'], ship: 0, rating: 4.1 },
  { vi: 1, name: 'Economics: An Introduction', desc: 'McConnell & Brue — 21st edition SA reprint', cat: 'textbooks', price: 589.99, colours: [], sizes: [], ship: 0, rating: 4.2 },
  { vi: 1, name: 'USB Flash Drive 32GB', desc: 'Verbatim USB 3.0 flash drive 32GB', cat: 'textbooks', price: 149.99, colours: ['black', 'white'], sizes: ['32GB'], ship: 0, rating: 4.6 },

  // ── CLOTHING (UrbanThreads) ────────────────────────────────
  { vi: 2, name: 'Winter Hoodie', desc: 'Heavyweight fleece hoodie — warm and stylish', cat: 'clothing', price: 349.99, colours: ['black', 'navy', 'grey', 'olive'], sizes: ['XS','S','M','L','XL','XXL'], ship: 50, rating: 4.6 },
  { vi: 2, name: 'Slim-Fit Chinos', desc: 'Cotton stretch chino pants', cat: 'clothing', price: 399.99, colours: ['khaki', 'navy', 'black', 'olive'], sizes: ['28','30','32','34','36'], ship: 50, rating: 4.4 },
  { vi: 2, name: 'Graphic Tee', desc: 'Premium cotton unisex graphic t-shirt', cat: 'clothing', price: 149.99, colours: ['white', 'black', 'grey', 'blue'], sizes: ['XS','S','M','L','XL'], ship: 50, rating: 4.5 },
  { vi: 2, name: 'Winter Jacket (Puffer)', desc: 'Lightweight puffer jacket, water-resistant', cat: 'clothing', price: 549.99, colours: ['black', 'navy', 'olive', 'burgundy'], sizes: ['XS','S','M','L','XL','XXL'], ship: 60, rating: 4.7 },
  { vi: 2, name: 'Denim Jeans', desc: 'Straight-leg denim jeans, 100% cotton', cat: 'clothing', price: 449.99, colours: ['blue', 'black', 'grey'], sizes: ['28','30','32','34','36'], ship: 50, rating: 4.5 },
  { vi: 2, name: 'Sneakers — Canvas Low-top', desc: 'Classic canvas low-top sneakers', cat: 'clothing', price: 299.99, colours: ['white', 'black', 'navy', 'red'], sizes: ['36','37','38','39','40','41','42','43','44','45'], ship: 60, rating: 4.6 },
  { vi: 2, name: 'Beanie Hat', desc: 'Knitted winter beanie — one size fits all', cat: 'clothing', price: 89.99, colours: ['black', 'grey', 'navy', 'maroon', 'green'], sizes: ['One Size'], ship: 30, rating: 4.3 },
  { vi: 2, name: 'Sports Shorts', desc: 'Quick-dry running and gym shorts', cat: 'clothing', price: 199.99, colours: ['black', 'navy', 'grey', 'green'], sizes: ['XS','S','M','L','XL'], ship: 40, rating: 4.4 },
  { vi: 2, name: 'Polo Shirt', desc: 'Classic piqué polo shirt — smart casual', cat: 'clothing', price: 249.99, colours: ['white', 'navy', 'black', 'burgundy', 'grey'], sizes: ['XS','S','M','L','XL'], ship: 50, rating: 4.5 },
  { vi: 2, name: 'Gym Leggings (Women)', desc: 'High-waist compression gym leggings', cat: 'clothing', price: 279.99, colours: ['black', 'navy', 'grey', 'olive'], sizes: ['XS','S','M','L','XL'], ship: 50, rating: 4.7 },
  { vi: 2, name: 'Backpack 30L', desc: 'Durable laptop backpack — fits 15.6" laptop', cat: 'clothing', price: 399.99, colours: ['black', 'navy', 'grey', 'olive'], sizes: ['30L'], ship: 60, rating: 4.8 },
  { vi: 2, name: 'Rain Jacket', desc: 'Packable waterproof rain jacket', cat: 'clothing', price: 479.99, colours: ['black', 'navy', 'olive', 'red'], sizes: ['XS','S','M','L','XL'], ship: 60, rating: 4.6 },
  { vi: 2, name: 'Ankle Socks 6-pack', desc: 'Cotton ankle socks, 6-pair pack', cat: 'clothing', price: 99.99, colours: ['white', 'black', 'grey'], sizes: ['36-40','41-45'], ship: 30, rating: 4.2 },
  { vi: 2, name: 'Floral Summer Dress', desc: 'Lightweight floral midi dress', cat: 'clothing', price: 329.99, colours: ['white', 'blue', 'pink', 'yellow'], sizes: ['XS','S','M','L','XL'], ship: 50, rating: 4.5 },
  { vi: 2, name: 'Track Pants', desc: 'Cotton jogger track pants', cat: 'clothing', price: 229.99, colours: ['black', 'grey', 'navy'], sizes: ['XS','S','M','L','XL','XXL'], ship: 50, rating: 4.4 },

  // ── ELECTRONICS & DATA (TechNest) ─────────────────────────
  { vi: 3, name: 'Wireless Earbuds', desc: 'True wireless earbuds — 24hr battery life', cat: 'electronics', price: 699.99, colours: ['black', 'white'], sizes: [], ship: 80, rating: 4.6 },
  { vi: 3, name: 'USB-C Charger 65W', desc: 'GaN fast charger — charges laptop + phone', cat: 'electronics', price: 249.99, colours: ['white', 'black'], sizes: ['65W'], ship: 50, rating: 4.7 },
  { vi: 3, name: 'Power Bank 20000mAh', desc: 'Anker 20000mAh dual-output power bank', cat: 'electronics', price: 449.99, colours: ['black', 'white'], sizes: ['20000mAh'], ship: 60, rating: 4.8 },
  { vi: 3, name: 'Data SIM — 10GB Vodacom', desc: 'Prepaid 10GB data bundle, 30-day validity', cat: 'data', price: 149.99, colours: [], sizes: ['10GB'], ship: 0, rating: 4.5 },
  { vi: 3, name: 'Data SIM — 5GB MTN', desc: 'MTN 5GB prepaid data bundle', cat: 'data', price: 89.99, colours: [], sizes: ['5GB'], ship: 0, rating: 4.3 },
  { vi: 3, name: 'Wired Earphones', desc: 'JBL Tune 310C USB-C wired earphones', cat: 'electronics', price: 299.99, colours: ['black', 'white', 'blue'], sizes: [], ship: 50, rating: 4.5 },
  { vi: 3, name: 'LED Desk Lamp', desc: 'Dimmable USB-powered LED study lamp', cat: 'electronics', price: 189.99, colours: ['white', 'black'], sizes: [], ship: 60, rating: 4.4 },
  { vi: 3, name: 'Laptop Stand', desc: 'Adjustable aluminium laptop riser stand', cat: 'electronics', price: 349.99, colours: ['silver', 'black'], sizes: [], ship: 60, rating: 4.6 },
  { vi: 3, name: 'Airtime R100 (Vodacom)', desc: 'R100 Vodacom airtime voucher code', cat: 'data', price: 100.00, colours: [], sizes: [], ship: 0, rating: 4.9 },
  { vi: 3, name: 'Mouse — Wireless', desc: 'Logitech M185 wireless mouse', cat: 'electronics', price: 279.99, colours: ['black', 'blue', 'red'], sizes: [], ship: 50, rating: 4.7 },

  // ── TOILETRIES & HEALTH (PharmaPlus) ──────────────────────
  { vi: 4, name: 'Shampoo 400ml', desc: 'TRESemmé Keratin Smooth shampoo', cat: 'toiletries', price: 79.99, colours: [], sizes: ['400ml'], ship: 25, rating: 4.4 },
  { vi: 4, name: 'Conditioner 400ml', desc: 'TRESemmé Keratin Smooth conditioner', cat: 'toiletries', price: 79.99, colours: [], sizes: ['400ml'], ship: 25, rating: 4.3 },
  { vi: 4, name: 'Dove Bar Soap 6-pack', desc: 'Dove moisturising bar soap, 6×90g', cat: 'toiletries', price: 64.99, colours: [], sizes: ['6×90g'], ship: 20, rating: 4.6 },
  { vi: 4, name: 'Deodorant Roll-on', desc: 'Sure Maximum Protection deodorant', cat: 'toiletries', price: 49.99, colours: [], sizes: ['50ml'], ship: 20, rating: 4.4 },
  { vi: 4, name: 'Toothbrush & Paste Combo', desc: 'Oral-B toothbrush + Colgate 75ml paste', cat: 'toiletries', price: 59.99, colours: [], sizes: [], ship: 20, rating: 4.5 },
  { vi: 4, name: 'Vitamin C 1000mg x30', desc: 'Ester-C vitamin C tablets, 30-day supply', cat: 'toiletries', price: 89.99, colours: [], sizes: ['30 tabs'], ship: 20, rating: 4.7 },
  { vi: 4, name: 'Hand Cream 100ml', desc: 'Neutrogena Norwegian Formula hand cream', cat: 'toiletries', price: 69.99, colours: [], sizes: ['100ml'], ship: 20, rating: 4.6 },
  { vi: 4, name: 'Sanitary Pads 14-pack', desc: 'Always Ultra Thin, wings, 14-pack', cat: 'toiletries', price: 54.99, colours: [], sizes: ['14-pack'], ship: 20, rating: 4.8 },
  { vi: 4, name: 'Paracetamol 500mg x20', desc: 'Panado paracetamol tablets, 20-pack', cat: 'toiletries', price: 24.99, colours: [], sizes: ['20 tabs'], ship: 20, rating: 4.7 },
  { vi: 4, name: 'Multivitamin Gummies x30', desc: 'Centrum Kids gummy vitamins, 30 gummies', cat: 'toiletries', price: 109.99, colours: [], sizes: ['30 gummies'], ship: 20, rating: 4.5 },
  { vi: 4, name: 'Body Lotion 400ml', desc: 'Vaseline Intensive Care cocoa radiant lotion', cat: 'toiletries', price: 69.99, colours: [], sizes: ['400ml'], ship: 20, rating: 4.6 },
];

async function seed() {
  console.log('🌱 Seeding CampusShopper database...');

  // Clear existing data
  console.log('Clearing existing products and vendors...');
  await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('vendors').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Insert vendors
  console.log('Inserting vendors...');
  const { data: insertedVendors, error: vendorErr } = await supabase
    .from('vendors')
    .insert(vendors)
    .select();

  if (vendorErr || !insertedVendors) {
    console.error('Vendor insert error:', vendorErr);
    process.exit(1);
  }

  console.log(`✅ Inserted ${insertedVendors.length} vendors`);

  // Map vendor index to id
  const vendorIds = insertedVendors.map((v: any) => v.id);

  // Build products with actual vendor IDs
  const products = productTemplates.map((t) => ({
    vendor_id: vendorIds[t.vi],
    name: t.name,
    description: t.desc,
    category: t.cat,
    price_zar: t.price,
    colours: t.colours,
    sizes: t.sizes,
    shipping_cost_zar: t.ship,
    rating: t.rating,
    image_url: null,
    stock_count: Math.floor(Math.random() * 50) + 10,
    is_active: true,
  }));

  console.log('Inserting products...');
  const { data: insertedProducts, error: prodErr } = await supabase
    .from('products')
    .insert(products)
    .select();

  if (prodErr) {
    console.error('Product insert error:', prodErr);
    process.exit(1);
  }

  console.log(`✅ Inserted ${insertedProducts?.length} products`);
  console.log('🎉 Seed complete!');
}

seed().catch(console.error);
