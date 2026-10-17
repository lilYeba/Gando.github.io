import fs from 'node:fs';
import path from 'node:path';

const manifestPath = path.resolve(process.cwd(), 'data', 'open-food-facts-resolutions.json');
const resolutions = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as Array<{
  slug: string;
  photoUrl: string | null;
}>;

const photoUrlMap = new Map<string, string | null>();
for (const r of resolutions) {
  photoUrlMap.set(r.slug, r.photoUrl);
}

// 1. Update seed-data.ts
const seedDataPath = path.resolve(process.cwd(), 'src/lib/db/seed-data.ts');
let seedContent = fs.readFileSync(seedDataPath, 'utf-8');

for (const [slug, photoUrl] of photoUrlMap.entries()) {
  const replacement = photoUrl ? `'${photoUrl}'` : 'null';
  const regex = new RegExp(`(slug:\\s*'${slug}',[\\s\\S]*?imageUrl:\\s*)([^,\\n]+)`, 'g');
  seedContent = seedContent.replace(regex, `$1${replacement}`);
}
fs.writeFileSync(seedDataPath, seedContent, 'utf-8');
console.log('Updated seed-data.ts with Open Food Facts photographs and null placeholders');

// 2. Update seed-data-extra.ts
const seedExtraPath = path.resolve(process.cwd(), 'src/lib/db/seed-data-extra.ts');
if (fs.existsSync(seedExtraPath)) {
  let extraContent = fs.readFileSync(seedExtraPath, 'utf-8');
  for (const [slug, photoUrl] of photoUrlMap.entries()) {
    const replacement = photoUrl ? `'${photoUrl}'` : 'null';
    const regex = new RegExp(`(slug:\\s*'${slug}',[\\s\\S]*?imageUrl:\\s*)([^,\\n]+)`, 'g');
    extraContent = extraContent.replace(regex, `$1${replacement}`);
  }
  fs.writeFileSync(seedExtraPath, extraContent, 'utf-8');
  console.log('Updated seed-data-extra.ts with Open Food Facts photographs and null placeholders');
}
