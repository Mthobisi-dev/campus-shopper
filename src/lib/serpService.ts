// ============================================================
// SerpApi Integration Service
// Fetches live real-world products and prices from South African merchants
// ============================================================
import { Product } from '@/types';

const SERPAPI_KEY = process.env.SERPAPI_KEY || '93e333f9009775bec00b07ac789c917cb8d76a4a7ef8ba49e7e37d2f3e3346ac';

export async function fetchSerpProducts(query: string, maxPrice?: number): Promise<Product[]> {
  try {
    const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(
      query
    )}&location=${encodeURIComponent('Durban, KwaZulu-Natal, South Africa')}&google_domain=google.co.za&gl=za&hl=en&api_key=${SERPAPI_KEY}`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];

    const data = await res.json();
    const shoppingResults = data.shopping_results || [];

    const products: Product[] = shoppingResults.map((item: any, index: number) => {
      // Parse price string (e.g. "R 219,00" or "R 3 500,00") into numeric float
      let price = 0;
      if (item.extracted_price) {
        price = item.extracted_price;
      } else if (item.price) {
        const clean = item.price.replace(/[^\d.,]/g, '').replace(/\s+/g, '').replace(',', '.');
        price = parseFloat(clean) || 0;
      }

      const merchant = item.source || item.merchant || 'Durban Retailer';
      const category = detectCategoryFromTitle(item.title || query);

      return {
        id: `serp_${item.product_id || index}_${Date.now()}`,
        vendor_id: `v_serp_${merchant.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        name: item.title || 'Product',
        description: item.snippet || `Available from ${merchant} in South Africa`,
        category,
        price_zar: price,
        image_url: item.thumbnail || null,
        product_url: item.link || item.product_link || null,
        merchant_name: merchant,
        colours: extractColoursFromTitle(item.title || ''),
        sizes: [],
        shipping_cost_zar: item.delivery_price ? parseFloat(item.delivery_price.replace(/[^\d.]/g, '')) || 0 : 0,
        rating: item.rating ? Number(item.rating) : 4.5,
        stock_count: 50,
        is_active: true,
        is_serp_result: true,
        created_at: new Date().toISOString(),
        vendor: {
          id: `v_serp_${merchant.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          name: merchant,
          category,
          lat: -29.8587 + (Math.random() - 0.5) * 0.1,
          lng: 31.0218 + (Math.random() - 0.5) * 0.1,
          suburb: 'Durban',
          city: 'Durban',
          logo_url: null,
          created_at: new Date().toISOString(),
        },
      };

    });

    if (maxPrice && maxPrice > 0) {
      return products.filter((p) => p.price_zar <= maxPrice);
    }

    return products;
  } catch (err) {
    console.error('SerpApi fetch error:', err);
    return [];
  }
}

function detectCategoryFromTitle(title: string): Product['category'] {
  const lower = title.toLowerCase();
  if (/\b(food|rice|bread|milk|eggs|chicken|pasta|oats|coffee|tea|oil|cereal|snack|beans)\b/.test(lower)) return 'groceries';
  if (/\b(shirt|hoodie|jacket|pants|jeans|dress|shoes|sneakers|shorts|beanie|socks|tee|wear)\b/.test(lower)) return 'clothing';
  if (/\b(book|textbook|pen|notebook|calculator|highlighter|stationery|paper)\b/.test(lower)) return 'textbooks';
  if (/\b(phone|laptop|earbuds|earphones|charger|power bank|mouse|lamp|usb|gadget)\b/.test(lower)) return 'electronics';
  if (/\b(data|airtime|sim|bundle)\b/.test(lower)) return 'data';
  return 'toiletries';
}

function extractColoursFromTitle(title: string): string[] {
  const lower = title.toLowerCase();
  const known = ['black', 'white', 'grey', 'navy', 'blue', 'red', 'green', 'olive', 'yellow', 'pink', 'orange', 'purple', 'maroon', 'gold', 'silver', 'brown'];
  return known.filter((c) => lower.includes(c));
}
