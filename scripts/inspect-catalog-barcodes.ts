import { SEED_PRODUCTS } from '../src/lib/db/seed-data';

console.log('Total catalog products:', SEED_PRODUCTS.length);
for (let i = 0; i < SEED_PRODUCTS.length; i++) {
  const p = SEED_PRODUCTS[i];
  const offerBarcodes = p.offers.map(o => o.barcode).filter(Boolean);
  console.log(`${i + 1}. [${p.slug}]`);
  console.log(`   Canonical: "${p.canonicalName}" | Brand: "${p.brand}" | Package: ${p.packageQuantity} ${p.packageUnit}`);
  console.log(`   Primary EAN: ${p.primaryEan} | Offer Barcodes: ${offerBarcodes.join(', ')}`);
}
