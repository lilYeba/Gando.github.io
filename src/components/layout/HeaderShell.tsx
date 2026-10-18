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

const CATALOG_CATEGORIES = [
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
  const [catalogMenuOpen, setCatalogMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const loyaltyRef = useRef<HTMLDivElement>(null);
  const catalogRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  // Cmd/Ctrl + K keyboard focus shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setLoyaltyMenuOpen(false);
        setCatalogMenuOpen(false);
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
      if (catalogRef.current && !catalogRef.current.contains(target)) {
        setCatalogMenuOpen(false);
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
    <header className="sticky top-0 z-40 shadow-sm">
      {/* 1. Top Dark-Green Promo Strip (#0D2B1D) */}
      <div className="bg-[#0D2B1D] text-white border-b border-white/10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-center gap-3 text-xs sm:text-[13px]">
          {/* Official User Logo Mini Badge */}
          <div className="w-7 h-7 rounded-[6px] overflow-hidden bg-[#0B0D10] border border-[#4ADE80]/40 flex items-center justify-center shrink-0 shadow-2xs">
            <img
              src={`${basePath}/images/brand/logo.png`}
              alt="Price Checker"
              className="w-full h-full object-cover object-center"
            />
          </div>

          <p className="truncate sm:whitespace-normal text-center leading-snug text-emerald-50">
            <strong className="font-bold text-white">Price Checker Slovensko</strong>
            {' – '}
            <span>Objavte výhody Lidl Plus, Clubcard a BILLA Bonus v našej aplikácii</span>
          </p>

          <Link
            href="/akcie"
            className="shrink-0 bg-[#4ADE80] hover:bg-[#22C55E] text-[#092216] font-extrabold text-xs px-3.5 py-1.5 rounded-[4px] transition-colors shadow-2xs"
          >
            Zistiť viac
          </Link>
        </div>
      </div>

      {/* 2. Main Vibrant Green Header (#16A34A -> #15803D) */}
      <div className="bg-[#15803D] text-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-3.5">
          <div className="flex items-center justify-between lg:justify-start gap-6 lg:gap-10">
            {/* Left Column: Official Price Checker Logo + Block Wordmark spanning both rows */}
            <Link
              href="/"
              aria-label="Price Checker Domov"
              className="shrink-0 flex items-center gap-3.5 select-none group focus:outline-none"
            >
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl overflow-hidden bg-[#0B0D10] border-2 border-[#4ADE80]/60 shadow-md shrink-0 flex items-center justify-center transition-transform duration-150 group-hover:scale-105">
                <img
                  src={`${basePath}/images/brand/logo.png`}
                  alt="Price Checker Logo"
                  className="w-full h-full object-cover object-center"
                />
              </div>

              <div className="flex flex-col justify-center">
                <div className="flex items-baseline gap-1.5 leading-none">
                  <span
                    className="text-white font-black uppercase tracking-tight text-2xl sm:text-[30px]"
                    style={{
                      fontFamily:
                        '"Arial Black", "Inter", "Helvetica Neue", Impact, sans-serif',
                    }}
                  >
                    PRICE
                  </span>
                  <span
                    className="text-[#86EFAC] font-black uppercase tracking-tight text-2xl sm:text-[30px]"
                    style={{
                      fontFamily:
                        '"Arial Black", "Inter", "Helvetica Neue", Impact, sans-serif',
                    }}
                  >
                    CHECKER
                  </span>
                </div>
                <span className="text-emerald-100 font-extrabold uppercase tracking-[0.08em] text-[9.5px] sm:text-[10.5px] mt-1.5 leading-none">
                  V CENÁCH SA VYZNÁME • SK
                </span>
              </div>
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
                  <div className="relative flex items-center w-full bg-white rounded-[5px] h-10 shadow-xs focus-within:ring-2 focus-within:ring-[#4ADE80]">
                    <input
                      ref={searchInputRef}
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Vyhľadajte produkt, značku alebo EAN..."
                      aria-label="Vyhľadajte produkt, značku alebo EAN"
                      className="w-full h-full bg-transparent px-4 text-[13px] text-[#1C1917] placeholder:text-stone-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      aria-label="Hľadať"
                      className="mr-3 p-1 text-stone-500 hover:text-[#15803D] transition-colors"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </div>
                </form>

                {/* Right Action Icons: Predajne, Prihlásiť, Košík */}
                <div className="flex items-center gap-4 sm:gap-5 shrink-0">
                  {/* Predajne */}
                  <Link
                    href="/porovnanie"
                    className="inline-flex items-center gap-2 text-white hover:text-[#86EFAC] transition-colors text-[13px] font-semibold"
                  >
                    <svg
                      className="w-5 h-5 shrink-0 fill-current"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M4 4h16v2H4V4zm0 4h16l1 5v2h-1v5h-2v-5h-4v5H4v-5H3v-2l1-5zm2 7v3h6v-3H6z" />
                    </svg>
                    <span className="hidden sm:inline">Predajne</span>
                  </Link>

                  {/* Prihlásiť / Nastavenia */}
                  <Link
                    href="/nastavenia"
                    className="inline-flex items-center gap-2 text-white hover:text-[#86EFAC] transition-colors text-[13px] font-semibold"
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
                      className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] bg-[#0D2B1D] hover:bg-[#091F15] text-white text-xs font-bold transition-colors border border-[#4ADE80]/30 shadow-2xs"
                    >
                      <ShoppingBasket className="w-4 h-4 text-[#4ADE80] shrink-0" />
                      <span className="hidden xl:inline">Košík</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-[#4ADE80] text-[#092216] font-mono-tabular text-[11px] font-extrabold">
                        {activeListCount}
                      </span>
                    </Link>
                  </motion.div>

                  {/* Mobile Hamburger Button */}
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen((v) => !v)}
                    aria-label={mobileMenuOpen ? 'Zavrieť menu' : 'Otvoriť menu'}
                    className="lg:hidden p-2 rounded-[5px] bg-[#0D2B1D] text-white border border-white/15"
                  >
                    {mobileMenuOpen ? (
                      <X className="h-5 w-5" />
                    ) : (
                      <Menu className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Bottom Row: Horizontal Navigation Links aligned with Search Bar */}
              <nav
                aria-label="Hlavná navigácia"
                className="hidden lg:flex items-center gap-6 xl:gap-7 text-[13.5px] font-bold text-white"
              >
                {/* 1. Letáky a akcie */}
                <Link
                  href="/akcie"
                  className={`hover:text-[#86EFAC] transition-colors py-0.5 ${
                    pathname.startsWith('/akcie')
                      ? 'text-[#86EFAC] underline decoration-2 underline-offset-4'
                      : ''
                  }`}
                >
                  Letáky a akcie
                </Link>

                {/* 2. Vernostné karty a výhody ⌄ */}
                <div ref={loyaltyRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setLoyaltyMenuOpen((v) => !v);
                      setCatalogMenuOpen(false);
                      setMoreMenuOpen(false);
                    }}
                    aria-expanded={loyaltyMenuOpen}
                    className="inline-flex items-center gap-1.5 hover:text-[#86EFAC] transition-colors py-0.5 cursor-pointer"
                  >
                    <span>Vernostné karty a výhody</span>
                    <ChevronDown
                      className={`w-4 h-4 stroke-[2.5] transition-transform duration-150 ${
                        loyaltyMenuOpen ? 'rotate-180 text-[#86EFAC]' : ''
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
                          <span className="px-2 py-0.5 rounded-full bg-[#15803D] text-white text-[10px] font-bold">
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
                              {
                                key: 'includeBillaBonus',
                                label: 'BILLA Bonus',
                                store: 'BILLA Slovakia',
                                color: '#B45309',
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
                                    ? 'border-[#15803D]/50 bg-[#EAF6EF]'
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
                                      ? 'bg-[#15803D] text-white'
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

                {/* 3. Katalóg potravín ⌄ */}
                <div ref={catalogRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setCatalogMenuOpen((v) => !v);
                      setLoyaltyMenuOpen(false);
                      setMoreMenuOpen(false);
                    }}
                    aria-expanded={catalogMenuOpen}
                    className={`inline-flex items-center gap-1.5 hover:text-[#86EFAC] transition-colors py-0.5 cursor-pointer ${
                      pathname.startsWith('/katalog')
                        ? 'text-[#86EFAC] underline decoration-2 underline-offset-4'
                        : ''
                    }`}
                  >
                    <span>Katalóg potravín</span>
                    <ChevronDown
                      className={`w-4 h-4 stroke-[2.5] transition-transform duration-150 ${
                        catalogMenuOpen ? 'rotate-180 text-[#86EFAC]' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {catalogMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 mt-2.5 w-72 rounded-xl border border-stone-200 bg-white p-2 shadow-xl z-50 text-[#1C1917] font-normal"
                      >
                        {CATALOG_CATEGORIES.map((cat, idx) => (
                          <Link
                            key={cat.href}
                            href={cat.href}
                            onClick={() => setCatalogMenuOpen(false)}
                            className={`block px-3 py-2 rounded-lg text-xs transition-colors hover:bg-[#EAF6EF] ${
                              idx === 0
                                ? 'font-bold text-[#15803D] border-b border-stone-100 mb-1'
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

                {/* 4. Porovnanie reťazcov */}
                <Link
                  href="/porovnanie"
                  className={`hover:text-[#86EFAC] transition-colors py-0.5 ${
                    pathname.startsWith('/porovnanie')
                      ? 'text-[#86EFAC] underline decoration-2 underline-offset-4'
                      : ''
                  }`}
                >
                  Porovnanie reťazcov
                </Link>

                {/* 5. Nákupný zoznam */}
                <Link
                  href="/zoznam"
                  className={`hover:text-[#86EFAC] transition-colors py-0.5 ${
                    pathname.startsWith('/zoznam')
                      ? 'text-[#86EFAC] underline decoration-2 underline-offset-4'
                      : ''
                  }`}
                >
                  Nákupný zoznam
                </Link>

                {/* 6. Zobraziť viac ⌄ */}
                <div ref={moreRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setMoreMenuOpen((v) => !v);
                      setLoyaltyMenuOpen(false);
                      setCatalogMenuOpen(false);
                    }}
                    aria-expanded={moreMenuOpen}
                    className="inline-flex items-center gap-1.5 hover:text-[#86EFAC] transition-colors py-0.5 cursor-pointer"
                  >
                    <span>Zobraziť viac</span>
                    <ChevronDown
                      className={`w-4 h-4 stroke-[2.5] transition-transform duration-150 ${
                        moreMenuOpen ? 'rotate-180 text-[#86EFAC]' : ''
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
                              className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-[#EAF6EF] transition-colors"
                            >
                              <Icon className="w-4 h-4 text-[#15803D] mt-0.5 shrink-0" />
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
            className="lg:hidden overflow-hidden border-t border-white/15 bg-[#123524] text-white"
          >
            <div className="px-4 py-4 space-y-3">
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Vyhľadajte produkt, značku alebo EAN..."
                  className="flex-1 rounded-[5px] bg-white px-3.5 py-2 text-sm text-[#1C1917] placeholder:text-stone-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-[5px] bg-[#4ADE80] text-[#092216] text-xs font-extrabold"
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
                          ? 'bg-[#4ADE80] text-[#092216] shadow-2xs'
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          isActive ? 'text-[#092216]' : 'text-[#4ADE80]'
                        }`}
                      />
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
