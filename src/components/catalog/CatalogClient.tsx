'use client';

import React, { useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  SlidersHorizontal,
  X,
  RotateCcw,
  Tag,
  CreditCard,
} from 'lucide-react';
import type { ProductWithOffers, RetailerSlug } from '@/lib/domain/types';
import type { CatalogFacets } from '@/lib/db/repository';
import { evaluateListingOffer } from '@/lib/domain/money';
import { normalizeSlovakText } from '@/lib/domain/matching';
import { useApp } from '@/components/providers/AppContext';
import { ProductCard } from '@/components/ui/ProductCard';

interface CatalogClientProps {
  allProducts: ProductWithOffers[];
  facets: CatalogFacets;
  initialParams: {
    q?: string;
    category?: string;
    retailer?: string;
    brand?: string;
    onlyPromotions?: boolean;
    onlyLoyalty?: boolean;
    maxPriceEur?: string;
    sortBy?: string;
    view?: 'grid' | 'list';
  };
}

export function CatalogClient({
  allProducts,
  facets,
  initialParams,
}: CatalogClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { loyaltyPrefs } = useApp();

  const [q, setQ] = useState(initialParams.q ?? '');
  const [category, setCategory] = useState(initialParams.category ?? '');
  const [retailer, setRetailer] = useState<RetailerSlug | ''>(
    (initialParams.retailer as RetailerSlug) ?? ''
  );
  const [brand, setBrand] = useState(initialParams.brand ?? '');
  const [onlyPromotions, setOnlyPromotions] = useState(Boolean(initialParams.onlyPromotions));
  const [onlyLoyalty, setOnlyLoyalty] = useState(Boolean(initialParams.onlyLoyalty));
  const [maxPriceEur, setMaxPriceEur] = useState<string>(initialParams.maxPriceEur ?? '');
  const [sortBy, setSortBy] = useState<string>(initialParams.sortBy ?? 'discount_desc');
  const [layout, setLayout] = useState<'grid' | 'list'>(initialParams.view ?? 'grid');

  // Sync URL query params for bookmarkable / shareable filter state
  const syncUrlParams = (overrides: Record<string, string | boolean | undefined>) => {
    const state = {
      q,
      category,
      retailer,
      brand,
      onlyPromotions,
      onlyLoyalty,
      maxPriceEur,
      sortBy,
      view: layout,
      ...overrides,
    };

    const sp = new URLSearchParams();
    if (state.q) sp.set('q', String(state.q));
    if (state.category) sp.set('category', String(state.category));
    if (state.retailer) sp.set('retailer', String(state.retailer));
    if (state.brand) sp.set('brand', String(state.brand));
    if (state.onlyPromotions) sp.set('onlyPromotions', 'true');
    if (state.onlyLoyalty) sp.set('onlyLoyalty', 'true');
    if (state.maxPriceEur) sp.set('maxPriceEur', String(state.maxPriceEur));
    if (state.sortBy && state.sortBy !== 'discount_desc') sp.set('sortBy', String(state.sortBy));
    if (state.view && state.view !== 'grid') sp.set('view', String(state.view));

    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const resetAllFilters = () => {
    setQ('');
    setCategory('');
    setRetailer('');
    setBrand('');
    setOnlyPromotions(false);
    setOnlyLoyalty(false);
    setMaxPriceEur('');
    setSortBy('discount_desc');
    router.replace(pathname, { scroll: false });
  };

  const filteredProducts = useMemo(() => {
    const normQuery = q.trim() ? normalizeSlovakText(q) : '';
    const maxPriceCents =
      maxPriceEur && Number.isFinite(Number(maxPriceEur.replace(',', '.')))
        ? Math.round(Number(maxPriceEur.replace(',', '.')) * 100)
        : null;

    const list = allProducts.filter((product) => {
      if (normQuery) {
        const text = normalizeSlovakText(
          [
            product.canonicalName,
            product.brand ?? '',
            product.categoryName,
            product.subcategoryName ?? '',
            ...product.identifiers.map((id) => id.identifierValue),
            ...product.listings.map((l) => l.retailerTitle),
          ].join(' ')
        );
        if (!text.includes(normQuery)) return false;
      }

      if (category && product.categorySlug !== category) return false;
      if (brand && product.brand !== brand) return false;

      const evals = product.listings.map((l) =>
        evaluateListingOffer(l, loyaltyPrefs, {
          packageQuantity: product.packageQuantity,
          packageUnit: product.packageUnit,
        })
      );

      if (retailer) {
        const retEval = evals.find((e) => e.retailerSlug === retailer);
        if (!retEval || !retEval.isPriceAvailable) return false;
      }

      if (onlyPromotions) {
        if (!evals.some((e) => e.isPriceAvailable && (e.priceType === 'PROMO' || e.priceType === 'LOYALTY'))) {
          return false;
        }
      }

      if (onlyLoyalty) {
        if (!evals.some((e) => e.isPriceAvailable && e.priceType === 'LOYALTY')) {
          return false;
        }
      }

      if (maxPriceCents !== null && maxPriceCents > 0) {
        const availablePrices = evals
          .filter((e) => e.isPriceAvailable && e.effectivePriceCents !== null)
          .map((e) => e.effectivePriceCents!);
        if (availablePrices.length === 0 || Math.min(...availablePrices) > maxPriceCents) {
          return false;
        }
      }

      return true;
    });

    list.sort((a, b) => {
      const evalsA = a.listings
        .map((l) =>
          evaluateListingOffer(l, loyaltyPrefs, {
            packageQuantity: a.packageQuantity,
            packageUnit: a.packageUnit,
          })
        )
        .filter((e) => e.isPriceAvailable && e.effectivePriceCents !== null);
      const evalsB = b.listings
        .map((l) =>
          evaluateListingOffer(l, loyaltyPrefs, {
            packageQuantity: b.packageQuantity,
            packageUnit: b.packageUnit,
          })
        )
        .filter((e) => e.isPriceAvailable && e.effectivePriceCents !== null);

      const minPriceA =
        evalsA.length > 0 ? Math.min(...evalsA.map((e) => e.effectivePriceCents!)) : Number.MAX_SAFE_INTEGER;
      const minPriceB =
        evalsB.length > 0 ? Math.min(...evalsB.map((e) => e.effectivePriceCents!)) : Number.MAX_SAFE_INTEGER;

      if (sortBy === 'price_asc') return minPriceA - minPriceB;
      if (sortBy === 'price_desc') return minPriceB - minPriceA;
      if (sortBy === 'unit_price_asc') {
        const minUnitA =
          evalsA.length > 0
            ? Math.min(...evalsA.map((e) => e.effectiveUnitPriceCents ?? Number.MAX_SAFE_INTEGER))
            : Number.MAX_SAFE_INTEGER;
        const minUnitB =
          evalsB.length > 0
            ? Math.min(...evalsB.map((e) => e.effectiveUnitPriceCents ?? Number.MAX_SAFE_INTEGER))
            : Number.MAX_SAFE_INTEGER;
        return minUnitA - minUnitB;
      }
      if (sortBy === 'updated_desc') {
        return (b.lastUpdatedAt ?? '').localeCompare(a.lastUpdatedAt ?? '');
      }
      if (sortBy === 'name_asc') {
        return a.canonicalName.localeCompare(b.canonicalName, 'sk');
      }

      // Default: discount_desc
      const maxDiscA = Math.max(0, ...evalsA.map((e) => e.verifiedDiscountPercent ?? 0));
      const maxDiscB = Math.max(0, ...evalsB.map((e) => e.verifiedDiscountPercent ?? 0));
      if (maxDiscB !== maxDiscA) return maxDiscB - maxDiscA;
      return minPriceA - minPriceB;
    });

    return list;
  }, [
    allProducts,
    q,
    category,
    retailer,
    brand,
    onlyPromotions,
    onlyLoyalty,
    maxPriceEur,
    sortBy,
    loyaltyPrefs,
  ]);

  const activeFilterCount = [
    q.trim(),
    category,
    retailer,
    brand,
    onlyPromotions,
    onlyLoyalty,
    maxPriceEur,
  ].filter(Boolean).length;

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Title & View Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#123524]">
            Overený katalóg potravín
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mt-1">
            Porovnanie cien a merných jednotiek v reťazcoch
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Vyhľadávajte podľa názvu, značky, kategórie alebo 13-miestneho EAN čiarového kódu.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="inline-flex rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1">
            <button
              type="button"
              onClick={() => {
                setLayout('grid');
                syncUrlParams({ view: 'grid' });
              }}
              aria-label="Zobrazenie mriežky"
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                layout === 'grid'
                  ? 'bg-[#123524] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Mriežka</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLayout('list');
                syncUrlParams({ view: 'list' });
              }}
              aria-label="Zobrazenie zoznamu"
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                layout === 'list'
                  ? 'bg-[#123524] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <ListIcon className="h-4 w-4" />
              <span>Zoznam</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="h-4 w-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                syncUrlParams({ q: e.target.value });
              }}
              placeholder="Názov, značka, EAN (napr. 8585000902797)..."
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] pl-10 pr-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#123524]"
            />
          </div>

          {/* Category Select */}
          <div className="md:col-span-3">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                syncUrlParams({ category: e.target.value });
              }}
              aria-label="Filtrovať podľa kategórie"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#123524]"
            >
              <option value="">Všetky kategórie ({allProducts.length})</option>
              {facets.categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name} ({c.count})
                </option>
              ))}
            </select>
          </div>

          {/* Brand Select */}
          <div className="md:col-span-2">
            <select
              value={brand}
              onChange={(e) => {
                setBrand(e.target.value);
                syncUrlParams({ brand: e.target.value });
              }}
              aria-label="Filtrovať podľa značky"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#123524]"
            >
              <option value="">Všetky značky</option>
              {facets.brands.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name} ({b.count})
                </option>
              ))}
            </select>
          </div>

          {/* Sort Select */}
          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                syncUrlParams({ sortBy: e.target.value });
              }}
              aria-label="Zoradiť produkty"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2.5 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#123524]"
            >
              <option value="discount_desc">Zoradiť: Najvyššia overená zľava (%)</option>
              <option value="price_asc">Zoradiť: Najnižšia cena (€)</option>
              <option value="unit_price_asc">Zoradiť: Najnižšia jednotková cena (€/kg, €/l)</option>
              <option value="price_desc">Zoradiť: Najvyššia cena (€)</option>
              <option value="updated_desc">Zoradiť: Naposledy aktualizované</option>
              <option value="name_asc">Zoradiť: Podľa abecedy (A – Z)</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border-subtle)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] mr-1">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Reťazec:
            </span>
            {(
              [
                { slug: '', label: 'Všetky' },
                { slug: 'lidl', label: 'Lidl' },
                { slug: 'tesco', label: 'Tesco' },
                { slug: 'billa', label: 'BILLA' },
              ] as const
            ).map((r) => (
              <button
                key={r.slug || 'all'}
                type="button"
                onClick={() => {
                  setRetailer(r.slug);
                  syncUrlParams({ retailer: r.slug });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  retailer === r.slug
                    ? 'border-[#123524] bg-[#123524] text-white'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {r.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                const next = !onlyPromotions;
                setOnlyPromotions(next);
                syncUrlParams({ onlyPromotions: next });
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                onlyPromotions
                  ? 'border-[#C84B31] bg-[#FDF0ED] text-[#C84B31]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)]'
              }`}
            >
              <Tag className="h-3.5 w-3.5" />
              <span>Iba v akcii</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const next = !onlyLoyalty;
                setOnlyLoyalty(next);
                syncUrlParams({ onlyLoyalty: next });
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                onlyLoyalty
                  ? 'border-[#8F5B14] bg-[#FDF6E9] text-[#8F5B14]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)]'
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Iba vernostné zľavy</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--text-secondary)] font-medium">
              Max. cena (€):
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="50"
              value={maxPriceEur}
              onChange={(e) => {
                setMaxPriceEur(e.target.value);
                syncUrlParams({ maxPriceEur: e.target.value });
              }}
              placeholder="napr. 3,00"
              className="w-24 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs font-mono-tabular focus:outline-none focus:border-[#123524]"
            />
          </div>
        </div>

        {/* Active Filter Indicators */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-semibold text-[var(--text-muted)]">
              Aktívne filtre ({ filteredProducts.length } výsledkov):
            </span>
            {q && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] text-xs font-medium">
                Hľadanie: „{q}“
                <button
                  type="button"
                  onClick={() => {
                    setQ('');
                    syncUrlParams({ q: '' });
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {category && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] text-xs font-medium">
                Kategória: {facets.categories.find((c) => c.slug === category)?.name ?? category}
                <button
                  type="button"
                  onClick={() => {
                    setCategory('');
                    syncUrlParams({ category: '' });
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {retailer && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] text-xs font-medium uppercase">
                Obchod: {retailer}
                <button
                  type="button"
                  onClick={() => {
                    setRetailer('');
                    syncUrlParams({ retailer: '' });
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {brand && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] text-xs font-medium">
                Značka: {brand}
                <button
                  type="button"
                  onClick={() => {
                    setBrand('');
                    syncUrlParams({ brand: '' });
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#C84B31] hover:underline ml-2 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Zrušiť všetky filtre</span>
            </button>
          </div>
        )}
      </div>

      {/* Results Grid / List or Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-12 text-center max-w-xl mx-auto my-8 space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-[var(--bg-subtle)] text-[var(--text-secondary)] flex items-center justify-center mx-auto">
            <Search className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Pre zadané filtre sa nenašli žiadne overené produkty
          </h2>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Skúste upraviť hľadaný výraz, zvýšiť maximálnu cenu alebo vypnúť filter vernostných
            kariet.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={resetAllFilters}
              className="px-4 py-2.5 rounded-xl bg-[#123524] text-white text-xs font-bold cursor-pointer"
            >
              Zobraziť všetky produkty ({allProducts.length})
            </button>
          </div>
        </div>
      ) : layout === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredProducts.map((product, idx) => (
            <ProductCard key={product.id} product={product} layout="grid" index={idx} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product, idx) => (
            <ProductCard key={product.id} product={product} layout="list" index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
