'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Scale,
  Award,
  CreditCard,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Check,
  Search,
} from 'lucide-react';
import type { ProductWithOffers, RetailerSlug } from '@/lib/domain/types';
import {
  evaluateListingOffer,
  formatEurCents,
  formatUnitPriceCents,
} from '@/lib/domain/money';
import { useApp } from '@/components/providers/AppContext';
import { ProductIllustration } from '@/components/ui/ProductIllustration';

const RETAILERS: Array<{
  slug: RetailerSlug;
  name: string;
  loyaltyName: string;
  color: string;
}> = [
  { slug: 'lidl', name: 'Lidl Slovakia', loyaltyName: 'Lidl Plus', color: '#1D4ED8' },
  { slug: 'tesco', name: 'Tesco Slovakia', loyaltyName: 'Clubcard', color: '#0F4C81' },
  { slug: 'billa', name: 'BILLA Slovakia', loyaltyName: 'BILLA Bonus', color: '#B45309' },
];

interface PriceComparisonClientProps {
  allProducts: ProductWithOffers[];
  initialProductSlug?: string;
}

export function PriceComparisonClient({
  allProducts,
  initialProductSlug,
}: PriceComparisonClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { loyaltyPrefs, toggleLoyaltyCard, addProductToActiveList } = useApp();

  const [selectedSlug, setSelectedSlug] = useState<string>(
    initialProductSlug && allProducts.some((p) => p.slug === initialProductSlug)
      ? initialProductSlug
      : allProducts[0]?.slug ?? ''
  );
  const [filterText, setFilterText] = useState('');
  const [justAdded, setJustAdded] = useState(false);

  const selectedProduct =
    allProducts.find((p) => p.slug === selectedSlug) ?? allProducts[0];

  const handleSelectProduct = (slug: string) => {
    setSelectedSlug(slug);
    router.replace(`${pathname}?produkt=${encodeURIComponent(slug)}`, { scroll: false });
  };

  if (!selectedProduct) return null;

  const storeCards = RETAILERS.map((r) => {
    const listing =
      selectedProduct.listings.find((l) => l.retailerSlug === r.slug) ?? null;
    const evaluation = listing
      ? evaluateListingOffer(
          listing,
          loyaltyPrefs,
          {
            packageQuantity: selectedProduct.packageQuantity,
            packageUnit: selectedProduct.packageUnit,
          },
          new Date(),
          listing.retailerSlug === 'lidl'
            ? 'Lidl SK Public SSR (data-grid-data)'
            : listing.retailerSlug === 'billa'
              ? 'BILLA SK Nuxt SSR (__NUXT_DATA__)'
              : listing.latestObservation?.dataSourceId === 'ds-tesco-csv'
                ? 'Tesco SK Overený Letákový CSV + GraphQL EAN'
                : 'Tesco SK Leaflets GraphQL API'
        )
      : null;

    return {
      ...r,
      listing,
      evaluation,
    };
  });

  const pricedStores = storeCards.filter(
    (s) => s.evaluation?.isPriceAvailable && s.evaluation.effectivePriceCents !== null
  );
  const sortedPriced = [...pricedStores].sort(
    (a, b) => a.evaluation!.effectivePriceCents! - b.evaluation!.effectivePriceCents!
  );
  const cheapestStore = sortedPriced[0] ?? null;
  const highestPricedStore = sortedPriced[sortedPriced.length - 1] ?? null;
  const allThreeStoresVerified = pricedStores.length === 3;

  const filteredSelectorProducts = allProducts.filter((p) =>
    filterText.trim()
      ? p.canonicalName.toLowerCase().includes(filterText.toLowerCase()) ||
        (p.brand ?? '').toLowerCase().includes(filterText.toLowerCase())
      : true
  );

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#123524]">
            Detailné porovnanie reťazcov
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mt-1">
            Porovnanie cien: Lidl vs. Tesco vs. BILLA
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Presné porovnanie bežnej ceny, akciovej ceny, vernostnej ceny, jednotkovej ceny (€/kg,
            €/l) a pôvodu dát.
          </p>
        </div>

        {/* Quick Loyalty Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Vernostné ceny:
          </span>
          {(
            [
              { key: 'includeLidlPlus', label: 'Lidl Plus' },
              { key: 'includeTescoClubcard', label: 'Clubcard' },
              { key: 'includeBillaBonus', label: 'BILLA Bonus' },
            ] as const
          ).map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => toggleLoyaltyCard(c.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                loyaltyPrefs[c.key]
                  ? 'border-[#8F5B14] bg-[#FDF6E9] text-[#8F5B14]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
              }`}
            >
              {loyaltyPrefs[c.key] ? '✓ ' : ''}
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Selector Bar */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Vyberte produkt na porovnanie ({allProducts.length} v katalógu):
          </label>
          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filtrovať zoznam produktov..."
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] pl-8 pr-3 py-1.5 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {filteredSelectorProducts.map((p) => {
            const active = p.slug === selectedProduct.slug;
            const pricedCount = p.listings.filter(
              (l) =>
                l.latestObservation &&
                (l.latestObservation.effectivePriceCents !== null ||
                  l.latestObservation.loyaltyPriceCents !== null)
            ).length;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectProduct(p.slug)}
                className={`shrink-0 px-3.5 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? 'border-[#123524] bg-[#123524] text-white shadow-xs'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[var(--border-strong)]'
                }`}
              >
                <span className="text-xs font-bold block whitespace-nowrap">
                  {p.canonicalName}
                </span>
                <span
                  className={`text-[10px] font-mono-tabular block mt-0.5 ${
                    active ? 'text-[#A7F3D0]' : 'text-[var(--text-muted)]'
                  }`}
                >
                  {p.packageQuantity} {p.packageUnit} • {pricedCount}/3 obchodov
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Product Summary Banner */}
      <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <ProductIllustration
            slug={selectedProduct.slug}
            categorySlug={selectedProduct.categorySlug}
            brand={selectedProduct.brand}
            packageQuantity={selectedProduct.packageQuantity}
            packageUnit={selectedProduct.packageUnit}
            imageUrl={selectedProduct.imageUrl}
            className="h-28 w-36 shrink-0"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-[var(--text-muted)]">
                {selectedProduct.categoryName}
              </span>
              <span className="px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-xs font-mono-tabular font-semibold">
                Balenie: {String(selectedProduct.packageQuantity).replace('.', ',')}{' '}
                {selectedProduct.packageUnit}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">
              {selectedProduct.canonicalName}
            </h2>

            {/* Honest Coverage Status Statement */}
            {cheapestStore ? (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#EAF6EF] text-[#177245] text-xs font-bold">
                <Award className="h-4 w-4 shrink-0" />
                {allThreeStoresVerified ? (
                  <span>
                    Najvýhodnejšia overená ponuka zo všetkých 3 reťazcov:{' '}
                    <strong>{cheapestStore.name}</strong> (
                    {formatEurCents(cheapestStore.evaluation!.effectivePriceCents)})
                  </span>
                ) : (
                  <span>
                    Najnižšia známa cena z {pricedStores.length} overených obchodov:{' '}
                    <strong>{cheapestStore.name}</strong> (
                    {formatEurCents(cheapestStore.evaluation!.effectivePriceCents)}) — v{' '}
                    {3 - pricedStores.length} obchode cena chýba!
                  </span>
                )}
              </div>
            ) : (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#FDF6E9] text-[#8F5B14] text-xs font-bold">
                <AlertTriangle className="h-4 w-4" />
                <span>Pre tento produkt momentálne nie je overená cena.</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto">
          <Link
            href={`/produkt/${selectedProduct.slug}`}
            className="px-4 py-2.5 rounded-xl border border-[var(--border-strong)] text-xs font-bold hover:border-[#123524] transition-colors"
          >
            História cien produktu
          </Link>
          <button
            type="button"
            onClick={async () => {
              setJustAdded(true);
              await addProductToActiveList(selectedProduct.id, selectedProduct.canonicalName, 1);
              setTimeout(() => setJustAdded(false), 1200);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#123524] hover:bg-[#1A4B33] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            {justAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            <span>{justAdded ? 'Pridané' : 'Pridať do zoznamu'}</span>
          </button>
        </div>
      </div>

      {/* Warning Banner when any store lacks verified price data */}
      {!allThreeStoresVerified && (
        <div className="rounded-2xl border border-[#E8C98E] bg-[#FDF6E9] p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-[#8F5B14] shrink-0 mt-0.5" />
          <div className="text-xs text-[#8F5B14] leading-relaxed">
            <p className="font-bold">
              Upozornenie na neúplné pokrytie cien ({pricedStores.length} z 3 obchodov overené):
            </p>
            <p className="mt-0.5">
              Jeden alebo viac reťazcov momentálne nemá pre tento produkt overenú číselnú cenu.
              Chýbajúca cena je zobrazená ako <strong>Cena nedostupná</strong> (nikdy nie ako 0,00
              €) a produkt neoznačujeme ako najlacnejší zo všetkých troch reťazcov.
            </p>
          </div>
        </div>
      )}

      {/* Side-by-Side 3-Store Comparison Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {storeCards.map((store) => {
          const { listing, evaluation } = store;
          const isAvailable =
            evaluation?.isPriceAvailable && evaluation.effectivePriceCents !== null;
          const isCheapest =
            isAvailable &&
            cheapestStore &&
            evaluation!.effectivePriceCents === cheapestStore.evaluation!.effectivePriceCents;

          const diffFromCheapestCents =
            isAvailable && cheapestStore?.evaluation?.effectivePriceCents
              ? evaluation!.effectivePriceCents! - cheapestStore.evaluation.effectivePriceCents
              : null;

          const diffFromCheapestPct =
            diffFromCheapestCents !== null &&
            cheapestStore?.evaluation?.effectivePriceCents &&
            cheapestStore.evaluation.effectivePriceCents > 0
              ? Math.round(
                  (diffFromCheapestCents / cheapestStore.evaluation.effectivePriceCents) * 100
                )
              : null;

          return (
            <motion.div
              key={store.slug}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-3xl border p-6 flex flex-col justify-between transition-all ${
                isCheapest
                  ? 'border-2 border-[#177245] bg-[var(--bg-surface)] shadow-md'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xs'
              }`}
            >
              <div className="space-y-5">
                {/* Store Header */}
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-3.5 w-3.5 rounded-full"
                      style={{ backgroundColor: store.color }}
                    />
                    <h3 className="text-lg font-extrabold text-[var(--text-primary)]">
                      {store.name}
                    </h3>
                  </div>

                  {isCheapest ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#177245] text-white">
                      {allThreeStoresVerified
                        ? 'Najlacnejší (3/3)'
                        : `Najnižšia známa (${pricedStores.length}/3)`}
                    </span>
                  ) : isAvailable && diffFromCheapestCents !== null && diffFromCheapestCents > 0 ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono-tabular font-bold bg-[#FDF0ED] text-[#C84B31]">
                      +{formatEurCents(diffFromCheapestCents)} (+{diffFromCheapestPct} %)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                      Neoverená cena
                    </span>
                  )}
                </div>

                {/* Main Effective Price Display */}
                <div className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4">
                  <span className="text-xs font-semibold text-[var(--text-secondary)] block">
                    Aktuálna platná cena pre vás:
                  </span>
                  {isAvailable ? (
                    <div className="mt-1 flex items-baseline justify-between font-mono-tabular">
                      <span
                        className={`text-3xl font-extrabold ${
                          isCheapest ? 'text-[#177245]' : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {formatEurCents(evaluation!.effectivePriceCents)}
                      </span>
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">
                        {formatUnitPriceCents(
                          evaluation!.effectiveUnitPriceCents,
                          evaluation!.baseUnit
                        )}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2 py-2">
                      <span className="text-lg font-bold text-[var(--text-muted)] block">
                        Cena nedostupná
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {listing
                          ? 'Produkt je v letáku bez overenej číselnej ceny.'
                          : 'Tento reťazec nemá v katalógu spárovanú ponuku.'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Detailed Breakdown Rows */}
                <dl className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)]">
                    <dt className="text-[var(--text-secondary)]">Názov v reťazci:</dt>
                    <dd className="font-semibold text-[var(--text-primary)] text-right max-w-[60%] truncate">
                      {listing?.retailerTitle ?? '—'}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)] font-mono-tabular">
                    <dt className="font-sans text-[var(--text-secondary)]">Bežná (štandardná) cena:</dt>
                    <dd className="font-bold text-[var(--text-primary)]">
                      {evaluation?.regularPriceCents
                        ? formatEurCents(evaluation.regularPriceCents)
                        : 'Neznáma'}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)] font-mono-tabular">
                    <dt className="font-sans text-[var(--text-secondary)]">Akciová cena (bez karty):</dt>
                    <dd className="font-bold text-[#C84B31]">
                      {evaluation?.promoPriceCents
                        ? formatEurCents(evaluation.promoPriceCents)
                        : '—'}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)] font-mono-tabular">
                    <dt className="font-sans text-[var(--text-secondary)]">
                      Cena s kartou ({store.loyaltyName}):
                    </dt>
                    <dd className="font-bold text-[#8F5B14]">
                      {evaluation?.loyaltyPriceCents
                        ? formatEurCents(evaluation.loyaltyPriceCents)
                        : '—'}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)] font-mono-tabular">
                    <dt className="font-sans text-[var(--text-secondary)]">Jednotková cena:</dt>
                    <dd className="font-bold text-[var(--text-primary)]">
                      {isAvailable
                        ? formatUnitPriceCents(
                            evaluation!.effectiveUnitPriceCents,
                            evaluation!.baseUnit
                          )
                        : '—'}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)] font-mono-tabular">
                    <dt className="font-sans text-[var(--text-secondary)]">Overená zľava:</dt>
                    <dd className="font-bold text-[#177245]">
                      {evaluation?.verifiedDiscountPercent
                        ? `−${evaluation.verifiedDiscountPercent} % (úspora ${formatEurCents(
                            evaluation.absoluteSavingsCents
                          )})`
                        : 'Bez zľavy'}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)]">
                    <dt className="text-[var(--text-secondary)]">Stav dostupnosti:</dt>
                    <dd className="font-semibold text-[var(--text-primary)]">
                      {listing?.availabilityStatus === 'VERIFIED_IN_STOCK'
                        ? 'Overené v katalógu'
                        : listing?.availabilityStatus === 'LEAFLET_OFFER'
                          ? 'Platná letáková ponuka'
                          : 'Neoverená dostupnosť'}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Provenance Footer */}
              <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] space-y-2 text-[11px] text-[var(--text-muted)]">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#177245]" />
                    Zdroj: {evaluation?.dataSourceName ?? 'Nespárované'}
                  </span>
                </div>
                {listing && (
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 font-mono-tabular">
                      <Clock className="h-3 w-3" />
                      {listing.lastVerifiedAt.slice(0, 16).replace('T', ' ')}
                    </span>
                    <a
                      href={listing.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-[#123524] hover:underline"
                    >
                      <span>Overiť na webe</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Absolute & Percentage Price Spread Summary */}
      {cheapestStore && highestPricedStore && pricedStores.length >= 2 && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--brand-accent-soft)] text-[#123524]">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Cenový rozdiel medzi reťazcami pre {selectedProduct.canonicalName}
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Rozdiel medzi najdrahšou ({highestPricedStore.name}) a najlacnejšou (
                {cheapestStore.name}) overenou ponukou.
              </p>
            </div>
          </div>

          <div className="font-mono-tabular text-right">
            <span className="text-xs text-[var(--text-muted)] block font-sans">
              Úspora pri kúpe 1 ks:
            </span>
            <span className="text-xl font-extrabold text-[#177245]">
              {formatEurCents(
                highestPricedStore.evaluation!.effectivePriceCents! -
                  cheapestStore.evaluation!.effectivePriceCents!
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
