import { DatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';

const db = new DatabaseSync('data/pricetracker.sqlite');
const products = db.prepare('SELECT id, slug, canonical_name, brand, category_slug, package_quantity, package_unit, image_url FROM products ORDER BY id').all() as any[];

const identifiers = db.prepare('SELECT product_id, identifier_type, identifier_value FROM product_identifiers').all() as any[];
const listings = db.prepare('SELECT product_id, retailer_id, retailer_title, retailer_brand, image_url FROM retailer_product_listings').all() as any[];

const result = products.map((p) => {
  const pIds = identifiers.filter((i) => i.product_id === p.id);
  const pListings = listings.filter((l) => l.product_id === p.id);
  return {
    id: p.id,
    slug: p.slug,
    name: p.canonical_name,
    brand: p.brand,
    category: p.category_slug,
    size: `${p.package_quantity} ${p.package_unit}`,
    canonicalImg: p.image_url,
    eans: pIds.map((i) => `${i.identifier_type}:${i.identifier_value}`),
    listings: pListings.map((l) => ({
      retailer: l.retailer_id,
      title: l.retailer_title,
      brand: l.retailer_brand,
      img: l.image_url,
    })),
  };
});

fs.writeFileSync('data/full-40-products-inventory.json', JSON.stringify(result, null, 2), 'utf-8');
console.log(`Saved inventory of ${result.length} products to data/full-40-products-inventory.json`);
