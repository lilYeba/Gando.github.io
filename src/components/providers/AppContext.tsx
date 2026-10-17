'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { MotionConfig, AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import type { LoyaltyPreferences } from '@/lib/domain/types';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: 'success' | 'warning' | 'info';
}

interface AppContextValue {
  language: 'sk' | 'en';
  setLanguage: (lang: 'sk' | 'en') => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  reducedMotion: boolean;
  setReducedMotion: (rm: boolean) => void;
  loyaltyPrefs: LoyaltyPreferences;
  toggleLoyaltyCard: (key: keyof LoyaltyPreferences) => void;
  setLoyaltyPrefs: (prefs: LoyaltyPreferences) => void;
  activeListId: string;
  setActiveListId: (id: string) => void;
  activeListCount: number;
  cartPulseKey: number;
  addProductToActiveList: (productId: string, productName: string, quantity?: number) => Promise<void>;
  favoriteIds: string[];
  toggleFavorite: (productId: string, productName?: string) => Promise<void>;
  unreadNotificationsCount: number;
  refreshHeaderCounts: () => Promise<void>;
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<'sk' | 'en'>('sk');
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [reducedMotion, setReducedMotionState] = useState(false);
  const [loyaltyPrefs, setLoyaltyPrefsState] = useState<LoyaltyPreferences>({
    includeLidlPlus: true,
    includeTescoClubcard: true,
    includeBillaBonus: true,
  });
  const [activeListId, setActiveListId] = useState<string>('list-rodinny-nakup');
  const [activeListCount, setActiveListCount] = useState<number>(8);
  const [cartPulseKey, setCartPulseKey] = useState<number>(0);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(2);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const refreshHeaderCounts = useCallback(async () => {
    try {
      const [prefsRes, listsRes, alertsRes, prodsRes] = await Promise.all([
        fetch('/api/preferences'),
        fetch('/api/lists'),
        fetch('/api/alerts'),
        fetch('/api/products?pageSize=1'),
      ]);

      if (prefsRes.ok) {
        const { preferences } = await prefsRes.json();
        if (preferences) {
          setLanguageState(preferences.language === 'en' ? 'en' : 'sk');
          const resolvedTheme = preferences.theme === 'dark' ? 'dark' : 'light';
          setThemeState(resolvedTheme);
          document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
          setReducedMotionState(Boolean(preferences.reducedMotion));
          setLoyaltyPrefsState({
            includeLidlPlus: Boolean(preferences.includeLidlPlus),
            includeTescoClubcard: Boolean(preferences.includeTescoClubcard),
            includeBillaBonus: Boolean(preferences.includeBillaBonus),
          });
        }
      }

      if (listsRes.ok) {
        const { lists } = await listsRes.json();
        if (Array.isArray(lists) && lists.length > 0) {
          const current = lists.find((l: { id: string }) => l.id === activeListId) ?? lists[0];
          setActiveListId(current.id);
          setActiveListCount(current.itemCount ?? 0);
        }
      }

      if (alertsRes.ok) {
        const { notifications } = await alertsRes.json();
        if (Array.isArray(notifications)) {
          setUnreadNotificationsCount(notifications.filter((n: { isRead: boolean }) => !n.isRead).length);
        }
      }

      if (prodsRes.ok) {
        const data = await prodsRes.json();
        if (Array.isArray(data.favoriteProductIds)) {
          setFavoriteIds(data.favoriteProductIds);
        }
      }
    } catch {
      // Ignore network errors during initial hydration
    }
  }, [activeListId]);

  useEffect(() => {
    refreshHeaderCounts();
  }, [refreshHeaderCounts]);

  const setLanguage = useCallback(
    async (lang: 'sk' | 'en') => {
      setLanguageState(lang);
      await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang }),
      });
      showToast({
        title: lang === 'sk' ? 'Jazyk rozhrania: Slovenčina' : 'Interface language: English',
        variant: 'info',
      });
    },
    [showToast]
  );

  const setTheme = useCallback(
    async (nextTheme: 'light' | 'dark') => {
      setThemeState(nextTheme);
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
      await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: nextTheme }),
      });
    },
    []
  );

  const setReducedMotion = useCallback(
    async (rm: boolean) => {
      setReducedMotionState(rm);
      await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reducedMotion: rm }),
      });
      showToast({
        title: rm ? 'Obmedzenie pohybu zapnuté' : 'Štandardné animácie zapnuté',
        variant: 'info',
      });
    },
    [showToast]
  );

  const setLoyaltyPrefs = useCallback(
    async (next: LoyaltyPreferences) => {
      setLoyaltyPrefsState(next);
      await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
    },
    []
  );

  const toggleLoyaltyCard = useCallback(
    async (key: keyof LoyaltyPreferences) => {
      const next = { ...loyaltyPrefs, [key]: !loyaltyPrefs[key] };
      setLoyaltyPrefsState(next);
      await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: next[key] }),
      });
      const label =
        key === 'includeLidlPlus'
          ? 'Lidl Plus'
          : key === 'includeTescoClubcard'
            ? 'Tesco Clubcard'
            : 'BILLA Bonus';
      showToast({
        title: `${label}: ${next[key] ? 'Zahrnutá do výpočtov' : 'Vylúčená z výpočtov'}`,
        description: 'Všetky porovnania a košík boli prepočítané.',
        variant: 'info',
      });
    },
    [loyaltyPrefs, showToast]
  );

  const addProductToActiveList = useCallback(
    async (productId: string, productName: string, quantity = 1) => {
      const res = await fetch(`/api/lists/${activeListId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_item',
          productId,
          quantity,
        }),
      });
      if (res.ok) {
        const { list } = await res.json();
        setActiveListCount(list.itemCount ?? activeListCount + 1);
        setCartPulseKey((k) => k + 1);
        showToast({
          title: 'Pridané do nákupného zoznamu',
          description: `${productName} (${quantity}×) bol pridaný do „${list.name}“.`,
          variant: 'success',
        });
      }
    },
    [activeListId, activeListCount, showToast]
  );

  const toggleFavorite = useCallback(
    async (productId: string, productName?: string) => {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        const data = await res.json();
        setFavoriteIds(data.favoriteProductIds);
        showToast({
          title: data.isFavorite ? 'Pridané medzi obľúbené' : 'Odstránené z obľúbených',
          description: productName,
          variant: 'info',
        });
      }
    },
    [showToast]
  );

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        setTheme,
        reducedMotion,
        setReducedMotion,
        loyaltyPrefs,
        toggleLoyaltyCard,
        setLoyaltyPrefs,
        activeListId,
        setActiveListId,
        activeListCount,
        cartPulseKey,
        addProductToActiveList,
        favoriteIds,
        toggleFavorite,
        unreadNotificationsCount,
        refreshHeaderCounts,
        showToast,
      }}
    >
      <MotionConfig reducedMotion={reducedMotion ? 'always' : 'user'}>
        {children}

        {/* Editorial Toast Stack */}
        <div
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        >
          <AnimatePresence mode="popLayout">
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-auto flex items-start gap-3 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-3.5 shadow-lg"
              >
                {t.variant === 'warning' ? (
                  <AlertTriangle className="h-5 w-5 text-[#B45309] shrink-0 mt-0.5" />
                ) : t.variant === 'info' ? (
                  <Info className="h-5 w-5 text-[#123524] shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-[#177245] shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{t.title}</p>
                  {t.description && (
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                      {t.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                  aria-label="Zavrieť hlásenie"
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </MotionConfig>
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
}
