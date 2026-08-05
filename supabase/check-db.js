const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://czzlkgnekogmltbhzhvq.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const headers = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Prefer': 'count=exact',
};

const tables = ['vendors', 'products', 'profiles', 'preferences', 'favourites', 'purchases', 'searches'];

async function check() {
  console.log('📊 Database health check:\n');
  for (const table of tables) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count`, { headers });
      const count = res.headers.get('content-range') || '?';
      const status = res.ok ? '✅' : '❌';
      console.log(`  ${status} ${table.padEnd(12)} ${res.status === 200 ? count.split('/')[1] + ' rows' : 'ERROR ' + res.status}`);
    } catch (e) {
      console.log(`  ❌ ${table.padEnd(12)} ${e.message}`);
    }
  }
  console.log('\n✅ DB check complete');
}

check();
