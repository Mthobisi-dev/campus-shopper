// CampusShopper v2 — Seed Script
// Seeds 5 vendors + 61 products WITH real product image URLs
// Run: node supabase/seed.js

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://czzlkgnekogmltbhzhvq.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const headers = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Prefer': 'return=representation',
};

async function api(path, method = 'GET', body = null) {
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, opts);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${err}`);
  }
  return res.json();
}

const vendors = [
  { name: 'FreshKart',    category: 'grocery',     lat: -29.8308, lng: 30.9343, suburb: 'Westville', city: 'Durban' },
  { name: 'CampusBooks',  category: 'books',        lat: -29.8650, lng: 30.9822, suburb: 'Glenwood',  city: 'Durban' },
  { name: 'UrbanThreads', category: 'clothing',     lat: -29.8557, lng: 30.9845, suburb: 'Musgrave',  city: 'Durban' },
  { name: 'TechNest',     category: 'electronics',  lat: -29.7300, lng: 31.0784, suburb: 'Umhlanga',  city: 'Durban' },
  { name: 'PharmaPlus',   category: 'pharmacy',     lat: -29.8175, lng: 30.8561, suburb: 'Pinetown',  city: 'Durban' },
];

// Product image URLs: high-quality Unsplash photos matching each product
// vi: vendor index (0=FreshKart, 1=CampusBooks, 2=UrbanThreads, 3=TechNest, 4=PharmaPlus)
const productTemplates = [
  // ── GROCERIES (FreshKart) ─────────────────────────────────────
  { vi:0, name:'White Rice 2kg',              desc:'Long grain white rice — a South African student staple',        cat:'groceries', price:39.99,  img:'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80', colours:[],             sizes:['2kg'],    ship:15, rating:4.5 },
  { vi:0, name:'Brown Bread Loaf',            desc:'Wholesome 700g sliced brown bread',                            cat:'groceries', price:19.99,  img:'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80', colours:[],             sizes:['700g'],   ship:15, rating:4.2 },
  { vi:0, name:'Full Cream Milk 2L',          desc:'Fresh Clover full cream milk — chilled delivery',              cat:'groceries', price:32.99,  img:'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80', colours:[],             sizes:['2L'],     ship:15, rating:4.7 },
  { vi:0, name:'Free Range Eggs x12',         desc:'12-pack free range eggs — farm fresh',                        cat:'groceries', price:44.99,  img:'https://images.unsplash.com/photo-1518569656558-1f25e69d2fd4?w=400&q=80', colours:[],             sizes:['x12'],    ship:15, rating:4.8 },
  { vi:0, name:'Instant Noodles 6-pack',      desc:'Indomie chicken flavour — quick student meal',                cat:'groceries', price:34.99,  img:'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80', colours:[],             sizes:['6-pack'], ship:15, rating:4.6 },
  { vi:0, name:'Peanut Butter 400g',          desc:'Smooth peanut butter — high protein snack',                   cat:'groceries', price:29.99,  img:'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&q=80', colours:[],             sizes:['400g'],   ship:15, rating:4.4 },
  { vi:0, name:'Canned Baked Beans',          desc:'Koo baked beans 410g — easy protein',                        cat:'groceries', price:14.99,  img:'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80', colours:[],             sizes:['410g'],   ship:15, rating:4.3 },
  { vi:0, name:'Sunflower Oil 750ml',         desc:'Pure sunflower cooking oil',                                   cat:'groceries', price:27.99,  img:'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80', colours:[],             sizes:['750ml'],  ship:15, rating:4.1 },
  { vi:0, name:'Pasta 500g',                  desc:"Spaghetti pasta — quick student dinner",                      cat:'groceries', price:17.99,  img:'https://images.unsplash.com/photo-1551462147-37885acc36f1?w=400&q=80', colours:[],             sizes:['500g'],   ship:15, rating:4.0 },
  { vi:0, name:'Oats 1kg',                    desc:'Jungle Oats — hearty breakfast cereal',                       cat:'groceries', price:34.99,  img:'https://images.unsplash.com/photo-1614961233913-a5113a4a34ed?w=400&q=80', colours:[],             sizes:['1kg'],    ship:15, rating:4.6 },
  { vi:0, name:'Bananas (bunch ~1kg)',         desc:'Fresh ripe bananas — healthy snack',                          cat:'groceries', price:19.99,  img:'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80', colours:['yellow'],     sizes:['~1kg'],   ship:15, rating:4.4 },
  { vi:0, name:'Frozen Chicken Portions 1kg', desc:'Mixed chicken portions — great for meals',                    cat:'groceries', price:79.99,  img:'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80', colours:[],             sizes:['1kg'],    ship:20, rating:4.3 },
  { vi:0, name:'Laundry Detergent 1kg',       desc:'Skip powder detergent — keeps clothes clean',                 cat:'groceries', price:54.99,  img:'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80', colours:[],             sizes:['1kg'],    ship:15, rating:4.1 },
  { vi:0, name:'Canned Tuna x4 pack',         desc:'Lucky Star pilchards in tomato sauce 4-pack',                cat:'groceries', price:48.99,  img:'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80', colours:[],             sizes:['x4'],     ship:15, rating:4.5 },
  { vi:0, name:'Tomato Sauce 450ml',          desc:'All Gold classic tomato sauce',                               cat:'groceries', price:22.99,  img:'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80', colours:[],             sizes:['450ml'],  ship:15, rating:4.2 },

  // ── TEXTBOOKS & STATIONERY (CampusBooks) ─────────────────────
  { vi:1, name:'A4 Hardcover Notebook',            desc:'200-page ruled hardcover notebook',                      cat:'textbooks', price:49.99,  img:'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400&q=80', colours:['black','navy','red','green'], sizes:['A4'],   ship:0,  rating:4.5 },
  { vi:1, name:'Ballpoint Pen 10-pack',            desc:'Kilometrico blue pens — reliable write every time',      cat:'textbooks', price:24.99,  img:'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400&q=80', colours:['blue','black'],              sizes:[],       ship:0,  rating:4.2 },
  { vi:1, name:'Scientific Calculator',            desc:'Casio FX-82ZA Plus II — CAPS approved',                  cat:'textbooks', price:259.99, img:'https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=400&q=80', colours:['black'],                     sizes:[],       ship:30, rating:4.9 },
  { vi:1, name:'Introduction to Business Mgmt',    desc:'8th Ed — du Toit, Erasmus & Strydom',                   cat:'textbooks', price:499.99, img:'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80', colours:[],                           sizes:[],       ship:0,  rating:4.3 },
  { vi:1, name:'Accounting Principles (SA Ed)',    desc:'Weygandt, Kimmel & Kieso South Africa edition',          cat:'textbooks', price:649.99, img:'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&q=80', colours:[],                           sizes:[],       ship:0,  rating:4.4 },
  { vi:1, name:'A4 Sticky Notes 100pk',            desc:'Post-it style yellow notes for studying',               cat:'textbooks', price:34.99,  img:'https://images.unsplash.com/photo-1587482517291-cfdcc54c2c73?w=400&q=80', colours:['yellow'],                    sizes:['A4'],   ship:0,  rating:4.0 },
  { vi:1, name:'Highlighter Set 5-pack',           desc:'Neon highlighters in 5 vibrant colours',                cat:'textbooks', price:39.99,  img:'https://images.unsplash.com/photo-1619410283995-43d9134e7656?w=400&q=80', colours:['yellow','pink','green','orange','blue'], sizes:[], ship:0, rating:4.3 },
  { vi:1, name:'Lever Arch File A4',               desc:'PVC lever arch file — 70mm spine',                      cat:'textbooks', price:54.99,  img:'https://images.unsplash.com/photo-1568057373837-e21b63b78f6c?w=400&q=80', colours:['black','navy','red'],         sizes:['A4'],   ship:0,  rating:4.1 },
  { vi:1, name:'USB Flash Drive 32GB',             desc:'Verbatim USB 3.0 32GB — store your notes',              cat:'textbooks', price:149.99, img:'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&q=80', colours:['black','white'],             sizes:['32GB'], ship:0,  rating:4.6 },
  { vi:1, name:'Economics: An Introduction',       desc:'McConnell & Brue 21st ed SA reprint',                   cat:'textbooks', price:589.99, img:'https://images.unsplash.com/photo-1502945015378-0e284ca1a5be?w=400&q=80', colours:[],                           sizes:[],       ship:0,  rating:4.2 },

  // ── CLOTHING (UrbanThreads) ───────────────────────────────────
  { vi:2, name:'Winter Hoodie',          desc:'Heavyweight fleece hoodie — warm through Durban winters',         cat:'clothing', price:349.99, img:'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&q=80', colours:['black','navy','grey','olive'],        sizes:['XS','S','M','L','XL','XXL'], ship:50, rating:4.6 },
  { vi:2, name:'Slim-Fit Chinos',        desc:'Cotton stretch chino pants — smart casual everyday',              cat:'clothing', price:399.99, img:'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80', colours:['khaki','navy','black','olive'],        sizes:['28','30','32','34','36'],     ship:50, rating:4.4 },
  { vi:2, name:'Graphic Tee',            desc:'Premium cotton graphic t-shirt — express yourself',               cat:'clothing', price:149.99, img:'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=80', colours:['white','black','grey','blue'],         sizes:['XS','S','M','L','XL'],       ship:50, rating:4.5 },
  { vi:2, name:'Winter Jacket Puffer',   desc:'Lightweight puffer jacket — wind and rain resistant',             cat:'clothing', price:549.99, img:'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&q=80', colours:['black','navy','olive','burgundy'],     sizes:['XS','S','M','L','XL','XXL'], ship:60, rating:4.7 },
  { vi:2, name:'Denim Jeans',            desc:'Straight-leg 100% cotton denim — classic fit',                    cat:'clothing', price:449.99, img:'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80', colours:['blue','black','grey'],                 sizes:['28','30','32','34','36'],     ship:50, rating:4.5 },
  { vi:2, name:'Canvas Sneakers',        desc:'Classic low-top canvas sneakers — everyday comfort',              cat:'clothing', price:299.99, img:'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400&q=80', colours:['white','black','navy','red'],          sizes:['36','37','38','39','40','41','42','43','44','45'], ship:60, rating:4.6 },
  { vi:2, name:'Beanie Hat',             desc:'Knitted winter beanie — keeps you warm on campus',                cat:'clothing', price:89.99,  img:'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&q=80', colours:['black','grey','navy','maroon','green'], sizes:['One Size'],                  ship:30, rating:4.3 },
  { vi:2, name:'Sports Shorts',          desc:'Quick-dry gym shorts — perfect for gym or sport',                 cat:'clothing', price:199.99, img:'https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=400&q=80', colours:['black','navy','grey','green'],         sizes:['XS','S','M','L','XL'],       ship:40, rating:4.4 },
  { vi:2, name:'Polo Shirt',             desc:'Classic piqué polo — smart look for campus',                      cat:'clothing', price:249.99, img:'https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=400&q=80', colours:['white','navy','black','burgundy','grey'], sizes:['XS','S','M','L','XL'],    ship:50, rating:4.5 },
  { vi:2, name:'Gym Leggings Women',     desc:'High-waist compression leggings — workout ready',                 cat:'clothing', price:279.99, img:'https://images.unsplash.com/photo-1616699002805-3e6a6c4b8dae?w=400&q=80', colours:['black','navy','grey','olive'],         sizes:['XS','S','M','L','XL'],       ship:50, rating:4.7 },
  { vi:2, name:'Backpack 30L',           desc:'Durable 15.6" laptop backpack — carry everything',                cat:'clothing', price:399.99, img:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80', colours:['black','navy','grey','olive'],         sizes:['30L'],                        ship:60, rating:4.8 },
  { vi:2, name:'Rain Jacket',            desc:'Packable waterproof jacket — never be caught in the rain',        cat:'clothing', price:479.99, img:'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80', colours:['black','navy','olive','red'],          sizes:['XS','S','M','L','XL'],       ship:60, rating:4.6 },
  { vi:2, name:'Ankle Socks 6-pack',     desc:'Cotton ankle socks 6-pair multi-pack',                            cat:'clothing', price:99.99,  img:'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400&q=80', colours:['white','black','grey'],                sizes:['36-40','41-45'],             ship:30, rating:4.2 },
  { vi:2, name:'Floral Summer Dress',    desc:'Lightweight floral midi dress — vibrant and breezy',              cat:'clothing', price:329.99, img:'https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=400&q=80', colours:['white','blue','pink','yellow'],        sizes:['XS','S','M','L','XL'],       ship:50, rating:4.5 },
  { vi:2, name:'Track Pants',            desc:'Cotton jogger track pants — comfortable study or gym wear',       cat:'clothing', price:229.99, img:'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=400&q=80', colours:['black','grey','navy'],                 sizes:['XS','S','M','L','XL','XXL'], ship:50, rating:4.4 },

  // ── ELECTRONICS & DATA (TechNest) ────────────────────────────
  { vi:3, name:'Wireless Earbuds',         desc:'True wireless earbuds — 24hr battery + charging case',          cat:'electronics', price:699.99, img:'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&q=80', colours:['black','white'],    sizes:[],          ship:80, rating:4.6 },
  { vi:3, name:'USB-C Charger 65W',        desc:'GaN fast charger — charges laptop and phone simultaneously',    cat:'electronics', price:249.99, img:'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=400&q=80', colours:['white','black'],    sizes:['65W'],     ship:50, rating:4.7 },
  { vi:3, name:'Power Bank 20000mAh',      desc:'Dual-output power bank — never run out of battery',             cat:'electronics', price:449.99, img:'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&q=80', colours:['black','white'],    sizes:['20000mAh'],ship:60, rating:4.8 },
  { vi:3, name:'Data SIM — 10GB Vodacom', desc:'Prepaid Vodacom 10GB data bundle — 30-day validity',             cat:'data',        price:149.99, img:'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400&q=80', colours:[],                   sizes:['10GB'],    ship:0,  rating:4.5 },
  { vi:3, name:'Data SIM — 5GB MTN',      desc:'MTN 5GB prepaid data bundle — great value',                      cat:'data',        price:89.99,  img:'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80', colours:[],                   sizes:['5GB'],     ship:0,  rating:4.3 },
  { vi:3, name:'Wired Earphones USB-C',   desc:'JBL Tune 310C USB-C wired earphones — great sound',              cat:'electronics', price:299.99, img:'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&q=80', colours:['black','white','blue'], sizes:[],        ship:50, rating:4.5 },
  { vi:3, name:'LED Desk Lamp',           desc:'Dimmable USB-powered study lamp — eye-care mode',                 cat:'electronics', price:189.99, img:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', colours:['white','black'],    sizes:[],          ship:60, rating:4.4 },
  { vi:3, name:'Laptop Stand',            desc:'Adjustable aluminium riser — better posture, less neck pain',    cat:'electronics', price:349.99, img:'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&q=80', colours:['silver','black'],   sizes:[],          ship:60, rating:4.6 },
  { vi:3, name:'Airtime R100 Vodacom',    desc:'R100 Vodacom airtime voucher code — instant delivery',           cat:'data',        price:100.00, img:'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400&q=80', colours:[],                   sizes:[],          ship:0,  rating:4.9 },
  { vi:3, name:'Wireless Mouse',          desc:'Logitech M185 wireless mouse — reliable 12-month battery',       cat:'electronics', price:279.99, img:'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80', colours:['black','blue','red'],sizes:[],          ship:50, rating:4.7 },

  // ── TOILETRIES & HEALTH (PharmaPlus) ─────────────────────────
  { vi:4, name:'Shampoo 400ml',            desc:'TRESemmé Keratin Smooth shampoo — silky results',               cat:'toiletries', price:79.99,  img:'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&q=80', colours:[], sizes:['400ml'],      ship:25, rating:4.4 },
  { vi:4, name:'Conditioner 400ml',        desc:'TRESemmé Keratin Smooth conditioner',                            cat:'toiletries', price:79.99,  img:'https://images.unsplash.com/photo-1526290766257-c4f40e04c515?w=400&q=80', colours:[], sizes:['400ml'],      ship:25, rating:4.3 },
  { vi:4, name:'Dove Bar Soap 6-pack',     desc:'Dove moisturising soap 6x90g — gentle on skin',                 cat:'toiletries', price:64.99,  img:'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=400&q=80', colours:[], sizes:['6x90g'],      ship:20, rating:4.6 },
  { vi:4, name:'Deodorant Roll-on',        desc:'Sure Maximum Protection deodorant — 72hr protection',            cat:'toiletries', price:49.99,  img:'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&q=80', colours:[], sizes:['50ml'],       ship:20, rating:4.4 },
  { vi:4, name:'Toothbrush & Paste Combo', desc:'Oral-B brush + Colgate 75ml — complete oral care',              cat:'toiletries', price:59.99,  img:'https://images.unsplash.com/photo-1559304822-9eb2813b7a68?w=400&q=80', colours:[], sizes:[],             ship:20, rating:4.5 },
  { vi:4, name:'Vitamin C 1000mg x30',     desc:'Ester-C vitamin C 30 tabs — boost your immunity',               cat:'toiletries', price:89.99,  img:'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80', colours:[], sizes:['30 tabs'],    ship:20, rating:4.7 },
  { vi:4, name:'Hand Cream 100ml',         desc:'Neutrogena Norwegian Formula — intense hand repair',             cat:'toiletries', price:69.99,  img:'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80', colours:[], sizes:['100ml'],      ship:20, rating:4.6 },
  { vi:4, name:'Sanitary Pads 14-pack',    desc:'Always Ultra Thin wings 14-pack — reliable protection',          cat:'toiletries', price:54.99,  img:'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80', colours:[], sizes:['14-pack'],    ship:20, rating:4.8 },
  { vi:4, name:'Paracetamol 500mg x20',    desc:'Panado tablets 20-pack — fast headache & pain relief',          cat:'toiletries', price:24.99,  img:'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80', colours:[], sizes:['20 tabs'],    ship:20, rating:4.7 },
  { vi:4, name:'Multivitamin Gummies x30', desc:'Centrum gummy vitamins — tasty daily health boost',              cat:'toiletries', price:109.99, img:'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&q=80', colours:[], sizes:['30 gummies'], ship:20, rating:4.5 },
  { vi:4, name:'Body Lotion 400ml',        desc:'Vaseline cocoa radiant lotion — deep moisture',                  cat:'toiletries', price:69.99,  img:'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80', colours:[], sizes:['400ml'],      ship:20, rating:4.6 },
];

async function seed() {
  console.log('🌱 Seeding CampusShopper v2...\n');

  // Clear existing data
  console.log('Clearing old data...');
  await fetch(`${SUPABASE_URL}/rest/v1/products?id=neq.00000000-0000-0000-0000-000000000000`, {
    method: 'DELETE', headers: { ...headers, 'Prefer': '' },
  });
  await fetch(`${SUPABASE_URL}/rest/v1/vendors?id=neq.00000000-0000-0000-0000-000000000000`, {
    method: 'DELETE', headers: { ...headers, 'Prefer': '' },
  });

  // Insert vendors
  console.log('Inserting vendors...');
  const insertedVendors = await api('/vendors', 'POST', vendors);
  console.log(`✅ ${insertedVendors.length} vendors inserted`);
  const vendorIds = insertedVendors.map(v => v.id);

  // Build products with image_url
  const products = productTemplates.map(t => ({
    vendor_id: vendorIds[t.vi],
    name: t.name,
    description: t.desc,
    category: t.cat,
    price_zar: t.price,
    image_url: t.img,
    colours: t.colours,
    sizes: t.sizes,
    shipping_cost_zar: t.ship,
    rating: t.rating,
    stock_count: Math.floor(Math.random() * 50) + 10,
    is_active: true,
  }));

  console.log('Inserting products with images...');
  const insertedProducts = await api('/products', 'POST', products);
  console.log(`✅ ${insertedProducts.length} products inserted with images`);

  console.log('\n🎉 Seed complete! Visit http://localhost:3000');
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
