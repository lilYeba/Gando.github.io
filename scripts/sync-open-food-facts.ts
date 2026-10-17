// ==============================================================================
// PRICE TRACKER SK — OPEN FOOD FACTS REAL PHOTOGRAPH SYNCHRONIZATION
// Fetches verified real product photographs from Open Food Facts, caches them,
// and updates the catalog so AI-generated illustrations are completely replaced.
// ==============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { getDatabase } from '../src/lib/db/repository';
import { fetchProductByBarcode, searchProductsByBrand, normalizeBarcode } from '../src/lib/services/open-food-facts';
import { SEED_PRODUCTS } from '../src/lib/db/seed-data';

interface ProductPhotoResolution {
  slug: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  photoUrl: string | null;
  thumbnailUrl: string | null;
  matchedBy: 'EXACT_BARCODE' | 'OFFER_BARCODE' | 'BRAND_TAG' | 'NONE';
  offProductName?: string;
}

// Known verified barcodes on Open Food Facts for Slovak catalog items
const VERIFIED_OFF_BARCODES: Record<string, string> = {
  'tami-tatranske-maslo-82-250g': '8585000902797',
  'rajo-trvanlive-mlieko-1-5-1l': '8585002510037',
  'banovecky-polostiepok-neudeny-190g': '8586001543866',
  'rajo-mnam-smotanovy-jogurt-jahoda-145g': '8585002500854',
  'popradska-kava-extra-special-mleta-250g': '8586009411853',
  'psenicna-muka-hladka-t650-1kg': '8594060910093',
  'panzani-torti-tricolore-vretena-500g': '3038350250803',
  'panzani-spagety-semolinove-500g': '3038351484900',
  'tekovsky-salamovy-syr-udeny-1kg': '8585000902568',
  'mutti-kecup-classico-300g': '8005110170348',
  'kofola-original-nulka-1-5l-pet': '8586019830415',
  'liptov-bryndza-plnotucna-110g': '8588000003020',
  'zvolensky-smotanovy-jogurt-cokolada-145g': '8586000140431',
  'rajec-pramenita-voda-nesytena-1-5l': '8586011330296',
  'zlaty-bazant-12-lezak-plechovka-500ml': '8586000987517',
  'vinea-biela-hroznovy-napoj-1-5l': '8594001091012',
  'emco-ovsene-vlocky-jemne-500g': '8595229931812',
  'rajo-slovensky-eidam-platky-45-100g': '8585002524614',
  'rajo-tradicny-tvaroh-jemny-hrudkovity-250g': '8588002964794',
};

async function syncCatalogPhotos() {
  console.log('------------------------------------------------------------');
  console.log('PRICE TRACKER SK — OPEN FOOD FACTS REAL PHOTO SYNC');
  console.log('------------------------------------------------------------');

  const db = getDatabase();
  const resolutions: ProductPhotoResolution[] = [];

  for (let i = 0; i < SEED_PRODUCTS.length; i++) {
    const p = SEED_PRODUCTS[i];
    console.log(`\n[${i + 1}/${SEED_PRODUCTS.length}] Resolving: ${p.canonicalName} (${p.brand ?? 'bez značky'})`);

    let photoUrl: string | null = null;
    let thumbnailUrl: string | null = null;
    let matchedBy: ProductPhotoResolution['matchedBy'] = 'NONE';
    let offProductName: string | undefined;

    // 1. Check known verified Slovak barcode mapping
    const mappedBarcode = VERIFIED_OFF_BARCODES[p.slug];
    if (mappedBarcode) {
      const offProd = await fetchProductByBarcode(mappedBarcode);
      const foundImg = offProd?.image_front_url || offProd?.image_url;
      if (foundImg && foundImg.startsWith('http')) {
        photoUrl = foundImg;
        thumbnailUrl = offProd?.image_front_small_url || foundImg;
        matchedBy = 'EXACT_BARCODE';
        offProductName = offProd?.product_name_sk || offProd?.product_name;
        console.log(`  ✓ Matched via verified EAN ${mappedBarcode}: ${foundImg}`);
      }
    }

    // 2. Check primary EAN if not yet matched
    if (!photoUrl && p.primaryEan) {
      const cleanEan = normalizeBarcode(p.primaryEan);
      if (cleanEan) {
        const offProd = await fetchProductByBarcode(cleanEan);
        const foundImg = offProd?.image_front_url || offProd?.image_url;
        if (foundImg && foundImg.startsWith('http')) {
          photoUrl = foundImg;
          thumbnailUrl = offProd?.image_front_small_url || foundImg;
          matchedBy = 'EXACT_BARCODE';
          offProductName = offProd?.product_name_sk || offProd?.product_name;
          console.log(`  ✓ Matched via primary EAN ${cleanEan}: ${foundImg}`);
        }
      }
    }

    // 3. Check offer barcodes if not yet matched
    if (!photoUrl && p.offers.length > 0) {
      for (const o of p.offers) {
        if (!o.barcode) continue;
        const cleanEan = normalizeBarcode(o.barcode);
        if (!cleanEan || cleanEan === p.primaryEan) continue;

        const offProd = await fetchProductByBarcode(cleanEan);
        const foundImg = offProd?.image_front_url || offProd?.image_url;
        if (foundImg && foundImg.startsWith('http')) {
          photoUrl = foundImg;
          thumbnailUrl = offProd?.image_front_small_url || foundImg;
          matchedBy = 'OFFER_BARCODE';
          offProductName = offProd?.product_name_sk || offProd?.product_name;
          console.log(`  ✓ Matched via offer EAN ${cleanEan}: ${foundImg}`);
          break;
        }
      }
    }

    // 4. Fallback search by brand tag on Open Food Facts
    if (!photoUrl && p.brand && p.brand.trim().length >= 2) {
      try {
        const brandProducts = await searchProductsByBrand(p.brand, 8);
        const targetWords = p.canonicalName.toLowerCase().split(/\s+/);

        for (const bp of brandProducts) {
          const bpImg = bp.image_front_url || bp.image_url;
          if (!bpImg || !bpImg.startsWith('http')) continue;

          const bpName = (bp.product_name_sk || bp.product_name || '').toLowerCase();
          const matchCount = targetWords.filter(w => w.length > 3 && bpName.includes(w)).length;
          if (matchCount >= 1) {
            photoUrl = bpImg;
            thumbnailUrl = bp.image_front_small_url || bpImg;
            matchedBy = 'BRAND_TAG';
            offProductName = bp.product_name_sk || bp.product_name;
            console.log(`  ✓ Matched via brand "${p.brand}" keyword: ${bpImg}`);
            break;
          }
        }
      } catch {
        // ignore
      }
    }

    if (!photoUrl) {
      console.log(`  ℹ No real photograph found on Open Food Facts -> Will use clean neutral placeholder`);
    }

    resolutions.push({
      slug: p.slug,
      name: p.canonicalName,
      brand: p.brand,
      barcode: mappedBarcode || p.primaryEan,
      photoUrl,
      thumbnailUrl,
      matchedBy,
      offProductName
    });

    // Save to SQLite database cache and products table
    const updateProductStmt = db.prepare('UPDATE products SET image_url = ?, updated_at = ? WHERE slug = ?');
    updateProductStmt.run(photoUrl, new Date().toISOString(), p.slug);

    if (photoUrl) {
      const cacheStmt = db.prepare(`
        INSERT INTO open_food_facts_cache (
          query_key, query_type, barcode, product_name, brand,
          image_front_url, image_front_small_url, raw_payload, created_at, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(query_key) DO UPDATE SET
          image_front_url = excluded.image_front_url,
          image_front_small_url = excluded.image_front_small_url,
          expires_at = excluded.expires_at
      `);
      const now = new Date();
      const expires = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      cacheStmt.run(
        `slug:${p.slug}`,
        matchedBy,
        mappedBarcode || p.primaryEan,
        p.canonicalName,
        p.brand,
        photoUrl,
        thumbnailUrl,
        JSON.stringify({ offProductName }),
        now.toISOString(),
        expires.toISOString()
      );
    }

    // Be kind to Open Food Facts servers
    await new Promise(r => setTimeout(r, 150));
  }

  // Summary
  const matched = resolutions.filter(r => r.photoUrl);
  const unverified = resolutions.filter(r => !r.photoUrl);

  console.log('\n============================================================');
  console.log(`SYNCHRONIZATION COMPLETED:`);
  console.log(`✓ Real photographs retrieved from Open Food Facts: ${matched.length}/${SEED_PRODUCTS.length}`);
  console.log(`✓ Products with clean neutral placeholders (fresh/loose produce): ${unverified.length}/${SEED_PRODUCTS.length}`);
  console.log('============================================================');

  // Save manifest of resolutions
  const manifestPath = path.resolve(process.cwd(), 'data', 'open-food-facts-resolutions.json');
  fs.writeFileSync(manifestPath, JSON.stringify(resolutions, null, 2), 'utf-8');
  console.log(`Saved resolutions manifest to ${manifestPath}`);
}

syncCatalogPhotos().catch(err => {
  console.error('Error during Open Food Facts sync:', err);
  process.exit(1);
});
