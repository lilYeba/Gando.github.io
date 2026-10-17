import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data/pricetracker.sqlite');
const cats = db.prepare('SELECT category_slug, category_name, count(*) as count FROM products GROUP BY category_slug').all();
console.log('Categories in DB:');
console.table(cats);
