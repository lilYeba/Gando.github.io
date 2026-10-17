'use client';

import React, { useState } from 'react';
import {
  Package,
  Milk,
  Apple,
  Beef,
  Croissant,
  Coffee,
  Sparkles,
  Camera,
  ImageOff,
} from 'lucide-react';

export interface ProductImageProps {
  slug?: string;
  categorySlug?: string;
  brand?: string | null;
  packageQuantity?: number;
  packageUnit?: string;
  className?: string;
  imageUrl?: string | null;
  alt?: string;
}

export function ProductImage({
  slug = '',
  categorySlug = '',
  brand = null,
  packageQuantity = 1,
  packageUnit = 'ks',
  className = '',
  imageUrl = null,
  alt = '',
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // If imageUrl was an old SVG mock, treat it as null so clean placeholder or real photo is used
  const isSvgMock = imageUrl?.endsWith('.svg') && imageUrl?.includes('/images/products/');
  const effectiveImageUrl = isSvgMock ? null : imageUrl;

  const isOpenFoodFacts =
    effectiveImageUrl?.includes('openfoodfacts.org') ||
    effectiveImageUrl?.includes('openfoodfacts.net');

  const isLidl =
    effectiveImageUrl?.includes('lidl.sk') ||
    effectiveImageUrl?.includes('lidl.com') ||
    effectiveImageUrl?.includes('lidl-flyer.com') ||
    effectiveImageUrl?.includes('lidl-cdn.net');

  // Choose clean category icon for neutral placeholder
  const getCategoryIcon = () => {
    const s = slug.toLowerCase();
    const c = categorySlug.toLowerCase();

    if (s.includes('maslo') || s.includes('mlieko') || s.includes('syr') || s.includes('jogurt') || s.includes('tvaroh') || s.includes('bryndza') || c.includes('mliecne')) {
      return Milk;
    }
    if (s.includes('kuracie') || s.includes('maso') || s.includes('kare') || s.includes('sunka') || s.includes('parky') || c.includes('maso')) {
      return Beef;
    }
    if (s.includes('banan') || s.includes('brokolica') || s.includes('jablk') || s.includes('paradaj') || s.includes('uhork') || s.includes('zemiak') || c.includes('ovocie')) {
      return Apple;
    }
    if (s.includes('chlieb') || s.includes('bageta') || s.includes('rohl') || c.includes('pecivo')) {
      return Croissant;
    }
    if (s.includes('kava') || s.includes('kofola') || s.includes('vinea') || s.includes('rajec') || s.includes('bazant') || c.includes('napoje')) {
      return Coffee;
    }
    if (s.includes('tento') || s.includes('jar') || c.includes('drogeria')) {
      return Sparkles;
    }
    return Package;
  };

  const CategoryIcon = getCategoryIcon();

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const resolvedImageUrl =
    effectiveImageUrl && effectiveImageUrl.startsWith('/') && (!basePath || !effectiveImageUrl.startsWith(`${basePath}/`))
      ? `${basePath}${effectiveImageUrl}`
      : effectiveImageUrl;

  // If image URL is valid and hasn't errored out, render real photograph with skeleton
  if (resolvedImageUrl && !hasError) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl border border-[var(--border-subtle)] select-none flex items-center justify-center bg-white p-2 group ${className}`}
      >
        {/* Loading skeleton shimmer */}
        {isLoading && (
          <div className="absolute inset-0 bg-stone-100 animate-pulse flex items-center justify-center">
            <CategoryIcon className="h-8 w-8 text-stone-300 animate-pulse" />
          </div>
        )}

        {/* Real Product Photograph */}
        <img
          src={resolvedImageUrl}
          alt={alt || (brand ? `${brand} ${slug}` : slug)}
          className={`w-full h-full object-contain filter drop-shadow-sm transition-all duration-300 ease-out group-hover:scale-105 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          loading="lazy"
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
        />

        {/* Subtle Open Food Facts Attribution Badge */}
        {isOpenFoodFacts && !isLoading && (
          <div
            title="Skutočná fotografia z otvorenej databázy Open Food Facts (ODbL)"
            className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm text-[9px] font-mono-tabular font-semibold bg-stone-900/60 text-white backdrop-blur-xs tracking-tight"
          >
            <Camera className="h-2.5 w-2.5 opacity-80" />
            <span>OFF</span>
          </div>
        )}

        {/* Subtle Official Lidl Attribution Badge */}
        {isLidl && !isLoading && (
          <div
            title="Oficiálna produktová fotografia z lidl.sk / lidl.com (Lidl Stiftung & Co. KG)"
            className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm text-[9px] font-mono-tabular font-bold bg-[#0050AA] text-white backdrop-blur-xs tracking-tight shadow-xs"
          >
            <Camera className="h-2.5 w-2.5 opacity-90" />
            <span>LIDL</span>
          </div>
        )}

        {/* Subtle Official Tesco Attribution Badge */}
        {effectiveImageUrl?.includes('tesco.com') && !isLoading && (
          <div
            title="Oficiálna produktová fotografia z tesco.sk (Tesco Stores SR)"
            className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm text-[9px] font-mono-tabular font-bold bg-[#00539F] text-white backdrop-blur-xs tracking-tight shadow-xs"
          >
            <Camera className="h-2.5 w-2.5 opacity-90" />
            <span>TESCO</span>
          </div>
        )}

        {/* Subtle Official BILLA Attribution Badge */}
        {(effectiveImageUrl?.includes('billa') || effectiveImageUrl?.includes('commercetools')) && !isLoading && (
          <div
            title="Oficiálna produktová fotografia z billa.sk (BILLA s.r.o.)"
            className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm text-[9px] font-mono-tabular font-bold bg-[#E2001A] text-white backdrop-blur-xs tracking-tight shadow-xs"
          >
            <Camera className="h-2.5 w-2.5 opacity-90" />
            <span>BILLA</span>
          </div>
        )}

        {/* Local Verified Real Photo Badge */}
        {effectiveImageUrl?.startsWith('/images/products/') && !isLoading && (
          <div
            title="Overená reálna fotografia balenia z centrálneho registra"
            className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm text-[9px] font-mono-tabular font-bold bg-stone-900/75 text-emerald-300 backdrop-blur-xs tracking-tight shadow-xs"
          >
            <Camera className="h-2.5 w-2.5 text-emerald-400" />
            <span>OVERENÉ</span>
          </div>
        )}
      </div>
    );
  }

  // Clean Neutral Placeholder (when real photo is unavailable or packaging is unpackaged)
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-[var(--border-subtle)] select-none flex flex-col items-center justify-center bg-stone-50/80 p-3 transition-colors hover:bg-stone-100/80 ${className}`}
    >
      <div className="flex flex-col items-center justify-center gap-1.5 my-auto text-center">
        <div className="h-10 w-10 rounded-full bg-white border border-stone-200/80 flex items-center justify-center text-stone-400 shadow-2xs">
          <CategoryIcon className="h-5 w-5 text-stone-500" />
        </div>

        {brand && (
          <span className="text-[11px] font-bold text-stone-700 tracking-wide uppercase max-w-[90%] truncate">
            {brand}
          </span>
        )}

        <div className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-400">
          <ImageOff className="h-2.5 w-2.5" />
          <span>Foto nedostupná</span>
        </div>
      </div>

      {/* Package quantity badge at bottom */}
      {packageQuantity > 0 && (
        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono-tabular font-semibold bg-white/90 border border-stone-200/60 text-stone-600">
          {String(packageQuantity).replace('.', ',')} {packageUnit}
        </div>
      )}
    </div>
  );
}

// Re-export as ProductIllustration for 100% backward compatibility
export const ProductIllustration = ProductImage;
