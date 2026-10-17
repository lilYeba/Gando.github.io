import {
  getDatabase,
  getAllProducts,
  getRetailers,
  getDataSources,
  getShoppingLists,
} from '../src/lib/db/repository';

console.log('--------------------------------------------------');
console.log('PRICE TRACKER SK — DATABASE INITIALIZATION TOOL');
console.log('--------------------------------------------------');

try {
  const db = getDatabase();
  console.log('✓ SQLite database connected and verified.');

  const retailers = getRetailers();
  console.log(`✓ Retailers loaded: ${retailers.length} (${retailers.map((r) => r.name).join(', ')})`);

  const sources = getDataSources();
  console.log(`✓ Data sources registered: ${sources.length}`);

  const products = getAllProducts();
  console.log(`✓ Seeded products in catalog: ${products.length}`);

  const lists = getShoppingLists();
  console.log(`✓ Initial shopping lists: ${lists.length} (${lists.map((l) => l.name).join(', ')})`);

  const obsCount = (db.prepare('SELECT COUNT(*) AS cnt FROM price_observations').get() as { cnt: number }).cnt;
  console.log(`✓ Historical price observations: ${obsCount}`);

  const promoCount = (db.prepare('SELECT COUNT(*) AS cnt FROM promotions').get() as { cnt: number }).cnt;
  console.log(`✓ Verified leaflet promotions: ${promoCount}`);

  console.log('--------------------------------------------------');
  console.log('SUCCESS: Database is ready for Price Tracker SK.');
  console.log('--------------------------------------------------');
} catch (err) {
  console.error('ERROR initializing database:', err);
  process.exit(1);
}
