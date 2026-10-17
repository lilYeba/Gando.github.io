import * as fs from 'node:fs';

const items = JSON.parse(fs.readFileSync('data/full-40-products-inventory.json', 'utf-8'));
for (let i = 0; i < Math.min(20, items.length); i++) {
  const p = items[i];
  console.log(`${i + 1}. [${p.id}] ${p.name} (${p.brand || 'No brand'}) - ${p.size}`);
  console.log(`   Canonical: ${p.canonicalImg || 'NULL (placeholder)'}`);
  for (const l of p.listings) {
    console.log(`   - ${l.retailer}: ${l.title} => ${l.img || 'NULL'}`);
  }
}
