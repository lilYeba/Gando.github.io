'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  Tag,
  Calendar,
  ExternalLink,
  Plus,
  Check,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Percent,
  Filter,
  ArrowUpDown,
  CreditCard,
  AlertCircle,
  Archive,
  Store,
  ChevronRight,
  TrendingDown,
} from 'lucide-react';
import { formatEur } from '@/lib/domain/money';
import type { WeeklyOfferItem } from '@/lib/db/repository';
import { useApp } from '@/components/providers/AppContext';
import { ProductIllustration } from '@/components/ui/ProductIllustration';

interface WeeklyOffersProps {
  initialData: {
    regularPromotions: WeeklyOfferItem[];
    loyaltyPromotions: WeeklyOfferItem[];
    expiredPromotions: WeeklyOfferItem[];
  };
  categories: Array<{ slug: string; name: string }>;
  initialRetailer?: string;
  initialCategory?: string;
  initialSort?: 'discount_desc' | 'price_asc' | 'expiring_soon';
  initialTab?: 'regular' | 'loyalty' | 'expired';
}

function formatSkDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
}

function getDaysRemaining(validToStr: string): { days: number; label: string; isEndingSoon: boolean; isExpired: boolean } {
  const now = new Date();
  const validTo = new Date(validToStr);
  validTo.setHours(23, 59, 59, 999);
  const diffMs = validTo.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return { days, label: 'Akcia skončila', isEndingSoon: false, isExpired: true };
  }
  if (days === 0) {
    return { days, label: 'Končí dnes!', isEndingSoon: true, isExpired: false };
  }
  if (days === 1) {
    return { days, label: 'Končí zajtra!', isEndingSoon: true, isExpired: false };
  }
  if (days <= 3) {
    return { days, label: `Platí ešte ${days} dni`, isEndingSoon: true, isExpired: false };
  }
  return { days, label: `Platí ešte ${days} dní`, isEndingSoon: false, isExpired: false };
}

export function WeeklyOffersClient({
  initialData,
  categories,
  initialRetailer = 'all',
  initialCategory = 'all',
  initialSort = 'discount_desc',
  initialTab = 'regular',
}: WeeklyOffersProps) {
  const { addProductToActiveList } = useApp();
  const [activeTab, setActiveTab] = useState<'regular' | 'loyalty' | 'expired'>(initialTab);
  const [selectedRetailer, setSelectedRetailer] = useState<string>(initialRetailer);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [sortBy, setSortBy] = useState<'discount_desc' | 'price_asc' | 'expiring_soon'>(initialSort);
  const [addedItemIds, setAddedItemIds] = useState<Set<string>>(new Set());

  // Filter current tab items
  const currentItems = useMemo(() => {
    let list: WeeklyOfferItem[] = [];
    if (activeTab === 'regular') list = initialData.regularPromotions;
    else if (activeTab === 'loyalty') list = initialData.loyaltyPromotions;
    else list = initialData.expiredPromotions;

    return list.filter((item) => {
      if (selectedRetailer !== 'all' && item.retailerSlug !== selectedRetailer) return false;
      if (selectedCategory !== 'all' && item.categorySlug !== selectedCategory) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'discount_desc') {
        const discA = a.verifiedDiscountPercent ?? 0;
        const discB = b.verifiedDiscountPercent ?? 0;
        return discB - discA;
      }
      if (sortBy === 'price_asc') {
        return a.promoPriceCents - b.promoPriceCents;
      }
      if (sortBy === 'expiring_soon') {
        return new Date(a.validTo).getTime() - new Date(b.validTo).getTime();
      }
      return 0;
    });
  }, [activeTab, initialData, selectedRetailer, selectedCategory, sortBy]);

  const handleAddToList = async (item: WeeklyOfferItem) => {
    await addProductToActiveList(item.productId, item.productName);
    setAddedItemIds((prev) => new Set(prev).add(item.promotionId));
    setTimeout(() => {
      setAddedItemIds((prev) => {
        const next = new Set(prev);
        next.delete(item.promotionId);
        return next;
      });
    }, 2500);
  };

  const getRetailerColor = (slug: string) => {
    switch (slug) {
      case 'lidl':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'tesco':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'billa':
        return 'bg-amber-50 text-amber-900 border-amber-200';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <section className="bg-white rounded-2xl border border-stone-200/80 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Overené akciové ponuky a letáky</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 tracking-tight">
              Týždenné akcie a zľavy
            </h1>
            <p className="text-stone-600 mt-2 text-base max-w-2xl leading-relaxed">
              Zoznam všetkých aktívnych zliav v reťazcoch Lidl, Tesco a BILLA. Všetky referenčné ceny a zľavové percentá
              poctivo overujeme podľa smernice EÚ Omnibus.
            </p>
          </div>

          {/* Quick summary stats */}
          <div className="flex items-center gap-3 bg-[#F7F5F0] p-4 rounded-xl border border-stone-200/60 shrink-0">
            <div className="text-center px-3 border-r border-stone-200">
              <span className="block text-2xl font-bold font-mono text-emerald-800">
                {initialData.regularPromotions.length}
              </span>
              <span className="text-xs text-stone-500">Bežných akcií</span>
            </div>
            <div className="text-center px-3 border-r border-stone-200">
              <span className="block text-2xl font-bold font-mono text-amber-800">
                {initialData.loyaltyPromotions.length}
              </span>
              <span className="text-xs text-stone-500">S kartou</span>
            </div>
            <div className="text-center px-3">
              <span className="block text-2xl font-bold font-mono text-stone-600">
                {initialData.expiredPromotions.length}
              </span>
              <span className="text-xs text-stone-500">V archíve</span>
            </div>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="mt-8 pt-6 border-t border-stone-100 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('regular')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'regular'
                ? 'bg-[#123524] text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200/80'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Bežné akcie (pre všetkých)</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'regular' ? 'bg-emerald-900/80 text-emerald-100' : 'bg-stone-200 text-stone-700'
              }`}
            >
              {initialData.regularPromotions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('loyalty')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'loyalty'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100/80 border border-amber-200/60'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Vernostné akcie (s aplikáciou / kartou)</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'loyalty' ? 'bg-amber-950 text-amber-200' : 'bg-amber-200/80 text-amber-900'
              }`}
            >
              {initialData.loyaltyPromotions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('expired')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'expired'
                ? 'bg-stone-700 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>Archív ukončených akcií</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'expired' ? 'bg-stone-900 text-stone-300' : 'bg-stone-200 text-stone-600'
              }`}
            >
              {initialData.expiredPromotions.length}
            </span>
          </button>
        </div>
      </section>

      {/* Filter bar */}
      <section className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        {/* Retailer Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider mr-2 shrink-0">Reťazec:</span>
          {[
            { id: 'all', label: 'Všetky' },
            { id: 'lidl', label: 'Lidl' },
            { id: 'tesco', label: 'Tesco' },
            { id: 'billa', label: 'BILLA' },
          ].map((ret) => (
            <button
              key={ret.id}
              onClick={() => setSelectedRetailer(ret.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all shrink-0 ${
                selectedRetailer === ret.id
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {ret.label}
            </button>
          ))}
        </div>

        {/* Category & Sort controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-stone-50 border border-stone-200 text-stone-800 text-xs rounded-md px-2.5 py-1.5 focus:outline-emerald-800"
            >
              <option value="all">Všetky kategórie</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-stone-50 border border-stone-200 text-stone-800 text-xs rounded-md px-2.5 py-1.5 focus:outline-emerald-800"
            >
              <option value="discount_desc">Najvyššia zľava (% zľavy)</option>
              <option value="price_asc">Najnižšia akciová cena (€)</option>
              <option value="expiring_soon">Končiace čoskoro</option>
            </select>
          </div>
        </div>
      </section>

      {/* Promotion Items Grid */}
      {currentItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-12 text-center">
          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400 mb-3">
            <Tag className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-serif font-bold text-stone-800">Žiadne akcie nevyhovujú filtru</h3>
          <p className="text-sm text-stone-500 max-w-md mx-auto mt-1">
            Skúste zmeniť vybraný reťazec alebo kategóriu, prípadne prepnite záložku medzi bežnými a vernostnými akciami.
          </p>
          <button
            onClick={() => {
              setSelectedRetailer('all');
              setSelectedCategory('all');
            }}
            className="mt-4 px-4 py-2 bg-stone-900 text-white text-xs font-medium rounded-lg hover:bg-stone-800"
          >
            Resetovať filtre
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {currentItems.map((item, idx) => {
              const daysInfo = getDaysRemaining(item.validTo);
              const isAdded = addedItemIds.has(item.promotionId);

              return (
                <motion.article
                  key={item.promotionId}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: idx * 0.03 }}
                  className={`bg-white rounded-xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between overflow-hidden ${
                    item.isExpired
                      ? 'border-stone-200 opacity-75'
                      : item.requiresLoyaltyCard
                      ? 'border-amber-200/90 shadow-2xs'
                      : 'border-stone-200 shadow-2xs'
                  }`}
                >
                  <div className="p-5">
                    {/* Top badging */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {/* Retailer badge */}
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${getRetailerColor(
                          item.retailerSlug
                        )}`}
                      >
                        <Store className="w-3 h-3" />
                        {item.retailerName}
                      </span>

                      {/* Expiration badge */}
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          item.isExpired
                            ? 'bg-stone-100 text-stone-500'
                            : daysInfo.isEndingSoon
                            ? 'bg-rose-100 text-rose-800 font-bold animate-pulse'
                            : 'bg-emerald-50 text-emerald-800'
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        {daysInfo.label}
                      </span>
                    </div>

                    {/* Product visual & details */}
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                        <ProductIllustration
                          slug={item.productSlug}
                          categorySlug={item.categorySlug}
                          brand={item.brand}
                          imageUrl={item.imageUrl}
                          className="w-full h-full"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 block truncate">
                          {item.brand ?? item.categoryName}
                        </span>
                        <Link
                          href={`/produkt/${item.productSlug}`}
                          className="font-serif font-bold text-stone-900 text-base leading-snug hover:text-emerald-800 transition-colors line-clamp-2"
                        >
                          {item.productName}
                        </Link>
                        <span className="text-xs text-stone-500 font-mono mt-0.5 block">
                          {item.packageLabel}
                        </span>
                      </div>
                    </div>

                    {/* Price and discount presentation */}
                    <div className="mt-4 pt-3 border-t border-stone-100 bg-[#F7F5F0]/60 -mx-5 px-5 py-3 rounded-b-none">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-xs text-stone-500 block mb-0.5">Akciová cena:</span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold font-mono text-emerald-800">
                              {formatEur(item.promoPriceCents)}
                            </span>
                            {item.regularPriceCents && (
                              <span className="text-sm line-through text-stone-400 font-mono">
                                {formatEur(item.regularPriceCents)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Verified discount percent */}
                        {item.verifiedDiscountPercent !== null && (
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-2xs font-mono">
                              <TrendingDown className="w-3 h-3" />
                              -{item.verifiedDiscountPercent} %
                            </span>
                            {item.absoluteSavingsCents && (
                              <span className="block text-[11px] text-rose-800 font-medium mt-0.5">
                                ušetríte {formatEur(item.absoluteSavingsCents)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Unit price */}
                      {item.unitPriceCents && (
                        <div className="text-xs text-stone-500 mt-2 font-mono flex items-center justify-between">
                          <span>Prepočítaná jednotková cena:</span>
                          <span className="font-semibold text-stone-700">
                            {formatEur(item.unitPriceCents)} / {item.baseUnit}
                          </span>
                        </div>
                      )}

                      {/* Loyalty condition warning if required */}
                      {item.requiresLoyaltyCard && (
                        <div className="mt-2.5 bg-amber-50 border border-amber-200/80 rounded-md p-2 flex items-start gap-2 text-xs text-amber-900">
                          <CreditCard className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold">
                              Vyžaduje {item.loyaltyProgramName ?? 'vernostnú kartu'}
                            </span>
                            {item.conditionLabel && <p className="text-[11px] text-amber-800 mt-0.5">{item.conditionLabel}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card footer with actions and source link */}
                  <div className="px-5 py-3 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[140px]" title={item.leafletName ?? 'Letáková ponuka'}>
                        {item.leafletName ?? 'Leták'}
                      </span>
                      {item.sourceUrl && (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-stone-400 hover:text-stone-700 flex items-center gap-0.5"
                          title="Zobraziť originálny zdroj ponuky"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAddToList(item)}
                        disabled={item.isExpired}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isAdded
                            ? 'bg-emerald-700 text-white'
                            : item.isExpired
                            ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                            : 'bg-[#123524] text-white hover:bg-emerald-900'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>V zozname</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Do zoznamu</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Omnibus Disclosure Banner */}
      <section className="bg-stone-50 rounded-xl border border-stone-200 p-5 text-xs text-stone-600 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-stone-900 text-sm mb-1">
            Poctivé zľavy a smernica EÚ Omnibus (Zákon č. 108/2024 Z. z.)
          </h4>
          <p className="leading-relaxed">
            Zľavové percentá na Price Tracker SK počítame výhradne vtedy, keď máme k dispozícii preukázateľnú referenčnú
            alebo najnižšiu cenu za posledných 30 dní. Pokiaľ reťazec neuvádza pravdivú východiskovú cenu, zľavu
            nefabrikovateľne neuvádzame a zobrazujeme iba overenú koncovú cenu.
          </p>
        </div>
      </section>
    </div>
  );
}
