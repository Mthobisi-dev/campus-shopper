'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { formatZAR } from '@/lib/utils';
import ProductCard from '@/components/product/ProductCard';
import { Heart, Loader2, Trash2 } from 'lucide-react';
import { getOrCreateUserId } from '@/lib/userSession';

export default function FavouritesPage() {
  const [favourites, setFavourites] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [remainingBudget, setRemainingBudget] = useState(1500);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadFavourites(); }, []);

  async function loadFavourites() {
    setLoading(true);
    try {
      const userId = await getOrCreateUserId();
      const [favRes, profRes, purchRes] = await Promise.all([
        fetch(`/api/favourites?userId=${userId}`),
        fetch(`/api/profile?userId=${userId}`),
        fetch(`/api/purchases?userId=${userId}`),
      ]);

      if (favRes.ok) {
        const data = await favRes.json();
        setFavourites(data.favourites || []);
      }

      if (profRes.ok) {
        const pData = await profRes.json();
        setProfile(pData.profile);
      }

      if (purchRes.ok) {
        const purData = await purchRes.json();
        setRemainingBudget(purData.remainingBudget !== undefined ? purData.remainingBudget : 1500);
      }
    } catch (err) {
      console.error('Error loading favourites:', err);
    } finally {
      setLoading(false);
    }
  }

  async function removeAll() {
    const userId = await getOrCreateUserId();
    await fetch(`/api/favourites?userId=${userId}`, { method: 'DELETE' });
    setFavourites([]);
  }

  function handleBuy(product: Product) {
    setRemainingBudget((prev) => +(prev - product.price_zar - product.shipping_cost_zar).toFixed(2));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-400 fill-red-400" />
            Saved Items
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{favourites.length} saved product{favourites.length !== 1 ? 's' : ''}</p>
        </div>
        {favourites.length > 0 && (
          <button
            id="clear-favourites"
            onClick={removeAll}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear all
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      ) : favourites.length === 0 ? (
        <div className="text-center py-20 glass-card">
          <div className="text-6xl mb-4">💔</div>
          <h3 className="font-semibold mb-2 text-base">No saved items yet</h3>
          <p className="text-sm text-muted-foreground">Tap the heart icon on any product to save it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {favourites.map((fav) =>
            fav.product ? (
              <ProductCard
                key={fav.id}
                product={fav.product}
                studentLat={profile?.lat}
                studentLng={profile?.lng}
                initialFav={true}
                remainingBudget={remainingBudget}
                onBuy={handleBuy}
                onFavouriteToggle={(id, isFav) => {
                  if (!isFav) setFavourites((prev) => prev.filter((f) => f.product?.id !== id));
                }}
              />
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
