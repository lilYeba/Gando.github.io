// ==============================================================================
// PRICE TRACKER SK — SQLITE REPOSITORY & INGESTION ORCHESTRATOR
// Uses Node 24 native `node:sqlite` (DatabaseSync) with full relational integrity
// ==============================================================================

import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import type {
  AvailabilityStatus,
  BaseUnit,
  BasketOptimizationResult,
  LoyaltyPreferences,
  MatchStatus,
  MatchType,
  PriceObservation,
  ProductIdentifier,
  ProductVariant,
  ProductWithOffers,
  Promotion,
  PromotionCondition,
  Retailer,
  RetailerProductListing,
  RetailerSlug,
  ShoppingListItemInput,
} from '../domain/types';
import {
  calculateUnitPriceCents,
  calculateVerifiedDiscount,
  evaluateListingOffer,
  normalizeQuantityAndUnit,
} from '../domain/money';
import {
  computeObservationDeduplicationHash,
  evaluateProductMatch,
  normalizeSlovakText,
} from '../domain/matching';
import { optimizeShoppingBasket } from '../domain/basket-optimizer';
import { evaluatePriceAlertAgainstListings, type PriceAlertRule } from '../domain/alerts';
import { SEED_PRODUCTS } from './seed-data';
import { fetchLiveLidlSkOffers } from '../adapters/lidl-sk';
import { fetchLiveBillaSkOffers } from '../adapters/billa-sk';
import { fetchLiveTescoSkLeafletOffers, parseVerifiedPriceCsv } from '../adapters/tesco-sk';
import type { NormalizedRetailerOffer } from '../adapters/types';

export const DEFAULT_USER_ID = 'user-jana-sk';
export const DEFAULT_USER_EMAIL = 'jana.kovacova@pricetracker.sk';

export interface DataSourceRecord {
  id: string;
  retailerId: string;
  retailerSlug: RetailerSlug;
  retailerName: string;
  name: string;
  sourceType: string;
  endpointUrl: string;
  robotsTxtCompliant: boolean;
  updateFrequency: string;
  reliabilityStatus: string;
  notes: string | null;
  lastSuccessAt: string | null;
}

export interface ImportJobRecord {
  id: string;
  retailerId: string;
  retailerSlug: RetailerSlug;
  retailerName: string;
  dataSourceId: string;
  dataSourceName: string;
  status: string;
  itemsDiscovered: number;
  itemsImported: number;
  itemsDeduplicated: number;
  errorCount: number;
  startedAt: string;
  completedAt: string | null;
  summaryNotes: string | null;
  errors: Array<{
    id: string;
    externalIdentifier: string | null;
    errorCode: string;
    errorMessage: string;
    rawPayloadSnippet: string | null;
    createdAt: string;
  }>;
}

export interface ShoppingListRecord {
  id: string;
  userId: string | null;
  guestSessionId: string | null;
  name: string;
  description: string | null;
  shareToken: string | null;
  includeLoyaltyPrices: boolean;
  isArchived: boolean;
  itemCount: number;
  purchasedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingListItemRecord {
  id: string;
  shoppingListId: string;
  productId: string | null;
  customTitle: string | null;
  quantity: number;
  isPurchased: boolean;
  preferredRetailerId: string | null;
  notes: string | null;
  product: ProductWithOffers | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingListDetail extends ShoppingListRecord {
  items: ShoppingListItemRecord[];
}

export interface PriceAlertRecord {
  id: string;
  userId: string;
  productId: string;
  product: ProductWithOffers;
  targetPriceCents: number;
  notifyOnAnyPromotion: boolean;
  includeLoyaltyPrices: boolean;
  retailerFilter: RetailerSlug | null;
  isActive: boolean;
  lastTriggeredAt: string | null;
  lastTriggeredObservationId: string | null;
  createdAt: string;
  currentBestPriceCents: number | null;
  currentBestRetailerName: string | null;
  isCurrentlyTriggered: boolean;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  alertId: string | null;
  productId: string | null;
  productSlug: string | null;
  retailerId: string | null;
  title: string;
  message: string;
  observedPriceCents: number | null;
  deduplicationKey: string;
  isRead: boolean;
  createdAt: string;
}

export interface UserPreferencesRecord {
  id: string;
  userId: string;
  language: 'sk' | 'en';
  currency: 'EUR';
  theme: 'light' | 'dark' | 'system';
  reducedMotion: boolean;
  includeLidlPlus: boolean;
  includeTescoClubcard: boolean;
  includeBillaBonus: boolean;
  defaultMaxStores: number;
  defaultTripCostCents: number;
  inAppNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  analyticsPrivacyOptOut: boolean;
  updatedAt: string;
}

export interface ProductCatalogQuery {
  q?: string;
  category?: string;
  retailer?: RetailerSlug;
  brand?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  onlyPromotions?: boolean;
  onlyLoyalty?: boolean;
  includeLoyalty?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'unit_price_asc' | 'discount_desc' | 'updated_desc' | 'name_asc';
  page?: number;
  pageSize?: number;
}

export interface CatalogFacets {
  categories: Array<{ slug: string; name: string; count: number }>;
  brands: Array<{ name: string; count: number }>;
  retailers: Array<{ slug: RetailerSlug; name: string; count: number }>;
}

export interface ProductPriceHistorySeries {
  productId: string;
  productName: string;
  baseUnit: BaseUnit;
  historicalMinCents: number | null;
  historicalMaxCents: number | null;
  observationsByRetailer: Record<
    RetailerSlug,
    Array<{
      id: string;
      observationDay: string;
      observedAt: string;
      regularPriceCents: number | null;
      promoPriceCents: number | null;
      loyaltyPriceCents: number | null;
      effectivePriceCents: number | null;
      unitPriceCents: number | null;
      isPromotional: boolean;
      requiresLoyaltyCard: boolean;
      loyaltyProgramName: string | null;
      sourceUrl: string;
    }>
  >;
  weeklyAggregates: Array<{
    weekLabel: string;
    lidlAvgCents: number | null;
    tescoAvgCents: number | null;
    billaAvgCents: number | null;
  }>;
  monthlyAggregates: Array<{
    monthLabel: string;
    lidlAvgCents: number | null;
    tescoAvgCents: number | null;
    billaAvgCents: number | null;
  }>;
  coverageGaps: Array<{
    retailerSlug: RetailerSlug;
    retailerName: string;
    fromDay: string;
    toDay: string;
    missingDays: number;
  }>;
}

export interface PendingMatchCandidateRecord {
  listingId: string;
  retailerSlug: RetailerSlug;
  retailerName: string;
  externalId: string;
  externalBarcode: string | null;
  retailerTitle: string;
  retailerBrand: string | null;
  packageLabel: string;
  packageQuantity: number;
  packageUnit: string;
  sourceUrl: string;
  matchType: MatchType;
  matchConfidence: number;
  matchStatus: MatchStatus;
  canonicalProduct: {
    id: string;
    slug: string;
    canonicalName: string;
    brand: string | null;
    packageQuantity: number;
    packageUnit: string;
    primaryEan: string | null;
  };
  evaluation: ReturnType<typeof evaluateProductMatch>;
}

let singletonDb: DatabaseSync | null = null;
let singletonDbPath: string | null = null;

function resolveSchemaSql(): string {
  const schemaPath = path.join(process.cwd(), 'db', 'migrations', '001_initial_schema.sqlite.sql');
  return fs.readFileSync(schemaPath, 'utf-8');
}

export function getDatabase(customPath?: string): DatabaseSync {
  if (singletonDb && (!customPath || singletonDbPath === customPath)) {
    return singletonDb;
  }

  if (singletonDb) {
    try {
      singletonDb.close();
    } catch {
      // ignore
    }
    singletonDb = null;
    singletonDbPath = null;
  }

  const targetPath =
    customPath ??
    process.env.SQLITE_DB_PATH ??
    path.join(process.cwd(), 'data', 'pricetracker.sqlite');

  if (targetPath !== ':memory:') {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(targetPath);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');

  const schemaSql = resolveSchemaSql();
  db.exec(schemaSql);

  const countRow = db.prepare('SELECT COUNT(*) AS cnt FROM retailers').get() as { cnt: number };
  if (!countRow || countRow.cnt === 0) {
    seedInitialDatabase(db);
  }

  singletonDb = db;
  singletonDbPath = targetPath;
  return db;
}

export function resetDatabaseForTesting(customPath = ':memory:'): DatabaseSync {
  if (singletonDb) {
    try {
      singletonDb.close();
    } catch {
      // ignore close errors
    }
    singletonDb = null;
    singletonDbPath = null;
  }
  return getDatabase(customPath);
}

// ==============================================================================
// INITIAL SEEDING LOGIC
// ==============================================================================

function seedInitialDatabase(db: DatabaseSync): void {
  const now = '2026-10-16T08:30:00Z';

  db.exec('BEGIN TRANSACTION;');
  try {
    // 1. Retailers
    const insertRetailer = db.prepare(`
      INSERT INTO retailers (
        id, slug, name, country_code, website_url, offers_url,
        loyalty_program_name, logo_brand_color, adapter_type, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, 'SK', ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    insertRetailer.run(
      'ret-lidl-sk',
      'lidl',
      'Lidl',
      'https://www.lidl.sk',
      'https://www.lidl.sk/c/jedlo-a-napoje/s10068374',
      'Lidl Plus',
      '#1D4ED8',
      'LidlSkAdapter',
      now,
      now
    );
    insertRetailer.run(
      'ret-tesco-sk',
      'tesco',
      'Tesco',
      'https://www.tesco.sk',
      'https://www.tesco.sk/akciove-ponuky/letaky-a-katalogy',
      'Clubcard',
      '#0F4C81',
      'TescoSkAdapter',
      now,
      now
    );
    insertRetailer.run(
      'ret-billa-sk',
      'billa',
      'BILLA',
      'https://www.billa.sk',
      'https://www.billa.sk/produkty/leaflet-99000000',
      'BILLA Bonus',
      '#B45309',
      'BillaSkAdapter',
      now,
      now
    );

    const retailerIdBySlug: Record<RetailerSlug, string> = {
      lidl: 'ret-lidl-sk',
      tesco: 'ret-tesco-sk',
      billa: 'ret-billa-sk',
    };

    // 2. Data Sources
    const insertDataSource = db.prepare(`
      INSERT INTO data_sources (
        id, retailer_id, name, source_type, endpoint_url,
        robots_txt_compliant, update_frequency, reliability_status, notes, last_success_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertDataSource.run(
      'ds-lidl-ssr',
      'ret-lidl-sk',
      'Lidl SK Public SSR Category Grid (data-grid-data)',
      'LIVE_SSR_ADAPTER',
      'https://www.lidl.sk/c/jedlo-a-napoje/s10068374',
      1,
      'Každých 12 hodín (pondelok / štvrtok akcie)',
      'VERIFIED_LIVE',
      'Verejné SSR stránky kategórií s JSON atribútom data-grid-data. Plne v súlade s robots.txt.',
      now,
      now
    );

    insertDataSource.run(
      'ds-billa-ssr',
      'ret-billa-sk',
      'BILLA SK Public Nuxt SSR & Sitemap (__NUXT_DATA__)',
      'LIVE_SSR_ADAPTER',
      'https://www.billa.sk/produkty/leaflet-99000000',
      1,
      'Každých 12 hodín (streda akcie)',
      'VERIFIED_LIVE',
      'Verejný Commercetools SSR payload obsahujúci centové ceny, prečiarknuté ceny, 30-dňové minimum a BILLA Bonus.',
      now,
      now
    );

    insertDataSource.run(
      'ds-tesco-graphql',
      'ret-tesco-sk',
      'Tesco SK Leaflets GraphQL API (tesco.sk)',
      'LIVE_GRAPHQL_ADAPTER',
      'https://api.prod.retail.tesco.com/marketing/leaflets-be/graphql',
      1,
      'Každých 24 hodín',
      'PARTIAL_METADATA_ONLY',
      'Verejné GraphQL API vracia platné letáky, TPN identifikátory a 13-miestne EAN čiarové kódy, ale neobsahuje číselné EUR ceny (potravinydomov.itesco.sk blokované cez Akamai WAF HTTP 403).',
      now,
      now
    );

    insertDataSource.run(
      'ds-tesco-csv',
      'ret-tesco-sk',
      'Tesco SK Overený Letákový Import (CSV + EAN/TPN)',
      'VERIFIED_LEAFLET_CSV',
      'data/imports/tesco_verified_leaflet_prices.csv',
      1,
      'Týždenne pri vydaní letáku (streda 08:00)',
      'VERIFIED_FALLBACK',
      'Overený CSV import letákových cien spárovaný s EAN-13 a TPN kódmi z Tesco GraphQL API.',
      now,
      now
    );

    // 3. Initial Import Jobs & Errors (for transparent audit trail)
    const insertImportJob = db.prepare(`
      INSERT INTO import_jobs (
        id, retailer_id, data_source_id, status, items_discovered,
        items_imported, items_deduplicated, error_count, started_at, completed_at, summary_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertImportJob.run(
      'job-billa-init',
      'ret-billa-sk',
      'ds-billa-ssr',
      'COMPLETED',
      18,
      16,
      2,
      0,
      '2026-10-16T08:00:00Z',
      '2026-10-16T08:00:04Z',
      'Úspešný import SSR katalógu BILLA Slovakia (__NUXT_DATA__). Všetky ceny v centoch a jednotkové ceny overené.'
    );

    insertImportJob.run(
      'job-lidl-init',
      'ret-lidl-sk',
      'ds-lidl-ssr',
      'COMPLETED',
      16,
      15,
      1,
      0,
      '2026-10-16T08:05:00Z',
      '2026-10-16T08:05:03Z',
      'Úspešný import SSR mriežky Lidl Slovakia (data-grid-data) vrátane ponúk Lidl Plus.'
    );

    insertImportJob.run(
      'job-tesco-graphql-init',
      'ret-tesco-sk',
      'ds-tesco-graphql',
      'PARTIAL_WARNING',
      14,
      13,
      0,
      1,
      '2026-10-16T08:10:00Z',
      '2026-10-16T08:10:05Z',
      'Načítané TPN a EAN-13 z GraphQL letáku tesco-letak-2026-10-14; číselné ceny doplnené z overeného CSV. 1 položka (Mutti Kečup) bez číselnej ceny ponechaná ako nedostupná.'
    );

    const insertImportError = db.prepare(`
      INSERT INTO import_errors (
        id, import_job_id, external_identifier, error_code, error_message, raw_payload_snippet, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertImportError.run(
      'err-tesco-mutti-price',
      'job-tesco-graphql-init',
      '2005105399111',
      'MISSING_NUMERIC_PRICE_IN_GRAPHQL',
      'Tesco GraphQL endpoint vrátil produkt Mutti Kečup Classico 300 g (EAN 8005110550300), ale neobsahuje pole price. Produkt nebol nájdený ani v CSV importe — cena označená ako nedostupná.',
      '{"id":"2005105399111","ean":"8005110550300","name":"Mutti Kečup Classico 300 g"}',
      '2026-10-16T08:10:05Z'
    );

    // 4. Products, Identifiers, Variants, Listings, Observations, Promotions
    const insertProduct = db.prepare(`
      INSERT INTO products (
        id, slug, canonical_name, brand, category_slug, category_name, subcategory_name,
        package_quantity, package_unit, normalized_quantity, normalized_unit,
        variant_descriptor, image_url, description, is_essential_staple, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertIdentifier = db.prepare(`
      INSERT OR IGNORE INTO product_identifiers (
        id, product_id, identifier_type, identifier_value, is_primary, verified_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertVariant = db.prepare(`
      INSERT INTO product_variants (
        id, product_id, related_product_id, variant_name, package_quantity, package_unit, relationship_type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertListing = db.prepare(`
      INSERT INTO retailer_product_listings (
        id, retailer_id, product_id, external_id, external_sku, external_barcode,
        retailer_title, retailer_brand, package_label, package_quantity, package_unit,
        source_url, image_url, match_type, match_confidence, match_status,
        availability_status, last_verified_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertObservation = db.prepare(`
      INSERT OR IGNORE INTO price_observations (
        id, listing_id, data_source_id, import_job_id, currency,
        regular_price_cents, promo_price_cents, loyalty_price_cents, effective_price_cents,
        unit_price_cents, loyalty_unit_price_cents, base_unit, lowest_30d_price_cents,
        is_promotional, requires_loyalty_card, loyalty_program_name, discount_percentage,
        observed_at, observation_day, valid_from, valid_to, source_url, deduplication_hash, created_at
      ) VALUES (?, ?, ?, ?, 'EUR', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertPromotion = db.prepare(`
      INSERT INTO promotions (
        id, retailer_id, listing_id, title, promotion_type,
        regular_price_cents, promo_price_cents, discount_percentage,
        requires_loyalty_card, loyalty_program_name, valid_from, valid_to,
        is_expired, leaflet_name, source_url, verified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertPromotionCondition = db.prepare(`
      INSERT INTO promotion_conditions (
        id, promotion_id, condition_type, condition_label, min_quantity, max_quantity, loyalty_card_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of SEED_PRODUCTS) {
      insertProduct.run(
        p.id,
        p.slug,
        p.canonicalName,
        p.brand,
        p.categorySlug,
        p.categoryName,
        p.subcategoryName,
        p.packageQuantity,
        p.packageUnit,
        p.normalizedQuantity,
        p.normalizedUnit,
        p.variantDescriptor,
        p.imageUrl,
        p.description,
        p.isEssentialStaple ? 1 : 0,
        now,
        now
      );

      if (p.primaryEan) {
        insertIdentifier.run(
          `id-ean-${p.id}`,
          p.id,
          'EAN13',
          p.primaryEan,
          1,
          now
        );
      }

      for (const offer of p.offers) {
        const retailerId = retailerIdBySlug[offer.retailerSlug];
        const listingId = `lst-${p.id}-${offer.retailerSlug}`;

        const idType =
          offer.retailerSlug === 'lidl'
            ? 'LIDL_ERP'
            : offer.retailerSlug === 'tesco'
              ? 'TESCO_TPN'
              : 'BILLA_SKU';

        insertIdentifier.run(
          `id-${offer.retailerSlug}-${offer.externalId}`,
          p.id,
          idType,
          offer.externalId,
          0,
          now
        );

        insertListing.run(
          listingId,
          retailerId,
          p.id,
          offer.externalId,
          offer.externalSku,
          offer.barcode,
          offer.retailerTitle,
          offer.retailerBrand,
          offer.packageLabel,
          offer.packageQuantity,
          offer.packageUnit,
          offer.sourceUrl,
          offer.imageUrl,
          offer.matchType,
          offer.matchConfidence,
          offer.matchStatus,
          offer.availabilityStatus,
          now,
          now,
          now
        );

        const normPkg = normalizeQuantityAndUnit(offer.packageQuantity, offer.packageUnit);
        const baseUnit: BaseUnit = normPkg?.normalizedUnit ?? p.normalizedUnit;

        for (const h of offer.history) {
          const observedAt = `${h.day}T08:00:00Z`;
          const standardEffective = h.promoCents ?? h.regularCents;
          const unitPriceCalc = calculateUnitPriceCents(
            standardEffective,
            offer.packageQuantity,
            offer.packageUnit
          );
          const loyaltyUnitPriceCalc = calculateUnitPriceCents(
            h.loyaltyCents,
            offer.packageQuantity,
            offer.packageUnit
          );

          const bestPrice = h.loyaltyCents ?? h.promoCents ?? h.regularCents;
          const discountInfo = calculateVerifiedDiscount(h.regularCents, bestPrice);

          const dedupHash = computeObservationDeduplicationHash({
            listingId,
            observationDay: h.day,
            regularPriceCents: h.regularCents,
            promoPriceCents: h.promoCents,
            loyaltyPriceCents: h.loyaltyCents,
          });

          const jobId =
            offer.retailerSlug === 'billa'
              ? 'job-billa-init'
              : offer.retailerSlug === 'lidl'
                ? 'job-lidl-init'
                : 'job-tesco-graphql-init';

          insertObservation.run(
            `obs-${listingId}-${h.day}`,
            listingId,
            offer.dataSourceId,
            jobId,
            h.regularCents,
            h.promoCents,
            h.loyaltyCents,
            standardEffective,
            unitPriceCalc?.unitPriceCents ?? null,
            loyaltyUnitPriceCalc?.unitPriceCents ?? null,
            unitPriceCalc?.baseUnit ?? loyaltyUnitPriceCalc?.baseUnit ?? baseUnit,
            offer.lowest30DayPriceCents,
            h.promoCents !== null || h.loyaltyCents !== null ? 1 : 0,
            h.loyaltyCents !== null ? 1 : 0,
            offer.loyaltyProgramName,
            discountInfo?.discountPercentage ?? null,
            observedAt,
            h.day,
            offer.validFrom,
            offer.validTo,
            offer.sourceUrl,
            dedupHash,
            observedAt
          );
        }

        // Create active or expired promotion record if promo/loyalty exists
        if (
          (offer.promoPriceCents !== null || offer.loyaltyPriceCents !== null) &&
          offer.validFrom &&
          offer.validTo
        ) {
          const isLoyaltyPromo =
            offer.loyaltyPriceCents !== null &&
            (offer.promoPriceCents === null || offer.loyaltyPriceCents < offer.promoPriceCents);
          const activePromoCents = offer.loyaltyPriceCents ?? offer.promoPriceCents!;
          const discountInfo = calculateVerifiedDiscount(offer.regularPriceCents, activePromoCents);
          const isExpired = new Date(offer.validTo).getTime() < new Date(now).getTime();
          const promoId = `promo-${listingId}`;

          insertPromotion.run(
            promoId,
            retailerId,
            listingId,
            offer.conditionLabel ?? `Akciová ponuka ${p.canonicalName}`,
            isLoyaltyPromo ? 'LOYALTY_CARD_PROMO' : 'REGULAR_PROMO',
            offer.regularPriceCents,
            activePromoCents,
            discountInfo?.discountPercentage ?? null,
            isLoyaltyPromo ? 1 : 0,
            offer.loyaltyProgramName,
            offer.validFrom,
            offer.validTo,
            isExpired ? 1 : 0,
            offer.retailerSlug === 'tesco'
              ? 'tesco-letak-2026-10-14'
              : offer.retailerSlug === 'billa'
                ? 'BILLA Týždenný leták'
                : 'Lidl Akciový leták',
            offer.sourceUrl,
            now
          );

          if (offer.conditionLabel || offer.loyaltyProgramName) {
            insertPromotionCondition.run(
              `cond-${promoId}`,
              promoId,
              isLoyaltyPromo ? 'LOYALTY_CARD' : offer.minQuantity ? 'MIN_QUANTITY' : 'STORE_FORMAT',
              offer.conditionLabel ?? `Cena platí s kartou ${offer.loyaltyProgramName}`,
              offer.minQuantity,
              null,
              offer.loyaltyProgramName
            );
          }
        }
      }
    }

    // Add an expired promotion example for Weekly Offers expired handling demonstration
    insertPromotion.run(
      'promo-expired-panzani-lidl',
      'ret-lidl-sk',
      'lst-prod-rajo-mlieko-15-1l-lidl',
      'Mliečny týždeň v Lidli (ukončená akcia)',
      'REGULAR_PROMO',
      109,
      79,
      27.5,
      0,
      null,
      '2026-10-01T06:00:00Z',
      '2026-10-07T21:59:59Z',
      1,
      'Lidl Mliečny týždeň',
      'https://www.lidl.sk/c/jedlo-a-napoje/s10068374',
      '2026-10-07T12:00:00Z'
    );

    // Add Product Variants (e.g., 1,5% vs 3,5% milk, and 400g vs 145g yogurt)
    insertVariant.run(
      'var-rajo-milk-35',
      'prod-rajo-mlieko-15-1l',
      null,
      'Rajo Trvanlivé mlieko plnotučné 3,5 % 1 l',
      1,
      'l',
      'FAT_CONTENT',
      now
    );
    insertVariant.run(
      'var-rajo-jogurt-400',
      'prod-rajo-mnam-jogurt-145g',
      null,
      'Smotanový jogurt 400 g (odlišná gramáž)',
      400,
      'g',
      'PACKAGE_SIZE',
      now
    );

    // Add Pending Match Review Candidate (e.g. 400g yogurt vs 145g yogurt & 3.5% vs 1.5% milk)
    insertListing.run(
      'lst-pending-jogurt-400g-tesco',
      'ret-tesco-sk',
      'prod-rajo-mnam-jogurt-145g',
      '2009998887771',
      '2009998887771',
      '8586000899999',
      'Tesco Smotanový jogurt jahodový 400 g',
      'Tesco',
      '400 g',
      400,
      'g',
      'https://www.tesco.sk/akciove-ponuky/letaky-a-katalogy',
      null,
      'SIMILAR_PRODUCT',
      0.52,
      'PENDING_REVIEW',
      'LEAFLET_OFFER',
      now,
      now,
      now
    );

    insertListing.run(
      'lst-pending-mlieko-35-lidl',
      'ret-lidl-sk',
      'prod-rajo-mlieko-15-1l',
      '11099112',
      '11099112',
      '4056489999111',
      'Pilos Trvanlivé mlieko plnotučné 3,5 % 1 l',
      'Pilos',
      '1 l',
      1,
      'l',
      'https://www.lidl.sk/h/syry-mliecne-vyrobky-a-vajcia/h10095761',
      null,
      'SIMILAR_PRODUCT',
      0.61,
      'PENDING_REVIEW',
      'LEAFLET_OFFER',
      now,
      now,
      now
    );

    // 5. Default Signed-in User & Preferences
    db.prepare(`
      INSERT INTO users (id, email, display_name, role, created_at, updated_at)
      VALUES (?, ?, ?, 'ADMIN', ?, ?)
    `).run(DEFAULT_USER_ID, DEFAULT_USER_EMAIL, 'Ing. Jana Kováčová (Bratislava)', now, now);

    db.prepare(`
      INSERT INTO user_preferences (
        id, user_id, language, currency, theme, reduced_motion,
        include_lidl_plus, include_tesco_clubcard, include_billa_bonus,
        default_max_stores, default_trip_cost_cents,
        in_app_notifications_enabled, email_notifications_enabled,
        analytics_privacy_opt_out, updated_at
      ) VALUES (?, ?, 'sk', 'EUR', 'light', 0, 1, 1, 1, 2, 150, 1, 0, 1, ?)
    `).run('pref-jana-sk', DEFAULT_USER_ID, now);

    // 6. Default Shopping Lists & Items
    const insertList = db.prepare(`
      INSERT INTO shopping_lists (
        id, user_id, guest_session_id, name, description, share_token,
        include_loyalty_prices, is_archived, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `);

    insertList.run(
      'list-rodinny-nakup',
      DEFAULT_USER_ID,
      null,
      'Veľký týždenný rodinný nákup',
      'Základné potraviny, mliečne výrobky, pečivo a ovocie na celý týždeň pre 4-člennú rodinu.',
      'sk-share-8f92a1c4b7e3',
      1,
      now,
      now
    );

    insertList.run(
      'list-vikendove-pecenie',
      DEFAULT_USER_ID,
      null,
      'Víkendové varenie & špajza (s neúplnými cenami)',
      'Nákupný zoznam obsahujúci aj položky s chýbajúcou cenou v niektorom reťazci (Mutti kečup, údený syr) na demonštráciu čiastočného medzisúčtu.',
      'sk-share-3d71e9b0a5c2',
      1,
      now,
      now
    );

    const insertListItem = db.prepare(`
      INSERT INTO shopping_list_items (
        id, shopping_list_id, product_id, custom_title, quantity, is_purchased, preferred_retailer_id, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // List 1: Fully comparable across all 3 retailers
    const list1Items = [
      { id: 'li-1', productId: 'prod-tami-maslo-250g', qty: 2, purchased: 0, note: 'Na pečenie a raňajky' },
      { id: 'li-2', productId: 'prod-rajo-mlieko-15-1l', qty: 4, purchased: 0, note: 'Kartón 4 ks' },
      { id: 'li-3', productId: 'prod-balticovo-vajcia-m-10ks', qty: 2, purchased: 1, note: 'Podstielkový chov M' },
      { id: 'li-4', productId: 'prod-kuracie-stvrte-1kg', qty: 1, purchased: 0, note: 'Chladené' },
      { id: 'li-5', productId: 'prod-banovecky-polostiepok-190g', qty: 2, purchased: 0, note: 'Údený alebo neúdený' },
      { id: 'li-6', productId: 'prod-banany-1kg', qty: 2, purchased: 0, note: 'Zrelé' },
      { id: 'li-7', productId: 'prod-panzani-spaghetti-500g', qty: 2, purchased: 0, note: 'Špagety' },
      { id: 'li-8', productId: 'prod-psenicno-razny-chlieb-1kg', qty: 1, purchased: 1, note: 'Čerstvý krájaný' },
    ];

    for (const item of list1Items) {
      insertListItem.run(
        item.id,
        'list-rodinny-nakup',
        item.productId,
        null,
        item.qty,
        item.purchased,
        null,
        item.note,
        now,
        now
      );
    }

    // List 2: Includes partial coverage items & custom unpriced note item
    const list2Items = [
      { id: 'li-201', productId: 'prod-tami-maslo-250g', custom: null, qty: 1, purchased: 0, note: null },
      { id: 'li-202', productId: 'prod-mutti-passata-700g', custom: null, qty: 2, purchased: 0, note: 'V Tesco chýba číselná cena v GraphQL' },
      { id: 'li-203', productId: 'prod-tekovsky-syr-udeny-1kg', custom: null, qty: 1, purchased: 0, note: 'Dostupné iba vo vybraných predajniach' },
      { id: 'li-204', productId: 'prod-kofola-original-2l', custom: null, qty: 3, purchased: 0, note: null },
      { id: 'li-205', productId: null, custom: 'Čerstvý kôpor z farmárskeho trhu (vlastná položka)', qty: 1, purchased: 0, note: 'Mimo katalógu reťazcov' },
    ];

    for (const item of list2Items) {
      insertListItem.run(
        item.id,
        'list-vikendove-pecenie',
        item.productId,
        item.custom,
        item.qty,
        item.purchased,
        null,
        item.note,
        now,
        now
      );
    }

    // 7. Favorites
    const insertFavorite = db.prepare(`
      INSERT INTO favorites (id, user_id, product_id, created_at)
      VALUES (?, ?, ?, ?)
    `);
    insertFavorite.run('fav-1', DEFAULT_USER_ID, 'prod-tami-maslo-250g', now);
    insertFavorite.run('fav-2', DEFAULT_USER_ID, 'prod-kuracie-stvrte-1kg', now);
    insertFavorite.run('fav-3', DEFAULT_USER_ID, 'prod-rajo-mlieko-15-1l', now);
    insertFavorite.run('fav-4', DEFAULT_USER_ID, 'prod-panzani-spaghetti-500g', now);

    // 8. Price Alerts & Notifications
    const insertAlert = db.prepare(`
      INSERT INTO price_alerts (
        id, user_id, product_id, target_price_cents, notify_on_any_promotion,
        include_loyalty_prices, retailer_filter, is_active, last_triggered_at,
        last_triggered_observation_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `);

    insertAlert.run(
      'alert-maslo',
      DEFAULT_USER_ID,
      'prod-tami-maslo-250g',
      200, // 2,00 €
      1,
      1,
      null,
      now,
      'obs-lst-prod-tami-maslo-250g-billa-2026-10-16',
      '2026-10-01T10:00:00Z'
    );

    insertAlert.run(
      'alert-kuracie',
      DEFAULT_USER_ID,
      'prod-kuracie-stvrte-1kg',
      250, // 2,50 €
      1,
      1,
      null,
      now,
      'obs-lst-prod-kuracie-stvrte-1kg-lidl-2026-10-16',
      '2026-10-05T10:00:00Z'
    );

    insertAlert.run(
      'alert-kava',
      DEFAULT_USER_ID,
      'prod-popradska-extra-special-250g',
      290, // 2,90 €
      0,
      1,
      null,
      null,
      null,
      '2026-10-10T10:00:00Z'
    );

    const insertNotification = db.prepare(`
      INSERT INTO notifications (
        id, user_id, alert_id, product_id, retailer_id, title, message,
        observed_price_cents, deduplication_key, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertNotification.run(
      'notif-1',
      DEFAULT_USER_ID,
      'alert-maslo',
      'prod-tami-maslo-250g',
      'ret-billa-sk',
      'Cenový cieľ dosiahnutý: Tatranské maslo 82 % (250 g)',
      'Cena v reťazci BILLA klesla na 1,89 € s kartou BILLA Bonus (váš limit: 2,00 €). V reťazci Lidl je dostupné za 1,99 € bez vernostnej karty.',
      189,
      'alert:alert-maslo:obs:obs-lst-prod-tami-maslo-250g-billa-2026-10-16',
      0,
      now
    );

    insertNotification.run(
      'notif-2',
      DEFAULT_USER_ID,
      'alert-kuracie',
      'prod-kuracie-stvrte-1kg',
      'ret-lidl-sk',
      'Cenový cieľ dosiahnutý: Kuracie štvrte chladené (1 kg)',
      'Cena v reťazci Lidl klesla na 2,19 € v týždennej akcii (váš limit: 2,50 €).',
      219,
      'alert:alert-kuracie:obs:obs-lst-prod-kuracie-stvrte-1kg-lidl-2026-10-16',
      0,
      now
    );

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

// ==============================================================================
// HYDRATION HELPERS
// ==============================================================================

function hydrateProducts(db: DatabaseSync, productRows: Array<Record<string, unknown>>): ProductWithOffers[] {
  if (productRows.length === 0) return [];

  const retailers = db.prepare('SELECT * FROM retailers').all() as Array<Record<string, unknown>>;
  const retailerMap = new Map<string, { slug: RetailerSlug; name: string }>();
  for (const r of retailers) {
    retailerMap.set(String(r.id), {
      slug: r.slug as RetailerSlug,
      name: String(r.name),
    });
  }

  const allIdentifiers = db.prepare('SELECT * FROM product_identifiers').all() as Array<Record<string, unknown>>;
  const identifiersByProduct = new Map<string, ProductIdentifier[]>();
  for (const row of allIdentifiers) {
    const pid = String(row.product_id);
    const list = identifiersByProduct.get(pid) ?? [];
    list.push({
      id: String(row.id),
      productId: pid,
      identifierType: row.identifier_type as ProductIdentifier['identifierType'],
      identifierValue: String(row.identifier_value),
      isPrimary: Boolean(row.is_primary),
      verifiedAt: String(row.verified_at),
    });
    identifiersByProduct.set(pid, list);
  }

  const allVariants = db.prepare('SELECT * FROM product_variants').all() as Array<Record<string, unknown>>;
  const variantsByProduct = new Map<string, ProductVariant[]>();
  for (const row of allVariants) {
    const pid = String(row.product_id);
    const list = variantsByProduct.get(pid) ?? [];
    list.push({
      id: String(row.id),
      productId: pid,
      relatedProductId: row.related_product_id ? String(row.related_product_id) : null,
      variantName: String(row.variant_name),
      packageQuantity: Number(row.package_quantity),
      packageUnit: String(row.package_unit),
      relationshipType: row.relationship_type as ProductVariant['relationshipType'],
    });
    variantsByProduct.set(pid, list);
  }

  // Only include VERIFIED listings in consumer-facing product offers
  const allListings = db
    .prepare("SELECT * FROM retailer_product_listings WHERE match_status = 'VERIFIED'")
    .all() as Array<Record<string, unknown>>;

  const allObservations = db
    .prepare('SELECT * FROM price_observations ORDER BY observed_at DESC')
    .all() as Array<Record<string, unknown>>;

  const latestObsByListing = new Map<string, PriceObservation>();
  const obsListByListing = new Map<string, PriceObservation[]>();

  for (const row of allObservations) {
    const lid = String(row.listing_id);
    const obs: PriceObservation = {
      id: String(row.id),
      listingId: lid,
      dataSourceId: String(row.data_source_id),
      importJobId: row.import_job_id ? String(row.import_job_id) : null,
      currency: 'EUR',
      regularPriceCents: row.regular_price_cents !== null ? Number(row.regular_price_cents) : null,
      promoPriceCents: row.promo_price_cents !== null ? Number(row.promo_price_cents) : null,
      loyaltyPriceCents: row.loyalty_price_cents !== null ? Number(row.loyalty_price_cents) : null,
      effectivePriceCents: row.effective_price_cents !== null ? Number(row.effective_price_cents) : null,
      unitPriceCents: row.unit_price_cents !== null ? Number(row.unit_price_cents) : null,
      loyaltyUnitPriceCents: row.loyalty_unit_price_cents !== null ? Number(row.loyalty_unit_price_cents) : null,
      baseUnit: row.base_unit as BaseUnit,
      lowest30DayPriceCents: row.lowest_30d_price_cents !== null ? Number(row.lowest_30d_price_cents) : null,
      isPromotional: Boolean(row.is_promotional),
      requiresLoyaltyCard: Boolean(row.requires_loyalty_card),
      loyaltyProgramName: row.loyalty_program_name ? String(row.loyalty_program_name) : null,
      discountPercentage: row.discount_percentage !== null ? Number(row.discount_percentage) : null,
      observedAt: String(row.observed_at),
      observationDay: String(row.observation_day),
      validFrom: row.valid_from ? String(row.valid_from) : null,
      validTo: row.valid_to ? String(row.valid_to) : null,
      sourceUrl: String(row.source_url),
      deduplicationHash: String(row.deduplication_hash),
    };
    if (!latestObsByListing.has(lid)) {
      latestObsByListing.set(lid, obs);
    }
    const existing = obsListByListing.get(lid) ?? [];
    existing.push(obs);
    obsListByListing.set(lid, existing);
  }

  const allConditions = db.prepare('SELECT * FROM promotion_conditions').all() as Array<Record<string, unknown>>;
  const conditionsByPromo = new Map<string, PromotionCondition[]>();
  for (const row of allConditions) {
    const promoId = String(row.promotion_id);
    const list = conditionsByPromo.get(promoId) ?? [];
    list.push({
      id: String(row.id),
      promotionId: promoId,
      conditionType: row.condition_type as PromotionCondition['conditionType'],
      conditionLabel: String(row.condition_label),
      minQuantity: row.min_quantity !== null ? Number(row.min_quantity) : null,
      maxQuantity: row.max_quantity !== null ? Number(row.max_quantity) : null,
      loyaltyCardName: row.loyalty_card_name ? String(row.loyalty_card_name) : null,
    });
    conditionsByPromo.set(promoId, list);
  }

  const allPromotions = db
    .prepare('SELECT * FROM promotions WHERE is_expired = 0 ORDER BY verified_at DESC')
    .all() as Array<Record<string, unknown>>;
  const activePromoByListing = new Map<string, Promotion>();
  for (const row of allPromotions) {
    const lid = String(row.listing_id);
    if (!activePromoByListing.has(lid)) {
      const promoId = String(row.id);
      activePromoByListing.set(lid, {
        id: promoId,
        retailerId: String(row.retailer_id),
        listingId: lid,
        title: String(row.title),
        promotionType: row.promotion_type as Promotion['promotionType'],
        regularPriceCents: row.regular_price_cents !== null ? Number(row.regular_price_cents) : null,
        promoPriceCents: Number(row.promo_price_cents),
        discountPercentage: row.discount_percentage !== null ? Number(row.discount_percentage) : null,
        requiresLoyaltyCard: Boolean(row.requires_loyalty_card),
        loyaltyProgramName: row.loyalty_program_name ? String(row.loyalty_program_name) : null,
        validFrom: String(row.valid_from),
        validTo: String(row.valid_to),
        isExpired: Boolean(row.is_expired),
        leafletName: row.leaflet_name ? String(row.leaflet_name) : null,
        sourceUrl: String(row.source_url),
        verifiedAt: String(row.verified_at),
        conditions: conditionsByPromo.get(promoId) ?? [],
      });
    }
  }

  const canonicalImageByProduct = new Map<string, string | null>();
  for (const pr of productRows) {
    canonicalImageByProduct.set(String(pr.id), pr.image_url ? String(pr.image_url) : null);
  }

  const listingsByProduct = new Map<string, RetailerProductListing[]>();
  for (const row of allListings) {
    const pid = String(row.product_id);
    const lid = String(row.id);
    const ret = retailerMap.get(String(row.retailer_id)) ?? { slug: 'lidl' as RetailerSlug, name: 'Lidl' };
    const list = listingsByProduct.get(pid) ?? [];
    const canonicalImg = canonicalImageByProduct.get(pid) ?? null;
    list.push({
      id: lid,
      retailerId: String(row.retailer_id),
      retailerSlug: ret.slug,
      retailerName: ret.name,
      productId: pid,
      externalId: String(row.external_id),
      externalSku: row.external_sku ? String(row.external_sku) : null,
      externalBarcode: row.external_barcode ? String(row.external_barcode) : null,
      retailerTitle: String(row.retailer_title),
      retailerBrand: row.retailer_brand ? String(row.retailer_brand) : null,
      packageLabel: String(row.package_label),
      packageQuantity: Number(row.package_quantity),
      packageUnit: String(row.package_unit),
      sourceUrl: String(row.source_url),
      imageUrl: row.image_url ? String(row.image_url) : canonicalImg,
      matchType: row.match_type as MatchType,
      matchConfidence: Number(row.match_confidence),
      matchStatus: row.match_status as MatchStatus,
      availabilityStatus: row.availability_status as AvailabilityStatus,
      lastVerifiedAt: String(row.last_verified_at),
      latestObservation: latestObsByListing.get(lid) ?? null,
      activePromotion: activePromoByListing.get(lid) ?? null,
    });
    listingsByProduct.set(pid, list);
  }

  return productRows.map((row) => {
    const pid = String(row.id);
    const listings = listingsByProduct.get(pid) ?? [];

    let minCents: number | null = null;
    let maxCents: number | null = null;
    let lastUpdatedAt: string | null = null;

    for (const listing of listings) {
      const obsList = obsListByListing.get(listing.id) ?? [];
      for (const obs of obsList) {
        const candidatePrices = [obs.regularPriceCents, obs.promoPriceCents, obs.loyaltyPriceCents].filter(
          (v): v is number => v !== null && v > 0
        );
        for (const c of candidatePrices) {
          if (minCents === null || c < minCents) minCents = c;
          if (maxCents === null || c > maxCents) maxCents = c;
        }
        if (!lastUpdatedAt || obs.observedAt > lastUpdatedAt) {
          lastUpdatedAt = obs.observedAt;
        }
      }
    }

    return {
      id: pid,
      slug: String(row.slug),
      canonicalName: String(row.canonical_name),
      brand: row.brand ? String(row.brand) : null,
      categorySlug: String(row.category_slug),
      categoryName: String(row.category_name),
      subcategoryName: row.subcategory_name ? String(row.subcategory_name) : null,
      packageQuantity: Number(row.package_quantity),
      packageUnit: String(row.package_unit),
      normalizedQuantity: Number(row.normalized_quantity),
      normalizedUnit: row.normalized_unit as BaseUnit,
      variantDescriptor: row.variant_descriptor ? String(row.variant_descriptor) : null,
      imageUrl: row.image_url ? String(row.image_url) : null,
      description: row.description ? String(row.description) : null,
      isEssentialStaple: Boolean(row.is_essential_staple),
      identifiers: identifiersByProduct.get(pid) ?? [],
      variants: variantsByProduct.get(pid) ?? [],
      listings,
      historicalMinCents: minCents,
      historicalMaxCents: maxCents,
      lastUpdatedAt,
    };
  });
}

// ==============================================================================
// PUBLIC REPOSITORY QUERIES
// ==============================================================================

export function getRetailers(): Retailer[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM retailers ORDER BY slug ASC').all() as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: String(r.id),
    slug: r.slug as RetailerSlug,
    name: String(r.name),
    countryCode: 'SK',
    websiteUrl: String(r.website_url),
    offersUrl: String(r.offers_url),
    loyaltyProgramName: r.loyalty_program_name ? String(r.loyalty_program_name) : null,
    logoBrandColor: String(r.logo_brand_color),
    adapterType: String(r.adapter_type),
    isActive: Boolean(r.is_active),
  }));
}

export function getDataSources(): DataSourceRecord[] {
  const db = getDatabase();
  const rows = db
    .prepare(`
      SELECT ds.*, r.slug AS retailer_slug, r.name AS retailer_name
      FROM data_sources ds
      JOIN retailers r ON r.id = ds.retailer_id
      ORDER BY r.slug ASC, ds.id ASC
    `)
    .all() as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    id: String(row.id),
    retailerId: String(row.retailer_id),
    retailerSlug: row.retailer_slug as RetailerSlug,
    retailerName: String(row.retailer_name),
    name: String(row.name),
    sourceType: String(row.source_type),
    endpointUrl: String(row.endpoint_url),
    robotsTxtCompliant: Boolean(row.robots_txt_compliant),
    updateFrequency: String(row.update_frequency),
    reliabilityStatus: String(row.reliability_status),
    notes: row.notes ? String(row.notes) : null,
    lastSuccessAt: row.last_success_at ? String(row.last_success_at) : null,
  }));
}

export function getImportJobs(limit = 20): ImportJobRecord[] {
  const db = getDatabase();
  const rows = db
    .prepare(`
      SELECT ij.*, r.slug AS retailer_slug, r.name AS retailer_name, ds.name AS data_source_name
      FROM import_jobs ij
      JOIN retailers r ON r.id = ij.retailer_id
      JOIN data_sources ds ON ds.id = ij.data_source_id
      ORDER BY ij.started_at DESC
      LIMIT ?
    `)
    .all(limit) as Array<Record<string, unknown>>;

  const errorsRows = db
    .prepare('SELECT * FROM import_errors ORDER BY created_at DESC')
    .all() as Array<Record<string, unknown>>;
  const errorsByJob = new Map<string, ImportJobRecord['errors']>();
  for (const e of errorsRows) {
    const jid = String(e.import_job_id);
    const list = errorsByJob.get(jid) ?? [];
    list.push({
      id: String(e.id),
      externalIdentifier: e.external_identifier ? String(e.external_identifier) : null,
      errorCode: String(e.error_code),
      errorMessage: String(e.error_message),
      rawPayloadSnippet: e.raw_payload_snippet ? String(e.raw_payload_snippet) : null,
      createdAt: String(e.created_at),
    });
    errorsByJob.set(jid, list);
  }

  return rows.map((row) => {
    const id = String(row.id);
    return {
      id,
      retailerId: String(row.retailer_id),
      retailerSlug: row.retailer_slug as RetailerSlug,
      retailerName: String(row.retailer_name),
      dataSourceId: String(row.data_source_id),
      dataSourceName: String(row.data_source_name),
      status: String(row.status),
      itemsDiscovered: Number(row.items_discovered),
      itemsImported: Number(row.items_imported),
      itemsDeduplicated: Number(row.items_deduplicated),
      errorCount: Number(row.error_count),
      startedAt: String(row.started_at),
      completedAt: row.completed_at ? String(row.completed_at) : null,
      summaryNotes: row.summary_notes ? String(row.summary_notes) : null,
      errors: errorsByJob.get(id) ?? [],
    };
  });
}

export function getAllProducts(): ProductWithOffers[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM products ORDER BY canonical_name ASC').all() as Array<Record<string, unknown>>;
  return hydrateProducts(db, rows);
}

export function getProductBySlugOrId(slugOrId: string): ProductWithOffers | null {
  const db = getDatabase();
  const row = db
    .prepare('SELECT * FROM products WHERE slug = ? OR id = ? LIMIT 1')
    .get(slugOrId, slugOrId) as Record<string, unknown> | undefined;
  if (!row) return null;
  const hydrated = hydrateProducts(db, [row]);
  return hydrated[0] ?? null;
}

function getBestEvaluatedOfferForProduct(
  product: ProductWithOffers,
  loyalty: LoyaltyPreferences
) {
  const evaluations = product.listings
    .map((l) =>
      evaluateListingOffer(l, loyalty, {
        packageQuantity: product.packageQuantity,
        packageUnit: product.packageUnit,
      })
    )
    .filter((e) => e.isPriceAvailable && e.effectivePriceCents !== null);

  if (evaluations.length === 0) return null;
  evaluations.sort((a, b) => a.effectivePriceCents! - b.effectivePriceCents!);
  return evaluations[0];
}

export function queryProducts(filters: ProductCatalogQuery = {}): {
  products: ProductWithOffers[];
  totalCount: number;
  facets: CatalogFacets;
} {
  const allProducts = getAllProducts();
  const includeLoyalty = filters.includeLoyalty ?? true;
  const loyalty: LoyaltyPreferences = {
    includeLidlPlus: includeLoyalty,
    includeTescoClubcard: includeLoyalty,
    includeBillaBonus: includeLoyalty,
  };

  // Compute facets across all products
  const categoryMap = new Map<string, { slug: string; name: string; count: number }>();
  const brandMap = new Map<string, number>();
  const retailerCountMap: Record<RetailerSlug, number> = { lidl: 0, tesco: 0, billa: 0 };

  for (const p of allProducts) {
    const cat = categoryMap.get(p.categorySlug) ?? {
      slug: p.categorySlug,
      name: p.categoryName,
      count: 0,
    };
    cat.count += 1;
    categoryMap.set(p.categorySlug, cat);

    if (p.brand) {
      brandMap.set(p.brand, (brandMap.get(p.brand) ?? 0) + 1);
    }

    for (const l of p.listings) {
      if (l.latestObservation && (l.latestObservation.effectivePriceCents ?? l.latestObservation.loyaltyPriceCents)) {
        retailerCountMap[l.retailerSlug] = (retailerCountMap[l.retailerSlug] ?? 0) + 1;
      }
    }
  }

  const normalizedQuery = filters.q ? normalizeSlovakText(filters.q) : '';

  const filtered = allProducts.filter((product) => {
    if (normalizedQuery) {
      const searchableParts = [
        product.canonicalName,
        product.brand ?? '',
        product.categoryName,
        product.subcategoryName ?? '',
        product.variantDescriptor ?? '',
        ...product.identifiers.map((id) => id.identifierValue),
        ...product.listings.map((l) => l.retailerTitle),
      ];
      const combined = normalizeSlovakText(searchableParts.join(' '));
      if (!combined.includes(normalizedQuery)) {
        return false;
      }
    }

    if (filters.category && product.categorySlug !== filters.category) {
      return false;
    }

    if (filters.brand && product.brand !== filters.brand) {
      return false;
    }

    const evaluations = product.listings.map((l) =>
      evaluateListingOffer(l, loyalty, {
        packageQuantity: product.packageQuantity,
        packageUnit: product.packageUnit,
      })
    );

    if (filters.retailer) {
      const retailerEval = evaluations.find((e) => e.retailerSlug === filters.retailer);
      if (!retailerEval || !retailerEval.isPriceAvailable) {
        return false;
      }
    }

    if (filters.onlyPromotions) {
      const hasPromo = evaluations.some(
        (e) => e.isPriceAvailable && (e.priceType === 'PROMO' || e.priceType === 'LOYALTY')
      );
      if (!hasPromo) return false;
    }

    if (filters.onlyLoyalty) {
      const hasLoyalty = evaluations.some((e) => e.isPriceAvailable && e.priceType === 'LOYALTY');
      if (!hasLoyalty) return false;
    }

    const bestOffer = getBestEvaluatedOfferForProduct(product, loyalty);
    if (filters.minPriceCents !== undefined && filters.minPriceCents > 0) {
      if (!bestOffer || bestOffer.effectivePriceCents! < filters.minPriceCents) {
        return false;
      }
    }
    if (filters.maxPriceCents !== undefined && filters.maxPriceCents > 0) {
      if (!bestOffer || bestOffer.effectivePriceCents! > filters.maxPriceCents) {
        return false;
      }
    }

    return true;
  });

  // Sort
  const sortBy = filters.sortBy ?? 'discount_desc';
  filtered.sort((a, b) => {
    const bestA = getBestEvaluatedOfferForProduct(a, loyalty);
    const bestB = getBestEvaluatedOfferForProduct(b, loyalty);

    if (sortBy === 'price_asc') {
      const pa = bestA?.effectivePriceCents ?? Number.MAX_SAFE_INTEGER;
      const pb = bestB?.effectivePriceCents ?? Number.MAX_SAFE_INTEGER;
      return pa - pb;
    }
    if (sortBy === 'price_desc') {
      const pa = bestA?.effectivePriceCents ?? -1;
      const pb = bestB?.effectivePriceCents ?? -1;
      return pb - pa;
    }
    if (sortBy === 'unit_price_asc') {
      const ua = bestA?.effectiveUnitPriceCents ?? Number.MAX_SAFE_INTEGER;
      const ub = bestB?.effectiveUnitPriceCents ?? Number.MAX_SAFE_INTEGER;
      return ua - ub;
    }
    if (sortBy === 'discount_desc') {
      const maxDiscA = Math.max(
        0,
        ...a.listings.map(
          (l) =>
            evaluateListingOffer(l, loyalty, {
              packageQuantity: a.packageQuantity,
              packageUnit: a.packageUnit,
            }).verifiedDiscountPercent ?? 0
        )
      );
      const maxDiscB = Math.max(
        0,
        ...b.listings.map(
          (l) =>
            evaluateListingOffer(l, loyalty, {
              packageQuantity: b.packageQuantity,
              packageUnit: b.packageUnit,
            }).verifiedDiscountPercent ?? 0
        )
      );
      if (maxDiscB !== maxDiscA) return maxDiscB - maxDiscA;
      return a.canonicalName.localeCompare(b.canonicalName, 'sk');
    }
    if (sortBy === 'updated_desc') {
      return (b.lastUpdatedAt ?? '').localeCompare(a.lastUpdatedAt ?? '');
    }
    return a.canonicalName.localeCompare(b.canonicalName, 'sk');
  });

  const totalCount = filtered.length;
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, filters.pageSize ?? 24));
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  return {
    products: paginated,
    totalCount,
    facets: {
      categories: Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'sk')),
      brands: Array.from(brandMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name, 'sk')),
      retailers: [
        { slug: 'lidl', name: 'Lidl', count: retailerCountMap.lidl },
        { slug: 'tesco', name: 'Tesco', count: retailerCountMap.tesco },
        { slug: 'billa', name: 'BILLA', count: retailerCountMap.billa },
      ],
    },
  };
}

export function getSimilarProducts(productId: string, limit = 4): ProductWithOffers[] {
  const target = getProductBySlugOrId(productId);
  if (!target) return [];
  const all = getAllProducts().filter((p) => p.id !== target.id);
  const sameCategory = all.filter((p) => p.categorySlug === target.categorySlug);
  if (sameCategory.length >= limit) {
    return sameCategory.slice(0, limit);
  }
  const others = all.filter((p) => p.categorySlug !== target.categorySlug);
  return [...sameCategory, ...others].slice(0, limit);
}

// ==============================================================================
// PRICE HISTORY & GAP ANALYSIS (NEVER INTERPOLATES MISSING DATES)
// ==============================================================================

export function getProductPriceHistory(productIdOrSlug: string): ProductPriceHistorySeries | null {
  const product = getProductBySlugOrId(productIdOrSlug);
  if (!product) return null;

  const db = getDatabase();
  const observationsByRetailer: ProductPriceHistorySeries['observationsByRetailer'] = {
    lidl: [],
    tesco: [],
    billa: [],
  };

  for (const listing of product.listings) {
    const rows = db
      .prepare(`
        SELECT * FROM price_observations
        WHERE listing_id = ?
        ORDER BY observation_day ASC, observed_at ASC
      `)
      .all(listing.id) as Array<Record<string, unknown>>;

    observationsByRetailer[listing.retailerSlug] = rows.map((row) => ({
      id: String(row.id),
      observationDay: String(row.observation_day),
      observedAt: String(row.observed_at),
      regularPriceCents: row.regular_price_cents !== null ? Number(row.regular_price_cents) : null,
      promoPriceCents: row.promo_price_cents !== null ? Number(row.promo_price_cents) : null,
      loyaltyPriceCents: row.loyalty_price_cents !== null ? Number(row.loyalty_price_cents) : null,
      effectivePriceCents:
        row.loyalty_price_cents !== null
          ? Number(row.loyalty_price_cents)
          : row.effective_price_cents !== null
            ? Number(row.effective_price_cents)
            : null,
      unitPriceCents:
        row.loyalty_unit_price_cents !== null
          ? Number(row.loyalty_unit_price_cents)
          : row.unit_price_cents !== null
            ? Number(row.unit_price_cents)
            : null,
      isPromotional: Boolean(row.is_promotional),
      requiresLoyaltyCard: Boolean(row.requires_loyalty_card),
      loyaltyProgramName: row.loyalty_program_name ? String(row.loyalty_program_name) : null,
      sourceUrl: String(row.source_url),
    }));
  }

  // Detect coverage gaps (> 8 days between observations for a retailer)
  const coverageGaps: ProductPriceHistorySeries['coverageGaps'] = [];
  const retailerNames: Record<RetailerSlug, string> = {
    lidl: 'Lidl',
    tesco: 'Tesco',
    billa: 'BILLA',
  };

  for (const slug of ['lidl', 'tesco', 'billa'] as RetailerSlug[]) {
    const series = observationsByRetailer[slug];
    for (let i = 1; i < series.length; i++) {
      const prevDate = new Date(`${series[i - 1].observationDay}T00:00:00Z`);
      const currDate = new Date(`${series[i].observationDay}T00:00:00Z`);
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 8) {
        coverageGaps.push({
          retailerSlug: slug,
          retailerName: retailerNames[slug],
          fromDay: series[i - 1].observationDay,
          toDay: series[i].observationDay,
          missingDays: diffDays - 1,
        });
      }
    }
  }

  // Compute Weekly and Monthly Aggregates from real observations only
  const weekBuckets = new Map<string, Record<RetailerSlug, number[]>>();
  const monthBuckets = new Map<string, Record<RetailerSlug, number[]>>();

  for (const slug of ['lidl', 'tesco', 'billa'] as RetailerSlug[]) {
    for (const obs of observationsByRetailer[slug]) {
      if (obs.effectivePriceCents === null) continue;
      const [year, month, day] = obs.observationDay.split('-').map(Number);
      const weekNum = Math.ceil(day / 7);
      const weekKey = `${year}-${String(month).padStart(2, '0')} (Týždeň ${weekNum})`;
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;

      const wb = weekBuckets.get(weekKey) ?? { lidl: [], tesco: [], billa: [] };
      wb[slug].push(obs.effectivePriceCents);
      weekBuckets.set(weekKey, wb);

      const mb = monthBuckets.get(monthKey) ?? { lidl: [], tesco: [], billa: [] };
      mb[slug].push(obs.effectivePriceCents);
      monthBuckets.set(monthKey, mb);
    }
  }

  const avgOrNull = (arr: number[]) =>
    arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

  const weeklyAggregates = Array.from(weekBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekLabel, data]) => ({
      weekLabel,
      lidlAvgCents: avgOrNull(data.lidl),
      tescoAvgCents: avgOrNull(data.tesco),
      billaAvgCents: avgOrNull(data.billa),
    }));

  const monthlyAggregates = Array.from(monthBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthLabel, data]) => ({
      monthLabel,
      lidlAvgCents: avgOrNull(data.lidl),
      tescoAvgCents: avgOrNull(data.tesco),
      billaAvgCents: avgOrNull(data.billa),
    }));

  return {
    productId: product.id,
    productName: product.canonicalName,
    baseUnit: product.normalizedUnit,
    historicalMinCents: product.historicalMinCents,
    historicalMaxCents: product.historicalMaxCents,
    observationsByRetailer,
    weeklyAggregates,
    monthlyAggregates,
    coverageGaps,
  };
}

// ==============================================================================
// WEEKLY OFFERS & PROMOTIONS
// ==============================================================================

export interface WeeklyOfferItem {
  promotionId: string;
  productId: string;
  productSlug: string;
  productName: string;
  brand: string | null;
  categorySlug: string;
  categoryName: string;
  packageLabel: string;
  imageUrl: string | null;
  retailerSlug: RetailerSlug;
  retailerName: string;
  regularPriceCents: number | null;
  promoPriceCents: number;
  unitPriceCents: number | null;
  baseUnit: BaseUnit;
  verifiedDiscountPercent: number | null;
  absoluteSavingsCents: number | null;
  requiresLoyaltyCard: boolean;
  loyaltyProgramName: string | null;
  conditionLabel: string | null;
  leafletName: string | null;
  validFrom: string;
  validTo: string;
  isExpired: boolean;
  sourceUrl: string;
  verifiedAt: string;
}

export function getWeeklyOffers(filters?: {
  retailer?: RetailerSlug;
  category?: string;
  sortBy?: 'discount_desc' | 'price_asc' | 'expiring_soon';
}): {
  regularPromotions: WeeklyOfferItem[];
  loyaltyPromotions: WeeklyOfferItem[];
  expiredPromotions: WeeklyOfferItem[];
} {
  const db = getDatabase();
  const rows = db
    .prepare(`
      SELECT
        pr.*,
        r.slug AS retailer_slug,
        r.name AS retailer_name,
        p.id AS product_id,
        p.slug AS product_slug,
        p.canonical_name AS product_name,
        p.brand AS product_brand,
        p.category_slug,
        p.category_name,
        p.package_quantity,
        p.package_unit,
        p.normalized_unit,
        p.image_url AS product_image_url,
        l.image_url AS listing_image_url,
        l.package_label
      FROM promotions pr
      JOIN retailers r ON r.id = pr.retailer_id
      JOIN retailer_product_listings l ON l.id = pr.listing_id
      JOIN products p ON p.id = l.product_id
      WHERE l.match_status = 'VERIFIED'
    `)
    .all() as Array<Record<string, unknown>>;

  const conditionsRows = db.prepare('SELECT * FROM promotion_conditions').all() as Array<Record<string, unknown>>;
  const condByPromo = new Map<string, string>();
  for (const c of conditionsRows) {
    condByPromo.set(String(c.promotion_id), String(c.condition_label));
  }

  const allItems: WeeklyOfferItem[] = rows
    .filter((row) => {
      if (filters?.retailer && row.retailer_slug !== filters.retailer) return false;
      if (filters?.category && row.category_slug !== filters.category) return false;
      return true;
    })
    .map((row) => {
      const regularPriceCents = row.regular_price_cents !== null ? Number(row.regular_price_cents) : null;
      const promoPriceCents = Number(row.promo_price_cents);
      const pkgQty = Number(row.package_quantity);
      const pkgUnit = String(row.package_unit);
      const unitCalc = calculateUnitPriceCents(promoPriceCents, pkgQty, pkgUnit);
      const discount = calculateVerifiedDiscount(regularPriceCents, promoPriceCents);
      const effectiveImageUrl =
        (row.listing_image_url as string | null) ??
        (row.product_image_url as string | null) ??
        null;

      return {
        promotionId: String(row.id),
        productId: String(row.product_id),
        productSlug: String(row.product_slug),
        productName: String(row.product_name),
        brand: row.product_brand ? String(row.product_brand) : null,
        categorySlug: String(row.category_slug),
        categoryName: String(row.category_name),
        packageLabel: String(row.package_label),
        imageUrl: effectiveImageUrl,
        retailerSlug: row.retailer_slug as RetailerSlug,
        retailerName: String(row.retailer_name),
        regularPriceCents,
        promoPriceCents,
        unitPriceCents: unitCalc?.unitPriceCents ?? null,
        baseUnit: unitCalc?.baseUnit ?? (row.normalized_unit as BaseUnit),
        verifiedDiscountPercent: discount?.discountPercentage ?? null,
        absoluteSavingsCents: discount?.absoluteSavingsCents ?? null,
        requiresLoyaltyCard: Boolean(row.requires_loyalty_card),
        loyaltyProgramName: row.loyalty_program_name ? String(row.loyalty_program_name) : null,
        conditionLabel: condByPromo.get(String(row.id)) ?? null,
        leafletName: row.leaflet_name ? String(row.leaflet_name) : null,
        validFrom: String(row.valid_from),
        validTo: String(row.valid_to),
        isExpired: Boolean(row.is_expired),
        sourceUrl: String(row.source_url),
        verifiedAt: String(row.verified_at),
      };
    });

  const sortBy = filters?.sortBy ?? 'discount_desc';
  allItems.sort((a, b) => {
    if (sortBy === 'price_asc') {
      return a.promoPriceCents - b.promoPriceCents;
    }
    if (sortBy === 'expiring_soon') {
      return a.validTo.localeCompare(b.validTo);
    }
    return (b.verifiedDiscountPercent ?? 0) - (a.verifiedDiscountPercent ?? 0);
  });

  return {
    regularPromotions: allItems.filter((i) => !i.isExpired && !i.requiresLoyaltyCard),
    loyaltyPromotions: allItems.filter((i) => !i.isExpired && i.requiresLoyaltyCard),
    expiredPromotions: allItems.filter((i) => i.isExpired),
  };
}

// ==============================================================================
// SHOPPING LISTS & BASKET OPTIMIZER
// ==============================================================================

function hydrateShoppingListItems(db: DatabaseSync, listId: string): ShoppingListItemRecord[] {
  const rows = db
    .prepare('SELECT * FROM shopping_list_items WHERE shopping_list_id = ? ORDER BY created_at ASC')
    .all(listId) as Array<Record<string, unknown>>;

  const productMap = new Map<string, ProductWithOffers>();
  for (const p of getAllProducts()) {
    productMap.set(p.id, p);
  }

  return rows.map((row) => {
    const pid = row.product_id ? String(row.product_id) : null;
    return {
      id: String(row.id),
      shoppingListId: String(row.shopping_list_id),
      productId: pid,
      customTitle: row.custom_title ? String(row.custom_title) : null,
      quantity: Number(row.quantity),
      isPurchased: Boolean(row.is_purchased),
      preferredRetailerId: row.preferred_retailer_id ? String(row.preferred_retailer_id) : null,
      notes: row.notes ? String(row.notes) : null,
      product: pid ? productMap.get(pid) ?? null : null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  });
}

export function getShoppingLists(owner?: {
  userId?: string | null;
  guestSessionId?: string | null;
}): ShoppingListDetail[] {
  const db = getDatabase();
  const userId = owner?.userId ?? DEFAULT_USER_ID;
  const guestId = owner?.guestSessionId ?? null;

  const rows = db
    .prepare(`
      SELECT * FROM shopping_lists
      WHERE is_archived = 0
        AND (user_id = ? OR (guest_session_id IS NOT NULL AND guest_session_id = ?))
      ORDER BY updated_at DESC
    `)
    .all(userId, guestId) as Array<Record<string, unknown>>;

  return rows.map((row) => {
    const id = String(row.id);
    const items = hydrateShoppingListItems(db, id);
    return {
      id,
      userId: row.user_id ? String(row.user_id) : null,
      guestSessionId: row.guest_session_id ? String(row.guest_session_id) : null,
      name: String(row.name),
      description: row.description ? String(row.description) : null,
      shareToken: row.share_token ? String(row.share_token) : null,
      includeLoyaltyPrices: Boolean(row.include_loyalty_prices),
      isArchived: Boolean(row.is_archived),
      itemCount: items.length,
      purchasedCount: items.filter((i) => i.isPurchased).length,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      items,
    };
  });
}

export function getShoppingListByIdOrShareToken(
  idOrToken: string,
  authContext?: {
    userId?: string | null;
    guestSessionId?: string | null;
    allowShareToken?: boolean;
  }
): ShoppingListDetail | null {
  const db = getDatabase();
  const row = db
    .prepare('SELECT * FROM shopping_lists WHERE id = ? OR share_token = ? LIMIT 1')
    .get(idOrToken, idOrToken) as Record<string, unknown> | undefined;

  if (!row) return null;

  const matchedByShareToken = row.share_token && String(row.share_token) === idOrToken;
  if (!matchedByShareToken && authContext) {
    const expectedUserId = authContext.userId ?? DEFAULT_USER_ID;
    const expectedGuestId = authContext.guestSessionId ?? null;
    const listUserId = row.user_id ? String(row.user_id) : null;
    const listGuestId = row.guest_session_id ? String(row.guest_session_id) : null;

    const isOwner =
      (listUserId && listUserId === expectedUserId) ||
      (listGuestId && expectedGuestId && listGuestId === expectedGuestId);

    if (!isOwner) {
      throw new Error('UNAUTHORIZED_SHOPPING_LIST_ACCESS');
    }
  }

  const id = String(row.id);
  const items = hydrateShoppingListItems(db, id);
  return {
    id,
    userId: row.user_id ? String(row.user_id) : null,
    guestSessionId: row.guest_session_id ? String(row.guest_session_id) : null,
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    shareToken: row.share_token ? String(row.share_token) : null,
    includeLoyaltyPrices: Boolean(row.include_loyalty_prices),
    isArchived: Boolean(row.is_archived),
    itemCount: items.length,
    purchasedCount: items.filter((i) => i.isPurchased).length,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    items,
  };
}

export function createShoppingList(input: {
  name: string;
  description?: string | null;
  userId?: string | null;
  guestSessionId?: string | null;
  includeLoyaltyPrices?: boolean;
}): ShoppingListDetail {
  const db = getDatabase();
  const id = `list-${crypto.randomUUID().slice(0, 12)}`;
  const shareToken = `sk-share-${crypto.randomBytes(8).toString('hex')}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO shopping_lists (
      id, user_id, guest_session_id, name, description, share_token,
      include_loyalty_prices, is_archived, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).run(
    id,
    input.userId !== undefined ? input.userId : DEFAULT_USER_ID,
    input.guestSessionId ?? null,
    input.name.trim(),
    input.description?.trim() ?? null,
    shareToken,
    input.includeLoyaltyPrices === false ? 0 : 1,
    now,
    now
  );

  return getShoppingListByIdOrShareToken(id)!;
}

export function updateShoppingList(
  listId: string,
  updates: { name?: string; description?: string | null; includeLoyaltyPrices?: boolean },
  authContext?: { userId?: string | null; guestSessionId?: string | null }
): ShoppingListDetail {
  const existing = getShoppingListByIdOrShareToken(listId, authContext);
  if (!existing) throw new Error('SHOPPING_LIST_NOT_FOUND');

  const db = getDatabase();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE shopping_lists
    SET name = ?, description = ?, include_loyalty_prices = ?, updated_at = ?
    WHERE id = ?
  `).run(
    updates.name !== undefined ? updates.name.trim() : existing.name,
    updates.description !== undefined ? updates.description : existing.description,
    updates.includeLoyaltyPrices !== undefined
      ? updates.includeLoyaltyPrices
        ? 1
        : 0
      : existing.includeLoyaltyPrices
        ? 1
        : 0,
    now,
    existing.id
  );

  return getShoppingListByIdOrShareToken(existing.id, authContext)!;
}

export function duplicateShoppingList(
  listId: string,
  authContext?: { userId?: string | null; guestSessionId?: string | null }
): ShoppingListDetail {
  const source = getShoppingListByIdOrShareToken(listId, authContext);
  if (!source) throw new Error('SHOPPING_LIST_NOT_FOUND');

  const duplicated = createShoppingList({
    name: `${source.name} (kópia)`,
    description: source.description,
    userId: source.userId,
    guestSessionId: source.guestSessionId,
    includeLoyaltyPrices: source.includeLoyaltyPrices,
  });

  for (const item of source.items) {
    addShoppingListItem(
      duplicated.id,
      {
        productId: item.productId,
        customTitle: item.customTitle,
        quantity: item.quantity,
        notes: item.notes,
      },
      authContext
    );
  }

  return getShoppingListByIdOrShareToken(duplicated.id, authContext)!;
}

export function deleteShoppingList(
  listId: string,
  authContext?: { userId?: string | null; guestSessionId?: string | null }
): void {
  const existing = getShoppingListByIdOrShareToken(listId, authContext);
  if (!existing) throw new Error('SHOPPING_LIST_NOT_FOUND');

  const db = getDatabase();
  db.prepare('DELETE FROM shopping_lists WHERE id = ?').run(existing.id);
}

export function addShoppingListItem(
  listId: string,
  input: {
    productId?: string | null;
    customTitle?: string | null;
    quantity?: number;
    notes?: string | null;
  },
  authContext?: { userId?: string | null; guestSessionId?: string | null }
): ShoppingListDetail {
  const list = getShoppingListByIdOrShareToken(listId, authContext);
  if (!list) throw new Error('SHOPPING_LIST_NOT_FOUND');

  const qty = Math.max(1, Math.min(999, Math.round(input.quantity ?? 1)));
  const db = getDatabase();
  const now = new Date().toISOString();

  if (input.productId) {
    const existingItem = list.items.find((i) => i.productId === input.productId);
    if (existingItem) {
      const nextQty = Math.min(999, existingItem.quantity + qty);
      db.prepare('UPDATE shopping_list_items SET quantity = ?, updated_at = ? WHERE id = ?').run(
        nextQty,
        now,
        existingItem.id
      );
      db.prepare('UPDATE shopping_lists SET updated_at = ? WHERE id = ?').run(now, list.id);
      return getShoppingListByIdOrShareToken(list.id, authContext)!;
    }
  }

  const itemId = `li-${crypto.randomUUID().slice(0, 12)}`;
  db.prepare(`
    INSERT INTO shopping_list_items (
      id, shopping_list_id, product_id, custom_title, quantity, is_purchased, preferred_retailer_id, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 0, NULL, ?, ?, ?)
  `).run(
    itemId,
    list.id,
    input.productId ?? null,
    input.customTitle?.trim() ?? null,
    qty,
    input.notes?.trim() ?? null,
    now,
    now
  );

  db.prepare('UPDATE shopping_lists SET updated_at = ? WHERE id = ?').run(now, list.id);
  return getShoppingListByIdOrShareToken(list.id, authContext)!;
}

export function updateShoppingListItem(
  listId: string,
  itemId: string,
  updates: { quantity?: number; isPurchased?: boolean; notes?: string | null },
  authContext?: { userId?: string | null; guestSessionId?: string | null }
): ShoppingListDetail {
  const list = getShoppingListByIdOrShareToken(listId, authContext);
  if (!list) throw new Error('SHOPPING_LIST_NOT_FOUND');

  const item = list.items.find((i) => i.id === itemId);
  if (!item) throw new Error('SHOPPING_LIST_ITEM_NOT_FOUND');

  const nextQty =
    updates.quantity !== undefined
      ? Math.max(1, Math.min(999, Math.round(updates.quantity)))
      : item.quantity;
  const nextPurchased =
    updates.isPurchased !== undefined ? (updates.isPurchased ? 1 : 0) : item.isPurchased ? 1 : 0;
  const nextNotes = updates.notes !== undefined ? updates.notes : item.notes;

  const db = getDatabase();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE shopping_list_items
    SET quantity = ?, is_purchased = ?, notes = ?, updated_at = ?
    WHERE id = ? AND shopping_list_id = ?
  `).run(nextQty, nextPurchased, nextNotes, now, item.id, list.id);

  db.prepare('UPDATE shopping_lists SET updated_at = ? WHERE id = ?').run(now, list.id);
  return getShoppingListByIdOrShareToken(list.id, authContext)!;
}

export function removeShoppingListItem(
  listId: string,
  itemId: string,
  authContext?: { userId?: string | null; guestSessionId?: string | null }
): ShoppingListDetail {
  const list = getShoppingListByIdOrShareToken(listId, authContext);
  if (!list) throw new Error('SHOPPING_LIST_NOT_FOUND');

  const db = getDatabase();
  const now = new Date().toISOString();
  db.prepare('DELETE FROM shopping_list_items WHERE id = ? AND shopping_list_id = ?').run(itemId, list.id);
  db.prepare('UPDATE shopping_lists SET updated_at = ? WHERE id = ?').run(now, list.id);
  return getShoppingListByIdOrShareToken(list.id, authContext)!;
}

export function optimizeShoppingListById(
  listId: string,
  options?: {
    loyalty?: LoyaltyPreferences;
    maxStoresAllowed?: number;
    tripCostPerExtraStoreCents?: number;
  }
): BasketOptimizationResult {
  const list = getShoppingListByIdOrShareToken(listId);
  if (!list) throw new Error('SHOPPING_LIST_NOT_FOUND');

  const prefs = getUserPreferences();
  const includeLoyaltyDefault = list.includeLoyaltyPrices;
  const loyaltyPreferences: LoyaltyPreferences = options?.loyalty ?? {
    includeLidlPlus: includeLoyaltyDefault ? prefs.includeLidlPlus : false,
    includeTescoClubcard: includeLoyaltyDefault ? prefs.includeTescoClubcard : false,
    includeBillaBonus: includeLoyaltyDefault ? prefs.includeBillaBonus : false,
  };

  const itemsInput: ShoppingListItemInput[] = list.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    customTitle: item.customTitle,
    quantity: item.quantity,
    isPurchased: item.isPurchased,
    product: item.product,
  }));

  return optimizeShoppingBasket(itemsInput, {
    loyaltyPreferences,
    maxStores: options?.maxStoresAllowed ?? prefs.defaultMaxStores,
    tripCostPerExtraStoreCents:
      options?.tripCostPerExtraStoreCents ?? prefs.defaultTripCostCents,
  });
}

// ==============================================================================
// USER PREFERENCES, FAVORITES, ALERTS & NOTIFICATIONS
// ==============================================================================

export function getUserPreferences(userId = DEFAULT_USER_ID): UserPreferencesRecord {
  const db = getDatabase();
  const row = db
    .prepare('SELECT * FROM user_preferences WHERE user_id = ? LIMIT 1')
    .get(userId) as Record<string, unknown> | undefined;

  if (!row) {
    return {
      id: 'pref-default',
      userId,
      language: 'sk',
      currency: 'EUR',
      theme: 'light',
      reducedMotion: false,
      includeLidlPlus: true,
      includeTescoClubcard: true,
      includeBillaBonus: true,
      defaultMaxStores: 2,
      defaultTripCostCents: 150,
      inAppNotificationsEnabled: true,
      emailNotificationsEnabled: false,
      analyticsPrivacyOptOut: true,
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    id: String(row.id),
    userId: String(row.user_id),
    language: (row.language as 'sk' | 'en') ?? 'sk',
    currency: 'EUR',
    theme: (row.theme as 'light' | 'dark' | 'system') ?? 'light',
    reducedMotion: Boolean(row.reduced_motion),
    includeLidlPlus: Boolean(row.include_lidl_plus),
    includeTescoClubcard: Boolean(row.include_tesco_clubcard),
    includeBillaBonus: Boolean(row.include_billa_bonus),
    defaultMaxStores: Number(row.default_max_stores),
    defaultTripCostCents: Number(row.default_trip_cost_cents),
    inAppNotificationsEnabled: Boolean(row.in_app_notifications_enabled),
    emailNotificationsEnabled: Boolean(row.email_notifications_enabled),
    analyticsPrivacyOptOut: Boolean(row.analytics_privacy_opt_out),
    updatedAt: String(row.updated_at),
  };
}

export function updateUserPreferences(
  updates: Partial<Omit<UserPreferencesRecord, 'id' | 'userId' | 'currency' | 'updatedAt'>>,
  userId = DEFAULT_USER_ID
): UserPreferencesRecord {
  const current = getUserPreferences(userId);
  const db = getDatabase();
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE user_preferences
    SET
      language = ?,
      theme = ?,
      reduced_motion = ?,
      include_lidl_plus = ?,
      include_tesco_clubcard = ?,
      include_billa_bonus = ?,
      default_max_stores = ?,
      default_trip_cost_cents = ?,
      in_app_notifications_enabled = ?,
      email_notifications_enabled = ?,
      analytics_privacy_opt_out = ?,
      updated_at = ?
    WHERE user_id = ?
  `).run(
    updates.language ?? current.language,
    updates.theme ?? current.theme,
    (updates.reducedMotion ?? current.reducedMotion) ? 1 : 0,
    (updates.includeLidlPlus ?? current.includeLidlPlus) ? 1 : 0,
    (updates.includeTescoClubcard ?? current.includeTescoClubcard) ? 1 : 0,
    (updates.includeBillaBonus ?? current.includeBillaBonus) ? 1 : 0,
    updates.defaultMaxStores ?? current.defaultMaxStores,
    updates.defaultTripCostCents ?? current.defaultTripCostCents,
    (updates.inAppNotificationsEnabled ?? current.inAppNotificationsEnabled) ? 1 : 0,
    (updates.emailNotificationsEnabled ?? current.emailNotificationsEnabled) ? 1 : 0,
    (updates.analyticsPrivacyOptOut ?? current.analyticsPrivacyOptOut) ? 1 : 0,
    now,
    userId
  );

  return getUserPreferences(userId);
}

export function getFavoriteProductIds(userId = DEFAULT_USER_ID): string[] {
  const db = getDatabase();
  const rows = db
    .prepare('SELECT product_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId) as Array<{ product_id: string }>;
  return rows.map((r) => r.product_id);
}

export function toggleFavoriteProduct(
  productId: string,
  userId = DEFAULT_USER_ID
): { isFavorite: boolean; favoriteProductIds: string[] } {
  const db = getDatabase();
  const existing = db
    .prepare('SELECT id FROM favorites WHERE user_id = ? AND product_id = ? LIMIT 1')
    .get(userId, productId) as { id: string } | undefined;

  if (existing) {
    db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id);
    return { isFavorite: false, favoriteProductIds: getFavoriteProductIds(userId) };
  }

  db.prepare('INSERT INTO favorites (id, user_id, product_id, created_at) VALUES (?, ?, ?, ?)').run(
    `fav-${crypto.randomUUID().slice(0, 10)}`,
    userId,
    productId,
    new Date().toISOString()
  );
  return { isFavorite: true, favoriteProductIds: getFavoriteProductIds(userId) };
}

export function getPriceAlerts(userId = DEFAULT_USER_ID): PriceAlertRecord[] {
  const db = getDatabase();
  const rows = db
    .prepare('SELECT * FROM price_alerts WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId) as Array<Record<string, unknown>>;

  const productMap = new Map<string, ProductWithOffers>();
  for (const p of getAllProducts()) {
    productMap.set(p.id, p);
  }

  return rows
    .map((row) => {
      const pid = String(row.product_id);
      const product = productMap.get(pid);
      if (!product) return null;

      const includeLoyaltyPrices = Boolean(row.include_loyalty_prices);
      const alertLoyalty: LoyaltyPreferences = {
        includeLidlPlus: includeLoyaltyPrices,
        includeTescoClubcard: includeLoyaltyPrices,
        includeBillaBonus: includeLoyaltyPrices,
      };
      const bestOffer = getBestEvaluatedOfferForProduct(product, alertLoyalty);
      const targetPriceCents = Number(row.target_price_cents);

      return {
        id: String(row.id),
        userId: String(row.user_id),
        productId: pid,
        product,
        targetPriceCents,
        notifyOnAnyPromotion: Boolean(row.notify_on_any_promotion),
        includeLoyaltyPrices,
        retailerFilter: row.retailer_filter ? (row.retailer_filter as RetailerSlug) : null,
        isActive: Boolean(row.is_active),
        lastTriggeredAt: row.last_triggered_at ? String(row.last_triggered_at) : null,
        lastTriggeredObservationId: row.last_triggered_observation_id
          ? String(row.last_triggered_observation_id)
          : null,
        createdAt: String(row.created_at),
        currentBestPriceCents: bestOffer?.effectivePriceCents ?? null,
        currentBestRetailerName: bestOffer?.retailerName ?? null,
        isCurrentlyTriggered:
          bestOffer?.effectivePriceCents !== null &&
          bestOffer?.effectivePriceCents !== undefined &&
          bestOffer.effectivePriceCents <= targetPriceCents,
      };
    })
    .filter((r): r is PriceAlertRecord => r !== null);
}

export function createPriceAlert(
  input: {
    productId: string;
    targetPriceCents: number;
    notifyOnAnyPromotion?: boolean;
    includeLoyaltyPrices?: boolean;
    retailerFilter?: RetailerSlug | null;
  },
  userId = DEFAULT_USER_ID
): PriceAlertRecord {
  const product = getProductBySlugOrId(input.productId);
  if (!product) throw new Error('PRODUCT_NOT_FOUND');

  const db = getDatabase();
  const id = `alert-${crypto.randomUUID().slice(0, 10)}`;
  const now = new Date().toISOString();

  const existingNotifs = db
    .prepare('SELECT deduplication_key FROM notifications WHERE user_id = ?')
    .all(userId) as Array<{ deduplication_key: string }>;
  const existingDedupKeys = new Set(existingNotifs.map((n) => n.deduplication_key));

  const alertRule: PriceAlertRule = {
    id,
    userId,
    productId: product.id,
    productName: product.canonicalName,
    targetPriceCents: Math.max(1, Math.round(input.targetPriceCents)),
    notifyOnAnyPromotion: input.notifyOnAnyPromotion ?? true,
    includeLoyaltyPrices: input.includeLoyaltyPrices ?? true,
    retailerFilter: input.retailerFilter ?? null,
    isActive: true,
  };

  const triggeredCandidates = evaluatePriceAlertAgainstListings(
    alertRule,
    product.listings,
    existingDedupKeys
  );

  const firstTrigger = triggeredCandidates[0] ?? null;

  db.prepare(`
    INSERT INTO price_alerts (
      id, user_id, product_id, target_price_cents, notify_on_any_promotion,
      include_loyalty_prices, retailer_filter, is_active, last_triggered_at,
      last_triggered_observation_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
  `).run(
    id,
    userId,
    product.id,
    alertRule.targetPriceCents,
    alertRule.notifyOnAnyPromotion ? 1 : 0,
    alertRule.includeLoyaltyPrices ? 1 : 0,
    alertRule.retailerFilter,
    firstTrigger ? now : null,
    firstTrigger ? firstTrigger.deduplicationKey : null,
    now
  );

  for (const cand of triggeredCandidates) {
    db.prepare(`
      INSERT OR IGNORE INTO notifications (
        id, user_id, alert_id, product_id, retailer_id, title, message,
        observed_price_cents, deduplication_key, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      `notif-${crypto.randomUUID().slice(0, 10)}`,
      userId,
      id,
      product.id,
      cand.retailerId,
      cand.title,
      cand.message,
      cand.observedPriceCents,
      cand.deduplicationKey,
      now
    );
  }

  return getPriceAlerts(userId).find((a) => a.id === id)!;
}

export function deletePriceAlert(alertId: string, userId = DEFAULT_USER_ID): void {
  const db = getDatabase();
  db.prepare('DELETE FROM price_alerts WHERE id = ? AND user_id = ?').run(alertId, userId);
}

export function getNotifications(userId = DEFAULT_USER_ID): NotificationRecord[] {
  const db = getDatabase();
  const rows = db
    .prepare(`
      SELECT n.*, p.slug AS product_slug
      FROM notifications n
      LEFT JOIN products p ON p.id = n.product_id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
    `)
    .all(userId) as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    id: String(row.id),
    userId: String(row.user_id),
    alertId: row.alert_id ? String(row.alert_id) : null,
    productId: row.product_id ? String(row.product_id) : null,
    productSlug: row.product_slug ? String(row.product_slug) : null,
    retailerId: row.retailer_id ? String(row.retailer_id) : null,
    title: String(row.title),
    message: String(row.message),
    observedPriceCents: row.observed_price_cents !== null ? Number(row.observed_price_cents) : null,
    deduplicationKey: String(row.deduplication_key),
    isRead: Boolean(row.is_read),
    createdAt: String(row.created_at),
  }));
}

export function markNotificationAsRead(notificationId: string, userId = DEFAULT_USER_ID): void {
  const db = getDatabase();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(
    notificationId,
    userId
  );
}

export function deleteNotification(notificationId: string, userId = DEFAULT_USER_ID): void {
  const db = getDatabase();
  db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?').run(notificationId, userId);
}

// ==============================================================================
// PRODUCT MATCH REVIEW WORKFLOW (ADMIN / QA)
// ==============================================================================

export function getPendingMatchCandidates(): PendingMatchCandidateRecord[] {
  const db = getDatabase();
  const rows = db
    .prepare(`
      SELECT
        l.*,
        r.slug AS retailer_slug,
        r.name AS retailer_name,
        p.slug AS product_slug,
        p.canonical_name,
        p.brand AS canonical_brand,
        p.package_quantity AS canonical_pkg_qty,
        p.package_unit AS canonical_pkg_unit,
        p.variant_descriptor AS canonical_variant
      FROM retailer_product_listings l
      JOIN retailers r ON r.id = l.retailer_id
      JOIN products p ON p.id = l.product_id
      WHERE l.match_status != 'VERIFIED'
      ORDER BY l.updated_at DESC
    `)
    .all() as Array<Record<string, unknown>>;

  return rows.map((row) => {
    const pid = String(row.product_id);
    const eanRow = db
      .prepare("SELECT identifier_value FROM product_identifiers WHERE product_id = ? AND identifier_type = 'EAN13' LIMIT 1")
      .get(pid) as { identifier_value: string } | undefined;

    const primaryEan = eanRow?.identifier_value ?? null;
    const evaluation = evaluateProductMatch(
      {
        title: String(row.canonical_name),
        brand: row.canonical_brand ? String(row.canonical_brand) : null,
        packageQuantity: Number(row.canonical_pkg_qty),
        packageUnit: String(row.canonical_pkg_unit),
        barcode: primaryEan,
        variantDescriptor: row.canonical_variant ? String(row.canonical_variant) : null,
      },
      {
        title: String(row.retailer_title),
        brand: row.retailer_brand ? String(row.retailer_brand) : null,
        packageQuantity: Number(row.package_quantity),
        packageUnit: String(row.package_unit),
        barcode: row.external_barcode ? String(row.external_barcode) : null,
      }
    );

    return {
      listingId: String(row.id),
      retailerSlug: row.retailer_slug as RetailerSlug,
      retailerName: String(row.retailer_name),
      externalId: String(row.external_id),
      externalBarcode: row.external_barcode ? String(row.external_barcode) : null,
      retailerTitle: String(row.retailer_title),
      retailerBrand: row.retailer_brand ? String(row.retailer_brand) : null,
      packageLabel: String(row.package_label),
      packageQuantity: Number(row.package_quantity),
      packageUnit: String(row.package_unit),
      sourceUrl: String(row.source_url),
      matchType: row.match_type as MatchType,
      matchConfidence: Number(row.match_confidence),
      matchStatus: row.match_status as MatchStatus,
      canonicalProduct: {
        id: pid,
        slug: String(row.product_slug),
        canonicalName: String(row.canonical_name),
        brand: row.canonical_brand ? String(row.canonical_brand) : null,
        packageQuantity: Number(row.canonical_pkg_qty),
        packageUnit: String(row.canonical_pkg_unit),
        primaryEan,
      },
      evaluation,
    };
  });
}

export function resolvePendingMatchCandidate(
  listingId: string,
  action: 'APPROVE' | 'REJECT'
): PendingMatchCandidateRecord[] {
  const db = getDatabase();
  const nextStatus: MatchStatus = action === 'APPROVE' ? 'VERIFIED' : 'REJECTED';
  const now = new Date().toISOString();
  db.prepare('UPDATE retailer_product_listings SET match_status = ?, updated_at = ? WHERE id = ?').run(
    nextStatus,
    now,
    listingId
  );
  return getPendingMatchCandidates();
}

// ==============================================================================
// LIVE RETAILER ADAPTER EXECUTION & CSV IMPORT
// ==============================================================================

export async function runRetailerIngestion(input: {
  retailerSlug: RetailerSlug;
  mode: 'LIVE_ADAPTER' | 'CSV_FALLBACK';
  csvContent?: string;
}): Promise<{
  job: ImportJobRecord;
  sampleItems: NormalizedRetailerOffer[];
}> {
  const db = getDatabase();
  const retailerRow = db
    .prepare('SELECT * FROM retailers WHERE slug = ? LIMIT 1')
    .get(input.retailerSlug) as Record<string, unknown> | undefined;

  if (!retailerRow) {
    throw new Error(`Unknown retailer: ${input.retailerSlug}`);
  }

  const retailerId = String(retailerRow.id);
  const startedAt = new Date().toISOString();
  const jobId = `job-${input.retailerSlug}-${crypto.randomUUID().slice(0, 8)}`;

  const dataSourceId =
    input.retailerSlug === 'lidl'
      ? 'ds-lidl-ssr'
      : input.retailerSlug === 'billa'
        ? 'ds-billa-ssr'
        : input.mode === 'CSV_FALLBACK'
          ? 'ds-tesco-csv'
          : 'ds-tesco-graphql';

  let offersNormalized: NormalizedRetailerOffer[] = [];
  let errors: Array<{
    externalIdentifier: string | null;
    errorCode: string;
    errorMessage: string;
    rawPayloadSnippet?: string;
  }> = [];
  let summaryNotes = '';

  if (input.mode === 'CSV_FALLBACK' && input.csvContent) {
    const csvParsed = parseVerifiedPriceCsv(input.csvContent, startedAt);
    offersNormalized = csvParsed.offers;
    errors = csvParsed.errors;
    summaryNotes = `Overený CSV import: spracovaných ${offersNormalized.length} ponúk.`;
  } else {
    const report =
      input.retailerSlug === 'lidl'
        ? await fetchLiveLidlSkOffers()
        : input.retailerSlug === 'billa'
          ? await fetchLiveBillaSkOffers()
          : await fetchLiveTescoSkLeafletOffers();
    offersNormalized = report.offersNormalized;
    errors = report.errors;
    summaryNotes = report.notes.join(' ');
  }

  const completedAt = new Date().toISOString();
  let itemsImported = 0;
  let itemsDeduplicated = 0;
  const today = completedAt.slice(0, 10);

  db.prepare(`
    INSERT INTO import_jobs (
      id, retailer_id, data_source_id, status, items_discovered,
      items_imported, items_deduplicated, error_count, started_at, completed_at, summary_notes
    ) VALUES (?, ?, ?, 'RUNNING', ?, 0, 0, 0, ?, NULL, ?)
  `).run(jobId, retailerId, dataSourceId, offersNormalized.length, startedAt, summaryNotes);

  for (const item of offersNormalized) {
    const listingRow = db
      .prepare(`
        SELECT l.*
        FROM retailer_product_listings l
        WHERE l.retailer_id = ? AND (l.external_id = ? OR (l.external_barcode IS NOT NULL AND l.external_barcode = ?))
        LIMIT 1
      `)
      .get(retailerId, item.externalId, item.barcode ?? '__none__') as Record<string, unknown> | undefined;

    if (!listingRow) {
      continue;
    }

    const listingId = String(listingRow.id);
    const dedupHash = computeObservationDeduplicationHash({
      listingId,
      observationDay: today,
      regularPriceCents: item.regularPriceCents,
      promoPriceCents: item.promoPriceCents,
      loyaltyPriceCents: item.loyaltyPriceCents,
    });

    const existingObs = db
      .prepare('SELECT id FROM price_observations WHERE deduplication_hash = ? LIMIT 1')
      .get(dedupHash) as { id: string } | undefined;

    if (existingObs) {
      itemsDeduplicated += 1;
      continue;
    }

    const pkgQty = item.packageQuantity || Number(listingRow.package_quantity);
    const pkgUnit = item.packageUnit || String(listingRow.package_unit);
    const standardEffective = item.promoPriceCents ?? item.regularPriceCents;
    const unitPriceCalc = calculateUnitPriceCents(standardEffective, pkgQty, pkgUnit);
    const loyaltyUnitPriceCalc = calculateUnitPriceCents(item.loyaltyPriceCents, pkgQty, pkgUnit);
    const bestPrice = item.loyaltyPriceCents ?? item.promoPriceCents ?? item.regularPriceCents;
    const discountInfo = calculateVerifiedDiscount(item.regularPriceCents, bestPrice);

    db.prepare(`
      INSERT INTO price_observations (
        id, listing_id, data_source_id, import_job_id, currency,
        regular_price_cents, promo_price_cents, loyalty_price_cents, effective_price_cents,
        unit_price_cents, loyalty_unit_price_cents, base_unit, lowest_30d_price_cents,
        is_promotional, requires_loyalty_card, loyalty_program_name, discount_percentage,
        observed_at, observation_day, valid_from, valid_to, source_url, deduplication_hash, created_at
      ) VALUES (?, ?, ?, ?, 'EUR', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `obs-${listingId}-${crypto.randomUUID().slice(0, 8)}`,
      listingId,
      dataSourceId,
      jobId,
      item.regularPriceCents,
      item.promoPriceCents,
      item.loyaltyPriceCents,
      standardEffective,
      unitPriceCalc?.unitPriceCents ?? null,
      loyaltyUnitPriceCalc?.unitPriceCents ?? null,
      unitPriceCalc?.baseUnit ?? loyaltyUnitPriceCalc?.baseUnit ?? item.normalizedUnit,
      item.lowest30DayPriceCents,
      item.promoPriceCents !== null || item.loyaltyPriceCents !== null ? 1 : 0,
      item.loyaltyPriceCents !== null ? 1 : 0,
      item.loyaltyProgramName,
      discountInfo?.discountPercentage ?? null,
      completedAt,
      today,
      item.validFrom,
      item.validTo,
      item.sourceUrl,
      dedupHash,
      completedAt
    );

    itemsImported += 1;
  }

  const jobStatus =
    errors.length > 0 && offersNormalized.length === 0
      ? 'FAILED'
      : errors.length > 0
        ? 'PARTIAL_WARNING'
        : 'COMPLETED';

  db.prepare(`
    UPDATE import_jobs
    SET status = ?, items_imported = ?, items_deduplicated = ?, error_count = ?, completed_at = ?, summary_notes = ?
    WHERE id = ?
  `).run(
    jobStatus,
    itemsImported,
    itemsDeduplicated,
    errors.length,
    completedAt,
    summaryNotes,
    jobId
  );

  for (const err of errors) {
    db.prepare(`
      INSERT INTO import_errors (
        id, import_job_id, external_identifier, error_code, error_message, raw_payload_snippet, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `err-${crypto.randomUUID().slice(0, 10)}`,
      jobId,
      err.externalIdentifier,
      err.errorCode,
      err.errorMessage,
      err.rawPayloadSnippet ?? null,
      completedAt
    );
  }

  db.prepare('UPDATE data_sources SET last_success_at = ? WHERE id = ?').run(completedAt, dataSourceId);

  const jobs = getImportJobs(10);
  const createdJob = jobs.find((j) => j.id === jobId) ?? jobs[0];

  return {
    job: createdJob,
    sampleItems: offersNormalized.slice(0, 12),
  };
}

// ==============================================================================
// HOME PAGE SUMMARY & LIVE STORED METRICS
// ==============================================================================

export function getHomeDashboardData() {
  const db = getDatabase();
  const allProducts = getAllProducts();
  const weeklyOffers = getWeeklyOffers({ sortBy: 'discount_desc' });
  const dataSources = getDataSources();
  const defaultBasketOptimization = optimizeShoppingListById('list-rodinny-nakup');

  const obsCountRow = db.prepare('SELECT COUNT(*) AS cnt FROM price_observations').get() as { cnt: number };
  const activePromosRow = db
    .prepare('SELECT COUNT(*) AS cnt FROM promotions WHERE is_expired = 0')
    .get() as { cnt: number };

  const recentObsRows = db
    .prepare(`
      SELECT
        po.*,
        r.slug AS retailer_slug,
        r.name AS retailer_name,
        p.slug AS product_slug,
        p.canonical_name AS product_name,
        p.brand AS product_brand,
        l.package_label
      FROM price_observations po
      JOIN retailer_product_listings l ON l.id = po.listing_id
      JOIN retailers r ON r.id = l.retailer_id
      JOIN products p ON p.id = l.product_id
      WHERE l.match_status = 'VERIFIED'
      ORDER BY po.observed_at DESC
      LIMIT 8
    `)
    .all() as Array<Record<string, unknown>>;

  const recentlyUpdatedPrices = recentObsRows.map((row) => ({
    observationId: String(row.id),
    productSlug: String(row.product_slug),
    productName: String(row.product_name),
    brand: row.product_brand ? String(row.product_brand) : null,
    packageLabel: String(row.package_label),
    retailerSlug: row.retailer_slug as RetailerSlug,
    retailerName: String(row.retailer_name),
    regularPriceCents: row.regular_price_cents !== null ? Number(row.regular_price_cents) : null,
    effectivePriceCents:
      row.loyalty_price_cents !== null
        ? Number(row.loyalty_price_cents)
        : row.effective_price_cents !== null
          ? Number(row.effective_price_cents)
          : null,
    unitPriceCents:
      row.loyalty_unit_price_cents !== null
        ? Number(row.loyalty_unit_price_cents)
        : row.unit_price_cents !== null
          ? Number(row.unit_price_cents)
          : null,
    baseUnit: row.base_unit as BaseUnit,
    requiresLoyaltyCard: Boolean(row.requires_loyalty_card),
    loyaltyProgramName: row.loyalty_program_name ? String(row.loyalty_program_name) : null,
    discountPercentage: row.discount_percentage !== null ? Number(row.discount_percentage) : null,
    observedAt: String(row.observed_at),
    sourceUrl: String(row.source_url),
  }));

  const categoriesMap = new Map<
    string,
    { slug: string; name: string; productCount: number; activeOffersCount: number }
  >();
  for (const p of allProducts) {
    const existing = categoriesMap.get(p.categorySlug) ?? {
      slug: p.categorySlug,
      name: p.categoryName,
      productCount: 0,
      activeOffersCount: 0,
    };
    existing.productCount += 1;
    existing.activeOffersCount += p.listings.filter((l) => l.activePromotion !== null).length;
    categoriesMap.set(p.categorySlug, existing);
  }

  return {
    storedMetrics: {
      verifiedCatalogProductsCount: allProducts.length,
      totalStoredPriceObservationsCount: obsCountRow.cnt,
      activeVerifiedPromotionsCount: activePromosRow.cnt,
      supportedRetailersCount: 3,
      lastVerificationTimestamp: recentlyUpdatedPrices[0]?.observedAt ?? '2026-10-16T08:30:00Z',
    },
    todaysVerifiedOffers: [
      ...weeklyOffers.regularPromotions,
      ...weeklyOffers.loyaltyPromotions,
    ]
      .sort((a, b) => (b.verifiedDiscountPercent ?? 0) - (a.verifiedDiscountPercent ?? 0))
      .slice(0, 6),
    popularProducts: allProducts.filter((p) => p.isEssentialStaple).slice(0, 8),
    comparisonHighlights: allProducts.slice(0, 4),
    categories: Array.from(categoriesMap.values()),
    recentlyUpdatedPrices,
    dataSources,
    defaultBasketOptimization,
  };
}
