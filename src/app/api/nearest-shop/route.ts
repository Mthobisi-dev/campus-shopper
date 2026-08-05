import { NextRequest, NextResponse } from 'next/server';
import { SUBURB_COORDS } from '@/types';
import { getDistanceMatrix } from '@/lib/locationService';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const suburb = searchParams.get('suburb') || 'Glenwood';

  const origin = SUBURB_COORDS[suburb] || { lat: -29.8650, lng: 30.9822 };

  // Fetch all Durban vendors
  const { data: vendors } = await supabase.from('vendors').select('*');

  if (!vendors || vendors.length === 0) {
    return NextResponse.json({ nearest: null, vendors: [] });
  }

  // Calculate driving/walking routes using OpenRouteService API
  const destinations = vendors.map((v) => ({ lat: v.lat, lng: v.lng }));
  const routes = await getDistanceMatrix(origin, destinations);

  const annotatedVendors = vendors.map((v, i) => ({
    ...v,
    distanceKm: routes[i]?.distanceKm ?? 0,
    durationMins: routes[i]?.durationMins ?? 0,
  }));

  // Sort by nearest distance
  annotatedVendors.sort((a, b) => a.distanceKm - b.distanceKm);

  return NextResponse.json({
    studentSuburb: suburb,
    nearestShop: annotatedVendors[0] || null,
    vendors: annotatedVendors,
  });
}
