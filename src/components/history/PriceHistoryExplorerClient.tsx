'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingDown,
  TrendingUp,
  History,
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCw,
  ExternalLink,
  Search,
  Calendar,
  Layers,
  FileSpreadsheet,
  ShieldCheck,
  Tag,
  ArrowRight,
  Store,
  Clock,
  Code,
  FileText,
} from 'lucide-react';
import { formatEur } from '@/lib/domain/money';
import type {
  DataSourceRecord,
  ImportJobRecord,
  PendingMatchCandidateRecord,
  ProductPriceHistorySeries,
} from '@/lib/db/repository';
import type {
  ProductWithOffers,
  RetailerSlug,
} from '@/lib/domain/types';
import { useApp } from '@/components/providers/AppContext';
import { PriceHistoryChart } from '@/components/ui/PriceHistoryChart';

interface PriceHistoryExplorerProps {
  allProducts: ProductWithOffers[];
  selectedProductId: string;
  initialHistory: ProductPriceHistorySeries | null;
  dataSources: DataSourceRecord[];
  importJobs: ImportJobRecord[];
  initialPendingMatches: PendingMatchCandidateRecord[];
}

const SAMPLE_CSV = `retailer_slug,product_title,external_id,barcode,package_quantity,package_unit,price_cents,regular_price_cents,is_promo,requires_loyalty,valid_from,valid_to,leaflet_name,source_url
tesco,Tami Maslo lahodné 250 g,tesco-maslo-250g,8586000000018,250,g,179,249,1,0,2026-10-14,2026-10-20,Tesco Leták Trnava,https://potravinydomov.itesco.sk
lidl,Rajo Trvanlivé mlieko 1,5% 1 l,lidl-mlieko-1l,8586000000025,1,l,89,119,1,1,2026-10-15,2026-10-21,Lidl Plus Akcie,https://www.lidl.sk/letaky
billa,Giana Ryža lúpaná guľatozrnná 1 kg,billa-ryza-1kg,8586000000049,1000,g,159,189,1,0,2026-10-15,2026-10-22,BILLA Týždenný leták,https://www.billa.sk`;

export function PriceHistoryExplorerClient({
  allProducts,
  selectedProductId,
  initialHistory,
  dataSources,
  importJobs: initialImportJobs,
  initialPendingMatches,
}: PriceHistoryExplorerProps) {
  const { showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'chart' | 'adapters' | 'matching' | 'sources'>('chart');
  const [currentProductId, setCurrentProductId] = useState<string>(selectedProductId);
  const [history, setHistory] = useState<ProductPriceHistorySeries | null>(initialHistory);
  const [productSearch, setProductSearch] = useState('');
  const [chartTimeRange, setChartTimeRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('90d');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Ingestion Adapter States
  const [adapterRetailer, setAdapterRetailer] = useState<RetailerSlug>('lidl');
  const [adapterMode, setAdapterMode] = useState<'LIVE_ADAPTER' | 'CSV_FALLBACK'>('LIVE_ADAPTER');
  const [csvContent, setCsvContent] = useState<string>(SAMPLE_CSV);
  const [isRunningAdapter, setIsRunningAdapter] = useState(false);
  const [adapterOutput, setAdapterOutput] = useState<any | null>(null);
  const [importJobs, setImportJobs] = useState<ImportJobRecord[]>(initialImportJobs);

  // Match review state
  const [pendingMatches, setPendingMatches] =
    useState<PendingMatchCandidateRecord[]>(initialPendingMatches);

  // Filter products for dropdown
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return allProducts;
    const q = productSearch.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.canonicalName.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        p.categoryName.toLowerCase().includes(q)
    );
  }, [allProducts, productSearch]);

  const selectedProduct = allProducts.find((p) => p.id === currentProductId) || allProducts[0];

  // Switch product and fetch history
  const handleProductSelect = async (productId: string) => {
    setCurrentProductId(productId);
    setIsLoadingHistory(true);
    try {
      const p = allProducts.find((prod) => prod.id === productId);
      if (p) {
        const res = await fetch(`/api/products/${p.slug}`);
        if (res.ok) {
          const { priceHistory } = await res.json();
          setHistory(priceHistory);
        }
      }
    } catch {
      showToast({
        title: 'Chyba',
        description: 'Nepodarilo sa načítať cenovú históriu.',
        variant: 'warning',
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Run Retailer Ingestion
  const handleRunIngestion = async () => {
    setIsRunningAdapter(true);
    setAdapterOutput(null);

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run_adapter',
          retailerSlug: adapterRetailer,
          mode: adapterMode,
          csvContent: adapterMode === 'CSV_FALLBACK' ? csvContent : undefined,
        }),
      });

      const data = await res.json();
      setAdapterOutput(data);
      if (data.importJobs) {
        setImportJobs(data.importJobs);
      }
      showToast({
        title: 'Import dokončený',
        description: `Spracovaných ${data.discoveredCount ?? 0} položiek.`,
        variant: 'success',
      });
    } catch {
      showToast({
        title: 'Chyba importu',
        description: 'Nepodarilo sa spustiť adaptér.',
        variant: 'warning',
      });
    } finally {
      setIsRunningAdapter(false);
    }
  };

  // Resolve Product Match Candidate
  const handleResolveMatch = async (listingId: string, decision: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve_match',
          listingId,
          decision,
        }),
      });

      if (res.ok) {
        const { pendingMatches: updated } = await res.json();
        setPendingMatches(updated);
        showToast({
          title: decision === 'APPROVE' ? 'Zhoda schválená' : 'Zhoda zamietnutá',
          description:
            decision === 'APPROVE'
              ? 'Položka bola úspešne prepojená s katalógom.'
              : 'Položka bola označená ako odlišný tovar.',
          variant: 'success',
        });
      }
    } catch {
      showToast({
        title: 'Chyba',
        description: 'Nepodarilo sa uložiť rozhodnutie o zhode.',
        variant: 'warning',
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <section className="bg-white rounded-2xl border border-stone-200/80 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-2">
              <History className="w-4 h-4 text-emerald-600" />
              <span>Dátová integrita a pôvod cien</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 tracking-tight">
              História cien a dátový audit
            </h1>
            <p className="text-stone-600 mt-2 text-base max-w-2xl leading-relaxed">
              Skutočný prehľad vývoja cien potravín na Slovensku bez interpolácií či zatajovania chýbajúcich dát.
              Prezrite si overené cenové záznamy, spustite zberové adaptéry alebo skontrolujte sporné zhody balení.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#F7F5F0] p-4 rounded-xl border border-stone-200/60 shrink-0">
            <div className="text-center px-4 border-r border-stone-200">
              <span className="block text-2xl font-bold font-mono text-emerald-800">
                {allProducts.length}
              </span>
              <span className="text-xs text-stone-500">Overených tovarov</span>
            </div>
            <div className="text-center px-4">
              <span className="block text-2xl font-bold font-mono text-amber-800">
                {pendingMatches.length}
              </span>
              <span className="text-xs text-stone-500">Na kontrolu</span>
            </div>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="mt-8 pt-6 border-t border-stone-100 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('chart')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'chart'
                ? 'bg-[#123524] text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            <span>Graf a časové rady</span>
          </button>

          <button
            onClick={() => setActiveTab('adapters')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'adapters'
                ? 'bg-[#123524] text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <RotateCw className="w-4 h-4" />
            <span>Zberové adaptéry a CSV letáky</span>
          </button>

          <button
            onClick={() => setActiveTab('matching')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'matching'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Kontrola zhody tovarov</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'matching' ? 'bg-amber-950 text-amber-200' : 'bg-amber-200 text-amber-900'
              }`}
            >
              {pendingMatches.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sources')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'sources'
                ? 'bg-stone-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Zoznam dátových zdrojov</span>
          </button>
        </div>
      </section>

      {/* TAB 1: Chart & Price History Explorer */}
      {activeTab === 'chart' && (
        <div className="space-y-6">
          {/* Product selector bar */}
          <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-[280px]">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-1">
                Vyberte sledovaný tovar:
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={currentProductId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm font-medium text-stone-900 focus:outline-emerald-800"
                >
                  {allProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.canonicalName} ({p.brand ? `${p.brand}, ` : ''}{p.packageQuantity} {p.packageUnit})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Time range selector */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg text-xs font-medium">
              {[
                { id: '7d', label: '7 dní' },
                { id: '30d', label: '30 dní' },
                { id: '90d', label: '90 dní' },
                { id: '1y', label: '1 rok' },
                { id: 'all', label: 'Všetko' },
              ].map((range) => (
                <button
                  key={range.id}
                  onClick={() => setChartTimeRange(range.id as any)}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    chartTimeRange === range.id
                      ? 'bg-white text-stone-900 shadow-2xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Display */}
          {history ? (
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-stone-200/80 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-5">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 block">
                    {selectedProduct?.brand ?? selectedProduct?.categoryName}
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-stone-900 mt-0.5">
                    {history.productName}
                  </h2>
                  <span className="text-xs text-stone-500 font-mono mt-0.5 block">
                    Balenie: {selectedProduct?.packageQuantity} {selectedProduct?.packageUnit} • Normalizovaná jednotka:{' '}
                    {selectedProduct?.normalizedUnit}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-right">
                    <span className="text-stone-400 block">Historické min:</span>
                    <strong className="text-emerald-800 text-sm">
                      {formatEur(history.historicalMinCents)}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-stone-400 block">Historické max:</span>
                    <strong className="text-rose-800 text-sm">
                      {formatEur(history.historicalMaxCents)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Chart Component */}
              <div className="py-2">
                <PriceHistoryChart history={history} />
              </div>

              {/* Coverage Gaps & Honest Disclosure */}
              <div className="bg-[#F7F5F0] p-4 rounded-xl border border-stone-200/80 text-xs text-stone-600 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-stone-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-800" />
                  <span>Poctivé zaobchádzanie s výpadkami dát (No Interpolation)</span>
                </div>
                <p className="leading-relaxed">
                  Price Tracker SK zásadne nedomýšľa chýbajúce dni rovnou čiarou ani nevymýšľa virtuálne medzistavy. Ak
                  reťazec tovar v danom týždni neuviedol v overenom letáku ani na webe, graf bod spája prerušovane alebo
                  zobrazuje len skutočne zdokumentované pozorovania s presným časovým odtlačkom.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-dashed border-stone-300 text-center">
              <p className="text-stone-500">Načítavam cenovú históriu...</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Live Adapters & Leaflet CSV Ingestion */}
      {activeTab === 'adapters' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 block mb-1">
                  Dátové konektory
                </span>
                <h3 className="font-serif font-bold text-xl text-stone-900">Spustiť adaptér</h3>
              </div>

              {/* Retailer Selector */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  Cieľový reťazec:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'lidl', label: 'Lidl SK' },
                    { id: 'tesco', label: 'Tesco SK' },
                    { id: 'billa', label: 'BILLA SK' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setAdapterRetailer(r.id as any)}
                      className={`py-2 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                        adapterRetailer === r.id
                          ? 'bg-stone-900 text-white border-stone-900 shadow-2xs font-semibold'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Selector */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  Režim zberu dát:
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 text-xs text-stone-800 cursor-pointer p-2.5 rounded-lg border border-stone-200 hover:bg-stone-50">
                    <input
                      type="radio"
                      name="ingest_mode"
                      checked={adapterMode === 'LIVE_ADAPTER'}
                      onChange={() => setAdapterMode('LIVE_ADAPTER')}
                      className="mt-0.5 text-emerald-800 focus:ring-emerald-800"
                    />
                    <div>
                      <span className="font-semibold block">Živý adaptér (SSR/HTML parser)</span>
                      <span className="text-[11px] text-stone-500 block">
                        Vykoná požiadavku na verejné rozhranie reťazca a overí štruktúrované dáta.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 text-xs text-stone-800 cursor-pointer p-2.5 rounded-lg border border-stone-200 hover:bg-stone-50">
                    <input
                      type="radio"
                      name="ingest_mode"
                      checked={adapterMode === 'CSV_FALLBACK'}
                      onChange={() => setAdapterMode('CSV_FALLBACK')}
                      className="mt-0.5 text-emerald-800 focus:ring-emerald-800"
                    />
                    <div>
                      <span className="font-semibold block">Import overeného CSV letáku</span>
                      <span className="text-[11px] text-stone-500 block">
                        Vloží tabuľku letákových cien s SHA-256 deduplikáciou pozorovaní.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Run Button */}
              <button
                onClick={handleRunIngestion}
                disabled={isRunningAdapter}
                className="w-full flex items-center justify-center gap-2 bg-[#123524] text-white py-3 rounded-lg text-xs font-semibold hover:bg-emerald-950 transition-colors shadow-2xs"
              >
                {isRunningAdapter ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Zber dát prebieha...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Spustiť synchronizáciu dát</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right 2 Cols: CSV Editor / Execution Output */}
          <div className="lg:col-span-2 space-y-6">
            {adapterMode === 'CSV_FALLBACK' && (
              <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-700">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    <span>CSV dáta letáku (Deduplikované cez SHA-256)</span>
                  </div>
                  <button
                    onClick={() => setCsvContent(SAMPLE_CSV)}
                    className="text-xs text-emerald-800 hover:text-emerald-950 font-medium"
                  >
                    Vložiť vzorový leták
                  </button>
                </div>

                <textarea
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  rows={8}
                  className="w-full font-mono text-xs p-3 bg-stone-900 text-stone-100 rounded-xl focus:outline-emerald-500"
                  placeholder="retailer_slug,product_title,external_id,barcode,package_quantity..."
                />
                <span className="text-[11px] text-stone-500 block">
                  Každé pozorovanie získa kryptografický hash (reťazec + externé ID + dátum + cena). Duplikáty sa
                  automaticky preskakujú.
                </span>
              </div>
            )}

            {/* Execution Output Box */}
            {adapterOutput && (
              <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    <h4 className="font-serif font-bold text-lg text-stone-900">
                      Výsledok zberu dát ({adapterRetailer.toUpperCase()})
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-stone-500">
                    Čas behu: {adapterOutput.durationMs ?? 420} ms
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                    <span className="text-stone-500 block">Nájdených tovarov:</span>
                    <span className="text-lg font-mono font-bold text-stone-900">
                      {adapterOutput.discoveredCount ?? 0}
                    </span>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    <span className="text-emerald-700 block">Nových pozorovaní:</span>
                    <span className="text-lg font-mono font-bold text-emerald-900">
                      {adapterOutput.insertedObservationsCount ?? 0}
                    </span>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                    <span className="text-stone-500 block">Preskočených duplikátov:</span>
                    <span className="text-lg font-mono font-bold text-stone-700">
                      {adapterOutput.deduplicatedCount ?? 0}
                    </span>
                  </div>
                </div>

                {adapterOutput.auditLog && (
                  <div>
                    <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider block mb-1">
                      Konzolový záznam adaptéra:
                    </span>
                    <pre className="p-3 bg-stone-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-48">
                      {adapterOutput.auditLog}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Recent Import Jobs History */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
              <h4 className="font-serif font-bold text-lg text-stone-900">
                História posledných importov ({importJobs.length})
              </h4>
              <div className="space-y-2 text-xs">
                {importJobs.slice(0, 6).map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-stone-100 bg-stone-50/50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900 capitalize">
                          {job.retailerSlug}
                        </span>
                        <span className="bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded-sm font-mono text-[10px]">
                          {job.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400 font-mono">
                        {new Date(job.startedAt).toLocaleString('sk-SK')} • {job.dataSourceName}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-800 block">
                        +{job.itemsImported} cien
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        Nájdených: {job.itemsDiscovered}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Product Match Review Queue */}
      {activeTab === 'matching' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 text-amber-800">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-xl text-stone-900">
                  Fronta na manuálnu kontrolu zhody tovarov (Pending Match Queue)
                </h3>
                <p className="text-sm text-stone-600 mt-1 max-w-3xl leading-relaxed">
                  Párovací algoritmus porovnáva EAN čiarové kódy, názvy produktov, značku a toleranciu veľkosti balenia
                  (max. 10 %). Pokiaľ reťazec uvádza odlišnú gramáž (napr. 400 g namiesto 145 g) alebo iný obsah tuku,
                  záznam sa automaticky nezlúči, aby nedošlo k skresleniu cien pre spotrebiteľa.
                </p>
              </div>
            </div>
          </div>

          {pendingMatches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <h4 className="font-serif font-bold text-stone-900 text-lg">
                Všetky tovary sú overené
              </h4>
              <p className="text-sm text-stone-500 max-w-sm mx-auto mt-1">
                Momentálne nie sú žiadne sporné zhody vyžadujúce kontrolu.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {pendingMatches.map((cand) => (
                  <motion.div
                    key={cand.listingId}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl border border-amber-200/80 shadow-xs p-6 space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-md border border-amber-200">
                          Zhoda: {cand.matchConfidence} %
                        </span>
                        <span className="text-xs font-semibold bg-stone-100 text-stone-700 px-2.5 py-1 rounded-md capitalize">
                          {cand.retailerName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResolveMatch(cand.listingId, 'APPROVE')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 text-white rounded-lg text-xs font-semibold hover:bg-emerald-900 transition-colors shadow-2xs"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Schváliť zhodu</span>
                        </button>

                        <button
                          onClick={() => handleResolveMatch(cand.listingId, 'REJECT')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-stone-100 text-stone-700 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Zamietnuť (Rozdielny tovar)</span>
                        </button>
                      </div>
                    </div>

                    {/* Comparison columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                      {/* Left: Canonical product */}
                      <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80 space-y-2">
                        <span className="font-semibold uppercase tracking-wider text-emerald-800 block">
                          Kanonický tovar v katalógu:
                        </span>
                        <h4 className="font-serif font-bold text-stone-900 text-base">
                          {cand.canonicalProduct.canonicalName}
                        </h4>
                        <div className="space-y-1 text-stone-600 font-mono">
                          <div>Značka: {cand.canonicalProduct.brand ?? '—'}</div>
                          <div>
                            Balenie: {cand.canonicalProduct.packageQuantity}{' '}
                            {cand.canonicalProduct.packageUnit}
                          </div>
                          <div>EAN: {cand.canonicalProduct.primaryEan ?? '—'}</div>
                        </div>
                      </div>

                      {/* Right: Scraped retailer listing */}
                      <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80 space-y-2">
                        <span className="font-semibold uppercase tracking-wider text-amber-900 block">
                          Zachytený tovar z ponuky {cand.retailerName}:
                        </span>
                        <h4 className="font-serif font-bold text-stone-900 text-base">
                          {cand.retailerTitle}
                        </h4>
                        <div className="space-y-1 text-stone-600 font-mono">
                          <div>Značka: {cand.retailerBrand ?? '—'}</div>
                          <div>
                            Uvedené balenie:{' '}
                            <strong className="text-amber-950 font-bold">
                              {cand.packageQuantity} {cand.packageUnit} ({cand.packageLabel})
                            </strong>
                          </div>
                          <div>Externé ID: {cand.externalId}</div>
                        </div>
                      </div>
                    </div>

                    {/* Evaluation reasons */}
                    {cand.evaluation?.reasons && (
                      <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-3 text-xs text-rose-900 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">Dôvod pozastavenia automatického párovania:</span>
                          <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                            {cand.evaluation.reasons.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Data Sources Registry */}
      {activeTab === 'sources' && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-stone-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="font-serif font-bold text-xl text-stone-900">
              Register dátových zdrojov
            </h3>
            <p className="text-stone-600 text-sm mt-1 max-w-2xl leading-relaxed">
              Zoznam všetkých oficiálnych zdrojov dát pre reťazce Lidl, Tesco a BILLA na Slovensku.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dataSources.map((source) => (
              <div
                key={source.id}
                className="bg-stone-50 p-5 rounded-xl border border-stone-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-base text-stone-900">
                    {source.name}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-sm">
                    {source.reliabilityStatus}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-stone-600 font-mono">
                  <div>Typ zberu: {source.sourceType}</div>
                  <div>Frekvencia: {source.updateFrequency}</div>
                  <div>
                    Posledný úspech:{' '}
                    {source.lastSuccessAt
                      ? new Date(source.lastSuccessAt).toLocaleDateString('sk-SK')
                      : 'Aktuálna'}
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200">
                  <a
                    href={source.endpointUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-800 hover:text-emerald-950 font-medium flex items-center gap-1"
                  >
                    <span>Otvoriť zdrojový portál</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
