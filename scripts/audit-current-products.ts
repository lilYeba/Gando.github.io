import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data/pricetracker.sqlite');
const products = db.prepare('SELECT id, slug, canonical_name, brand, package_quantity, package_unit, image_url FROM products ORDER BY id').all() as any[];

console.log('Total products:', products.length);
for (const p of products) {
  const listings = db.prepare('SELECT retailer_id, retailer_title, retailer_brand, image_url FROM retailer_product_listings WHERE product_id = ?').all(p.id) as any[];
  console.log('---');
  console.log(`ID: ${p.id} | Slug: ${p.slug}`);
  console.log(`Name: ${p.canonical_name} | Brand: ${p.brand || 'none'} | Size: ${p.package_quantity} ${p.package_unit}`);
  console.log(`Canonical Img: ${p.image_url}`);
  for (const l of listings) {
    console.log(`  [${l.retailer_id}] ${l.retailer_title} -> ${l.image_url}`);
  }
}
