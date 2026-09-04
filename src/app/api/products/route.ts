import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/admin';
import { fetchSerpProducts } from '@/lib/serpService';

export const dynamic = 'force-dynamic';

// Normalize any product (DB view or SerpAPI) to safe types
function normalizeProduct(p: any) {
  return {
    ...p,
    colours:           Array.isArray(p.colours) ? p.colours : [],
    sizes:             Array.isArray(p.sizes)   ? p.sizes   : [],
    price_zar:         Number(p.price_zar)         || 0,
    shipping_cost_zar: Number(p.shipping_cost_zar) || 0,
    rating:            Number(p.rating)            || 3,
    category:          p.category  || 'groceries',
    name:              p.name      || 'Unknown Product',
    // Ensure vendor is an object if it came as a JSON string from the view
    vendor: typeof p.vendor === 'string' ? JSON.parse(p.vendor) : (p.vendor || null),
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q           = searchParams.get('q') || '';
  const category    = searchParams.get('category');
  const maxPrice    = searchParams.get('maxPrice')    ? parseFloat(searchParams.get('maxPrice')!)    : undefined;
  const minPrice    = searchParams.get('minPrice')    ? parseFloat(searchParams.get('minPrice')!)    : undefined;
  const maxShipping = searchParams.get('maxShipping') ? parseFloat(searchParams.get('maxShipping')!) : undefined;
  const limit       = Math.min(parseInt(searchParams.get('limit') || '60'), 120);

  // ── Query the 4NF view v_products (colours+sizes already aggregated) ──
  let query = supabase
    .from('v_products')          // <-- uses the 4NF view
    .select('*')
    .eq('is_active', true);

  if (category && category !== 'all') query = query.eq('category', category);
  if (maxPrice   !== undefined)        query = query.lte('price_zar', maxPrice);
  if (minPrice   !== undefined)        query = query.gte('price_zar', minPrice);
  if (maxShipping !== undefined)       query = query.lte('shipping_cost_zar', maxShipping);

  // Text search — uses trigram GIN index via ilike (fast on indexed columns)
  if (q.trim()) {
    const terms = q.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
    if (terms.length > 0) {
      const orClauses = terms
        .flatMap((t) => [
          `name.ilike.%${t}%`,
          `description.ilike.%${t}%`,
          `category.ilike.%${t}%`,
        ])
        .join(',');
      query = query.or(orClauses);
    }
  }

  const { data: dbProducts, error } = await query.limit(limit);

  if (error) {
    console.error('v_products query error:', error.message);
  }

  let combined = (dbProducts || []).map(normalizeProduct);

  // ── Merge live SerpAPI results ────────────────────────────────
  if (q.trim()) {
    try {
      const serpItems = await fetchSerpProducts(q, maxPrice);
      combined = [...combined, ...serpItems.map(normalizeProduct)];
    } catch (err) {
      console.error('SerpApi error:', err);
    }
  }

  return NextResponse.json({ products: combined, count: combined.length });
}
