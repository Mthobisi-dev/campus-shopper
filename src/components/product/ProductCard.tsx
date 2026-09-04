'use client';

import { useState } from 'react';
import { Product } from '@/types';
import { formatZAR } from '@/lib/utils';
import { haversineKm, formatDistance } from '@/lib/distance';
import {
  Star, Heart, MapPin, Truck, ShoppingCart, Package,
  Loader2, ExternalLink, ImageOff, CreditCard,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { CATEGORY_ICONS } from '@/types';
import StripeCheckoutModal from '@/components/checkout/StripeCheckoutModal';
import { getOrCreateUserId } from '@/lib/userSession';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: Product;
  remainingBudget?: number;
  budgetStrictness?: string;
  studentLat?: number;
  studentLng?: number;
  initialFav?: boolean;
  onFavouriteToggle?: (id: string, fav: boolean) => void;
  onBuy?: (product: Product) => void;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  groceries:   'from-emerald-900/60 to-green-900/40',
  textbooks:   'from-blue-900/60 to-indigo-900/40',
  clothing:    'from-purple-900/60 to-pink-900/40',
  toiletries:  'from-teal-900/60 to-cyan-900/40',
  electronics: 'from-orange-900/60 to-amber-900/40',
  data:        'from-violet-900/60 to-blue-900/40',
};

const COLOUR_HEX: Record<string, string> = {
  black:'#000',white:'#fff',grey:'#6b7280',navy:'#1e3a5f',blue:'#3b82f6',
  red:'#ef4444',green:'#22c55e',olive:'#6b7028',yellow:'#eab308',pink:'#ec4899',
  orange:'#f97316',purple:'#a855f7',maroon:'#7f1d1d',burgundy:'#6b1f2e',
  khaki:'#c3b082',silver:'#94a3b8',gold:'#f59e0b',brown:'#92400e',
};

export default function ProductCard({
  product,
  remainingBudget,
  budgetStrictness = 'Strict',
  studentLat,
  studentLng,
  initialFav = false,
  onFavouriteToggle,
  onBuy,
}: ProductCardProps) {
  const [isFav, setIsFav] = useState(initialFav);
  const [buying, setBuying] = useState(false);
  const [bought, setBought] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [addedFlash, setAddedFlash] = useState(false);

  // Safely normalize colours & sizes — SerpAPI products may have null/undefined
  const productColours = Array.isArray(product.colours) ? product.colours : [];
  const productSizes   = Array.isArray(product.sizes)   ? product.sizes   : [];
  const [selectedColour, setSelectedColour] = useState(productColours[0] || '');
  const [selectedSize, setSelectedSize] = useState(productSizes[0] || '');

  const { addToCart } = useCart();
  const supabase = createClient();

  // ── Distance from student ──────────────────────────────────
  const distance =
    studentLat && studentLng && product.vendor?.lat && product.vendor?.lng
      ? haversineKm(studentLat, studentLng, product.vendor.lat, product.vendor.lng)
      : null;

  // ── Price + totals ─────────────────────────────────────────
  const unitPrice = Number(product.price_zar) || 0;
  const shipping  = Number(product.shipping_cost_zar) || 0;
  const totalCost = +(unitPrice + shipping).toFixed(2);
  const overBudget = remainingBudget !== undefined && remainingBudget !== null && totalCost > remainingBudget;

  const gradient = CATEGORY_GRADIENTS[product.category] || 'from-gray-900/40 to-slate-900/20';
  const icon     = CATEGORY_ICONS[product.category] || '📦';
  const hasImage = !!(product.image_url && !imgError);

  // ── Add to Cart ────────────────────────────────────────────
  function handleAddToCart(e: React.MouseEvent) {
    e.stopPropagation();
    addToCart(product, selectedColour, selectedSize);
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 1500);
  }

  // ── Save / unsave ──────────────────────────────────────────
  async function handleFavourite(e: React.MouseEvent) {
    e.stopPropagation();
    const next = !isFav;
    setIsFav(next);
    const userId = await getOrCreateUserId();
    await fetch('/api/favourites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, productId: product.id, isFavourite: next }),
    });
    onFavouriteToggle?.(product.id, next);
  }

  // ── Open Stripe Modal (direct buy) ────────────────────────
  function handleOpenCheckout(e: React.MouseEvent) {
    e.stopPropagation();
    if (buying || bought) return;
    setShowStripeModal(true);
  }

  // ── Record purchase after Stripe succeeds ─────────────────
  async function handleStripeSuccess(chargeData: any) {
    setBuying(true);
    try {
      const userId = await getOrCreateUserId();
      await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          productId: product.id,
          productName: product.name,
          vendorName: product.vendor?.name || (product as any).merchant_name || 'Durban Store',
          productImageUrl: product.image_url,
          productUrl: chargeData?.receiptUrl || (product as any).product_url || null,
          category: product.category,
          quantity: 1,
          unitPrice,
          shippingCost: shipping,
          totalZar: totalCost,
        }),
      });
      setBought(true);
      onBuy?.(product);
      setTimeout(() => setBought(false), 3000);
    } catch (err) {
      console.error('Error logging purchase:', err);
    } finally {
      setBuying(false);
    }
  }

  return (
    <>
      <div className="glass-card-hover overflow-hidden animate-fade-in flex flex-col">
        {/* ── Product Image ──────────────────────────────────────── */}
        <div className={`relative h-44 bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
          {hasImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={product.image_url!}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : imgError ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageOff className="w-8 h-8 opacity-40" />
              <span className="text-3xl select-none">{icon}</span>
            </div>
          ) : (
            <span className="text-5xl select-none">{icon}</span>
          )}

          {hasImage && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          )}

          {/* Favourite button */}
          <button
            id={`fav-${product.id}`}
            onClick={handleFavourite}
            aria-label={isFav ? 'Remove from saved' : 'Save product'}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${
              isFav
                ? 'bg-red-500 text-white shadow-red-900/40'
                : 'bg-black/50 text-white/70 hover:text-white hover:bg-black/70'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
          </button>

          {/* Recommendation score badge */}
          {(product as any).score !== undefined && (product as any).score > 0 && (
            <div className="absolute top-3 left-3 bg-primary/80 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
              {Math.round((product as any).score * 100)}% match
            </div>
          )}

          {/* Live / SerpApi badge */}
          {(product as any).is_serp_result && (
            <div className="absolute bottom-3 left-3 bg-blue-500/80 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              🔴 LIVE
            </div>
          )}

          {/* Over budget warning */}
          {overBudget && (
            <div className="absolute bottom-3 right-3 bg-red-500/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Over budget
            </div>
          )}
        </div>

        {/* ── Content ───────────────────────────────────────────── */}
        <div className="p-4 flex flex-col flex-1">
          {/* Name + Price */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2 flex-1">{product.name}</h3>
            <div className="text-right shrink-0 ml-2">
              <div className="text-lg font-bold text-green-400">{formatZAR(unitPrice)}</div>
              {shipping > 0 && (
                <div className="text-[10px] text-muted-foreground">+{formatZAR(shipping)} ship</div>
              )}
            </div>
          </div>

          {/* Vendor */}
          <p className="text-xs text-muted-foreground mb-2">
            {product.vendor?.name || (product as any).merchant_name || 'Durban Retailer'}
            {product.vendor?.suburb && ` · ${product.vendor.suburb}`}
          </p>

          {/* Meta row */}
          <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              {Number(product.rating).toFixed(1)}
            </span>
            {distance !== null && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {formatDistance(distance)}
              </span>
            )}
            {shipping > 0 ? (
              <span className="flex items-center gap-1">
                <Truck className="w-3 h-3" />
                +{formatZAR(shipping)}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-green-400">
                <Truck className="w-3 h-3" />
                Free ship
              </span>
            )}
          </div>

          {/* Total cost summary */}
          <div className={`text-xs rounded-lg px-3 py-2 mb-3 flex justify-between items-center ${
            overBudget
              ? 'bg-red-500/10 border border-red-500/20 text-red-400'
              : 'bg-green-500/10 border border-green-500/20 text-green-400'
          }`}>
            <span className="font-medium">Total cost</span>
            <span className="font-bold">{formatZAR(totalCost)}</span>
          </div>

          {/* Colour swatches */}
          {productColours.length > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              {productColours.slice(0, 7).map((c) => (
                <button
                  key={c}
                  title={c}
                  onClick={() => setSelectedColour(c)}
                  className={`w-5 h-5 rounded-full border-2 transition-all duration-150 hover:scale-110 ${
                    selectedColour === c ? 'border-primary scale-110 shadow-md' : 'border-white/20'
                  }`}
                  style={{ backgroundColor: COLOUR_HEX[c] || '#888' }}
                />
              ))}
              {productColours.length > 7 && (
                <span className="text-xs text-muted-foreground">+{productColours.length - 7}</span>
              )}
            </div>
          )}

          {/* Size pills */}
          {productSizes.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {productSizes.slice(0, 6).map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className={`text-xs px-2 py-0.5 rounded-md border transition-all ${
                    selectedSize === s
                      ? 'bg-primary/20 border-primary/50 text-primary font-medium'
                      : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s}
                </button>
              ))}
              {productSizes.length > 6 && (
                <span className="text-xs text-muted-foreground self-center">+{productSizes.length - 6}</span>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-auto pt-1">
            {/* Add to Cart */}
            <button
              id={`add-cart-${product.id}`}
              onClick={handleAddToCart}
              title="Add to Cart"
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-200 min-h-[40px] ${
                addedFlash
                  ? 'bg-primary/20 border border-primary/50 text-primary'
                  : 'bg-secondary border border-border hover:bg-secondary/80 text-foreground'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">{addedFlash ? 'Added!' : 'Add'}</span>
            </button>

            {/* Direct Stripe Buy */}
            <button
              id={`buy-${product.id}`}
              onClick={handleOpenCheckout}
              disabled={buying}
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-200 min-h-[40px] ${
                bought
                  ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                  : overBudget
                  ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
                  : 'btn-primary'
              }`}
            >
              {buying ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> <span className="truncate">Paying...</span></>
              ) : bought ? (
                <><Package className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Paid!</span></>
              ) : (
                <><CreditCard className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{overBudget ? 'Pay' : formatZAR(totalCost)}</span></>
              )}
            </button>

            {/* View on merchant site */}
            {(product as any).product_url && (
              <a
                href={(product as any).product_url}
                target="_blank"
                rel="noopener noreferrer"
                title="View on merchant site"
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-secondary border border-border hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all shrink-0 min-h-[40px]"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stripe Checkout Modal (direct buy) */}
      <StripeCheckoutModal
        product={product}
        remainingBudget={remainingBudget}
        budgetStrictness={budgetStrictness}
        isOpen={showStripeModal}
        onClose={() => setShowStripeModal(false)}
        onSuccess={handleStripeSuccess}
      />
    </>
  );
}
