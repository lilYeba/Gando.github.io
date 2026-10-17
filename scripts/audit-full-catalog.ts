import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data/pricetracker.sqlite');

const products = db.prepare(`
  SELECT 
    p.id, 
    p.slug, 
    p.canonical_name as canonicalName, 
    p.brand, 
    p.category_slug as categorySlug, 
    p.category_name as categoryName,
    p.package_quantity as packageQuantity, 
    p.package_unit as packageUnit, 
    p.image_url as canonicalImageUrl,
    (SELECT identifier_value FROM product_identifiers WHERE product_id = p.id AND identifier_type IN ('EAN13', 'EAN8') LIMIT 1) as ean
  FROM products p 
  ORDER BY p.id
`).all() as any[];

const fullReport = products.map((p) => {
  const listings = db.prepare(`
    SELECT r.slug as retailerSlug, r.name as retailerName, l.id as listingId, l.external_id as externalId, l.retailer_title as retailerTitle, l.retailer_brand as retailerBrand, l.package_label as packageLabel, l.image_url as imageUrl
    FROM retailer_product_listings l
    JOIN retailers r ON r.id = l.retailer_id
    WHERE l.product_id = ?
    ORDER BY r.slug
  `).all(p.id) as any[];

  return {
    ...p,
    listings,
  };
});

fs.writeFileSync(path.join(process.cwd(), 'data', 'catalog-audit-report.json'), JSON.stringify(fullReport, null, 2), 'utf-8');
console.log(`Saved full report for ${fullReport.length} products to data/catalog-audit-report.json`);
