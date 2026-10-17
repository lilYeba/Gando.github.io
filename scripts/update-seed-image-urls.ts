import fs from 'fs';
import path from 'path';

const seedFile = path.resolve(process.cwd(), 'src/lib/db/seed-data.ts');
let content = fs.readFileSync(seedFile, 'utf8');

// Match each product block:
// id: 'prod-...',
// slug: '...'
// ...
// imageUrl: null
content = content.replace(/(slug:\s*'([^']+)',[\s\S]*?imageUrl:\s*)(null|'[^']*')/g, (match, prefix, slug) => {
  return `${prefix}'/images/products/${slug}.svg'`;
});

fs.writeFileSync(seedFile, content, 'utf8');
console.log('Successfully updated seed-data.ts image URLs!');
