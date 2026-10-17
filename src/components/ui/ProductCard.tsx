'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Heart,
  Plus,
  Check,
  Award,
  CreditCard,
  ArrowUpRight,
  Scale,
  AlertCircle,
} from 'lucide-react';
import type { ProductWithOffers, RetailerSlug } from '@/lib/domain/types';
import {
  evaluateListingOffer,
  formatEurCents,
  formatUnitPriceCents,
} from '@/lib/domain/money';
import { useApp } from '@/components/providers/AppContext';
import { ProductIllustration } from './ProductIllustration';

const RETAILER_ORDER: Array<{ slug: RetailerSlug; label: string; color: string }> = [
  { slug: 'lidl', label: 'Lidl', color: '#1D4ED8' },
  { slug: 'tesco', label: 'Tesco', color: '#0F4C81' },
  { slug: 'billa', label: 'BILLA', color: '#B45309' },
];

interface ProductCardProps {
  product: ProductWithOffers;
  layout?: 'grid' | 'list';
  index?: number;
}

export function ProductCard({ product, layout = 'grid', index = 0 }: ProductCardProps) {
  const { loyaltyPrefs, addProductToActiveList, favoriteIds, toggleFavorite } = useApp();
  const [justAdded, setJustAdded] = useState(false);

  const isFavorite = favoriteIds.includes(product.id);

  const evaluationsByRetailer = RETAILER_ORDER.map((r) => {
    const listing = product.listings.find((l) => l.retailerSlug === r.slug);
    if (!listing) {
      return {
        retailerSlug: r.slug,
        retailerName: r.label,
        color: r.color,
        listing: null,
        evaluation: null,
      };
    }
    const evaluation = evaluateListingOffer(lOrListing(listing), loyaltyPrefs, {
      packageQuantity: product.packageQuantity,
      packageUnit: product.packageUnit,
    });
    return {
      retailerSlug: r.slug,
      retailerName: r.label,
      color: r.color,
      listing,
      evaluation,
    };
  });

  function lOrListing(l: NonNullable<typeof product.listings[number]>) {
    return l;
  }

  const availableEvaluations = evaluationsByRetailer.filter(
    (e) => e.evaluation?.isPriceAvailable && e.evaluation.effectivePriceCents !== null
  );

  const sortedAvailable = [...availableEvaluations].sort(
    (a, b) => a.evaluation!.effectivePriceCents! - b.evaluation!.effectivePriceCents!
  );

  const bestOffer = sortedAvailable[0] ?? null;
  const allThreeStoresVerified = availableEvaluations.length === 3;

  const maxDiscountPercent = Math.max(
    0,
    ...availableEvaluations.map((e) => e.evaluation?.verifiedDiscountPercent ?? 0)
  );

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setJustAdded(true);
    await addProductToActiveList(product.id, product.canonicalName, 1);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFavorite(product.id, product.canonicalName);
  };

  if (layout === 'list') {
    return (
      <motion.article
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, delay: Math.min(index * 0.03, 0.24) }}
        className="group relative flex flex-col md:flex-row items-stretch gap-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 hover:border-[var(--border-strong)] transition-all shadow-2xs hover:shadow-md"
      >
        <Link
          href={`/produkt/${product.slug}`}
          className="w-full md:w-44 h-36 shrink-0 block focus:outline-none"
        >
          <ProductIllustration
            slug={product.slug}
            categorySlug={product.categorySlug}
            brand={product.brand}
            packageQuantity={product.packageQuantity}
            packageUnit={product.packageUnit}
            imageUrl={product.imageUrl}
            className="w-full h-full"
          />
        </Link>

        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-medium text-[var(--text-muted)]">
                {product.categoryName}
              </span>
              {maxDiscountPercent > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#FDF0ED] text-[#C84B31] border border-[#F5C6BC] tabular-nums">
                  −{maxDiscountPercent} % overená zľava
                </span>
              )}
              {bestOffer && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#EAF6EF] text-[#177245]">
                  <Award className="h-3.5 w-3.5" />
                  {allThreeStoresVerified
                    ? `Najlacnejšie v ${bestOffer.retailerName} (3/3 obchodov)`
                    : `Najnižšia známa cena: ${bestOffer.retailerName} (${availableEvaluations.length}/3 obchodov)`}
                </span>
              )}
            </div>

            <Link
              href={`/produkt/${product.slug}`}
              className="text-lg font-bold text-[var(--text-primary)] hover:text-[#123524] transition-colors line-clamp-1"
            >
              {product.canonicalName}
            </Link>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Balenie: {String(product.packageQuantity).replace('.', ',')} {product.packageUnit}
              {product.variantDescriptor ? ` • ${product.variantDescriptor}` : ''}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
            {evaluationsByRetailer.map((r) => {
              const ev = r.evaluation;
              const isCheapest =
                bestOffer &&
                ev?.isPriceAvailable &&
                ev.effectivePriceCents === bestOffer.evaluation?.effectivePriceCents;

              return (
                <div
                  key={r.retailerSlug}
                  className={`rounded-xl border px-3 py-2 flex items-center justify-between ${
                    isCheapest
                      ? 'border-[#177245]/40 bg-[#EAF6EF]/60'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: r.color }}
                      />
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        {r.retailerName}
                      </span>
                      {ev?.priceType === 'LOYALTY' && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#FDF6E9] text-[#8F5B14] border border-[#E8C98E]">
                          {ev.loyaltyProgramName}
                        </span>
                      )}
                    </div>
                    {ev?.isPriceAvailable && ev.effectiveUnitPriceCents !== null ? (
                      <p className="text-[11px] text-[var(--text-muted)] font-mono-tabular mt-0.5">
                        {formatUnitPriceCents(ev.effectiveUnitPriceCents, ev.baseUnit)}
                      </p>
                    ) : (
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        Neoverená ponuka
                      </p>
                    )}
                  </div>

                  <div className="text-right font-mono-tabular">
                    {ev?.isPriceAvailable && ev.effectivePriceCents !== null ? (
                      <>
                        {ev.regularPriceCents &&
                          ev.regularPriceCents > ev.effectivePriceCents && (
                            <span className="block text-[11px] line-through text-[var(--text-muted)]">
                              {formatEurCents(ev.regularPriceCents)}
                            </span>
                          )}
                        <span
                          className={`text-sm font-bold ${
                            isCheapest ? 'text-[#177245]' : 'text-[var(--text-primary)]'
                          }`}
                        >
                          {formatEurCents(ev.effectivePriceCents)}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs font-medium text-[var(--text-muted)]">
                        Cena nedostupná
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex md:flex-col justify-between items-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-[var(--border-subtle)] pt-3 md:pt-0 md:pl-4">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleFavorite}
              aria-label={isFavorite ? 'Odstrániť z obľúbených' : 'Pridať medzi obľúbené'}
              className={`p-2 rounded-xl border transition-colors ${
                isFavorite
                  ? 'border-[#C84B31]/40 bg-[#FDF0ED] text-[#C84B31]'
                  : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <Link
              href={`/porovnanie?produkt=${product.slug}`}
              title="Detailné porovnanie v 3 obchodoch"
              className="p-2 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
            >
              <Scale className="h-4 w-4" />
            </Link>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#123524] hover:bg-[#1A4B33] text-white transition-colors shadow-2xs cursor-pointer"
          >
            {justAdded ? (
              <>
                <Check className="h-4 w-4" />
                <span>Pridané</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Do zoznamu</span>
              </>
            )}
          </button>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.24, delay: Math.min(index * 0.035, 0.25) }}
      className="group relative flex flex-col justify-between h-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 hover:border-[var(--border-strong)] transition-all shadow-2xs hover:shadow-md"
    >
      <div>
        {/* Top Image & Overlay Badges */}
        <div className="relative mb-3.5">
          <Link href={`/produkt/${product.slug}`} className="block focus:outline-none">
            <ProductIllustration
              slug={product.slug}
              categorySlug={product.categorySlug}
              brand={product.brand}
              packageQuantity={product.packageQuantity}
              packageUnit={product.packageUnit}
              imageUrl={product.imageUrl}
              className="h-44 w-full"
            />
          </Link>

          {maxDiscountPercent > 0 && (
            <motion.span
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute top-2.5 right-11 px-2 py-0.5 rounded-md text-xs font-bold bg-[#C84B31] text-white shadow-xs tabular-nums"
            >
              −{maxDiscountPercent} %
            </motion.span>
          )}

          <button
            type="button"
            onClick={handleFavorite}
            aria-label={isFavorite ? 'Odstrániť z obľúbených' : 'Pridať medzi obľúbené'}
            className={`absolute top-2 right-2 p-1.5 rounded-lg border backdrop-blur-xs transition-colors cursor-pointer ${
              isFavorite
                ? 'border-[#C84B31]/40 bg-[#FDF0ED] text-[#C84B31]'
                : 'border-[var(--border-subtle)] bg-white/85 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Category & Title */}
        <div className="mb-3">
          <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-muted)] mb-1">
            <span className="truncate">{product.categoryName}</span>
            {bestOffer?.evaluation?.effectiveUnitPriceCents && (
              <span className="font-mono-tabular font-medium text-[var(--text-secondary)] shrink-0">
                od{' '}
                {formatUnitPriceCents(
                  bestOffer.evaluation.effectiveUnitPriceCents,
                  bestOffer.evaluation.baseUnit
                )}
              </span>
            )}
          </div>

          <Link
            href={`/produkt/${product.slug}`}
            className="text-base font-bold text-[var(--text-primary)] group-hover:text-[#123524] transition-colors line-clamp-2 leading-snug min-h-[2.5rem] block"
          >
            {product.canonicalName}
          </Link>

          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mt-1">
            {product.brand && (
              <span className="font-semibold text-[var(--text-primary)] truncate max-w-[130px]">
                {product.brand}
              </span>
            )}
            {product.brand && <span>•</span>}
            <span className="font-mono-tabular">
              {String(product.packageQuantity).replace('.', ',')} {product.packageUnit}
            </span>
          </div>
        </div>

        {/* Best Known Offer Banner */}
        {(() => {
          const evalObj = bestOffer?.evaluation;
          if (!bestOffer || !evalObj || evalObj.effectivePriceCents === null) {
            return (
              <div className="mb-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-2 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Cena momentálne neoverená</span>
              </div>
            );
          }
          return (
            <div className="mb-3 rounded-xl border border-[#177245]/30 bg-[#EAF6EF]/65 px-3 py-2 flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-[#177245] shrink-0" />
                  <span className="text-[11px] font-bold text-[#177245] truncate">
                    {allThreeStoresVerified
                      ? `Najvýhodnejšie: ${bestOffer.retailerName}`
                      : `Najnižšia známa (${availableEvaluations.length}/3): ${bestOffer.retailerName}`}
                  </span>
                </div>
                {evalObj.priceType === 'LOYALTY' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#8F5B14] mt-0.5">
                    <CreditCard className="h-3 w-3" />
                    S kartou {evalObj.loyaltyProgramName}
                  </span>
                )}
              </div>
              <div className="text-right font-mono-tabular shrink-0 pl-2">
                {evalObj.regularPriceCents &&
                  evalObj.regularPriceCents > evalObj.effectivePriceCents && (
                    <span className="block text-[11px] line-through text-[var(--text-muted)]">
                      {formatEurCents(evalObj.regularPriceCents)}
                    </span>
                  )}
                <span className="text-lg font-extrabold text-[#123524]">
                  {formatEurCents(evalObj.effectivePriceCents)}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Store Matrix (Lidl, Tesco, BILLA) */}
        <div className="space-y-1.5 mb-4">
          {evaluationsByRetailer.map((r) => {
            const ev = r.evaluation;
            const isCheapest =
              bestOffer &&
              ev?.isPriceAvailable &&
              ev.effectivePriceCents === bestOffer.evaluation?.effectivePriceCents;

            return (
              <div
                key={r.retailerSlug}
                className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg border ${
                  isCheapest
                    ? 'border-[#177245]/35 bg-[#EAF6EF]/40 font-semibold'
                    : 'border-transparent bg-[var(--bg-elevated)]'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: r.color }}
                  />
                  <span className="text-[var(--text-primary)] font-medium">{r.retailerName}</span>
                  {ev?.priceType === 'LOYALTY' && (
                    <span className="px-1.5 py-0.2 text-[10px] font-semibold rounded bg-[#FDF6E9] text-[#8F5B14] border border-[#E8C98E] truncate">
                      {ev.loyaltyProgramName}
                    </span>
                  )}
                  {ev?.priceType === 'PROMO' && (
                    <span className="px-1.5 py-0.2 text-[10px] font-semibold rounded bg-[#FDF0ED] text-[#C84B31]">
                      Akcia
                    </span>
                  )}
                </div>

                <div className="font-mono-tabular text-right shrink-0 pl-2">
                  {ev?.isPriceAvailable && ev.effectivePriceCents !== null ? (
                    <span
                      className={
                        isCheapest
                          ? 'text-[#177245] font-bold'
                          : 'text-[var(--text-primary)] font-semibold'
                      }
                    >
                      {formatEurCents(ev.effectivePriceCents)}
                    </span>
                  ) : (
                    <span className="text-[11px] text-[var(--text-muted)] italic">
                      Nedostupná
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
        <Link
          href={`/produkt/${product.slug}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <span>História a detail</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={handleAdd}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            justAdded
              ? 'bg-[#177245] text-white'
              : 'bg-[#123524] hover:bg-[#1A4B33] text-white'
          }`}
        >
          {justAdded ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Pridané</span>
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              <span>Do košíka</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.article>
  );
}
