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
  CreditCard,
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
} from 'lucide-react';
import { useApp } from '@/components/providers/AppContext';
import { BrandLogo } from '@/components/ui/BrandLogo';

const NAV_ITEMS = [
  { href: '/', label: 'Prehľad', icon: Home },
  { href: '/katalog', label: 'Katalóg', icon: Store },
  { href: '/porovnanie', label: 'Porovnanie', icon: Scale },
  { href: '/akcie', label: 'Týždenné akcie', icon: Tag },
  { href: '/zoznam', label: 'Nákupný zoznam', icon: ListChecks },
  { href: '/optimalizator', label: 'Optimalizátor', icon: Sparkles },
  { href: '/historia-cien', label: 'História & Dáta', icon: LineChart },
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
  const [searchFocused, setSearchFocused] = useState(false);
  const [loyaltyMenuOpen, setLoyaltyMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const loyaltyRef = useRef<HTMLDivElement>(null);

  // Cmd/Ctrl + K keyboard focus shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setLoyaltyMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Close loyalty dropdown on outside click
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (loyaltyRef.current && !loyaltyRef.current.contains(e.target as Node)) {
        setLoyaltyMenuOpen(false);
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
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/95 backdrop-blur-md">
      {/* Top Provenance & Market Strip */}
      <div className="border-b border-[var(--border-subtle)] bg-[#123524] text-[#F7F5F0] text-[11px]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <span className="h-2 w-2 rounded-full bg-[#4ADE80] animate-pulse" />
              Overené dáta pre Slovensko (EUR • s DPH)
            </span>
            <span className="hidden md:inline text-[#C9D8CF]">|</span>
            <span className="hidden md:inline text-[#D6E3DC]">
              Porovnávame reťazce: <strong>Lidl Slovakia</strong> • <strong>Tesco Slovakia</strong> •{' '}
              <strong>BILLA Slovakia</strong>
            </span>
          </div>
          <div className="flex items-center gap-4 font-mono-tabular text-[#D6E3DC]">
            <Link href="/historia-cien" className="hover:underline">
              Zdroje dát a stav adaptérov →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 py-3">
          {/* Official Brand Logo */}
          <BrandLogo size="md" />

          {/* Expandable Global Search */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md mx-4"
          >
            <motion.div
              animate={{ scale: searchFocused ? 1.01 : 1 }}
              transition={{ duration: 0.16 }}
              className={`relative flex items-center w-full rounded-xl border bg-[var(--bg-surface)] transition-colors ${
                searchFocused
                  ? 'border-[#123524] ring-2 ring-[#123524]/15'
                  : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
              }`}
            >
              <Search className="h-4 w-4 text-[var(--text-muted)] ml-3.5 shrink-0" />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Hľadať produkt, značku alebo EAN čiarový kód..."
                aria-label="Hľadať produkt, značku alebo EAN čiarový kód"
                className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
              />
              <kbd className="hidden lg:inline-flex items-center gap-0.5 mr-2.5 px-1.5 py-0.5 text-[10px] font-mono-tabular text-[var(--text-muted)] bg-[var(--bg-subtle)] rounded border border-[var(--border-subtle)]">
                Ctrl K
              </kbd>
            </motion.div>
          </form>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Loyalty Cards Dropdown */}
            <div ref={loyaltyRef} className="relative">
              <button
                type="button"
                onClick={() => setLoyaltyMenuOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8C98E] bg-[#FDF6E9] text-[#8F5B14] text-xs font-semibold hover:bg-[#F9ECCF] transition-colors cursor-pointer"
                aria-expanded={loyaltyMenuOpen}
                aria-label="Nastavenie vernostných kariet"
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Vernostné karty</span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#8F5B14] text-white text-[10px] font-mono-tabular">
                  {activeLoyaltyCount}/3
                </span>
              </button>

              <AnimatePresence>
                {loyaltyMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 mt-2 w-72 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-4 shadow-xl z-50"
                  >
                    <p className="text-xs font-bold text-[var(--text-primary)]">
                      Zahrnúť ceny vernostných kariet
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 mb-3">
                      Okamžite prepočíta najnižšie ceny a optimalizáciu košíka.
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
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-colors cursor-pointer ${
                              checked
                                ? 'border-[#177245]/40 bg-[#EAF6EF]/60'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: card.color }}
                              />
                              <div>
                                <span className="text-xs font-bold text-[var(--text-primary)] block">
                                  {card.label}
                                </span>
                                <span className="text-[10px] text-[var(--text-muted)]">
                                  {card.store}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`h-5 w-5 rounded-md flex items-center justify-center ${
                                checked
                                  ? 'bg-[#177245] text-white'
                                  : 'border border-[var(--border-strong)] bg-white'
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

            {/* Price Alerts & Notifications */}
            <Link
              href="/upozornenia"
              aria-label="Cenové upozornenia"
              className="relative p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
            >
              <Bell className="h-4 w-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-[#C84B31] text-white text-[10px] font-mono-tabular font-bold flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </Link>

            {/* Settings */}
            <Link
              href="/nastavenia"
              aria-label="Nastavenia aplikácie"
              className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
            >
              <Settings className="h-4 w-4" />
            </Link>

            {/* Animated Shopping Basket Pill */}
            <motion.div
              key={cartPulseKey}
              animate={cartPulseKey > 0 ? { scale: [1, 1.12, 1] } : {}}
              transition={{ duration: 0.32 }}
            >
              <Link
                href="/optimalizator"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#123524] hover:bg-[#1A4B33] text-white text-xs font-semibold transition-colors shadow-2xs"
              >
                <ShoppingBasket className="h-4 w-4" />
                <span className="hidden sm:inline">Košík</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono-tabular text-[11px] font-bold">
                  {activeListCount}
                </span>
              </Link>
            </motion.div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? 'Zavrieť menu' : 'Otvoriť menu'}
              className="lg:hidden p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Desktop Primary Navigation Bar */}
        <nav
          aria-label="Hlavná navigácia"
          className="hidden lg:flex items-center gap-1 pb-2 overflow-x-auto"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'text-[#123524] dark:text-[#86EFAC]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-active-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-[var(--brand-accent-soft)] border border-[#123524]/15 -z-10"
                  />
                )}
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden overflow-hidden border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]"
          >
            <div className="px-4 py-4 space-y-3">
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Hľadať produkt, značku alebo EAN..."
                  className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#123524] text-white text-xs font-semibold"
                >
                  Hľadať
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                        isActive
                          ? 'bg-[var(--brand-accent-soft)] text-[#123524] border border-[#123524]/20'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
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
