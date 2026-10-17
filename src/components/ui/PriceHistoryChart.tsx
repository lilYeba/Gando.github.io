'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Info,
} from 'lucide-react';
import type { ProductPriceHistorySeries } from '@/lib/db/repository';
import type { RetailerSlug } from '@/lib/domain/types';
import { formatEurCents } from '@/lib/domain/money';

const RETAILER_META: Record<
  RetailerSlug,
  { name: string; color: string; strokeDash?: string }
> = {
  lidl: { name: 'Lidl Slovakia', color: '#1D4ED8' },
  tesco: { name: 'Tesco Slovakia', color: '#0F4C81' },
  billa: { name: 'BILLA Slovakia', color: '#B45309' },
};

interface PriceHistoryChartProps {
  history: ProductPriceHistorySeries;
}

export function PriceHistoryChart({ history }: PriceHistoryChartProps) {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [activeDay, setActiveDay] = useState<string | null>(null);

  const allDays = useMemo(() => {
    const set = new Set<string>();
    for (const slug of ['lidl', 'tesco', 'billa'] as RetailerSlug[]) {
      for (const obs of history.observationsByRetailer[slug]) {
        if (obs.effectivePriceCents !== null) {
          set.add(obs.observationDay);
        }
      }
    }
    return Array.from(set).sort();
  }, [history]);

  // Compute y-axis domain with generous padding so small movements are never exaggerated
  const { minPriceCents, maxPriceCents, yMin, yMax } = useMemo(() => {
    const values: number[] = [];
    for (const slug of ['lidl', 'tesco', 'billa'] as RetailerSlug[]) {
      for (const obs of history.observationsByRetailer[slug]) {
        if (obs.effectivePriceCents !== null) values.push(obs.effectivePriceCents);
        if (obs.regularPriceCents !== null) values.push(obs.regularPriceCents);
      }
    }
    if (values.length === 0) {
      return { minPriceCents: 100, maxPriceCents: 300, yMin: 50, yMax: 350 };
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = Math.max(40, max - min);
    return {
      minPriceCents: min,
      maxPriceCents: max,
      yMin: Math.max(0, Math.floor((min - spread * 0.25) / 10) * 10),
      yMax: Math.ceil((max + spread * 0.2) / 10) * 10,
    };
  }, [history]);

  const width = 760;
  const height = 280;
  const padLeft = 64;
  const padRight = 28;
  const padTop = 24;
  const padBottom = 42;
  const innerWidth = width - padLeft - padRight;
  const innerHeight = height - padTop - padBottom;

  const getX = (dayIndex: number, total: number) => {
    if (total <= 1) return padLeft + innerWidth / 2;
    return padLeft + (dayIndex / (total - 1)) * innerWidth;
  };

  const getY = (cents: number) => {
    const ratio = (cents - yMin) / Math.max(1, yMax - yMin);
    return padTop + innerHeight - ratio * innerHeight;
  };

  const selectedDay = activeDay ?? allDays[allDays.length - 1] ?? null;

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-2xs">
      {/* Header & Granularity Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#123524]" />
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              Overená história cien — {history.productName}
            </h3>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Zobrazené sú výhradne reálne zaznamenané cenové pozorovania. Chýbajúce dni nie sú umelo dopĺňané.
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-1 self-start">
          {(
            [
              { id: 'daily', label: 'Denné záznamy' },
              { id: 'weekly', label: 'Týždenne' },
              { id: 'monthly', label: 'Mesačne' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setViewMode(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === tab.id
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Historical Min / Max Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        <div className="rounded-xl border border-[#177245]/25 bg-[#EAF6EF]/50 p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#177245]/10 text-[#177245]">
            <TrendingDown className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-[var(--text-secondary)] block">
              Historické minimum (overené)
            </span>
            <span className="text-base font-extrabold font-mono-tabular text-[#177245]">
              {formatEurCents(history.historicalMinCents ?? minPriceCents)}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#C84B31]/10 text-[#C84B31]">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-[var(--text-secondary)] block">
              Historické maximum (bežná cena)
            </span>
            <span className="text-base font-extrabold font-mono-tabular text-[var(--text-primary)]">
              {formatEurCents(history.historicalMaxCents ?? maxPriceCents)}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[var(--text-secondary)] block">
              Legenda reťazcov
            </span>
            <div className="flex items-center gap-3 mt-1">
              {(['lidl', 'tesco', 'billa'] as RetailerSlug[]).map((slug) => (
                <span key={slug} className="inline-flex items-center gap-1.5 text-xs font-semibold">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: RETAILER_META[slug].color }}
                  />
                  { slug === 'lidl' ? 'Lidl' : slug === 'tesco' ? 'Tesco' : 'BILLA' }
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Interactive SVG Chart */}
      {viewMode === 'daily' ? (
        allDays.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--text-muted)]">
            Pre tento produkt zatiaľ nie sú k dispozícii žiadne historické cenové záznamy.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full min-w-[540px] h-auto select-none"
                role="img"
                aria-label={`Graf vývoja cien produktu ${history.productName}`}
              >
                {/* Horizontal Y-axis grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                  const valCents = Math.round(yMin + t * (yMax - yMin));
                  const y = getY(valCents);
                  return (
                    <g key={t}>
                      <line
                        x1={padLeft}
                        y1={y}
                        x2={width - padRight}
                        y2={y}
                        stroke="var(--border-subtle)"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={padLeft - 10}
                        y={y + 4}
                        textAnchor="end"
                        fontSize="11"
                        fill="var(--text-muted)"
                        className="font-mono-tabular"
                      >
                        {formatEurCents(valCents)}
                      </text>
                    </g>
                  );
                })}

                {/* X-axis day ticks */}
                {allDays.map((day, idx) => {
                  const x = getX(idx, allDays.length);
                  const isSelected = day === selectedDay;
                  return (
                    <g
                      key={day}
                      className="cursor-pointer"
                      onMouseEnter={() => setActiveDay(day)}
                      onClick={() => setActiveDay(day)}
                    >
                      <line
                        x1={x}
                        y1={padTop}
                        x2={x}
                        y2={height - padBottom}
                        stroke={isSelected ? 'var(--brand-primary)' : 'transparent'}
                        strokeWidth={isSelected ? '1.5' : '1'}
                        strokeDasharray="2 2"
                      />
                      <text
                        x={x}
                        y={height - 14}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight={isSelected ? '700' : '500'}
                        fill={isSelected ? 'var(--text-primary)' : 'var(--text-muted)'}
                        className="font-mono-tabular"
                      >
                        {day.slice(5).replace('-', '.')}
                      </text>
                    </g>
                  );
                })}

                {/* Retailer Price Trajectories */}
                {(['lidl', 'tesco', 'billa'] as RetailerSlug[]).map((slug) => {
                  const obsList = history.observationsByRetailer[slug].filter(
                    (o) => o.effectivePriceCents !== null
                  );
                  if (obsList.length === 0) return null;

                  const points = obsList.map((obs) => {
                    const dayIdx = allDays.indexOf(obs.observationDay);
                    return {
                      x: getX(dayIdx, allDays.length),
                      y: getY(obs.effectivePriceCents!),
                      obs,
                    };
                  });

                  // Draw segments; if > 8 days gap between consecutive points, draw dashed warning connector
                  const segments: Array<{
                    x1: number;
                    y1: number;
                    x2: number;
                    y2: number;
                    isGap: boolean;
                  }> = [];
                  for (let i = 1; i < points.length; i++) {
                    const prevD = new Date(`${points[i - 1].obs.observationDay}T00:00:00Z`);
                    const currD = new Date(`${points[i].obs.observationDay}T00:00:00Z`);
                    const diffDays = Math.round(
                      (currD.getTime() - prevD.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    segments.push({
                      x1: points[i - 1].x,
                      y1: points[i - 1].y,
                      x2: points[i].x,
                      y2: points[i].y,
                      isGap: diffDays > 8,
                    });
                  }

                  return (
                    <g key={slug}>
                      {segments.map((seg, idx) => (
                        <motion.line
                          key={idx}
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: seg.isGap ? 0.45 : 1 }}
                          transition={{ duration: 0.45, delay: idx * 0.05 }}
                          x1={seg.x1}
                          y1={seg.y1}
                          x2={seg.x2}
                          y2={seg.y2}
                          stroke={RETAILER_META[slug].color}
                          strokeWidth={seg.isGap ? '1.75' : '2.75'}
                          strokeDasharray={seg.isGap ? '5 5' : undefined}
                          strokeLinecap="round"
                        />
                      ))}

                      {points.map((pt) => {
                        const isHovered = pt.obs.observationDay === selectedDay;
                        return (
                          <g
                            key={pt.obs.id}
                            className="cursor-pointer"
                            onMouseEnter={() => setActiveDay(pt.obs.observationDay)}
                            onClick={() => setActiveDay(pt.obs.observationDay)}
                          >
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isHovered ? 6 : 4.2}
                              fill="#FFFFFF"
                              stroke={RETAILER_META[slug].color}
                              strokeWidth={isHovered ? 3 : 2.2}
                            />
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Interactive Day Inspection Card */}
            {selectedDay && (
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    Detail pozorovaní pre deň: <span className="font-mono-tabular">{selectedDay}</span>
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Kliknite alebo prejdite myšou po bodoch grafu
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(['lidl', 'tesco', 'billa'] as RetailerSlug[]).map((slug) => {
                    const obs = history.observationsByRetailer[slug].find(
                      (o) => o.observationDay === selectedDay
                    );
                    return (
                      <div
                        key={slug}
                        className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 flex items-center justify-between"
                      >
                        <div>
                          <span
                            className="text-xs font-bold block"
                            style={{ color: RETAILER_META[slug].color }}
                          >
                            {RETAILER_META[slug].name}
                          </span>
                          {obs ? (
                            <span className="text-[11px] text-[var(--text-secondary)]">
                              {obs.requiresLoyaltyCard
                                ? `S kartou ${obs.loyaltyProgramName}`
                                : obs.isPromotional
                                  ? 'Akciový leták'
                                  : 'Štandardná cena'}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[var(--text-muted)] italic">
                              Žiadny záznam v tento deň
                            </span>
                          )}
                        </div>
                        <div className="text-right font-mono-tabular">
                          {obs && obs.effectivePriceCents !== null ? (
                            <>
                              {obs.regularPriceCents &&
                                obs.regularPriceCents > obs.effectivePriceCents && (
                                  <span className="block text-[10px] line-through text-[var(--text-muted)]">
                                    {formatEurCents(obs.regularPriceCents)}
                                  </span>
                                )}
                              <span className="text-sm font-bold text-[var(--text-primary)]">
                                {formatEurCents(obs.effectivePriceCents)}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-[var(--text-muted)]">—</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )
      ) : viewMode === 'weekly' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                <th className="py-2.5 px-3 font-semibold">Týždeň</th>
                <th className="py-2.5 px-3 font-semibold">Lidl priemer</th>
                <th className="py-2.5 px-3 font-semibold">Tesco priemer</th>
                <th className="py-2.5 px-3 font-semibold">BILLA priemer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] font-mono-tabular">
              {history.weeklyAggregates.map((w) => (
                <tr key={w.weekLabel}>
                  <td className="py-2.5 px-3 font-semibold text-[var(--text-primary)]">
                    {w.weekLabel}
                  </td>
                  <td className="py-2.5 px-3">{formatEurCents(w.lidlAvgCents)}</td>
                  <td className="py-2.5 px-3">{formatEurCents(w.tescoAvgCents)}</td>
                  <td className="py-2.5 px-3">{formatEurCents(w.billaAvgCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                <th className="py-2.5 px-3 font-semibold">Mesiac</th>
                <th className="py-2.5 px-3 font-semibold">Lidl priemer</th>
                <th className="py-2.5 px-3 font-semibold">Tesco priemer</th>
                <th className="py-2.5 px-3 font-semibold">BILLA priemer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] font-mono-tabular">
              {history.monthlyAggregates.map((m) => (
                <tr key={m.monthLabel}>
                  <td className="py-2.5 px-3 font-semibold text-[var(--text-primary)]">
                    {m.monthLabel}
                  </td>
                  <td className="py-2.5 px-3">{formatEurCents(m.lidlAvgCents)}</td>
                  <td className="py-2.5 px-3">{formatEurCents(m.tescoAvgCents)}</td>
                  <td className="py-2.5 px-3">{formatEurCents(m.billaAvgCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Explicit Coverage Gap Disclosure */}
      {history.coverageGaps.length > 0 && (
        <div className="mt-4 rounded-xl border border-[#E8C98E] bg-[#FDF6E9] p-3.5 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-[#8F5B14] shrink-0 mt-0.5" />
          <div className="text-xs text-[#8F5B14]">
            <p className="font-bold">Transparentné upozornenie na medzery v historických dátach:</p>
            <ul className="mt-1 space-y-0.5 list-disc list-inside">
              {history.coverageGaps.map((g, i) => (
                <li key={i}>
                  Reťazec <strong>{g.retailerName}</strong> má nepokryté obdobie medzi{' '}
                  <span className="font-mono-tabular">{g.fromDay}</span> a{' '}
                  <span className="font-mono-tabular">{g.toDay}</span> ({g.missingDays} dní bez
                  overeného záznamu — zobrazené prerušovanou čiarou).
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
        <Info className="h-3.5 w-3.5 shrink-0" />
        <span>
          Všetky ceny sú uvedené v EUR s DPH. Prerušovaná čiara označuje obdobie medzi nepretržitými letákovými pozorovaniami.
        </span>
      </div>
    </div>
  );
}
