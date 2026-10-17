import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import {
  initImageRegistryTable,
  registerProductImage,
  ProductImageRegistryEntry,
} from '../src/lib/services/image-registry';

const dbPath = path.join(process.cwd(), 'data', 'pricetracker.sqlite');
const db = new DatabaseSync(dbPath);

console.log('================================================================');
console.log('PRICE TRACKER SK — POPULATING CENTRALIZED IMAGE REGISTRY');
console.log('================================================================');

initImageRegistryTable();

// Load downloaded registry mappings
const downloadedPath = path.join(process.cwd(), 'data', 'verified-downloaded-registry.json');
let downloadedRegistry: Record<string, {
  localPath: string;
  originalUrl: string;
  source: string;
  attribution: string;
  sizeBytes: number;
}> = {};

if (fs.existsSync(downloadedPath)) {
  downloadedRegistry = JSON.parse(fs.readFileSync(downloadedPath, 'utf-8'));
}

// Fetch all 311 canonical products
const products = db.prepare(`
  SELECT 
    p.id,
    p.canonical_name AS canonicalName,
    p.brand,
    p.package_quantity AS packageQuantity,
    p.package_unit AS packageUnit,
    p.image_url AS currentImageUrl,
    (SELECT identifier_value FROM product_identifiers WHERE product_id = p.id AND identifier_type = 'EAN13' LIMIT 1) AS barcode
  FROM products p
  ORDER BY p.id
`).all() as any[];

console.log(`Auditing and registering images for all ${products.length} canonical products...`);

let verifiedCount = 0;
let placeholderCount = 0;

const updateProductStmt = db.prepare('UPDATE products SET image_url = ? WHERE id = ?');
const updateListingStmt = db.prepare('UPDATE retailer_product_listings SET image_url = ? WHERE product_id = ?');

const now = new Date().toISOString();

for (const p of products) {
  const verified = downloadedRegistry[p.id];

  let finalImageUrl: string | null = null;
  let localImagePath: string | null = null;
  let originalSourceUrl: string | null = null;
  let sourceWebsite: 'open_food_facts' | 'lidl.sk' | 'lidl.com' | 'tesco.sk' | 'billa.sk' | 'none' = 'none';
  let verificationStatus: 'VERIFIED_GENUINE_PHOTO' | 'VERIFIED_OFFICIAL_CATALOG' | 'NEUTRAL_PLACEHOLDER' = 'NEUTRAL_PLACEHOLDER';
  let attribution: string | null = null;

  if (verified && fs.existsSync(path.join(process.cwd(), 'public', verified.localPath.replace(/^\//, '')))) {
    finalImageUrl = verified.localPath;
    localImagePath = verified.localPath;
    originalSourceUrl = verified.originalUrl;
    sourceWebsite = verified.source as any;
    verificationStatus = (verified.source.includes('lidl') || verified.source.includes('tesco') || verified.source.includes('billa'))
      ? 'VERIFIED_OFFICIAL_CATALOG'
      : 'VERIFIED_GENUINE_PHOTO';
    attribution = verified.attribution;
    verifiedCount++;
  } else {
    // Missing or unverified -> Clean neutral placeholder
    finalImageUrl = null;
    localImagePath = null;
    originalSourceUrl = null;
    sourceWebsite = 'none';
    verificationStatus = 'NEUTRAL_PLACEHOLDER';
    attribution = null;
    placeholderCount++;
  }

  // 1. Update Central Registry
  registerProductImage({
    productId: p.id,
    productName: p.canonicalName,
    brand: p.brand,
    packageSize: `${p.packageQuantity} ${p.packageUnit}`,
    barcode: p.barcode,
    imageUrl: finalImageUrl,
    localImagePath,
    originalSourceUrl,
    sourceWebsite,
    verificationStatus,
    lastCheckedAt: now,
    attribution,
    isReusedAcrossRetailers: true,
  });

  // 2. Update canonical product table
  updateProductStmt.run(finalImageUrl, p.id);

  // 3. Update ALL retailer product listings for this product to guarantee identical images across Lidl, Tesco, and BILLA!
  updateListingStmt.run(finalImageUrl, p.id);
}

// Ensure also image-verifier table is in sync
const regEntries = db.prepare('SELECT * FROM product_image_registry').all() as any[];
const insertVerif = db.prepare(`
  INSERT INTO product_image_verifications (
    id, target_type, target_id, barcode, product_name, brand,
    package_size, store_slug, image_url, image_source,
    verification_status, verification_notes, verified_at
  ) VALUES (?, 'PRODUCT', ?, ?, ?, ?, ?, 'canonical', ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    image_url = excluded.image_url,
    image_source = excluded.image_source,
    verification_status = excluded.verification_status,
    verification_notes = excluded.verification_notes,
    verified_at = excluded.verified_at
`);

for (const r of regEntries) {
  insertVerif.run(
    `verif-canonical-${r.product_id}`,
    r.product_id,
    r.barcode,
    r.product_name,
    r.brand,
    r.package_size,
    r.image_url,
    r.source_website,
    r.verification_status === 'NEUTRAL_PLACEHOLDER' ? 'UNVERIFIED_PLACEHOLDER' : r.verification_status,
    r.verification_status === 'NEUTRAL_PLACEHOLDER'
      ? 'Clean neutral placeholder. Sold loose or unverified packaging.'
      : `Verified genuine product packaging photograph from ${r.source_website}.`,
    r.last_checked_at
  );
}

console.log('\n--- Registry Population Summary ---');
console.log(`✓ Total canonical products registered: ${products.length}`);
console.log(`✓ Verified genuine product photographs: ${verifiedCount}`);
console.log(`✓ Clean neutral placeholders (unverified/unpackaged): ${placeholderCount}`);
console.log(`✓ Retailer listings synchronized with canonical images: 100%`);
console.log('================================================================');
