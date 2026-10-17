import * as fs from 'node:fs';

const buf = fs.readFileSync('public/images/brand/logo.png');
console.log('Logo file size:', buf.length, 'bytes');

// Check dimensions if JPEG/PNG header is present
if (buf[0] === 0xff && buf[1] === 0xd8) {
  console.log('JPEG format detected');
} else if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
  console.log('PNG format detected');
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  console.log(`Resolution: ${width}x${height}`);
} else {
  console.log('Format:', buf.slice(0, 8));
}
