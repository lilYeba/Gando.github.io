import * as fs from 'node:fs';

const src = 'C:/Users/semen/.gemini/antigravity/brain/ab16aba3-3636-4bd2-b6c1-b6e3c6cee7ed/.user_uploaded/media_1792182154206_7ec84153.jpg';
console.log('Source exists:', fs.existsSync(src));

if (fs.existsSync(src)) {
  fs.mkdirSync('public/images/brand', { recursive: true });
  fs.copyFileSync(src, 'public/images/brand/logo.jpg');
  fs.copyFileSync(src, 'public/images/brand/logo.png');
  fs.copyFileSync(src, 'public/logo.png');
  fs.copyFileSync(src, 'public/icon.png');
  fs.copyFileSync(src, 'public/favicon.ico');
  console.log('Successfully copied logo to public/images/brand/ and public/ root');
} else {
  console.error('Source file not found at:', src);
}
