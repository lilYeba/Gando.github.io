'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  ShoppingBag,
  Store,
  CreditCard,
  Car,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  TrendingDown,
  Info,
  Layers,
  ArrowRight,
  ShieldAlert,
  Sliders,
  DollarSign,
} from 'lucide-react';
import { formatEur } from '@/lib/domain/money';
import type { ShoppingListRecord } from '@/lib/db/repository';
import type {
  BasketOptimizationResult,
  RetailerSlug,
  SingleStoreBasketEvaluation,
} from '@/lib/domain/types';

interface BasketOptimizerProps {
  lists: ShoppingListRecord[];
  initialListId: string;
  initialOptimization: BasketOptimizationResult | null;
}

export function BasketOptimizerClient({
  lists,
  initialListId,
  initialOptimization,
}: BasketOptimizerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedListId, setSelectedListId] = useState<string>(initialListId);
  const [optimization, setOptimization] = useState<BasketOptimizationResult | null>(
    initialOptimization
  );
  const [expandedStore, setExpandedStore] = useState<RetailerSlug | null>(null);

  // Settings
  const [includeLidlPlus, setIncludeLidlPlus] = useState(true);
  const [includeTescoClubcard, setIncludeTescoClubcard] = useState(true);
  const [includeBillaBonus, setIncludeBillaBonus] = useState(true);
  const [maxStores, setMaxStores] = useState<number>(2);
  const [tripCostEur, setTripCostEur] = useState<number>(1.5);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Trigger Recalculate
  const recalculate = async (
    newListId = selectedListId,
    newLoyalty = {
      includeLidlPlus,
      includeTescoClubcard,
      includeBillaBonus,
    },
    newMaxStores = maxStores,
    newTripCost = tripCostEur
  ) => {
    setIsRecalculating(true);
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId: newListId,
          loyalty: newLoyalty,
          maxStoresAllowed: newMaxStores,
          tripCostPerExtraStoreCents: Math.round(newTripCost * 100),
        }),
      });

      if (res.ok) {
        const { optimization: newResult } = await res.json();
        setOptimization(newResult);
      }
    } catch {
      // Keep existing result on error
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleListChange = (listId: string) => {
    setSelectedListId(listId);
    recalculate(listId);
    startTransition(() => {
      router.replace(`/optimalizator?listId=${listId}`, { scroll: false });
    });
  };

  const handleLoyaltyToggle = (card: 'lidl' | 'tesco' | 'billa') => {
    const updated = {
      includeLidlPlus: card === 'lidl' ? !includeLidlPlus : includeLidlPlus,
      includeTescoClubcard: card === 'tesco' ? !includeTescoClubcard : includeTescoClubcard,
      includeBillaBonus: card === 'billa' ? !includeBillaBonus : includeBillaBonus,
    };
    if (card === 'lidl') setIncludeLidlPlus(!includeLidlPlus);
    if (card === 'tesco') setIncludeTescoClubcard(!includeTescoClubcard);
    if (card === 'billa') setIncludeBillaBonus(!includeBillaBonus);

    recalculate(selectedListId, updated);
  };

  const handleMaxStoresChange = (val: number) => {
    setMaxStores(val);
    recalculate(selectedListId, undefined, val, tripCostEur);
  };

  const handleTripCostChange = (val: number) => {
    setTripCostEur(val);
    recalculate(selectedListId, undefined, maxStores, val);
  };

  const activeListMeta = lists.find((l) => l.id === selectedListId);

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <section className="bg-white rounded-2xl border border-stone-200/80 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-2">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>Algoritmický nákupný poradca</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 tracking-tight">
              Optimalizátor nákupného košíka
            </h1>
            <p className="text-stone-600 mt-2 text-base max-w-2xl leading-relaxed">
              Zistite skutočnú celkovú sumu nákupu v troch reťazcoch. Ak má niektorý obchod neoverenú cenu tovaru,
              poctivo zobrazujeme iba čiastočný medzisúčet — nikdy nepredstierame nulovú cenu ani kompletný nákup.
            </p>
          </div>

          {/* List switcher dropdown */}
          <div className="bg-[#F7F5F0] p-4 rounded-xl border border-stone-200/80 shrink-0 min-w-[260px]">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-1.5">
              Hodnotený nákupný zoznam:
            </label>
            <select
              value={selectedListId}
              onChange={(e) => handleListChange(e.target.value)}
              className="w-full bg-white border border-stone-300 text-stone-900 rounded-lg p-2.5 text-sm font-medium focus:outline-emerald-800 shadow-2xs"
            >
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.itemCount ?? 0} pol.)
                </option>
              ))}
            </select>
            <div className="flex justify-between items-center mt-2 text-xs text-stone-500">
              <Link
                href={`/zoznam?list=${selectedListId}`}
                className="text-emerald-800 hover:text-emerald-950 font-medium flex items-center gap-1"
              >
                <span>Upraviť položky v zozname</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Strategy Parameters Panel */}
        <div className="mt-8 pt-6 border-t border-stone-100 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Loyalty Cards */}
          <div>
            <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-stone-500" />
              Zahrnúť vernostné ceny:
            </span>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLidlPlus}
                  onChange={() => handleLoyaltyToggle('lidl')}
                  className="rounded text-emerald-800 focus:ring-emerald-800"
                />
                <span>Lidl Plus (aplikácia)</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTescoClubcard}
                  onChange={() => handleLoyaltyToggle('tesco')}
                  className="rounded text-emerald-800 focus:ring-emerald-800"
                />
                <span>Tesco Clubcard</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeBillaBonus}
                  onChange={() => handleLoyaltyToggle('billa')}
                  className="rounded text-emerald-800 focus:ring-emerald-800"
                />
                <span>BILLA Bonus</span>
              </label>
            </div>
          </div>

          {/* 2. Max Stores for Multi-Store split */}
          <div>
            <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-stone-500" />
              Max. počet predajní pri delení:
            </span>
            <div className="flex gap-2">
              {[
                { val: 1, label: '1 obchod (bez delenia)' },
                { val: 2, label: 'Max. 2' },
                { val: 3, label: 'Až 3' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => handleMaxStoresChange(opt.val)}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium border transition-all ${
                    maxStores === opt.val
                      ? 'bg-stone-900 text-white border-stone-900 shadow-2xs font-semibold'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-stone-500 mt-2 block">
              Určuje, do koľkých predajní ste ochotní ísť nakúpiť.
            </span>
          </div>

          {/* 3. Trip Cost per extra store */}
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-stone-500" />
                Náklad na cestu do ďalšej predajne:
              </span>
              <span className="font-mono font-bold text-xs text-emerald-800">
                {tripCostEur.toFixed(2).replace('.', ',')} €
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={tripCostEur}
              onChange={(e) => handleTripCostChange(parseFloat(e.target.value))}
              className="w-full accent-emerald-800 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400 font-mono mt-1">
              <span>0,00 € (pešo)</span>
              <span>2,50 €</span>
              <span>5,00 € (auto / čas)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Recalculating overlay indicator */}
      {isRecalculating && (
        <div className="text-center py-2 text-xs text-stone-500 animate-pulse font-mono">
          Prepočítavam ceny a optimalizačné stratégie...
        </div>
      )}

      {optimization ? (
        <div className="space-y-8">
          {/* Winner Banner or Partial Coverage Notice */}
          {optimization.cheapestCompleteSingleStore ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-900 text-white p-6 rounded-2xl shadow-md border border-emerald-800 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-800 rounded-xl flex items-center justify-center shrink-0 border border-emerald-700 shadow-inner">
                  <Award className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-emerald-300 font-semibold block">
                    Najvýhodnejší kompletný nákup na jednom mieste
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-white mt-0.5">
                    {optimization.cheapestCompleteSingleStore.retailerName}
                  </h2>
                  <p className="text-emerald-100 text-sm mt-1 max-w-xl">
                    Všetky tovary zo zoznamu sú v tomto reťazci overené a dostupné. Ušetríte{' '}
                    <strong className="text-emerald-300">
                      {formatEur(
                        optimization.cheapestCompleteSingleStore.savingsVsMostExpensiveCompleteCents
                      )}
                    </strong>{' '}
                    (alebo {optimization.cheapestCompleteSingleStore.savingsPercentage} %) oproti najdrahšiemu
                    konkurentovi.
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 bg-emerald-950/60 p-4 rounded-xl border border-emerald-800/80">
                <span className="text-xs text-emerald-300 block mb-0.5">Konečný účet za košík:</span>
                <span className="text-3xl font-mono font-extrabold text-white">
                  {formatEur(optimization.cheapestCompleteSingleStore.totalCents)}
                </span>
              </div>
            </motion.div>
          ) : (
            <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-6 text-amber-950 flex items-start gap-4 shadow-2xs">
              <AlertTriangle className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-serif font-bold text-lg text-amber-950">
                  Čiastočné porovnanie — niektoré ceny nie sú v reťazcoch evidované
                </h3>
                <p className="text-sm text-amber-800 mt-1 max-w-2xl leading-relaxed">
                  Žiadny reťazec nemá overenú cenu pre 100 % položiek tohto zoznamu (napr. vlastné položky alebo tovary
                  neuvedené v letákoch). V takomto prípade zásadne neuvádzame falošnú celkovú sumu, ale porovnávame
                  čiastočné medzisúčty pre overené položky.
                </p>
              </div>
            </div>
          )}

          {/* 3 Retailer Cards (Lidl vs Tesco vs BILLA) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['lidl', 'tesco', 'billa'] as RetailerSlug[]).map((slug) => {
              const evalResult: SingleStoreBasketEvaluation = optimization.singleStoreByRetailer[slug];
              if (!evalResult) return null;

              const isWinner =
                optimization.cheapestCompleteSingleStore?.retailerSlug === slug;
              const isComplete = evalResult.basketStatus === 'COMPLETE';
              const isExpanded = expandedStore === slug;

              const getRetailerBorder = () => {
                if (isWinner) return 'border-emerald-600 ring-2 ring-emerald-600/30';
                if (slug === 'lidl') return 'border-blue-200 hover:border-blue-400';
                if (slug === 'tesco') return 'border-red-200 hover:border-red-400';
                return 'border-amber-200 hover:border-amber-400';
              };

              return (
                <div
                  key={slug}
                  className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs flex flex-col justify-between overflow-hidden ${getRetailerBorder()}`}
                >
                  <div className="p-6">
                    {/* Store Title & Badges */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-serif font-bold text-xl text-stone-900">
                          {evalResult.retailerName}
                        </h3>
                        {evalResult.loyaltyProgramName && (
                          <span className="text-[11px] text-stone-500 font-medium">
                            Karta: {evalResult.loyaltyProgramName}
                          </span>
                        )}
                      </div>

                      {/* Coverage Pill */}
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border font-mono ${
                          isComplete
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {evalResult.verifiedPricedItems} / {evalResult.totalRequestedItems} položiek
                      </span>
                    </div>

                    {/* Price Presentation (COMPLETE vs PARTIAL) */}
                    <div className="py-4 border-y border-stone-100 bg-[#F7F5F0]/60 -mx-6 px-6">
                      {isComplete ? (
                        <div>
                          <span className="text-xs text-emerald-800 font-semibold block uppercase tracking-wider mb-1">
                            Celková suma nákupu (100 %)
                          </span>
                          <div className="text-3xl font-mono font-bold text-stone-900">
                            {formatEur(evalResult.completeBasketTotalCents)}
                          </div>
                          {evalResult.regularSubtotalCents > (evalResult.completeBasketTotalCents ?? 0) && (
                            <span className="text-xs text-stone-400 line-through font-mono mt-0.5 block">
                              Pôvodne: {formatEur(evalResult.regularSubtotalCents)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold uppercase tracking-wider mb-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Čiastočný medzisúčet</span>
                          </div>
                          <div className="text-3xl font-mono font-bold text-stone-900">
                            {formatEur(evalResult.knownSubtotalCents)}
                          </div>
                          <span className="text-xs text-amber-700 mt-1 block">
                            Chýba {evalResult.missingPriceItemsCount} položiek bez overenej ceny
                          </span>
                        </div>
                      )}

                      {/* Savings Breakdown */}
                      {evalResult.totalSavingsCents > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex items-center justify-between text-xs">
                          <span className="text-stone-600">Celková zľava:</span>
                          <span className="font-mono font-bold text-rose-700">
                            -{formatEur(evalResult.totalSavingsCents)}
                          </span>
                        </div>
                      )}
                      {evalResult.loyaltyCardSavingsCents > 0 && (
                        <div className="flex items-center justify-between text-xs mt-1 text-amber-800">
                          <span>Z toho s kartou:</span>
                          <span className="font-mono font-semibold">
                            -{formatEur(evalResult.loyaltyCardSavingsCents)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Missing Items Alert if any */}
                    {evalResult.missingItems.length > 0 && (
                      <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs space-y-1.5">
                        <span className="font-semibold text-amber-950 block">
                          Neoverené tovary v tomto obchode:
                        </span>
                        {evalResult.missingItems.map((m) => (
                          <div
                            key={m.itemId}
                            className="text-amber-800 flex items-center justify-between"
                          >
                            <span className="truncate max-w-[170px]">{m.title}</span>
                            <span className="font-mono text-[10px] bg-amber-200/60 px-1.5 py-0.5 rounded-sm">
                              {m.reason === 'UNCATALOGED_CUSTOM_ITEM' ? 'Vlastná' : 'Chýba leták'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Expandable item receipt */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 space-y-2 text-xs border-t border-stone-100 pt-3"
                      >
                        <span className="font-semibold text-stone-700 block mb-2">
                          Rozpis overených položiek:
                        </span>
                        {evalResult.pricedLineItems.map((line) => (
                          <div
                            key={line.itemId}
                            className="flex items-center justify-between py-1 border-b border-stone-50"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="text-stone-800 font-medium truncate block">
                                {line.title}
                              </span>
                              <span className="text-[11px] text-stone-400 font-mono">
                                {line.quantity} × {formatEur(line.unitPriceCents)}
                                {line.priceType === 'LOYALTY' && ' (karta)'}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-stone-900 shrink-0">
                              {formatEur(line.lineTotalCents)}
                            </span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {/* Card bottom toggle */}
                  <div className="px-6 py-3 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => setExpandedStore(isExpanded ? null : slug)}
                      className="text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'Skryť položky' : 'Rozbaliť položkový účet'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {isWinner && (
                      <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        Odporúčame
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comparable Common Subset Card (Fair Apples-to-Apples) */}
          {optimization.comparableCommonSubset &&
            optimization.comparableCommonSubset.commonItemCount > 0 &&
            optimization.comparableCommonSubset.commonItemCount <
              activeListMeta?.itemCount! && (
              <section className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center shrink-0 text-stone-700">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                        Poctivé porovnanie identického výrezu
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-xl text-stone-900 mt-0.5">
                      Spoločný prienik: {optimization.comparableCommonSubset.commonItemCount} položiek
                      overených vo všetkých troch reťazcoch
                    </h3>
                    <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
                      Keďže niektoré tovary v určitých obchodoch chýbajú, pre férové porovnanie počítame aj sumu len za
                      položky overené súčasne v Lidli, Tescu aj BILLE:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      {(['lidl', 'tesco', 'billa'] as RetailerSlug[]).map((slug) => {
                        const total =
                          optimization.comparableCommonSubset.totalsByRetailerCents[slug];
                        const isCheapestOnSubset =
                          optimization.comparableCommonSubset.cheapestRetailerOnCommonSubset ===
                          slug;
                        const name =
                          slug === 'lidl' ? 'Lidl' : slug === 'tesco' ? 'Tesco' : 'BILLA';

                        return (
                          <div
                            key={slug}
                            className={`p-4 rounded-xl border ${
                              isCheapestOnSubset
                                ? 'bg-emerald-50/70 border-emerald-300'
                                : 'bg-stone-50 border-stone-200'
                            }`}
                          >
                            <span className="text-xs text-stone-600 block">{name} (spoločné položky):</span>
                            <span className="text-xl font-mono font-bold text-stone-900 mt-0.5 block">
                              {formatEur(total)}
                            </span>
                            {isCheapestOnSubset && (
                              <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1 mt-1">
                                <Award className="w-3 h-3" />
                                Najlacnejší na spoločnom prieniku
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            )}

          {/* Multi-Store Shopping Strategy */}
          {optimization.multiStoreStrategy && maxStores > 1 && (
            <section className="bg-white rounded-2xl border border-stone-200/80 p-6 md:p-8 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Kombinovaná nákupná stratégia</span>
                  </div>
                  <h3 className="font-serif font-bold text-2xl text-stone-900">
                    Rozdelenie nákupu medzi {optimization.multiStoreStrategy.storesUsedCount} predajne
                  </h3>
                  <p className="text-stone-600 text-sm mt-1 max-w-2xl leading-relaxed">
                    Algoritmus vybral pre každú položku najlacnejší dostupný reťazec a zohľadnil váš náklad na cestu do
                    ďalšej predajne ({tripCostEur.toFixed(2).replace('.', ',')} €).
                  </p>
                </div>

                <div className="text-right shrink-0 bg-[#F7F5F0] p-4 rounded-xl border border-stone-200">
                  <span className="text-xs text-stone-500 block mb-0.5">Celkový čistý účet po zohľadnení cesty:</span>
                  <span className="text-2xl font-mono font-extrabold text-stone-900">
                    {formatEur(optimization.multiStoreStrategy.netEffectiveTotalCents)}
                  </span>
                  {optimization.multiStoreStrategy.savingsVsBestSingleStoreNetCents &&
                    optimization.multiStoreStrategy.savingsVsBestSingleStoreNetCents > 0 && (
                      <span className="block text-xs font-bold text-emerald-800 mt-1">
                        Čistá úspora:{' '}
                        {formatEur(optimization.multiStoreStrategy.savingsVsBestSingleStoreNetCents)}
                      </span>
                    )}
                </div>
              </div>

              {/* Worthwhile verdict chip */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between gap-4 text-sm ${
                  optimization.multiStoreStrategy.isMultiStoreWorthwhileAfterTripCost
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  {optimization.multiStoreStrategy.isMultiStoreWorthwhileAfterTripCost ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                  ) : (
                    <Info className="w-5 h-5 text-amber-700 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold block">
                      {optimization.multiStoreStrategy.isMultiStoreWorthwhileAfterTripCost
                        ? 'Kombinovaný nákup sa oplatí aj po započítaní cesty'
                        : 'Kombinovaný nákup sa neoplatí — lepšie nakúpiť v jednom obchode'}
                    </span>
                    <span className="text-xs opacity-85 block mt-0.5">
                      Hrubá úspora na tovare: {formatEur(optimization.multiStoreStrategy.savingsVsBestSingleStoreGrossCents)} •
                      Prirážka za ďalšiu predajňu: {formatEur(optimization.multiStoreStrategy.totalTripPenaltyCents)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Store Allocations breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {optimization.multiStoreStrategy.allocations.map((alloc) => (
                  <div
                    key={alloc.retailerSlug}
                    className="p-5 rounded-xl border border-stone-200 bg-stone-50/50 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-stone-900 text-base">
                        {alloc.retailerName}
                      </span>
                      <span className="text-xs font-mono font-bold text-stone-700 bg-stone-200/80 px-2 py-0.5 rounded-md">
                        {alloc.assignedItems.length} položiek
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {alloc.assignedItems.map((item) => (
                        <div
                          key={item.itemId}
                          className="flex items-center justify-between py-1 border-b border-stone-200/60"
                        >
                          <span className="truncate pr-2 text-stone-800">{item.title}</span>
                          <span className="font-mono font-medium text-stone-900 shrink-0">
                            {formatEur(item.lineTotalCents)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
                      <span className="text-stone-500">Medzisúčet v predajni:</span>
                      <span className="font-mono font-bold text-emerald-900">
                        {formatEur(alloc.storeSubtotalCents)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Honest Travel & Real-World Disclaimer */}
          <section className="bg-stone-50 rounded-xl border border-stone-200 p-5 text-xs text-stone-600 flex items-start gap-3">
            <Car className="w-5 h-5 text-stone-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-stone-900 text-sm mb-1">
                Realistické odporúčanie k nákupu a dostupnosti tovaru
              </h4>
              <p className="leading-relaxed">
                Tento optimalizátor kalkuluje matematicky najvýhodnejšie kombinácie na základe overených letákových a
                regálových cien. V reálnom živote berte do úvahy čas presunu, vzdialenosť predajní vo vašom meste a
                možnú vypredanosť tovaru na konkrétnej prevádzke. Ak je čistá úspora z delenia menšia ako 2 €,
                odporúčame nákup v jednej predajni.
              </p>
            </div>
          </section>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <p className="text-stone-500">Optimalizáciu sa nepodarilo vypočítať.</p>
        </div>
      )}
    </div>
  );
}
