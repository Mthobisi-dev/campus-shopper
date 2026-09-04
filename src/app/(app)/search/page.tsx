'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Product, SearchFilters, Profile, Preferences, Purchase } from '@/types';
import { haversineKm } from '@/lib/distance';
import { rankProducts } from '@/lib/recommendation';
import { parseQueryWithGemini } from '@/lib/nlParser';
import ProductCard from '@/components/product/ProductCard';
import FilterPanel from '@/components/search/FilterPanel';
import { Search, Sparkles, Loader2, X, Mic, TrendingUp } from 'lucide-react';
import { getOrCreateUserId } from '@/lib/userSession';

const QUICK_SEARCHES = [
  'winter jacket under R500',
  'textbook stationery',
  'groceries for the week',
  'earphones for studying',
  'toiletries and soap',
  'affordable data bundle',
];

export default function SearchPage() {
  const supabase = createClient();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [allResults, setAllResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({ sortBy: 'recommended' });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());
  const [remainingBudget, setRemainingBudget] = useState(1500);
  const [nlParsing, setNlParsing] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const userId = await getOrCreateUserId();
      const [profRes, favRes, purchRes] = await Promise.all([
        fetch(`/api/profile?userId=${userId}`),
        fetch(`/api/favourites?userId=${userId}`),
        fetch(`/api/purchases?userId=${userId}`),
      ]);

      if (profRes.ok) {
        const pData = await profRes.json();
        if (pData.profile) setProfile(pData.profile);
        if (pData.preferences) setPreferences(pData.preferences);
      }

      if (favRes.ok) {
        const fData = await favRes.json();
        const fSet = new Set<string>((fData.favourites || []).map((f: any) => f.product_id || f.product?.id));
        setFavouriteIds(fSet);
      }

      if (purchRes.ok) {
        const purData = await purchRes.json();
        setPurchases(purData.purchases || []);
        if (purData.remainingBudget !== undefined) {
          setRemainingBudget(purData.remainingBudget);
        }
      }
    } catch (err) {
      console.error('Error loading search page user data:', err);
    }
  }

  async function handleSearch(searchQuery?: string) {
    const q = (searchQuery || query).trim();
    if (!q) return;

    setLoading(true);
    setSearched(true);
    setNlParsing(true);

    // Parse query with Gemini (or local fallback)
    const parsed = await parseQueryWithGemini(q);
    setNlParsing(false);

    // Build URL search parameters for our products API
    const params = new URLSearchParams();
    params.set('q', q);
    if (parsed.category) params.set('category', parsed.category);
    if (parsed.maxPrice) params.set('maxPrice', parsed.maxPrice.toString());
    if (parsed.minPrice) params.set('minPrice', parsed.minPrice.toString());

    let products: Product[] = [];
    try {
      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        products = data.products || [];
      }
    } catch (err) {
      console.error('Error searching products:', err);
    }

    // Fallback: If strict category/price filters returned 0 items, search broadly across all products
    if (products.length === 0) {
      try {
        const fallbackRes = await fetch(`/api/products?q=${encodeURIComponent(q)}`);
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          products = fallbackData.products || [];
        }
      } catch (err) {
        console.error('Fallback search error:', err);
      }
    }

    // Annotate with distance
    const annotated: Product[] = products.map((p) => {
      const v = p.vendor as any;
      const dist =
        profile?.lat && profile?.lng && v?.lat && v?.lng
          ? haversineKm(profile.lat, profile.lng, v.lat, v.lng)
          : undefined;
      return { ...p, distance_km: dist };
    });

    setAllResults(annotated);

    // Log the search
    const userId = await getOrCreateUserId();
    fetch('/api/searches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, query: q, resultCount: annotated.length, filters: parsed }),
    }).catch(() => {});

    applyFiltersAndSort(annotated, filters);
    setLoading(false);
  }

  const applyFiltersAndSort = useCallback(
    (products: Product[], currentFilters: SearchFilters) => {
      let filtered = [...products];

      // Apply UI filters
      if (currentFilters.category) {
        filtered = filtered.filter((p) => p.category === currentFilters.category);
      }
      if (currentFilters.maxPrice) {
        filtered = filtered.filter((p) => p.price_zar <= currentFilters.maxPrice!);
      }
      if (currentFilters.minPrice) {
        filtered = filtered.filter((p) => p.price_zar >= currentFilters.minPrice!);
      }
      if (currentFilters.colours && currentFilters.colours.length > 0) {
        filtered = filtered.filter(
          (p) => p.colours.length === 0 || p.colours.some((c) => currentFilters.colours!.includes(c))
        );
      }
      if (currentFilters.maxShipping !== undefined) {
        filtered = filtered.filter((p) => p.shipping_cost_zar <= currentFilters.maxShipping!);
      }
      if (currentFilters.maxDistance !== undefined) {
        filtered = filtered.filter(
          (p) => p.distance_km === undefined || p.distance_km <= currentFilters.maxDistance!
        );
      }

      // Sort
      const sortBy = currentFilters.sortBy || 'recommended';
      if (sortBy === 'recommended') {
        filtered = rankProducts(filtered, {
          remainingBudget,
          preferences,
          purchases,
          studentLat: profile?.lat || undefined,
          studentLng: profile?.lng || undefined,
        });
      } else if (sortBy === 'price_asc') {
        filtered.sort((a, b) => a.price_zar - b.price_zar);
      } else if (sortBy === 'price_desc') {
        filtered.sort((a, b) => b.price_zar - a.price_zar);
      } else if (sortBy === 'rating') {
        filtered.sort((a, b) => b.rating - a.rating);
      } else if (sortBy === 'distance') {
        filtered.sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999));
      }

      setResults(filtered);
    },
    [remainingBudget, preferences, purchases, profile]
  );

  function handleFilterChange(newFilters: SearchFilters) {
    setFilters(newFilters);
    applyFiltersAndSort(allResults, newFilters);
  }

  function handleQuickSearch(q: string) {
    setQuery(q);
    handleSearch(q);
  }

  function handleBuy(product: Product) {
    setRemainingBudget((prev) => prev - product.price_zar - product.shipping_cost_zar);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold gradient-text mb-1">Search</h1>
        <p className="text-sm text-muted-foreground">
          Tell me what you need — I&apos;ll find the best deals in Durban
        </p>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
          {nlParsing ? (
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>
        <input
          ref={searchRef}
          id="main-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={'"affordable winter jacket under R500, dark colours"'}
          className="input-field pl-12 pr-12 py-4 text-base"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setSearched(false); setResults([]); setAllResults([]); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search button + filters */}
      <div className="flex gap-3 mb-6">
        <button
          id="search-submit"
          onClick={() => handleSearch()}
          disabled={loading || !query.trim()}
          className="btn-primary flex items-center gap-2 flex-1"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? 'Searching...' : 'Search'}
        </button>
        {searched && (
          <FilterPanel
            filters={filters}
            onChange={handleFilterChange}
            resultCount={results.length}
          />
        )}
      </div>

      {/* Quick searches */}
      {!searched && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Popular searches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_SEARCHES.map((q) => (
                <button
                  key={q}
                  id={`quick-${q.replace(/\s+/g, '-')}`}
                  onClick={() => handleQuickSearch(q)}
                  className="px-3 py-1.5 rounded-full bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground hover:border-white/10 transition-all duration-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-4 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0" />
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">Powered by Gemini AI</span> — Type naturally! Try{' '}
              <em>&quot;dark hoodie under R400 in my size M&quot;</em> and I&apos;ll understand.
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {searched && (
        <div>
          {/* Result header */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {loading ? 'Searching...' : `${results.length} result${results.length !== 1 ? 's' : ''} found`}
            </p>
            <p className="text-xs text-primary">
              {filters.sortBy === 'recommended' ? '⭐ Ranked for you' : ''}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="skeleton h-80 rounded-2xl" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="font-semibold mb-2">No results found</h3>
              <p className="text-sm text-muted-foreground">
                Try different keywords or adjust your filters
              </p>
              <button
                onClick={() => handleFilterChange({ sortBy: 'recommended' })}
                className="btn-secondary mt-4 inline-flex"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  studentLat={profile?.lat || undefined}
                  studentLng={profile?.lng || undefined}
                  initialFav={favouriteIds.has(product.id)}
                  remainingBudget={remainingBudget}
                  budgetStrictness={(preferences?.ai_survey_answers as any)?.budgetStrictness || 'Strict'}
                  onBuy={handleBuy}
                  onFavouriteToggle={(id, isFav) => {
                    setFavouriteIds((prev) => {
                      const next = new Set(prev);
                      if (isFav) next.add(id); else next.delete(id);
                      return next;
                    });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
