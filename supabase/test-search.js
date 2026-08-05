const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://czzlkgnekogmltbhzhvq.supabase.co';
const ANON_KEY = 'sb_publishable_wqTqgq7G6puKMum2Tt5fLg_koxrKzQf';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function testSearch(q) {
  console.log(`\nTesting search for: "${q}"`);

  // Test 1: Fetch all active products
  const { data: allProds, error: allErr } = await supabase
    .from('products')
    .select('*, vendor:vendors(*)')
    .eq('is_active', true);

  console.log('Total active products in DB:', allProds ? allProds.length : 'ERROR:', allErr);

  // Test 2: Search with text
  const terms = q.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(t => t.length > 1);
  console.log('Cleaned search terms:', terms);

  if (terms.length > 0) {
    const clauses = terms.flatMap(t => [`name.ilike.%${t}%`, `description.ilike.%${t}%`, `category.ilike.%${t}%`]).join(',');
    const { data: searchProds, error: searchErr } = await supabase
      .from('products')
      .select('*, vendor:vendors(*)')
      .eq('is_active', true)
      .or(clauses);

    if (searchErr) {
      console.log('❌ Search error:', searchErr);
    } else {
      console.log(`✅ Matches found: ${searchProds.length}`);
      searchProds.slice(0, 3).forEach(p => console.log(`  - ${p.name} (R${p.price_zar}) [${p.category}]`));
    }
  }
}

testSearch('jacket').then(() => testSearch('winter jacket under R500')).catch(console.error);
