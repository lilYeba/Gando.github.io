'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  Search,
  ShoppingBasket,
  Bell,
  Settings,
  Menu,
  X,
  Check,
  Sparkles,
  Scale,
  Tag,
  ListChecks,
  LineChart,
  Store,
  Home,
  ChevronDown,
  User,
} from 'lucide-react';
import { useApp } from '@/components/providers/AppContext';

const MORE_NAV_ITEMS = [
  { href: '/', label: 'Prehľad trhu', icon: Home, desc: 'Hlavná stránka a rýchle porovnanie' },
  { href: '/katalog', label: 'Katalóg potravín (311)', icon: Store, desc: 'Všetky produkty s fotkami na bielom pozadí' },
  { href: '/porovnanie', label: 'Porovnanie reťazcov', icon: Scale, desc: 'Lidl vs. Tesco vs. BILLA Slovakia' },
  { href: '/akcie', label: 'Týždenné letáky a akcie', icon: Tag, desc: 'Aktuálne zľavy a vernostné ceny' },
  { href: '/zoznam', label: 'Nákupný zoznam', icon: ListChecks, desc: 'Váš zoznam položiek na nákup' },
  { href: '/optimalizator', label: 'Optimalizátor košíka', icon: Sparkles, desc: 'Rozdelenie nákupu pre maximálnu úsporu' },
  { href: '/historia-cien', label: 'História cien & Dáta', icon: LineChart, desc: 'Cenový vývoj a zdroje dát' },
  { href: '/upozornenia', label: 'Cenové upozornenia', icon: Bell, desc: 'Notifikácie pri poklese ceny' },
  { href: '/nastavenia', label: 'Nastavenia a profil', icon: Settings, desc: 'Predvoľby aplikácie a vernostných kariet' },
];

const QUALITY_CATEGORIES = [
  { href: '/katalog', label: 'Všetky produkty v katalógu (311)' },
  { href: '/katalog?category=mliecne-vyrobky-a-vajcia', label: 'Mliečne výrobky a vajcia' },
  { href: '/katalog?category=pecivo-a-pekarenske-vyrobky', label: 'Pečivo a pekárenské výrobky' },
  { href: '/katalog?category=maso-ryby-a-udeniny', label: 'Mäso, ryby a údeniny' },
  { href: '/katalog?category=ovocie-a-zelenina', label: 'Ovocie a zelenina' },
  { href: '/katalog?category=napoje', label: 'Nápoje, káva a čaj' },
  { href: '/katalog?category=trvanlive-potraviny', label: 'Trvanlivé potraviny' },
  { href: '/katalog?category=sladkosti-a-slane-pochutiny', label: 'Sladkosti a slané pochutiny' },
  { href: '/katalog?category=mrazene-potraviny', label: 'Mrazené potraviny' },
  { href: '/katalog?category=drogeria-a-domacnost', label: 'Drogéria a domácnosť' },
];

export function HeaderShell() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    loyaltyPrefs,
    toggleLoyaltyCard,
    activeListCount,
    cartPulseKey,
    unreadNotificationsCount,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [loyaltyMenuOpen, setLoyaltyMenuOpen] = useState(false);
  const [qualitiesMenuOpen, setQualitiesMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const loyaltyRef = useRef<HTMLDivElement>(null);
  const qualitiesRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  // Cmd/Ctrl + K keyboard focus shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setLoyaltyMenuOpen(false);
        setQualitiesMenuOpen(false);
        setMoreMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (loyaltyRef.current && !loyaltyRef.current.contains(target)) {
        setLoyaltyMenuOpen(false);
      }
      if (qualitiesRef.current && !qualitiesRef.current.contains(target)) {
        setQualitiesMenuOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(target)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/katalog?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push('/katalog');
    }
    setMobileMenuOpen(false);
  };

  const activeLoyaltyCount = [
    loyaltyPrefs.includeLidlPlus,
    loyaltyPrefs.includeTescoClubcard,
    loyaltyPrefs.includeBillaBonus,
  ].filter(Boolean).length;

  return (
    <header className="sticky top-0 z-40 shadow-xs">
      {/* 1. Top Cyan Promo Banner (#0089C4) */}
      <div className="bg-[#0089C4] text-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-center gap-3 text-xs sm:text-[13px]">
          {/* Yellow BILLA Bonus Badge Icon */}
          <div className="w-7 h-7 rounded-[6px] bg-[#FFD500] flex flex-col items-center justify-center shrink-0 shadow-2xs select-none leading-none">
            <span className="text-[7px] font-black tracking-tighter text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">
              BILLA
            </span>
            <span className="text-[8px] font-serif italic font-bold text-[#0089C4] -mt-0.5">
              Bonus
            </span>
          </div>

          <p className="truncate sm:whitespace-normal text-center leading-snug">
            <strong className="font-bold">BILLA Slovensko</strong>
            {' – '}
            <span>Objavte výhody BILLA Bonus v našej aplikácii</span>
          </p>

          <Link
            href="/akcie"
            className="shrink-0 bg-[#FFD500] hover:bg-[#FFCC00] text-[#1C1917] font-bold text-xs px-3.5 py-1.5 rounded-[3px] transition-colors shadow-2xs"
          >
            Zistiť viac
          </Link>
        </div>
      </div>

      {/* 2. Main Yellow Header (#FFD500) */}
      <div className="bg-[#FFD500] text-[#1C1917]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-3.5">
          <div className="flex items-center justify-between lg:justify-start gap-6 lg:gap-10">
            {/* Left Column: BILLA White Block Wordmark + "V KVALITE SA VYZNÁME" */}
            <Link
              href="/"
              aria-label="Domov"
              className="shrink-0 flex flex-col items-center select-none group focus:outline-none"
            >
              <span
                className="text-white font-black uppercase leading-[0.86] tracking-[-0.03em] text-[38px] sm:text-[48px] transition-transform duration-150 group-hover:scale-[1.02]"
                style={{
                  fontFamily:
                    '"Arial Black", "Inter", "Helvetica Neue", Impact, sans-serif',
                }}
              >
                BILLA
              </span>
              <span className="text-white font-extrabold uppercase tracking-[0.06em] text-[9.5px] sm:text-[10.5px] mt-1 leading-none">
                V KVALITE SA VYZNÁME
              </span>
            </Link>

            {/* Right Column: Top Row (Search + Predajne + Prihlásiť + Košík) & Bottom Row (Navigation) */}
            <div className="flex-1 flex flex-col gap-3">
              {/* Top Row */}
              <div className="flex items-center justify-end lg:justify-start gap-4 sm:gap-6">
                {/* Wide White Search Input */}
                <form
                  onSubmit={handleSearchSubmit}
                  className="hidden md:flex flex-1 max-w-[600px]"
                >
                  <div className="relative flex items-center w-full bg-white rounded-[4px] h-10 shadow-2xs focus-within:ring-2 focus-within:ring-[#0089C4]">
                    <input
                      ref={searchInputRef}
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Vyhľadajte obsah"
                      aria-label="Vyhľadajte obsah"
                      className="w-full h-full bg-transparent px-4 text-[13px] text-[#1C1917] placeholder:text-[#3A3A3A] focus:outline-none"
                    />
                    {searchQuery && (
                      <button
                        type="submit"
                        aria-label="Hľadať"
                        className="mr-2.5 p-1 text-[#1C1917]/70 hover:text-[#1C1917]"
                      >
                        <Search className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </form>

                {/* Right Action Icons: Predajne, Prihlásiť, Košík */}
                <div className="flex items-center gap-4 sm:gap-5 shrink-0">
                  {/* Predajne */}
                  <Link
                    href="/porovnanie"
                    className="inline-flex items-center gap-2 text-[#1C1917] hover:opacity-75 transition-opacity text-[13px] font-medium"
                  >
                    {/* Storefront Icon matching screenshot */}
                    <svg
                      className="w-5 h-5 shrink-0 fill-current"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M4 4h16v2H4V4zm0 4h16l1 5v2h-1v5h-2v-5h-4v5H4v-5H3v-2l1-5zm2 7v3h6v-3H6z" />
                    </svg>
                    <span className="hidden sm:inline">Predajne</span>
                  </Link>

                  {/* Prihlásiť */}
                  <Link
                    href="/nastavenia"
                    className="inline-flex items-center gap-2 text-[#1C1917] hover:opacity-75 transition-opacity text-[13px] font-medium"
                  >
                    <User className="w-5 h-5 shrink-0 fill-current stroke-[2.2]" />
                    <span className="hidden sm:inline">Prihlásiť</span>
                  </Link>

                  {/* Košík (with live item count badge) */}
                  <motion.div
                    key={cartPulseKey}
                    animate={cartPulseKey > 0 ? { scale: [1, 1.12, 1] } : {}}
                    transition={{ duration: 0.32 }}
                  >
                    <Link
                      href="/optimalizator"
                      aria-label="Nákupný košík a optimalizátor"
                      className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] bg-[#1C1917]/10 hover:bg-[#1C1917]/15 text-[#1C1917] text-xs font-bold transition-colors"
                    >
                      <ShoppingBasket className="w-4 h-4 shrink-0" />
                      <span className="hidden xl:inline">Košík</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-[#1C1917] text-[#FFD500] font-mono-tabular text-[11px] font-bold">
                        {activeListCount}
                      </span>
                    </Link>
                  </motion.div>

                  {/* Mobile Hamburger Button */}
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen((v) => !v)}
                    aria-label={mobileMenuOpen ? 'Zavrieť menu' : 'Otvoriť menu'}
                    className="lg:hidden p-2 rounded-[4px] bg-white/80 text-[#1C1917]"
                  >
                    {mobileMenuOpen ? (
                      <X className="h-5 w-5" />
                    ) : (
                      <Menu className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Bottom Row: Horizontal Navigation Links */}
              <nav
                aria-label="Hlavná navigácia"
                className="hidden lg:flex items-center gap-6 xl:gap-7 text-[13.5px] font-bold text-[#1C1917]"
              >
                {/* 1. Letáky a akcie */}
                <Link
                  href="/akcie"
                  className={`hover:opacity-75 transition-opacity py-0.5 ${
                    pathname.startsWith('/akcie')
                      ? 'underline decoration-2 underline-offset-4'
                      : ''
                  }`}
                >
                  Letáky a akcie
                </Link>

                {/* 2. BILLA Bonus a výhody ⌄ (Interactive Loyalty Cards Dropdown) */}
                <div ref={loyaltyRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setLoyaltyMenuOpen((v) => !v);
                      setQualitiesMenuOpen(false);
                      setMoreMenuOpen(false);
                    }}
                    aria-expanded={loyaltyMenuOpen}
                    className="inline-flex items-center gap-1.5 hover:opacity-75 transition-opacity py-0.5 cursor-pointer"
                  >
                    <span>BILLA Bonus a výhody</span>
                    <ChevronDown
                      className={`w-4 h-4 stroke-[2.5] transition-transform duration-150 ${
                        loyaltyMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {loyaltyMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 mt-2.5 w-80 rounded-xl border border-stone-200 bg-white p-4 shadow-xl z-50 text-[#1C1917] font-normal"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold text-[#1C1917]">
                            Vernostné karty a členské výhody
                          </p>
                          <span className="px-2 py-0.5 rounded-full bg-[#FFD500] text-[#1C1917] text-[10px] font-bold">
                            Aktívne: {activeLoyaltyCount}/3
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 mb-3">
                          Zapnite svoje vernostné karty pre automatický prepočet najnižších cien v katalógu.
                        </p>

                        <div className="space-y-2">
                          {(
                            [
                              {
                                key: 'includeBillaBonus',
                                label: 'BILLA Bonus',
                                store: 'BILLA Slovakia',
                                color: '#0089C4',
                              },
                              {
                                key: 'includeLidlPlus',
                                label: 'Lidl Plus',
                                store: 'Lidl Slovakia',
                                color: '#1D4ED8',
                              },
                              {
                                key: 'includeTescoClubcard',
                                label: 'Tesco Clubcard',
                                store: 'Tesco Slovakia',
                                color: '#0F4C81',
                              },
                            ] as const
                          ).map((card) => {
                            const checked = loyaltyPrefs[card.key];
                            return (
                              <button
                                key={card.key}
                                type="button"
                                onClick={() => toggleLoyaltyCard(card.key)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-colors cursor-pointer ${
                                  checked
                                    ? 'border-[#0089C4]/50 bg-[#0089C4]/5'
                                    : 'border-stone-200 bg-stone-50'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <span
                                    className="h-2.5 w-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: card.color }}
                                  />
                                  <div>
                                    <span className="text-xs font-bold text-[#1C1917] block">
                                      {card.label}
                                    </span>
                                    <span className="text-[10px] text-stone-500">
                                      {card.store}
                                    </span>
                                  </div>
                                </div>
                                <span
                                  className={`h-5 w-5 rounded flex items-center justify-center ${
                                    checked
                                      ? 'bg-[#0089C4] text-white'
                                      : 'border border-stone-300 bg-white'
                                  }`}
                                >
                                  {checked && <Check className="h-3.5 w-3.5" />}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 3. Naše kvality ⌄ (Product Categories & Catalog Dropdown) */}
                <div ref={qualitiesRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setQualitiesMenuOpen((v) => !v);
                      setLoyaltyMenuOpen(false);
                      setMoreMenuOpen(false);
                    }}
                    aria-expanded={qualitiesMenuOpen}
                    className={`inline-flex items-center gap-1.5 hover:opacity-75 transition-opacity py-0.5 cursor-pointer ${
                      pathname.startsWith('/katalog')
                        ? 'underline decoration-2 underline-offset-4'
                        : ''
                    }`}
                  >
                    <span>Naše kvality</span>
                    <ChevronDown
                      className={`w-4 h-4 stroke-[2.5] transition-transform duration-150 ${
                        qualitiesMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {qualitiesMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 mt-2.5 w-72 rounded-xl border border-stone-200 bg-white p-2 shadow-xl z-50 text-[#1C1917] font-normal"
                      >
                        {QUALITY_CATEGORIES.map((cat, idx) => (
                          <Link
                            key={cat.href}
                            href={cat.href}
                            onClick={() => setQualitiesMenuOpen(false)}
                            className={`block px-3 py-2 rounded-lg text-xs transition-colors hover:bg-[#FFD500]/25 ${
                              idx === 0
                                ? 'font-bold text-[#0089C4] border-b border-stone-100 mb-1'
                                : 'font-medium text-[#1C1917]'
                            }`}
                          >
                            {cat.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 4. Naše značky */}
                <Link
                  href="/porovnanie"
                  className={`hover:opacity-75 transition-opacity py-0.5 ${
                    pathname.startsWith('/porovnanie')
                      ? 'underline decoration-2 underline-offset-4'
                      : ''
                  }`}
                >
                  Naše značky
                </Link>

                {/* 5. BILLA recepty */}
                <Link
                  href="/zoznam"
                  className={`hover:opacity-75 transition-opacity py-0.5 ${
                    pathname.startsWith('/zoznam')
                      ? 'underline decoration-2 underline-offset-4'
                      : ''
                  }`}
                >
                  BILLA recepty
                </Link>

                {/* 6. Zobraziť viac ⌄ */}
                <div ref={moreRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setMoreMenuOpen((v) => !v);
                      setLoyaltyMenuOpen(false);
                      setQualitiesMenuOpen(false);
                    }}
                    aria-expanded={moreMenuOpen}
                    className="inline-flex items-center gap-1.5 hover:opacity-75 transition-opacity py-0.5 cursor-pointer"
                  >
                    <span>Zobraziť viac</span>
                    <ChevronDown
                      className={`w-4 h-4 stroke-[2.5] transition-transform duration-150 ${
                        moreMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {moreMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2.5 w-80 rounded-xl border border-stone-200 bg-white p-2 shadow-xl z-50 text-[#1C1917] font-normal"
                      >
                        {MORE_NAV_ITEMS.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMoreMenuOpen(false)}
                              className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-[#FFD500]/25 transition-colors"
                            >
                              <Icon className="w-4 h-4 text-[#0089C4] mt-0.5 shrink-0" />
                              <div>
                                <span className="text-xs font-bold text-[#1C1917] block">
                                  {item.label}
                                  {item.href === '/upozornenia' &&
                                    unreadNotificationsCount > 0 && (
                                      <span className="ml-2 px-1.5 py-0.2 rounded-full bg-[#C84B31] text-white text-[10px]">
                                        {unreadNotificationsCount}
                                      </span>
                                    )}
                                </span>
                                <span className="text-[11px] text-stone-500 block">
                                  {item.desc}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="lg:hidden overflow-hidden border-t border-black/10 bg-[#FFD500] text-[#1C1917]"
          >
            <div className="px-4 py-4 space-y-3">
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Vyhľadajte obsah"
                  className="flex-1 rounded-[4px] bg-white px-3.5 py-2 text-sm text-[#1C1917] placeholder:text-[#3A3A3A] focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-[4px] bg-[#0089C4] text-white text-xs font-bold"
                >
                  Hľadať
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {MORE_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/'
                      ? pathname === '/'
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold ${
                        isActive
                          ? 'bg-white text-[#1C1917] shadow-2xs'
                          : 'text-[#1C1917] hover:bg-white/60'
                      }`}
                    >
                      <Icon className="h-4 w-4 text-[#0089C4]" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
