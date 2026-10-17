'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calculator,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Tag,
  ShoppingBasket,
  Database,
} from 'lucide-react';
import type { ProductWithOffers, BasketOptimizationResult } from '@/lib/domain/types';
import type { DataSourceRecord, WeeklyOfferItem } from '@/lib/db/repository';
import { formatEurCents, formatUnitPriceCents } from '@/lib/domain/money';
import { ProductCard } from '@/components/ui/ProductCard';

interface HomeInteractiveClientProps {
  storedMetrics: {
    verifiedCatalogProductsCount: number;
    totalStoredPriceObservationsCount: number;
    activeVerifiedPromotionsCount: number;
    supportedRetailersCount: number;
    lastVerificationTimestamp: string;
  };
  todaysVerifiedOffers: WeeklyOfferItem[];
  popularProducts: ProductWithOffers[];
  categories: Array<{
    slug: string;
    name: string;
    productCount: number;
    activeOffersCount: number;
  }>;
  recentlyUpdatedPrices: Array<{
    observationId: string;
    productSlug: string;
    productName: string;
    brand: string | null;
    packageLabel: string;
    retailerSlug: string;
    retailerName: string;
    regularPriceCents: number | null;
    effectivePriceCents: number | null;
    unitPriceCents: number | null;
    baseUnit: 'kg' | 'l' | 'ks' | '100g';
    requiresLoyaltyCard: boolean;
    loyaltyProgramName: string | null;
    discountPercentage: number | null;
    observedAt: string;
    sourceUrl: string;
  }>;
  dataSources: DataSourceRecord[];
  defaultBasketOptimization: BasketOptimizationResult;
}

export function HomeInteractiveClient({
  storedMetrics,
  todaysVerifiedOffers,
  popularProducts,
  categories,
  recentlyUpdatedPrices,
  dataSources,
  defaultBasketOptimization,
}: HomeInteractiveClientProps) {
  const router = useRouter();
  const [heroSearch, setHeroSearch] = useState('');
  const [weeklyFrequency, setWeeklyFrequency] = useState<number>(1);
  const [includeMultiStoreSplit, setIncludeMultiStoreSplit] = useState<boolean>(true);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      router.push(`/katalog?q=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      router.push('/katalog');
    }
  };

  // Savings Calculator derived directly from stored family basket optimization
  const lidlTotal = defaultBasketOptimization.singleStoreByRetailer.lidl.knownSubtotalCents;
  const tescoTotal = defaultBasketOptimization.singleStoreByRetailer.tesco.knownSubtotalCents;
  const billaTotal = defaultBasketOptimization.singleStoreByRetailer.billa.knownSubtotalCents;
  const highestSingleStore = Math.max(lidlTotal, tescoTotal, billaTotal);
  const cheapestSingleStore =
    defaultBasketOptimization.cheapestCompleteSingleStore?.totalCents ??
    Math.min(lidlTotal, tescoTotal, billaTotal);
  const multiStoreNet = defaultBasketOptimization.multiStoreStrategy.netEffectiveTotalCents;

  const chosenOptimizedTotal = includeMultiStoreSplit
    ? Math.min(cheapestSingleStore, multiStoreNet)
    : cheapestSingleStore;

  const perBasketSavingsCents = Math.max(0, highestSingleStore - chosenOptimizedTotal);
  const monthlySavingsCents = perBasketSavingsCents * 4 * weeklyFrequency;
  const yearlySavingsCents = perBasketSavingsCents * 52 * weeklyFrequency;

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-14">
      {/* Editorial Hero & Main Search Experience */}
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border-strong)] bg-gradient-to-br from-[#123524] via-[#163F2B] to-[#0E291C] text-[#F7F5F0] p-6 sm:p-10 lg:p-12 shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-xs font-medium text-[#A7F3D0]">
              <img src="/images/brand/logo.png" alt="Price Checker Logo" className="h-5 w-5 rounded-md object-cover border border-white/20 shrink-0" />
              <span>Price Checker • Overené cenové pozorovania Lidl, Tesco a BILLA</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.12]">
              Nakupujte potraviny{' '}
              <span className="font-serif-editorial italic font-normal text-[#FDE68A]">
                s presnosťou na cent
              </span>{' '}
              a overenou jednotkovou cenou.
            </h1>

            <p className="text-sm sm:text-base text-[#D6E3DC] max-w-2xl leading-relaxed">
              Porovnávame reálne ceny základných potravín, oddeľujeme bežné akcie od cien s
              vernostnými kartami (<strong>Lidl Plus</strong>, <strong>Clubcard</strong>,{' '}
              <strong>BILLA Bonus</strong>) a vypočítame najlacnejší nákupný košík.
            </p>

            {/* Hero Search Bar */}
            <form onSubmit={handleHeroSearch} className="pt-1 max-w-2xl">
              <div className="flex flex-col sm:flex-row gap-2.5 p-2 rounded-2xl bg-white text-[#141815] shadow-xl">
                <div className="flex items-center flex-1 px-3">
                  <Search className="h-5 w-5 text-[#768079] shrink-0" />
                  <input
                    type="search"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    placeholder="Hľadajte maslo 82 %, mlieko Rajo, kuracie štvrte alebo EAN 8585000902797..."
                    className="w-full px-3 py-2.5 text-sm text-[#141815] placeholder:text-[#768079] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#123524] hover:bg-[#1A4B33] text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <span>Porovnať ceny</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>

            {/* Quick Search Chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#D6E3DC]">
              <span className="text-[#9CB5A8]">Rýchle hľadanie:</span>
              {[
                { label: 'Tatranské maslo 250 g', q: 'maslo' },
                { label: 'Rajo mlieko 1,5 %', q: 'mlieko' },
                { label: 'Vajcia M 10 ks', q: 'vajcia' },
                { label: 'Kofola 1,5 l', q: 'kofola' },
                { label: 'EAN: 8585000902797', q: '8585000902797' },
              ].map((chip) => (
                <Link
                  key={chip.q}
                  href={`/katalog?q=${encodeURIComponent(chip.q)}`}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 transition-colors"
                >
                  {chip.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Column: Live Stored Database Metrics & Quick Basket Preview */}
          <div className="lg:col-span-5 space-y-3.5">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/15 pb-3">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#A7F3D0] font-bold block">
                    Uložené dáta v databáze
                  </span>
                  <h2 className="text-sm font-bold text-white mt-0.5">
                    Stav overeného katalógu (bez odhadov)
                  </h2>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-[#177245] text-white text-[11px] font-mono-tabular font-semibold">
                  Aktívne
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono-tabular">
                <div className="rounded-xl bg-black/20 p-3 border border-white/10">
                  <span className="text-xs text-[#C9D8CF] block font-sans">
                    Overené produkty
                  </span>
                  <span className="text-2xl font-extrabold text-white mt-0.5 block">
                    {storedMetrics.verifiedCatalogProductsCount}
                  </span>
                </div>
                <div className="rounded-xl bg-black/20 p-3 border border-white/10">
                  <span className="text-xs text-[#C9D8CF] block font-sans">
                    Cenové pozorovania
                  </span>
                  <span className="text-2xl font-extrabold text-[#86EFAC] mt-0.5 block">
                    {storedMetrics.totalStoredPriceObservationsCount}
                  </span>
                </div>
                <div className="rounded-xl bg-black/20 p-3 border border-white/10">
                  <span className="text-xs text-[#C9D8CF] block font-sans">
                    Platné akcie dnes
                  </span>
                  <span className="text-2xl font-extrabold text-[#FDE68A] mt-0.5 block">
                    {storedMetrics.activeVerifiedPromotionsCount}
                  </span>
                </div>
                <div className="rounded-xl bg-black/20 p-3 border border-white/10">
                  <span className="text-xs text-[#C9D8CF] block font-sans">
                    Porovnané reťazce
                  </span>
                  <span className="text-2xl font-extrabold text-white mt-0.5 block">
                    {storedMetrics.supportedRetailersCount} (SK)
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#D6E3DC]">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#86EFAC]" />
                  Posledná verifikácia:{' '}
                  <strong className="font-mono-tabular">
                    {storedMetrics.lastVerificationTimestamp.slice(0, 10)}
                  </strong>
                </span>
                <Link
                  href="/optimalizator"
                  className="inline-flex items-center gap-1 font-bold text-[#FDE68A] hover:underline"
                >
                  <span>Otvoriť optimalizátor košíka</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Navigation Feature Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            href: '/optimalizator',
            title: 'Optimalizátor košíka',
            desc: 'Výpočet najlacnejšieho nákupu v 1 obchode alebo kombináciou viacerých reťazcov.',
            icon: ShoppingBasket,
            badge: 'Kľúčová funkcia',
          },
          {
            href: '/porovnanie',
            title: 'Porovnanie Lidl • Tesco • BILLA',
            desc: 'Detailné porovnanie cien, jednotkových cien (€/kg, €/l) a podmienok kariet.',
            icon: Scale,
            badge: '3 reťazce',
          },
          {
            href: '/akcie',
            title: 'Týždenné akcie & letáky',
            desc: 'Oddelený prehľad bežných akcií a zliav vyžadujúcich vernostnú kartu.',
            icon: Tag,
            badge: `${storedMetrics.activeVerifiedPromotionsCount} akcií`,
          },
          {
            href: '/historia-cien',
            title: 'História cien & Zdroje dát',
            desc: 'Vývoj cien v čase, detekcia medzier v dátach, živé adaptéry a CSV import.',
            icon: Database,
            badge: 'Plná transparentnosť',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 hover:border-[#123524] transition-all shadow-2xs hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-[var(--brand-accent-soft)] text-[#123524]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                    {card.badge}
                  </span>
                </div>
                <h2 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[#123524] transition-colors">
                  {card.title}
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  {card.desc}
                </p>
              </div>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#123524]">
                <span>Prejsť na sekciu</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </section>

      {/* Today's Verified Promotional Offers */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#C84B31]">
              Overené akciové ponuky dnes
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mt-1">
              Najvyššie overené zľavy v letákoch a predajniach
            </h2>
          </div>
          <Link
            href="/akcie"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#123524] hover:underline"
          >
            <span>Zobraziť všetky týždenné akcie</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {todaysVerifiedOffers.map((offer, i) => (
            <motion.div
              key={offer.promotionId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: i * 0.04 }}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 flex flex-col justify-between hover:border-[var(--border-strong)] transition-all shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span
                    className="px-2.5 py-0.5 rounded-md text-xs font-bold text-white"
                    style={{
                      backgroundColor:
                        offer.retailerSlug === 'lidl'
                          ? '#1D4ED8'
                          : offer.retailerSlug === 'tesco'
                            ? '#0F4C81'
                            : '#B45309',
                    }}
                  >
                    {offer.retailerName}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {offer.requiresLoyaltyCard && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FDF6E9] text-[#8F5B14] border border-[#E8C98E]">
                        S kartou {offer.loyaltyProgramName}
                      </span>
                    )}
                    {offer.verifiedDiscountPercent !== null && (
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#C84B31] text-white font-mono-tabular">
                        −{offer.verifiedDiscountPercent} %
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  href={`/produkt/${offer.productSlug}`}
                  className="text-base font-bold text-[var(--text-primary)] hover:text-[#123524] transition-colors line-clamp-1"
                >
                  {offer.productName}
                </Link>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {offer.brand ? `${offer.brand} • ` : ''}Balenie: {offer.packageLabel}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-end justify-between">
                <div>
                  <span className="text-[11px] text-[var(--text-muted)] block">
                    Jednotková cena:{' '}
                    <strong className="font-mono-tabular text-[var(--text-secondary)]">
                      {formatUnitPriceCents(offer.unitPriceCents, offer.baseUnit)}
                    </strong>
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">
                    Platí do:{' '}
                    <span className="font-mono-tabular">{offer.validTo.slice(0, 10)}</span>
                  </span>
                </div>

                <div className="text-right font-mono-tabular">
                  {offer.regularPriceCents && (
                    <span className="block text-xs line-through text-[var(--text-muted)]">
                      {formatEurCents(offer.regularPriceCents)}
                    </span>
                  )}
                  <span className="text-xl font-extrabold text-[#177245]">
                    {formatEurCents(offer.promoPriceCents)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Popular Everyday Staples Grid */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#177245]">
              Základné potraviny v domácnosti
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mt-1">
              Porovnanie najčastejšie nakupovaných potravín
            </h2>
          </div>
          <Link
            href="/katalog"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#123524] hover:underline"
          >
            <span>Otvoriť celý katalóg ({storedMetrics.verifiedCatalogProductsCount} produktov)</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {popularProducts.map((product, idx) => (
            <ProductCard key={product.id} product={product} index={idx} />
          ))}
        </div>
      </section>

      {/* Interactive Household Savings Calculator (Backed by Real Stored Family Basket) */}
      <section className="rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 sm:p-8 lg:p-10 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF6EF] text-[#177245] text-xs font-bold">
              <Calculator className="h-3.5 w-3.5" />
              <span>Kalkulačka úspor založená na uloženom rodinnom košíku (8 položiek / 17 ks)</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
              Koľko ušetríte cieleným výberom obchodu na reálnom rodinnom nákupe?
            </h2>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Výpočet vychádza zo skutočne uložených cien v zozname{' '}
              <strong>„Veľký týždenný rodinný nákup“</strong> (maslo, 4× mlieko, vajcia, kuracie
              mäso, oštiepok, banány, cestoviny, kváskový chlieb), kde majú všetky 3 reťazce 100 %
              overené ceny.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono-tabular">
              {(
                [
                  { slug: 'lidl', name: 'Lidl Slovakia', cents: lidlTotal, color: '#1D4ED8' },
                  { slug: 'tesco', name: 'Tesco Slovakia', cents: tescoTotal, color: '#0F4C81' },
                  { slug: 'billa', name: 'BILLA Slovakia', cents: billaTotal, color: '#B45309' },
                ] as const
              ).map((st) => {
                const isCheapest = st.cents === cheapestSingleStore;
                return (
                  <div
                    key={st.slug}
                    className={`rounded-2xl border p-4 ${
                      isCheapest
                        ? 'border-[#177245] bg-[#EAF6EF]/60'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-sans font-bold text-[var(--text-primary)]">
                        {st.name}
                      </span>
                      {isCheapest && (
                        <span className="text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-[#177245] text-white">
                          Najlacnejší 1 obchod
                        </span>
                      )}
                    </div>
                    <span className="text-xl font-extrabold text-[var(--text-primary)] block mt-1.5">
                      {formatEurCents(st.cents)}
                    </span>
                    <span className="text-[11px] font-sans text-[var(--text-muted)]">
                      8/8 položiek overených
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span>Počet takýchto nákupov za týždeň:</span>
                  <span className="font-mono-tabular font-bold text-[#123524]">
                    {weeklyFrequency}× týždenne
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={1}
                  value={weeklyFrequency}
                  onChange={(e) => setWeeklyFrequency(Number(e.target.value))}
                  aria-label="Počet nákupov za týždeň"
                  className="w-full accent-[#123524] cursor-pointer"
                />
              </div>

              <label className="flex items-center gap-2.5 text-xs font-medium text-[var(--text-primary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMultiStoreSplit}
                  onChange={(e) => setIncludeMultiStoreSplit(e.target.checked)}
                  className="h-4 w-4 rounded accent-[#123524]"
                />
                <span>
                  Zahrnúť rozdelenie nákupu do 2 obchodov (po odpočítaní nákladov na cestu 1,50 €)
                </span>
              </label>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-[#177245]/30 bg-[#EAF6EF] p-6 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#177245] block">
              Potenciálna úspora domácnosti
            </span>

            <div className="space-y-3 font-mono-tabular">
              <div className="flex items-baseline justify-between border-b border-[#177245]/20 pb-3">
                <span className="text-xs font-sans text-[#141815]">Úspora na 1 košíku:</span>
                <span className="text-2xl font-extrabold text-[#177245]">
                  {formatEurCents(perBasketSavingsCents)}
                </span>
              </div>
              <div className="flex items-baseline justify-between border-b border-[#177245]/20 pb-3">
                <span className="text-xs font-sans text-[#141815]">Mesačná úspora (4 týždne):</span>
                <span className="text-2xl font-extrabold text-[#123524]">
                  {formatEurCents(monthlySavingsCents)}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-sans font-bold text-[#141815]">
                  Ročná úspora (52 týždňov):
                </span>
                <span className="text-3xl font-extrabold text-[#177245]">
                  {formatEurCents(yearlySavingsCents)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#4A544E] leading-relaxed">
              * Výpočet porovnáva najdrahší plne oceniteľný košík ({formatEurCents(highestSingleStore)})
              s optimalizovaným výberom ({formatEurCents(chosenOptimizedTotal)}). Skutočná úspora
              závisí od vzdialenosti predajní a dostupnosti tovaru.
            </p>

            <Link
              href="/optimalizator"
              className="w-full py-3 px-4 rounded-xl bg-[#123524] hover:bg-[#1A4B33] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              <span>Prepočítať vlastný nákupný zoznam</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Overview */}
      <section className="space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Kategórie potravín
          </span>
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)] mt-1">
            Prehliadať podľa oddelenia
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/katalog?category=${encodeURIComponent(cat.slug)}`}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 hover:border-[#123524] transition-all flex flex-col justify-between group"
            >
              <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[#123524]">
                {cat.name}
              </h3>
              <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)] font-mono-tabular">
                <span>{cat.productCount} produktov</span>
                <span className="text-[#C84B31] font-semibold">{cat.activeOffersCount} v akcii</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recently Updated Prices & Data Sources Freshness */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Naposledy overené cenové záznamy
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Každý záznam obsahuje časovú pečiatku a odkaz na pôvodný zdroj.
              </p>
            </div>
            <Link
              href="/historia-cien"
              className="text-xs font-bold text-[#123524] hover:underline"
            >
              Celý protokol →
            </Link>
          </div>

          <div className="divide-y divide-[var(--border-subtle)]">
            {recentlyUpdatedPrices.map((obs) => (
              <div
                key={obs.observationId}
                className="py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--text-primary)]">
                      {obs.retailerName}
                    </span>
                    <span className="text-[var(--text-muted)]">•</span>
                    <Link
                      href={`/produkt/${obs.productSlug}`}
                      className="font-semibold text-[var(--text-primary)] hover:text-[#123524] truncate"
                    >
                      {obs.productName} ({obs.packageLabel})
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mt-0.5">
                    <span className="font-mono-tabular">{obs.observedAt.slice(0, 10)}</span>
                    {obs.requiresLoyaltyCard && (
                      <span className="text-[#8F5B14] font-semibold">
                        • {obs.loyaltyProgramName}
                      </span>
                    )}
                    <a
                      href={obs.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-0.5 hover:underline text-[var(--text-secondary)]"
                    >
                      Zdroj <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>

                <div className="text-right font-mono-tabular shrink-0">
                  {obs.regularPriceCents &&
                    obs.effectivePriceCents &&
                    obs.regularPriceCents > obs.effectivePriceCents && (
                      <span className="text-[11px] line-through text-[var(--text-muted)] mr-1.5">
                        {formatEurCents(obs.regularPriceCents)}
                      </span>
                    )}
                  <span className="text-sm font-bold text-[#177245]">
                    {formatEurCents(obs.effectivePriceCents)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Freshness & Retailer Adapter Transparency */}
        <div className="lg:col-span-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Transparentnosť zdrojov dát
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 mb-4">
              Prehľad aktívnych dátových adaptérov a technických obmedzení reťazcov.
            </p>

            <div className="space-y-3">
              {dataSources.map((ds) => {
                const isLive = ds.reliabilityStatus === 'VERIFIED_LIVE';
                return (
                  <div
                    key={ds.id}
                    className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[var(--text-primary)]">{ds.name}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isLive
                            ? 'bg-[#EAF6EF] text-[#177245]'
                            : 'bg-[#FDF6E9] text-[#8F5B14]'
                        }`}
                      >
                        {isLive ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {ds.reliabilityStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                      {ds.notes}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <Link
            href="/historia-cien"
            className="mt-4 w-full py-2.5 px-4 rounded-xl border border-[var(--border-strong)] hover:border-[#123524] text-xs font-bold text-center text-[var(--text-primary)] transition-colors"
          >
            Spustiť živý import alebo nahrať CSV leták →
          </Link>
        </div>
      </section>
    </div>
  );
}
