const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://czzlkgnekogmltbhzhvq.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const anonClient = createClient(SUPABASE_URL, ANON_KEY);
const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkRLS() {
  const { data: anonData, error: anonErr } = await anonClient.from('products').select('*');
  console.log('Anon client query:', anonData ? `${anonData.length} items` : 'ERR:', anonErr);

  const { data: servData, error: servErr } = await serviceClient.from('products').select('*');
  console.log('Service role query:', servData ? `${servData.length} items` : 'ERR:', servErr);
}

checkRLS();
