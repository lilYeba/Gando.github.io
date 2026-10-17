'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Settings,
  Globe,
  Sun,
  Moon,
  Monitor,
  Zap,
  CreditCard,
  Sliders,
  Bell,
  Shield,
  Download,
  RotateCcw,
  Check,
  Save,
  Car,
  Store,
  Sparkles,
} from 'lucide-react';
import type { UserPreferencesRecord } from '@/lib/db/repository';
import { useApp } from '@/components/providers/AppContext';
import { formatEur } from '@/lib/domain/money';

interface SettingsClientProps {
  initialPreferences: UserPreferencesRecord;
}

export function SettingsClient({ initialPreferences }: SettingsClientProps) {
  const {
    language,
    setLanguage,
    theme,
    setTheme,
    reducedMotion,
    setReducedMotion,
    loyaltyPrefs,
    setLoyaltyPrefs,
    showToast,
  } = useApp();

  const [lang, setLang] = useState<'sk' | 'en'>(
    initialPreferences.language === 'en' ? 'en' : 'sk'
  );
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(
    initialPreferences.theme as any || 'light'
  );
  const [rm, setRm] = useState<boolean>(initialPreferences.reducedMotion);

  // Loyalty Cards
  const [lidlPlus, setLidlPlus] = useState<boolean>(initialPreferences.includeLidlPlus);
  const [clubcard, setClubcard] = useState<boolean>(initialPreferences.includeTescoClubcard);
  const [billaBonus, setBillaBonus] = useState<boolean>(initialPreferences.includeBillaBonus);

  // Optimizer defaults
  const [defaultMaxStores, setDefaultMaxStores] = useState<number>(
    initialPreferences.defaultMaxStores || 2
  );
  const [defaultTripCostEur, setDefaultTripCostEur] = useState<number>(
    (initialPreferences.defaultTripCostCents ?? 150) / 100
  );

  // Notifications & Privacy
  const [inAppNotif, setInAppNotif] = useState<boolean>(
    initialPreferences.inAppNotificationsEnabled ?? true
  );
  const [emailNotif, setEmailNotif] = useState<boolean>(
    initialPreferences.emailNotificationsEnabled ?? false
  );
  const [privacyOptOut, setPrivacyOptOut] = useState<boolean>(
    initialPreferences.analyticsPrivacyOptOut ?? true
  );

  const [isSaving, setIsSaving] = useState(false);

  // Save Preferences
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: lang,
          theme: themeMode,
          reducedMotion: rm,
          includeLidlPlus: lidlPlus,
          includeTescoClubcard: clubcard,
          includeBillaBonus: billaBonus,
          defaultMaxStores,
          defaultTripCostCents: Math.round(defaultTripCostEur * 100),
          inAppNotificationsEnabled: inAppNotif,
          emailNotificationsEnabled: emailNotif,
          analyticsPrivacyOptOut: privacyOptOut,
        }),
      });

      if (res.ok) {
        // Update AppContext
        setLanguage(lang);
        setTheme(themeMode === 'dark' ? 'dark' : 'light');
        setReducedMotion(rm);
        setLoyaltyPrefs({
          includeLidlPlus: lidlPlus,
          includeTescoClubcard: clubcard,
          includeBillaBonus: billaBonus,
        });

        showToast({
          title: 'Nastavenia uložené',
          description: 'Vaše používateľské preferencie boli úspešne aktualizované.',
          variant: 'success',
        });
      }
    } catch {
      showToast({
        title: 'Chyba',
        description: 'Nepodarilo sa uložiť nastavenia.',
        variant: 'warning',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Export Settings as JSON
  const handleExportJSON = () => {
    const data = {
      language: lang,
      theme: themeMode,
      reducedMotion: rm,
      loyalty: {
        includeLidlPlus: lidlPlus,
        includeTescoClubcard: clubcard,
        includeBillaBonus: billaBonus,
      },
      optimizer: {
        defaultMaxStores,
        defaultTripCostEur,
      },
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `price-tracker-sk-nastavenia-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({
      title: 'Nastavenia exportované',
      description: 'Súbor JSON bol stiahnutý do vášho zariadenia.',
      variant: 'info',
    });
  };

  // Reset Local Cache
  const handleResetLocal = () => {
    if (confirm('Naozaj chcete resetovať lokálne vyrovnávacie pamäte a nastavenia prehliadača?')) {
      localStorage.clear();
      sessionStorage.clear();
      showToast({
        title: 'Pamäť vyčistená',
        description: 'Lokálna vyrovnávacia pamäť bola úspešne vymazaná.',
        variant: 'info',
      });
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Editorial Header */}
      <section className="bg-white rounded-2xl border border-stone-200/80 p-6 md:p-8 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-2">
          <Settings className="w-4 h-4 text-emerald-600" />
          <span>Prispôsobenie aplikácie</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 tracking-tight">
          Používateľské nastavenia
        </h1>
        <p className="text-stone-600 mt-2 text-base max-w-2xl leading-relaxed">
          Nastavte si predvolený jazyk, motív vzhľadu, preferované vernostné karty a východiskové parametre pre
          optimalizátor nákupného košíka.
        </p>
      </section>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Vzhľad a jazyk */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-stone-200/80 shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h3 className="font-serif font-bold text-xl text-stone-900">
              Jazyk a vizuálny motív
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Jazyk rozhrania a prispôsobenie farebnej schémy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Language */}
            <div>
              <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-stone-500" />
                Jazyk rozhrania:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLang('sk')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    lang === 'sk'
                      ? 'border-emerald-800 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-800'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span className="font-bold text-sm block">Slovenčina</span>
                  <span className="text-[11px] text-stone-500 block">Predvolený jazyk SR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    lang === 'en'
                      ? 'border-emerald-800 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-800'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span className="font-bold text-sm block">English</span>
                  <span className="text-[11px] text-stone-500 block">European English</span>
                </button>
              </div>
            </div>

            {/* Theme */}
            <div>
              <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-stone-500" />
                Vzhľad a farebný motív:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'light', label: 'Svetlý', icon: Sun },
                  { id: 'dark', label: 'Tmavý', icon: Moon },
                  { id: 'system', label: 'Systém', icon: Monitor },
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setThemeMode(t.id as any)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        themeMode === t.id
                          ? 'border-emerald-800 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-800 font-bold'
                          : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 mx-auto mb-1 text-stone-600" />
                      <span className="text-xs block">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reduced Motion Toggle */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
            <div>
              <span className="font-semibold text-sm text-stone-900 block">
                Obmedziť pohyb animácií (Reduced Motion)
              </span>
              <span className="text-xs text-stone-500 block mt-0.5">
                Vypne dynamické prechody a posuny kariet pri listovaní stránok.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={rm}
                onChange={(e) => setRm(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-800"></div>
            </label>
          </div>

          {/* Format preview */}
          <div className="bg-[#F7F5F0] p-4 rounded-xl border border-stone-200/80 flex items-center justify-between text-xs">
            <span className="text-stone-600">
              Formát meny v aplikácii: <strong>Slovenská konvencia (EUR, desatinná čiarka)</strong>
            </span>
            <span className="font-mono font-bold text-emerald-900 bg-white px-2.5 py-1 rounded-md border border-stone-200">
              {formatEur(199)} (1,99 €)
            </span>
          </div>
        </div>

        {/* 2. Vernostné karty */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-stone-200/80 shadow-xs space-y-5">
          <div className="border-b border-stone-100 pb-4">
            <h3 className="font-serif font-bold text-xl text-stone-900">
              Predvolené vernostné karty
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Zvoľte, ktoré karty a aplikácie bežne používate. Tieto ceny sa budú automaticky zohľadňovať v
              porovnávači aj v nákupnom košíku.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                id: 'lidl',
                name: 'Lidl Plus',
                retailer: 'Lidl Slovakia',
                checked: lidlPlus,
                setter: setLidlPlus,
                badge: 'Modrá aplikácia',
              },
              {
                id: 'tesco',
                name: 'Clubcard',
                retailer: 'Tesco Slovakia',
                checked: clubcard,
                setter: setClubcard,
                badge: 'Klubová karta',
              },
              {
                id: 'billa',
                name: 'BILLA Bonus',
                retailer: 'BILLA Slovakia',
                checked: billaBonus,
                setter: setBillaBonus,
                badge: 'Žltá karta',
              },
            ].map((card) => (
              <label
                key={card.id}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  card.checked
                    ? 'border-amber-300 bg-amber-50/40'
                    : 'border-stone-200 bg-stone-50/50 opacity-75'
                }`}
              >
                <input
                  type="checkbox"
                  checked={card.checked}
                  onChange={(e) => card.setter(e.target.checked)}
                  className="mt-1 rounded text-amber-800 focus:ring-amber-800"
                />
                <div className="min-w-0">
                  <span className="font-bold text-sm text-stone-900 block">{card.name}</span>
                  <span className="text-xs text-stone-500 block">{card.retailer}</span>
                  <span className="inline-block mt-2 text-[10px] font-semibold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-sm">
                    {card.badge}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 3. Východiskové parametre optimalizátora */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-stone-200/80 shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h3 className="font-serif font-bold text-xl text-stone-900">
              Parametre nákupného optimalizátora
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Predvolené správanie pri kalkulácii nákupu vo viacerých reťazcoch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-stone-500" />
                Východiskový max. počet predajní:
              </label>
              <div className="flex gap-2">
                {[1, 2, 3].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDefaultMaxStores(val)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                      defaultMaxStores === val
                        ? 'bg-stone-900 text-white border-stone-900 shadow-2xs font-semibold'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {val === 1 ? '1 predajňa' : `${val} predajne`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-stone-500" />
                  Východiskový náklad na cestu:
                </label>
                <span className="font-mono font-bold text-xs text-emerald-800">
                  {defaultTripCostEur.toFixed(2).replace('.', ',')} €
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={defaultTripCostEur}
                onChange={(e) => setDefaultTripCostEur(parseFloat(e.target.value))}
                className="w-full accent-emerald-800 cursor-pointer"
              />
              <span className="text-[11px] text-stone-400 font-mono mt-1 block">
                Zohľadňuje benzín, parkovné a stratu času.
              </span>
            </div>
          </div>
        </div>

        {/* 4. Súkromie a správa dát */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-stone-200/80 shadow-xs space-y-5">
          <div className="border-b border-stone-100 pb-4">
            <h3 className="font-serif font-bold text-xl text-stone-900">
              Súkromie a lokálne dáta
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Správa lokálnych údajov a export nastavení.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportovať preferencie ako JSON</span>
            </button>

            <button
              type="button"
              onClick={handleResetLocal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Vyčistiť lokálnu pamäť</span>
            </button>
          </div>
        </div>

        {/* Save Bar */}
        <div className="sticky bottom-6 z-20 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-stone-200/80 shadow-lg flex items-center justify-between">
          <span className="text-xs text-stone-500">
            Zmeny sa okamžite prejavia v celom nákupnom portáli.
          </span>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#123524] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-950 transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Ukladám...' : 'Uložiť všetky nastavenia'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
