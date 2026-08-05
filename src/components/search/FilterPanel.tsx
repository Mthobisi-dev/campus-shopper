'use client';

import { useState, useCallback } from 'react';
import { SearchFilters, CATEGORY_LABELS, COLOURS } from '@/types';
import { formatZAR } from '@/lib/utils';
import {
  SlidersHorizontal, X, ChevronDown, ChevronUp, Filter,
} from 'lucide-react';

const VENDOR_OPTIONS = [
  { id: '__freshkart', name: 'FreshKart' },
  { id: '__campusbooks', name: 'CampusBooks' },
  { id: '__urbanthreads', name: 'UrbanThreads' },
  { id: '__technest', name: 'TechNest' },
  { id: '__pharmaplus', name: 'PharmaPlus' },
];

const COLOUR_HEX: Record<string, string> = {
  black: '#000000', white: '#f8fafc', grey: '#6b7280',
  navy: '#1e3a5f', blue: '#3b82f6', red: '#ef4444', green: '#22c55e',
  olive: '#6b7028', yellow: '#eab308', pink: '#ec4899', orange: '#f97316',
  purple: '#a855f7', maroon: '#7f1d1d', burgundy: '#6b1f2e', khaki: '#c3b082',
  silver: '#d1d5db', gold: '#f59e0b', brown: '#92400e',
};

interface FilterPanelProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  resultCount: number;
  vendorIds?: { id: string; name: string }[];
}

export default function FilterPanel({
  filters,
  onChange,
  resultCount,
  vendorIds = VENDOR_OPTIONS,
}: FilterPanelProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    sort: true, price: true, colour: false, shipping: false, distance: false, category: false,
  });

  function toggleSection(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleColour(c: string) {
    const current = filters.colours || [];
    onChange({
      ...filters,
      colours: current.includes(c) ? current.filter((x) => x !== c) : [...current, c],
    });
  }

  function clearAll() {
    onChange({ sortBy: 'recommended' });
  }

  const hasActiveFilters =
    filters.colours?.length ||
    filters.maxPrice ||
    filters.minPrice ||
    filters.maxShipping !== undefined ||
    filters.maxDistance !== undefined ||
    filters.category;

  const FilterSection = ({ title, sectionKey, children }: { title: string; sectionKey: string; children: React.ReactNode }) => (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between py-3 text-sm font-medium hover:text-foreground text-muted-foreground transition-colors"
      >
        {title}
        {expanded[sectionKey] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {expanded[sectionKey] && <div className="pb-4">{children}</div>}
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        id="filter-toggle"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary border border-border text-sm font-medium hover:border-white/10 transition-all relative"
      >
        <Filter className="w-4 h-4" />
        Filters
        {hasActiveFilters && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-xs text-white flex items-center justify-center">
            !
          </span>
        )}
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative ml-auto w-80 max-w-full h-full bg-card border-l border-border overflow-y-auto animate-slide-in">
            {/* Header */}
            <div className="sticky top-0 bg-card z-10 p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters & Sort
                </h3>
                <p className="text-xs text-muted-foreground">{resultCount} results</p>
              </div>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button onClick={clearAll} className="text-xs text-primary hover:underline">
                    Clear all
                  </button>
                )}
                <button
                  id="filter-close"
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-0">
              {/* Sort */}
              <FilterSection title="Sort by" sectionKey="sort">
                <div className="space-y-1">
                  {[
                    { val: 'recommended', label: '⭐ Recommended' },
                    { val: 'price_asc', label: '💰 Price: Low → High' },
                    { val: 'price_desc', label: '💰 Price: High → Low' },
                    { val: 'rating', label: '⭐ Highest Rated' },
                    { val: 'distance', label: '📍 Nearest First' },
                  ].map(({ val, label }) => (
                    <button
                      key={val}
                      id={`sort-${val}`}
                      onClick={() => onChange({ ...filters, sortBy: val as SearchFilters['sortBy'] })}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        filters.sortBy === val
                          ? 'bg-primary/20 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Category */}
              <FilterSection title="Category" sectionKey="category">
                <div className="space-y-1">
                  {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => onChange({ ...filters, category: val === 'all' ? undefined : val })}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        (val === 'all' && !filters.category) || filters.category === val
                          ? 'bg-primary/20 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Price Range */}
              <FilterSection title="Price Range" sectionKey="price">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Min price</label>
                      <input
                        id="filter-min-price"
                        type="number"
                        placeholder="R0"
                        value={filters.minPrice || ''}
                        onChange={(e) => onChange({ ...filters, minPrice: Number(e.target.value) || undefined })}
                        className="input-field text-sm py-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Max price</label>
                      <input
                        id="filter-max-price"
                        type="number"
                        placeholder="Any"
                        value={filters.maxPrice || ''}
                        onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) || undefined })}
                        className="input-field text-sm py-2"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[100, 200, 500, 1000].map((p) => (
                      <button
                        key={p}
                        onClick={() => onChange({ ...filters, maxPrice: p })}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                          filters.maxPrice === p
                            ? 'bg-primary/20 border-primary/50 text-primary'
                            : 'border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Under {formatZAR(p)}
                      </button>
                    ))}
                  </div>
                </div>
              </FilterSection>

              {/* Colours */}
              <FilterSection title="Colour" sectionKey="colour">
                <div className="flex flex-wrap gap-2.5">
                  {COLOURS.map((c) => (
                    <button
                      key={c}
                      title={c}
                      onClick={() => toggleColour(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
                        filters.colours?.includes(c)
                          ? 'border-primary ring-2 ring-primary/40 scale-110'
                          : 'border-white/20'
                      }`}
                      style={{ backgroundColor: COLOUR_HEX[c] || '#888' }}
                    />
                  ))}
                </div>
                {filters.colours && filters.colours.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Selected: {filters.colours.join(', ')}
                  </p>
                )}
              </FilterSection>

              {/* Shipping */}
              <FilterSection title="Max Shipping Cost" sectionKey="shipping">
                <div className="space-y-2">
                  {[0, 30, 50, 100].map((s) => (
                    <button
                      key={s}
                      onClick={() => onChange({ ...filters, maxShipping: s === 0 ? 0 : s })}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        filters.maxShipping === s
                          ? 'bg-primary/20 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      {s === 0 ? '🚚 Free shipping only' : `Up to ${formatZAR(s)}`}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Distance */}
              <FilterSection title="Max Distance" sectionKey="distance">
                <div className="space-y-2">
                  {[5, 10, 25, 50].map((d) => (
                    <button
                      key={d}
                      onClick={() => onChange({ ...filters, maxDistance: d })}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        filters.maxDistance === d
                          ? 'bg-primary/20 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      Within {d} km
                    </button>
                  ))}
                </div>
              </FilterSection>
            </div>

            {/* Apply */}
            <div className="sticky bottom-0 p-4 bg-card border-t border-border">
              <button
                id="filter-apply"
                onClick={() => setOpen(false)}
                className="btn-primary w-full"
              >
                Show {resultCount} results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
