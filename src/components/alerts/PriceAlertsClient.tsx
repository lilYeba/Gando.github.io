'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  BellRing,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  AlertCircle,
  Mail,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Store,
  CreditCard,
  Search,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { formatEur, eurosToCents } from '@/lib/domain/money';
import type { PriceAlertRecord, NotificationRecord } from '@/lib/db/repository';
import type { ProductWithOffers, RetailerSlug } from '@/lib/domain/types';
import { useApp } from '@/components/providers/AppContext';
import { ProductIllustration } from '@/components/ui/ProductIllustration';

interface PriceAlertsClientProps {
  initialAlerts: PriceAlertRecord[];
  initialNotifications: NotificationRecord[];
  allProducts: ProductWithOffers[];
  smtpConfigured: boolean;
}

export function PriceAlertsClient({
  initialAlerts,
  initialNotifications,
  allProducts,
  smtpConfigured,
}: PriceAlertsClientProps) {
  const { showToast, refreshHeaderCounts } = useApp();

  const [alerts, setAlerts] = useState<PriceAlertRecord[]>(initialAlerts);
  const [notifications, setNotifications] = useState<NotificationRecord[]>(initialNotifications);
  const [activeTab, setActiveTab] = useState<'alerts' | 'notifications'>('alerts');

  // New alert form state
  const [selectedProductId, setSelectedProductId] = useState<string>(allProducts[0]?.id || '');
  const [targetPriceStr, setTargetPriceStr] = useState<string>('1.99');
  const [notifyOnAnyPromo, setNotifyOnAnyPromo] = useState<boolean>(true);
  const [includeLoyalty, setIncludeLoyalty] = useState<boolean>(true);
  const [retailerFilter, setRetailerFilter] = useState<RetailerSlug | ''>('');
  const [productSearchQuery, setProductSearchQuery] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filtered products for dropdown
  const filteredProducts = useMemo(() => {
    if (!productSearchQuery.trim()) return allProducts;
    const q = productSearchQuery.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.canonicalName.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        p.categoryName.toLowerCase().includes(q)
    );
  }, [allProducts, productSearchQuery]);

  // Selected product object
  const currentSelectedProduct = useMemo(
    () => allProducts.find((p) => p.id === selectedProductId),
    [allProducts, selectedProductId]
  );

  // Create alert
  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    const cents = eurosToCents(targetPriceStr);
    if (!cents || cents <= 0) {
      showToast({
        title: 'Neplatná cena',
        description: 'Zadajte platnú cieľovú cenu v eurách (napr. 1,89 €).',
        variant: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_alert',
          productId: selectedProductId,
          targetPriceCents: cents,
          notifyOnAnyPromotion: notifyOnAnyPromo,
          includeLoyaltyPrices: includeLoyalty,
          retailerFilter: retailerFilter || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts);
        if (data.notifications) setNotifications(data.notifications);
        showToast({
          title: 'Hlásič vytvorený',
          description: `Budeme vás informovať, keď cena klesne pod ${targetPriceStr} €.`,
          variant: 'success',
        });
        await refreshHeaderCounts();
      }
    } catch {
      showToast({
        title: 'Chyba',
        description: 'Nepodarilo sa vytvoriť cenové upozornenie.',
        variant: 'warning',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete alert
  const handleDeleteAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts?alertId=${alertId}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts);
        showToast({
          title: 'Hlásič odstránený',
          description: 'Cenové upozornenie bolo zmazané.',
          variant: 'info',
        });
        await refreshHeaderCounts();
      }
    } catch {
      showToast({
        title: 'Chyba',
        description: 'Nepodarilo sa odstrániť upozornenie.',
        variant: 'warning',
      });
    }
  };

  // Mark notification read
  const handleMarkNotificationRead = async (notificationId: string) => {
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_notification_read',
          notificationId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        await refreshHeaderCounts();
      }
    } catch {
      // Ignore
    }
  };

  // Delete notification
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/alerts?notificationId=${notificationId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        await refreshHeaderCounts();
      }
    } catch {
      // Ignore
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <section className="bg-white rounded-2xl border border-stone-200/80 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-2">
              <Bell className="w-4 h-4 text-emerald-600" />
              <span>Automatické stráženie cien a akcií</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 tracking-tight">
              Cenové upozornenia
            </h1>
            <p className="text-stone-600 mt-2 text-base max-w-2xl leading-relaxed">
              Nastavte si cieľovú cenu pre vaše obľúbené potraviny. Hneď ako overíme novú akciu v letáku Lidla, Tesca
              alebo BILLA, obdržíte okamžité upozornenie.
            </p>
          </div>

          {/* Quick summary badges */}
          <div className="flex items-center gap-3 bg-[#F7F5F0] p-4 rounded-xl border border-stone-200/60 shrink-0">
            <div className="text-center px-4 border-r border-stone-200">
              <span className="block text-2xl font-bold font-mono text-emerald-800">
                {alerts.length}
              </span>
              <span className="text-xs text-stone-500">Aktívnych hlásičov</span>
            </div>
            <div className="text-center px-4">
              <span className="block text-2xl font-bold font-mono text-stone-900">
                {unreadCount}
              </span>
              <span className="text-xs text-stone-500">Neprečítaných správ</span>
            </div>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="mt-8 pt-6 border-t border-stone-100 flex gap-2">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'alerts'
                ? 'bg-[#123524] text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Aktívne cenové hlásiče</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                activeTab === 'alerts' ? 'bg-emerald-900 text-emerald-200' : 'bg-stone-200 text-stone-700'
              }`}
            >
              {alerts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'notifications'
                ? 'bg-[#123524] text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <BellRing className="w-4 h-4" />
            <span>Doručené notifikácie</span>
            {unreadCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-rose-600 text-white font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </section>

      {/* Main Content Area */}
      {activeTab === 'alerts' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Create New Alert Form */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 block mb-1">
                  Nový hlásič
                </span>
                <h3 className="font-serif font-bold text-xl text-stone-900">
                  Nastaviť cenový prah
                </h3>
              </div>

              <form onSubmit={handleCreateAlert} className="space-y-4">
                {/* Product Search & Select */}
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Vyberte tovar:
                  </label>
                  <div className="relative mb-2">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Vyhľadať tovar..."
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-emerald-800"
                    />
                  </div>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-emerald-800"
                  >
                    {filteredProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.canonicalName} ({p.brand ? `${p.brand}, ` : ''}{p.packageQuantity} {p.packageUnit})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Price */}
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Cieľová cena (€):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      min="0.10"
                      max="100.00"
                      value={targetPriceStr}
                      onChange={(e) => setTargetPriceStr(e.target.value)}
                      placeholder="1.89"
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm font-mono font-bold text-stone-900 focus:outline-emerald-800"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-stone-400 font-mono">
                      EUR
                    </span>
                  </div>
                  {currentSelectedProduct && (
                    <span className="text-[11px] text-stone-500 mt-1 block">
                      Aktuálna min. cena v obchodoch:{' '}
                      <strong className="text-stone-800">
                        {formatEur(currentSelectedProduct.historicalMinCents)}
                      </strong>
                    </span>
                  )}
                </div>

                {/* Retailer Filter */}
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Obchod:
                  </label>
                  <select
                    value={retailerFilter}
                    onChange={(e) => setRetailerFilter(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-emerald-800"
                  >
                    <option value="">Všetky reťazce (Lidl, Tesco, BILLA)</option>
                    <option value="lidl">Iba Lidl</option>
                    <option value="tesco">Iba Tesco</option>
                    <option value="billa">Iba BILLA</option>
                  </select>
                </div>

                {/* Toggles */}
                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyOnAnyPromo}
                      onChange={(e) => setNotifyOnAnyPromo(e.target.checked)}
                      className="rounded text-emerald-800 focus:ring-emerald-800"
                    />
                    <span>Upozorniť pri akejkoľvek letákovej akcii</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeLoyalty}
                      onChange={(e) => setIncludeLoyalty(e.target.checked)}
                      className="rounded text-emerald-800 focus:ring-emerald-800"
                    />
                    <span>Zahrnúť ceny s vernostnou kartou</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-[#123524] text-white py-2.5 rounded-lg text-xs font-semibold hover:bg-emerald-950 transition-colors shadow-2xs mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Aktivovať cenové upozornenie</span>
                </button>
              </form>
            </div>

            {/* SMTP Honest Delivery Status */}
            <div className="bg-stone-50 rounded-xl border border-stone-200 p-5 text-xs text-stone-600 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-stone-800">
                <Mail className="w-4 h-4 text-stone-600" />
                <span>Stav doručovania hlásení</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                <span className="font-medium text-stone-800">In-app notifikácie: Aktívne</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    smtpConfigured ? 'bg-emerald-600' : 'bg-amber-500'
                  }`}
                />
                <span className="text-stone-600">
                  E-mail: {smtpConfigured ? 'Konfigurovaný' : 'Nekonfigurovaný (SMTP chýba v .env)'}
                </span>
              </div>
              {!smtpConfigured && (
                <p className="text-[11px] text-stone-500 pt-1 leading-relaxed">
                  Pre posielanie e-mailov nastavte v `.env` premenné `SMTP_HOST` a `SMTP_USER`. Všetky hlásenia sa
                  zatiaľ bezpečne zobrazujú priamo v rozhraní.
                </p>
              )}
            </div>
          </div>

          {/* Right 2 Columns: Active Alerts List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-xl text-stone-900">
                Vaše nastavené hlásiče ({alerts.length})
              </h3>
            </div>

            {alerts.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-stone-300 p-12 text-center">
                <Bell className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                <h4 className="font-serif font-bold text-stone-800 text-lg">
                  Žiadne aktívne cenové upozornenia
                </h4>
                <p className="text-sm text-stone-500 max-w-sm mx-auto mt-1">
                  Vytvorte si prvé upozornenie vo formulári vľavo a nenechajte si ujsť zľavy.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {alerts.map((alert) => {
                    const prod = alert.product;
                    const isTriggered = alert.isCurrentlyTriggered;

                    return (
                      <motion.div
                        key={alert.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`bg-white p-5 rounded-xl border transition-all duration-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          isTriggered
                            ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500/30'
                            : 'border-stone-200'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 bg-stone-50 rounded-lg p-1.5 border border-stone-100 shrink-0 flex items-center justify-center">
                            <ProductIllustration
                              slug={prod.slug}
                              categorySlug={prod.categorySlug}
                              brand={prod.brand}
                              imageUrl={prod.imageUrl}
                              className="w-11 h-11"
                            />
                          </div>

                          <div className="min-w-0">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 block">
                              {prod.brand ?? prod.categoryName}
                            </span>
                            <Link
                              href={`/produkt/${prod.slug}`}
                              className="font-serif font-bold text-stone-900 text-base hover:text-emerald-800 transition-colors"
                            >
                              {prod.canonicalName}
                            </Link>

                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                              <span className="font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md">
                                Cieľový prah:{' '}
                                <strong className="font-mono text-emerald-800">
                                  {formatEur(alert.targetPriceCents)}
                                </strong>
                              </span>

                              {alert.retailerFilter && (
                                <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-medium capitalize">
                                  {alert.retailerFilter}
                                </span>
                              )}

                              {alert.includeLoyaltyPrices && (
                                <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 font-medium">
                                  Aj vernostné ceny
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status & Delete */}
                        <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100">
                          <div className="text-left md:text-right">
                            {isTriggered ? (
                              <div>
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Cieľ splnený!
                                </span>
                                <span className="block text-xs text-stone-600 mt-1 font-mono">
                                  Teraz za{' '}
                                  <strong className="text-emerald-900 font-bold">
                                    {formatEur(alert.currentBestPriceCents)}
                                  </strong>{' '}
                                  ({alert.currentBestRetailerName})
                                </span>
                              </div>
                            ) : (
                              <div>
                                <span className="text-xs text-stone-400 font-medium block">
                                  Čaká na zľavu
                                </span>
                                <span className="text-xs text-stone-500 font-mono mt-0.5 block">
                                  Minimálna cena: {formatEur(alert.currentBestPriceCents)}
                                </span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleDeleteAlert(alert.id)}
                            className="text-stone-400 hover:text-rose-600 p-2 transition-colors rounded-lg hover:bg-stone-100"
                            title="Zmazať toto upozornenie"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Notifications Tab */
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-xl text-stone-900">
              História doručených notifikácií ({notifications.length})
            </h3>
          </div>

          {notifications.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-stone-300 p-12 text-center">
              <BellRing className="w-10 h-10 text-stone-400 mx-auto mb-2" />
              <h4 className="font-serif font-bold text-stone-800 text-lg">
                Žiadne notifikácie
              </h4>
              <p className="text-sm text-stone-500 max-w-sm mx-auto mt-1">
                Akonáhle sa overí cena vyhovujúca vašim hlásičom, správa sa objaví tu.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {notifications.map((n) => (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`bg-white p-5 rounded-xl border transition-all duration-200 shadow-2xs flex items-start justify-between gap-4 ${
                      n.isRead ? 'border-stone-200 opacity-70' : 'border-emerald-300 bg-emerald-50/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                          n.isRead ? 'bg-stone-300' : 'bg-emerald-600 animate-pulse'
                        }`}
                      />
                      <div>
                        <h4 className="font-semibold text-stone-900 text-sm">{n.title}</h4>
                        <p className="text-xs text-stone-600 mt-1 leading-relaxed">{n.message}</p>
                        <span className="text-[11px] text-stone-400 font-mono mt-2 block flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(n.createdAt).toLocaleString('sk-SK')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!n.isRead && (
                        <button
                          onClick={() => handleMarkNotificationRead(n.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-md hover:bg-emerald-200 transition-colors"
                          title="Označiť ako prečítané"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Prečítané</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(n.id)}
                        className="text-stone-400 hover:text-rose-600 p-1.5 transition-colors"
                        title="Zmazať notifikáciu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
