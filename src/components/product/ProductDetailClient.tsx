'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  Plus,
  Check,
  Award,
  CreditCard,
  ExternalLink,
  Bell,
  Scale,
  Barcode,
  Clock,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import type { ProductWithOffers, RetailerSlug } from '@/lib/domain/types';
import type { ProductPriceHistorySeries } from '@/lib/db/repository';
import {
  evaluateListingOffer,
  formatEurCents,
  formatUnitPriceCents,
} from '@/lib/domain/money';
import { useApp } from '@/components/providers/AppContext';
import { ProductIllustration } from '@/components/ui/ProductIllustration';
import { PriceHistoryChart } from '@/components/ui/PriceHistoryChart';
import { ProductCard } from '@/components/ui/ProductCard';

const RETAILER_META: Array<{ slug: RetailerSlug; name: string; color: string }> = [
  { slug: 'lidl', name: 'Lidl Slovakia', color: '#1D4ED8' },
  { slug: 'tesco', name: 'Tesco Slovakia', color: '#0F4C81' },
  { slug: 'billa', name: 'BILLA Slovakia', color: '#B45309' },
];

interface ProductDetailClientProps {
  product: ProductWithOffers;
  history: ProductPriceHistorySeries;
  similarProducts: ProductWithOffers[];
}

export function ProductDetailClient({
  product,
  history,
  similarProducts,
}: ProductDetailClientProps) {
  const {
    loyaltyPrefs,
    addProductToActiveList,
    favoriteIds,
    toggleFavorite,
    showToast,
    refreshHeaderCounts,
  } = useApp();

  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [alertTargetEur, setAlertTargetEur] = useState<string>(() => {
    const baseMin = product.historicalMinCents ?? 199;
    return (baseMin / 100).toFixed(2).replace('.', ',');
  });
  const [creatingAlert, setCreatingAlert] = useState(false);

  const isFavorite = favoriteIds.includes(product.id);

  const evaluations = RETAILER_META.map((r) => {
    const listing = product.listings.find((l) => l.retailerSlug === r.slug) ?? null;
    const evaluation = listing
      ? evaluateListingOffer(listing, loyaltyPrefs, {
          packageQuantity: product.packageQuantity,
          packageUnit: product.packageUnit,
        })
      : null;
    return {
      ...r,
      listing,
      evaluation,
    };
  });

  const pricedEvaluations = evaluations.filter(
    (e) => e.evaluation?.isPriceAvailable && e.evaluation.effectivePriceCents !== null
  );
  const sortedPriced = [...pricedEvaluations].sort(
    (a, b) => a.evaluation!.effectivePriceCents! - b.evaluation!.effectivePriceCents!
  );
  const cheapestOffer = sortedPriced[0] ?? null;
  const allThreePriced = pricedEvaluations.length === 3;

  const handleAddToList = async () => {
    setJustAdded(true);
    await addProductToActiveList(product.id, product.canonicalName, quantity);
    setTimeout(() => setJustAdded(false), 1400);
  };

  const handleCreateQuickAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericEur = parseFloat(alertTargetEur.replace(',', '.'));
    if (!Number.isFinite(numericEur) || numericEur <= 0) return;

    setCreatingAlert(true);
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_alert',
          productId: product.id,
          targetPriceCents: Math.round(numericEur * 100),
          notifyOnAnyPromotion: true,
          includeLoyaltyPrices: true,
        }),
      });
      if (res.ok) {
        await refreshHeaderCounts();
        showToast({
          title: 'Cenové upozornenie vytvorené',
          description: `Upozorníme vás, keď cena ${product.canonicalName} klesne pod ${alertTargetEur} €.`,
          variant: 'success',
        });
      }
    } finally {
      setCreatingAlert(false);
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Breadcrumb */}
      <nav aria-label="Drobečková navigácia" className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link
          href="/katalog"
          className="inline-flex items-center gap-1 font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Späť do katalógu</span>
        </Link>
        <span>/</span>
        <Link
          href={`/katalog?category=${encodeURIComponent(product.categorySlug)}`}
          className="hover:text-[var(--text-primary)]"
        >
          {product.categoryName}
        </Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] font-medium truncate">
          {product.canonicalName}
        </span>
      </nav>

      {/* Main Product Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Illustration & Product Identifiers */}
        <div className="lg:col-span-5 space-y-4">
          <ProductIllustration
            slug={product.slug}
            categorySlug={product.categorySlug}
            brand={product.brand}
            packageQuantity={product.packageQuantity}
            packageUnit={product.packageUnit}
            imageUrl={product.imageUrl}
            className="h-72 sm:h-80 w-full"
          />

          {/* Verified Identifiers Card */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
              <Barcode className="h-4 w-4 text-[#123524]" />
              <span>Overené produktové identifikátory (GTIN / SKU / TPN)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono-tabular">
              {product.identifiers.map((id) => (
                <div
                  key={id.id}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1.5 flex items-center justify-between"
                >
                  <span className="text-[10px] font-sans font-semibold text-[var(--text-muted)]">
                    {id.identifierType}:
                  </span>
                  <span className="font-bold text-[var(--text-primary)]">{id.identifierValue}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Normalizované balenie:{' '}
              <strong className="font-mono-tabular text-[var(--text-secondary)]">
                {String(product.packageQuantity).replace('.', ',')} {product.packageUnit} (
                {String(product.normalizedQuantity).replace('.', ',')} {product.normalizedUnit})
              </strong>
            </p>
            {product.imageUrl?.includes('openfoodfacts') && (
              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span>Fotografia produktu:</span>
                {(() => {
                  const ean = product.identifiers.find(
                    (i) => i.identifierType === 'EAN13' || i.identifierType === 'EAN8'
                  )?.identifierValue;
                  return (
                    <a
                      href={ean ? `https://world.openfoodfacts.org/product/${ean}` : 'https://world.openfoodfacts.org'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-[#177245] hover:underline"
                    >
                      Open Food Facts (ODbL) <ExternalLink className="h-3 w-3" />
                    </a>
                  );
                })()}
              </div>
            )}
            {product.imageUrl && (product.imageUrl.includes('lidl.sk') || product.imageUrl.includes('lidl.com')) && (
              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span>Fotografia produktu:</span>
                <a
                  href={product.imageUrl.includes('lidl.sk') ? 'https://www.lidl.sk' : 'https://www.lidl.com'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#0050AA] hover:underline"
                >
                  Lidl (Oficiálny web) <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            {product.imageUrl && product.imageUrl.includes('tesco.com') && (
              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span>Fotografia produktu:</span>
                <a
                  href="https://potravinydomov.itesco.sk"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#00539F] hover:underline"
                >
                  Tesco (Oficiálny katalóg) <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            {product.imageUrl && (product.imageUrl.includes('billa') || product.imageUrl.includes('commercetools')) && (
              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span>Fotografia produktu:</span>
                <a
                  href="https://www.billa.sk"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#E2001A] hover:underline"
                >
                  BILLA (Oficiálny e-shop) <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            {!product.imageUrl && (
              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span>Fotografia produktu:</span>
                <span className="font-medium text-stone-500">Neutrálny symbol (nebalený / neoverený tovar)</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Title, Store Offers Matrix & Actions */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                {product.categoryName}
              </span>
              {product.brand && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--brand-accent-soft)] text-[#123524]">
                  Značka: {product.brand}
                </span>
              )}
              {cheapestOffer && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EAF6EF] text-[#177245]">
                  <Award className="h-3.5 w-3.5" />
                  {allThreePriced
                    ? `Najlacnejšie zo všetkých 3 obchodov: ${cheapestOffer.name}`
                    : `Najnižšia známa cena (${pricedEvaluations.length}/3 obchodov): ${cheapestOffer.name}`}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
              {product.canonicalName}
            </h1>

            {product.description && (
              <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          {/* 3-Retailer Offer Comparison Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Aktuálne ponuky v podporovaných reťazcoch
              </h2>
              <Link
                href={`/porovnanie?produkt=${product.slug}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#123524] hover:underline"
              >
                <Scale className="h-3.5 w-3.5" />
                <span>Otvoriť v porovnávači</span>
              </Link>
            </div>

            <div className="space-y-3">
              {evaluations.map((item) => {
                const { listing, evaluation } = item;
                const isCheapest =
                  cheapestOffer &&
                  evaluation?.isPriceAvailable &&
                  evaluation.effectivePriceCents === cheapestOffer.evaluation?.effectivePriceCents;

                return (
                  <div
                    key={item.slug}
                    className={`rounded-2xl border p-4 transition-all ${
                      isCheapest
                        ? 'border-[#177245] bg-[#EAF6EF]/55 shadow-xs'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="px-2.5 py-0.5 rounded-md text-xs font-bold text-white"
                            style={{ backgroundColor: item.color }}
                          >
                            {item.name}
                          </span>
                          {isCheapest && (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#177245] text-white">
                              Najvýhodnejšia ponuka
                            </span>
                          )}
                          {evaluation?.priceType === 'LOYALTY' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FDF6E9] text-[#8F5B14] border border-[#E8C98E]">
                              <CreditCard className="h-3 w-3" />
                              S kartou {evaluation.loyaltyProgramName}
                            </span>
                          )}
                          {evaluation?.verifiedDiscountPercent !== null &&
                            evaluation?.verifiedDiscountPercent !== undefined && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#C84B31] text-white font-mono-tabular">
                                −{evaluation.verifiedDiscountPercent} %
                              </span>
                            )}
                        </div>

                        <p className="text-sm font-bold text-[var(--text-primary)]">
                          {listing ? listing.retailerTitle : 'Produkt neevidovaný v tomto reťazci'}
                        </p>

                        {listing && (
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
                            <span>Balenie: {listing.packageLabel}</span>
                            {listing.latestObservation?.lowest30DayPriceCents && (
                              <span className="font-mono-tabular">
                                Najnižšia cena za 30 dní:{' '}
                                <strong>
                                  {formatEurCents(listing.latestObservation.lowest30DayPriceCents)}
                                </strong>
                              </span>
                            )}
                            {evaluation?.validTo && (
                              <span className="font-mono-tabular">
                                Platnosť akcie do: {evaluation.validTo.slice(0, 10)}
                              </span>
                            )}
                          </div>
                        )}

                        {listing && (
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-muted)] pt-0.5">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Overené: {listing.lastVerifiedAt.slice(0, 10)}
                            </span>
                            <a
                              href={listing.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[#123524] font-semibold hover:underline"
                            >
                              <span>Pôvodný zdroj ({item.slug}.sk)</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="text-left sm:text-right font-mono-tabular shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--border-subtle)]">
                        {evaluation?.isPriceAvailable && evaluation.effectivePriceCents !== null ? (
                          <>
                            {evaluation.regularPriceCents &&
                              evaluation.regularPriceCents > evaluation.effectivePriceCents && (
                                <span className="block text-xs line-through text-[var(--text-muted)]">
                                  Bežná cena: {formatEurCents(evaluation.regularPriceCents)}
                                </span>
                              )}
                            <span
                              className={`text-2xl font-extrabold block ${
                                isCheapest ? 'text-[#177245]' : 'text-[var(--text-primary)]'
                              }`}
                            >
                              {formatEurCents(evaluation.effectivePriceCents)}
                            </span>
                            <span className="text-xs text-[var(--text-secondary)] font-semibold block">
                              {formatUnitPriceCents(
                                evaluation.effectiveUnitPriceCents,
                                evaluation.baseUnit
                              )}
                            </span>
                          </>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] text-xs font-sans font-semibold text-[var(--text-muted)]">
                            <AlertCircle className="h-4 w-4" />
                            <span>Cena nedostupná</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add to Shopping List & Quick Price Alert Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 flex flex-col justify-between gap-3">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                Pridať do aktívneho nákupného zoznamu
              </span>
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 text-sm font-bold cursor-pointer"
                  >
                    −
                  </button>
                  <span className="px-3 py-2 text-sm font-mono-tabular font-bold">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                    className="px-3 py-2 text-sm font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToList}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#123524] hover:bg-[#1A4B33] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {justAdded ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Pridané do zoznamu</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Pridať do košíka</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => toggleFavorite(product.id, product.canonicalName)}
                  aria-label="Obľúbený produkt"
                  className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                    isFavorite
                      ? 'border-[#C84B31] bg-[#FDF0ED] text-[#C84B31]'
                      : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleCreateQuickAlert}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 flex flex-col justify-between gap-3"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                <Bell className="h-3.5 w-3.5 text-[#C84B31]" />
                <span>Sledovať pokles ceny (Price Alert)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={alertTargetEur}
                    onChange={(e) => setAlertTargetEur(e.target.value)}
                    aria-label="Cieľová cena v EUR"
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-xs font-mono-tabular font-bold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">
                    €
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={creatingAlert}
                  className="px-4 py-2.5 rounded-xl bg-[#C84B31] hover:bg-[#B03E26] text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  Nastaviť limit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Price History Chart */}
      <PriceHistoryChart history={history} />

      {/* Product Variants (if any) */}
      {product.variants.length > 0 && (
        <section className="rounded-2xl border border-[#E8C98E] bg-[#FDF6E9] p-5 space-y-2">
          <h3 className="text-sm font-bold text-[#8F5B14]">
            Upozornenie na príbuzné varianty (odlišná gramáž alebo obsah tuku)
          </h3>
          <p className="text-xs text-[#8F5B14]/90">
            Nasledujúce varianty nie sú zlúčené s týmto produktom, pretože majú odlišné balenie
            alebo zloženie:
          </p>
          <ul className="text-xs font-semibold text-[#8F5B14] list-disc list-inside">
            {product.variants.map((v) => (
              <li key={v.id}>
                {v.variantName} ({v.packageQuantity} {v.packageUnit} • typ: {v.relationshipType})
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-[var(--text-primary)]">
            Podobné produkty v kategórii {product.categoryName}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {similarProducts.map((sim, idx) => (
              <ProductCard key={sim.id} product={sim} index={idx} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
