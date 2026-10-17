import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Database, Scale, ExternalLink } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]/70 text-[var(--text-secondary)]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-3">
            <BrandLogo size="md" showTagline={false} />
            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
              Nezávislá platforma na transparentné porovnávanie cien potravín a optimalizáciu
              nákupného košíka pre domácnosti na Slovensku.
            </p>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#177245]">
              <ShieldCheck className="h-4 w-4" />
              <span>100 % overiteľné zdroje a jednotkové ceny</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-3">
              Hlavné funkcie
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/katalog" className="hover:text-[var(--text-primary)]">
                  Katalóg produktov a filtre
                </Link>
              </li>
              <li>
                <Link href="/porovnanie" className="hover:text-[var(--text-primary)]">
                  Detailné porovnanie reťazcov
                </Link>
              </li>
              <li>
                <Link href="/akcie" className="hover:text-[var(--text-primary)]">
                  Týždenné akcie a vernostné zľavy
                </Link>
              </li>
              <li>
                <Link href="/zoznam" className="hover:text-[var(--text-primary)]">
                  Inteligentný nákupný zoznam
                </Link>
              </li>
              <li>
                <Link href="/optimalizator" className="hover:text-[var(--text-primary)]">
                  Optimalizátor nákupného košíka
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-3">
              Dátová integrita & Nástroje
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/historia-cien" className="hover:text-[var(--text-primary)]">
                  História cien, zdroje a CSV import
                </Link>
              </li>
              <li>
                <Link href="/upozornenia" className="hover:text-[var(--text-primary)]">
                  Cenové upozornenia (Price Alerts)
                </Link>
              </li>
              <li>
                <Link href="/nastavenia" className="hover:text-[var(--text-primary)]">
                  Nastavenia vernostných kariet a prístupnosti
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-3">
              Metodika porovnávania
            </h3>
            <div className="space-y-2 text-xs text-[var(--text-secondary)] leading-relaxed">
              <p className="flex items-start gap-2">
                <Scale className="h-4 w-4 text-[#123524] shrink-0 mt-0.5" />
                <span>
                  Nikdy neporovnávame odlišné veľkosti balení (napr. 400 g vs. 500 g) bez
                  prepočtu na normalizovanú jednotkovú cenu (€/kg, €/l, €/ks).
                </span>
              </p>
              <p className="flex items-start gap-2">
                <Database className="h-4 w-4 text-[#123524] shrink-0 mt-0.5" />
                <span>
                  Chýbajúce ceny sú vždy označené ako <em>Cena nedostupná</em>, nikdy ako 0,00 €.
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[var(--text-muted)]">
          <div className="space-y-1 text-center sm:text-left">
            <p>
              © {new Date().getFullYear()} Price Tracker SK. Nie sme oficiálne prepojení so spoločnosťami
              Lidl Slovenská republika, Tesco Stores SR ani BILLA s.r.o.
            </p>
            <p>
              Produktové fotografie a informácie pochádzajú z otvorenej databázy{' '}
              <a
                href="https://world.openfoodfacts.org"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-[var(--text-primary)]"
              >
                Open Food Facts
              </a>{' '}
              (ODbL / CC-BY-SA 3.0) a z oficiálnych katalógov{' '}
              <a
                href="https://www.lidl.sk"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-[var(--text-primary)]"
              >
                lidl.sk
              </a>{' '}
              / lidl.com (Lidl Stiftung & Co. KG).
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <a
              href="https://www.lidl.sk"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-[var(--text-primary)]"
            >
              lidl.sk <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://www.tesco.sk"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-[var(--text-primary)]"
            >
              tesco.sk <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://www.billa.sk"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-[var(--text-primary)]"
            >
              billa.sk <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
