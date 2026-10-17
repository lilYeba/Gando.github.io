// ==============================================================================
// PRICE TRACKER SK — OPEN FOOD FACTS API SERVICE
// Official integration with Open Food Facts (world.openfoodfacts.org / .net)
// Provides real product photographs, barcodes, and metadata for Slovak groceries.
// Licensed under ODbL / Database & photos: Open Food Facts contributors.
// ==============================================================================

import { getDatabase } from '../db/repository';

export interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  product_name_sk?: string;
  brands?: string;
  quantity?: string;
  image_front_url?: string;
  image_front_small_url?: string;
  image_url?: string;
  countries_tags?: string[];
  categories_tags?: string[];
  status?: number;
  status_verbose?: string;
}

export interface OpenFoodFactsPhotoResult {
  barcode: string;
  imageUrl: string;
  thumbnailUrl: string;
  productName: string;
  brand: string | null;
  packageSize: string | null;
  source: 'open_food_facts';
  attribution: string;
  cachedAt: string;
}

const PRIMARY_API_BASE = 'https://world.openfoodfacts.org';
const FALLBACK_API_BASE = 'https://world.openfoodfacts.net';
const USER_AGENT = 'PriceTrackerSK/1.0 (https://pricetracker.sk; contact: info@pricetracker.sk)';
const DEFAULT_TIMEOUT_MS = 4000;
const CACHE_TTL_DAYS = 7;
const NEGATIVE_CACHE_TTL_HOURS = 24;

// In-memory runtime cache to eliminate duplicate network calls during rendering
const memoryCache = new Map<string, { result: OpenFoodFactsPhotoResult | null; expiresAt: number }>();

/**
 * Normalizes barcode string by stripping non-digit characters.
 */
export function normalizeBarcode(barcode: string | null | undefined): string | null {
  if (!barcode) return null;
  const cleaned = barcode.trim().replace(/\D/g, '');
  // Valid EAN-8 or EAN-13 or GTIN-12 / GTIN-14
  if (cleaned.length >= 8 && cleaned.length <= 14) {
    return cleaned;
  }
  return null;
}

/**
 * Standard attribution text for Open Food Facts licensing compliance.
 */
export function getOpenFoodFactsAttribution(): string {
  return 'Produktové fotografie a informácie pochádzajú z otvorenej databázy Open Food Facts (ODbL / CC-BY-SA 3.0).';
}

/**
 * Checks persistent SQLite cache for a previously resolved image.
 */
function getFromDbCache(queryKey: string): OpenFoodFactsPhotoResult | null | undefined {
  try {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM open_food_facts_cache WHERE query_key = ?')
      .get(queryKey) as {
      query_key: string;
      barcode: string | null;
      product_name: string | null;
      brand: string | null;
      image_front_url: string | null;
      image_front_small_url: string | null;
      expires_at: string;
      created_at: string;
    } | undefined;

    if (!row) return undefined;

    const isExpired = new Date(row.expires_at).getTime() < Date.now();
    if (isExpired) return undefined;

    if (!row.image_front_url) {
      // Negative cache entry (product was checked and not found)
      return null;
    }

    return {
      barcode: row.barcode ?? '',
      imageUrl: row.image_front_url,
      thumbnailUrl: row.image_front_small_url ?? row.image_front_url,
      productName: row.product_name ?? '',
      brand: row.brand,
      packageSize: null,
      source: 'open_food_facts',
      attribution: getOpenFoodFactsAttribution(),
      cachedAt: row.created_at,
    };
  } catch {
    return undefined;
  }
}

/**
 * Saves resolved image or negative lookup to persistent SQLite cache.
 */
function saveToDbCache(
  queryKey: string,
  queryType: 'BARCODE' | 'NAME',
  result: OpenFoodFactsPhotoResult | null,
  rawPayload?: unknown
): void {
  try {
    const db = getDatabase();
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() +
        (result ? CACHE_TTL_DAYS * 24 * 60 * 60 * 1000 : NEGATIVE_CACHE_TTL_HOURS * 60 * 60 * 1000)
    );

    db.prepare(`
      INSERT INTO open_food_facts_cache (
        query_key, query_type, barcode, product_name, brand,
        image_front_url, image_front_small_url, raw_payload, created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(query_key) DO UPDATE SET
        image_front_url = excluded.image_front_url,
        image_front_small_url = excluded.image_front_small_url,
        raw_payload = excluded.raw_payload,
        expires_at = excluded.expires_at
    `).run(
      queryKey,
      queryType,
      result?.barcode ?? null,
      result?.productName ?? null,
      result?.brand ?? null,
      result?.imageUrl ?? null,
      result?.thumbnailUrl ?? null,
      rawPayload ? JSON.stringify(rawPayload) : null,
      now.toISOString(),
      expiresAt.toISOString()
    );
  } catch {
    // Gracefully ignore cache write failures
  }
}

/**
 * Fetch a single product from Open Food Facts API by exact barcode/EAN.
 */
export async function fetchProductByBarcode(
  barcode: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<OpenFoodFactsProduct | null> {
  const cleanBarcode = normalizeBarcode(barcode);
  if (!cleanBarcode) return null;

  const fields = 'code,product_name,product_name_sk,brands,image_front_url,image_front_small_url,image_url,quantity,countries_tags,categories_tags,status,status_verbose';
  const primaryUrl = `${PRIMARY_API_BASE}/api/v2/product/${encodeURIComponent(cleanBarcode)}.json?fields=${fields}`;
  const fallbackUrl = `${FALLBACK_API_BASE}/api/v2/product/${encodeURIComponent(cleanBarcode)}.json?fields=${fields}`;

  // Helper fetch with timeout
  async function tryFetch(url: string): Promise<OpenFoodFactsProduct | null> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) return null;
      const json = await res.json();
      if (json && (json.status === 1 || json.product)) {
        return (json.product ?? json) as OpenFoodFactsProduct;
      }
      return null;
    } catch {
      return null;
    }
  }

  // 1. Try primary endpoint
  const primaryResult = await tryFetch(primaryUrl);
  if (primaryResult) return primaryResult;

  // 2. Try fallback endpoint
  return await tryFetch(fallbackUrl);
}

/**
 * Search products by brand using Open Food Facts v2 structured tags.
 */
export async function searchProductsByBrand(
  brand: string,
  limit = 10,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<OpenFoodFactsProduct[]> {
  if (!brand || brand.trim().length < 2) return [];

  const cleanBrand = brand
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');

  const fields = 'code,product_name,product_name_sk,brands,image_front_url,image_front_small_url,image_url,quantity,countries_tags,categories_tags';
  const url = `${FALLBACK_API_BASE}/api/v2/search?brands_tags=${encodeURIComponent(cleanBrand)}&page_size=${limit}&fields=${fields}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) return [];
    const json = await res.json();
    if (json && Array.isArray(json.products)) {
      return json.products as OpenFoodFactsProduct[];
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Resolves a real product photograph from Open Food Facts using barcode first, then brand search.
 * Includes in-memory and persistent SQLite caching.
 */
export async function resolveProductPhoto(options: {
  barcode?: string | null;
  productName?: string | null;
  brand?: string | null;
}): Promise<OpenFoodFactsPhotoResult | null> {
  const { barcode, productName, brand } = options;
  const cleanBarcode = normalizeBarcode(barcode);
  const cacheKey = cleanBarcode
    ? `barcode:${cleanBarcode}`
    : `name:${(brand ?? '').trim().toLowerCase()}_${(productName ?? '').trim().toLowerCase()}`;

  // 1. Check memory cache
  const mem = memoryCache.get(cacheKey);
  if (mem && mem.expiresAt > Date.now()) {
    return mem.result;
  }

  // 2. Check SQLite persistent cache
  const dbCached = getFromDbCache(cacheKey);
  if (dbCached !== undefined) {
    memoryCache.set(cacheKey, {
      result: dbCached,
      expiresAt: Date.now() + 60 * 60 * 1000,
    });
    return dbCached;
  }

  // 3. Search Open Food Facts by barcode
  if (cleanBarcode) {
    const product = await fetchProductByBarcode(cleanBarcode);
    const photoUrl = product?.image_front_url || product?.image_url;

    if (photoUrl && photoUrl.startsWith('http')) {
      const result: OpenFoodFactsPhotoResult = {
        barcode: product?.code ?? cleanBarcode,
        imageUrl: photoUrl,
        thumbnailUrl: product?.image_front_small_url || photoUrl,
        productName: product?.product_name_sk || product?.product_name || productName || '',
        brand: product?.brands ?? brand ?? null,
        packageSize: product?.quantity ?? null,
        source: 'open_food_facts',
        attribution: getOpenFoodFactsAttribution(),
        cachedAt: new Date().toISOString(),
      };

      memoryCache.set(cacheKey, { result, expiresAt: Date.now() + 60 * 60 * 1000 });
      saveToDbCache(cacheKey, 'BARCODE', result, product);
      return result;
    }
  }

  // 4. Search by brand if barcode did not yield an image
  if (brand && brand.trim().length >= 2) {
    const brandProducts = await searchProductsByBrand(brand, 8);
    const targetName = (productName ?? '').toLowerCase();

    // Find best matching product that has an image
    let bestMatch: OpenFoodFactsProduct | null = null;
    for (const p of brandProducts) {
      const pPhoto = p.image_front_url || p.image_url;
      if (!pPhoto) continue;

      const pName = (p.product_name_sk || p.product_name || '').toLowerCase();
      if (targetName && pName.includes(targetName.split(' ')[0])) {
        bestMatch = p;
        break;
      }
      if (!bestMatch) {
        bestMatch = p;
      }
    }

    if (bestMatch && (bestMatch.image_front_url || bestMatch.image_url)) {
      const photoUrl = bestMatch.image_front_url || bestMatch.image_url!;
      const result: OpenFoodFactsPhotoResult = {
        barcode: bestMatch.code,
        imageUrl: photoUrl,
        thumbnailUrl: bestMatch.image_front_small_url || photoUrl,
        productName: bestMatch.product_name_sk || bestMatch.product_name || productName || '',
        brand: bestMatch.brands ?? brand,
        packageSize: bestMatch.quantity ?? null,
        source: 'open_food_facts',
        attribution: getOpenFoodFactsAttribution(),
        cachedAt: new Date().toISOString(),
      };

      memoryCache.set(cacheKey, { result, expiresAt: Date.now() + 60 * 60 * 1000 });
      saveToDbCache(cacheKey, 'NAME', result, bestMatch);
      return result;
    }
  }

  // 5. Negative cache (no real photograph found)
  memoryCache.set(cacheKey, { result: null, expiresAt: Date.now() + 15 * 60 * 1000 });
  saveToDbCache(cacheKey, cleanBarcode ? 'BARCODE' : 'NAME', null);
  return null;
}
