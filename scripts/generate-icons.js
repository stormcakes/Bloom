#!/usr/bin/env node
// Generates solid-color placeholder PNG icons for PWA manifest and iOS App Store.
// Replace with real branded artwork before submitting to the App Store.
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPNG(width, height, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; ihdrData[9] = 2; // 8-bit RGB
  const rawData = Buffer.alloc(height * (width * 3 + 1));
  for (let y = 0; y < height; y++) {
    rawData[y * (width * 3 + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const o = y * (width * 3 + 1) + 1 + x * 3;
      rawData[o] = r; rawData[o + 1] = g; rawData[o + 2] = b;
    }
  }
  const compressed = zlib.deflateSync(rawData, { level: 9 });
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdrData),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

// Bloom pink: #F472A0 = rgb(244, 114, 160)
const [r, g, b] = [244, 114, 160];

// PWA icons
const pwaDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(pwaDir, { recursive: true });
fs.writeFileSync(path.join(pwaDir, 'icon-192.png'), createPNG(192, 192, r, g, b));
fs.writeFileSync(path.join(pwaDir, 'icon-512.png'), createPNG(512, 512, r, g, b));
console.log('✓ PWA icons → public/icons/');

// iOS App Icon (1024x1024 for Xcode universal icon)
const iosIconDir = path.join(__dirname, '..', 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
fs.mkdirSync(iosIconDir, { recursive: true });
fs.writeFileSync(path.join(iosIconDir, 'AppIcon-512@2x.png'), createPNG(1024, 1024, r, g, b));
console.log('✓ iOS App Store icon → ios/App/App/Assets.xcassets/AppIcon.appiconset/');

// iOS splash screen (LaunchImage)
// Capacitor uses LaunchScreen.storyboard — set background via native project
console.log('\n⚠️  Replace placeholder icons with real artwork before App Store submission!');
