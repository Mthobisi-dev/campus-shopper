// ============================================================
// Recommendation engine — weighted scoring
// No ML, just a fast weighted formula
// ============================================================
import { Product, Preferences, Purchase } from '@/types';

interface RecommendationContext {
  remainingBudget: number;
  preferences: Preferences | null;
  purchases: Purchase[];
  searchQuery?: string;
  studentLat?: number;
  studentLng?: number;
}

// Safely normalize any array-or-null field to an actual array
function safeArr(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
}

// Safely get a numeric field
function safeNum(val: any, fallback = 0): number {
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

export function scoreProduct(
  product: Product,
  ctx: RecommendationContext
): number {
  let score = 0;

  // Defensive normalization — SerpAPI results can have undefined/null fields
  const colours  = safeArr(product.colours);
  const sizes    = safeArr(product.sizes);
  const unitPrice = safeNum(product.price_zar);
  const shipping  = safeNum(product.shipping_cost_zar);
  const rating    = safeNum(product.rating, 3);
  const totalCost = unitPrice + shipping;

  // 1. Budget fit (30%)
  const budget = safeNum(ctx.remainingBudget, 1500);
  const budgetFit =
    budget <= 0
      ? 0
      : totalCost <= budget
      ? 1
      : Math.max(0, 1 - (totalCost - budget) / budget);
  score += 0.3 * budgetFit;

  // 2. Preference match (20%)
  if (ctx.preferences) {
    let prefScore = 0;
    let prefCount = 0;

    const favColours = safeArr(ctx.preferences.fav_colours);
    const favSizes   = safeArr(ctx.preferences.fav_sizes);
    const favVendors = safeArr((ctx.preferences as any).fav_vendors);

    // Colour match
    if (favColours.length > 0 && colours.length > 0) {
      prefScore += colours.some((c) => favColours.includes(c)) ? 1 : 0;
      prefCount++;
    }

    // Size match
    if (favSizes.length > 0 && sizes.length > 0) {
      prefScore += sizes.some((s) => favSizes.includes(s)) ? 1 : 0;
      prefCount++;
    }

    // Vendor match
    if (favVendors.length > 0 && product.vendor_id) {
      prefScore += favVendors.includes(product.vendor_id) ? 1 : 0;
      prefCount++;
    }

    // AI Persona keyword match boost
    const aiPersona: string = (ctx.preferences as any).ai_persona_summary || '';
    if (aiPersona) {
      const summaryLower = aiPersona.toLowerCase();
      const nameLower    = (product.name || '').toLowerCase();
      const catLower     = (product.category || '').toLowerCase();
      if (summaryLower.includes(catLower) || summaryLower.includes(nameLower)) {
        prefScore += 1;
        prefCount++;
      }
    }

    score += 0.2 * (prefCount > 0 ? prefScore / prefCount : 0.5);
  } else {
    score += 0.1;
  }

  // 3. Category affinity from purchase history (20%)
  const purchases = safeArr(ctx.purchases);
  if (purchases.length > 0) {
    const categoryCounts: Record<string, number> = {};
    purchases.forEach((p) => {
      if (p?.category) categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });
    const values = Object.values(categoryCounts);
    const maxCount = values.length > 0 ? Math.max(...values) : 0;
    const productCategoryCount = categoryCounts[product.category] || 0;
    const affinity = maxCount > 0 ? productCategoryCount / maxCount : 0;
    score += 0.2 * affinity;
  } else {
    score += 0.1;
  }

  // 4. Rating (15%)  normalise 1–5 → 0–1
  const ratingScore = (Math.min(5, Math.max(1, rating)) - 1) / 4;
  score += 0.15 * ratingScore;

  // 5. Distance (10%)
  const maxDist = safeNum((ctx.preferences as any)?.max_distance_km, 50) || 50;
  if (product.distance_km !== undefined && product.distance_km !== null) {
    const distScore = Math.max(0, 1 - product.distance_km / maxDist);
    score += 0.1 * distScore;
  } else {
    score += 0.05;
  }

  // 6. Shipping cost penalty (5%)
  const shipScore = Math.max(0, 1 - shipping / 100);
  score += 0.05 * shipScore;

  return Math.min(1, Math.max(0, score));
}

export function rankProducts(
  products: Product[],
  ctx: RecommendationContext
): Product[] {
  if (!Array.isArray(products) || products.length === 0) return [];
  return products
    .map((p) => {
      try {
        return { ...p, score: scoreProduct(p, ctx) };
      } catch {
        return { ...p, score: 0 };
      }
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}
