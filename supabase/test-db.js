const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://czzlkgnekogmltbhzhvq.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function test() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
  });
  const openapi = await res.json();
  console.log('Available tables/endpoints in OpenAPI spec:');
  console.log(Object.keys(openapi.definitions || {}));
}

test().catch(console.error);
