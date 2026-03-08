#!/usr/bin/env node
/**
 * PWA Icon Generator — Mini Games Portal
 * Design: fond sombre #111827, dégradé multi-chain, texte "MINI GAMES"
 * Run: node scripts/generate-icons.js
 */

const sharp = require('sharp');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'public');

// Chain colors: Celo yellow, Base blue, MegaETH pink, Soneium purple
function makeSVG(size, maskable = false) {
  const r = maskable ? 0 : Math.round(size * 0.18);
  const cx = size / 2;
  const cy = size / 2;
  const s = size / 512;

  // Gamepad body
  const gpW = Math.round(280 * s);
  const gpH = Math.round(180 * s);
  const gpX = cx - gpW / 2;
  const gpY = cy - gpH / 2 - Math.round(30 * s);
  const gpR = Math.round(50 * s);

  // D-pad
  const dpCx = cx - Math.round(85 * s);
  const dpCy = gpY + Math.round(90 * s);
  const dpW = Math.round(18 * s);
  const dpL = Math.round(50 * s);

  // Buttons
  const btnCx = cx + Math.round(85 * s);
  const btnCy = gpY + Math.round(90 * s);
  const btnR = Math.round(14 * s);

  // Text
  const fontSize = Math.round(52 * s);
  const subFontSize = Math.round(28 * s);
  const textY = cy + Math.round(110 * s);
  const subY = cy + Math.round(145 * s);

  // Gradient arc radius for the glow ring
  const ringR = Math.round(200 * s);
  const ringStroke = Math.round(14 * s);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <!-- Background gradient -->
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a2035;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0d1117;stop-opacity:1" />
    </linearGradient>
    <!-- Gamepad gradient -->
    <linearGradient id="gpad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2d3748;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a202c;stop-opacity:1" />
    </linearGradient>
    <!-- Multi-chain ring gradient -->
    <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   style="stop-color:#FCFF52;stop-opacity:1" />
      <stop offset="33%"  style="stop-color:#0052FF;stop-opacity:1" />
      <stop offset="66%"  style="stop-color:#FF8AA8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7B61FF;stop-opacity:1" />
    </linearGradient>
    <!-- Glow filter -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="${Math.round(6 * s)}" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="${Math.round(4 * s)}" stdDeviation="${Math.round(8 * s)}" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Background -->
  ${maskable
    ? `<rect width="${size}" height="${size}" fill="url(#bg)"/>`
    : `<rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="url(#bg)"/>`
  }

  <!-- Multi-chain glow ring -->
  <circle cx="${cx}" cy="${cy - Math.round(10 * s)}" r="${ringR}"
          fill="none" stroke="url(#ring)" stroke-width="${ringStroke}"
          stroke-dasharray="${Math.round(ringR * 0.6)} ${Math.round(ringR * 0.15)}"
          opacity="0.35" filter="url(#glow)"/>

  <!-- Chain color dots around ring -->
  <circle cx="${cx}" cy="${cy - Math.round(10 * s) - ringR}" r="${Math.round(8 * s)}" fill="#FCFF52" opacity="0.9"/>
  <circle cx="${cx + ringR}" cy="${cy - Math.round(10 * s)}" r="${Math.round(8 * s)}" fill="#0052FF" opacity="0.9"/>
  <circle cx="${cx}" cy="${cy - Math.round(10 * s) + ringR}" r="${Math.round(8 * s)}" fill="#FF8AA8" opacity="0.9"/>
  <circle cx="${cx - ringR}" cy="${cy - Math.round(10 * s)}" r="${Math.round(8 * s)}" fill="#7B61FF" opacity="0.9"/>

  <!-- Gamepad body -->
  <rect x="${gpX}" y="${gpY}" width="${gpW}" height="${gpH}" rx="${gpR}" ry="${gpR}"
        fill="url(#gpad)" filter="url(#shadow)" stroke="#374151" stroke-width="${Math.round(2 * s)}"/>

  <!-- Gamepad grips -->
  <ellipse cx="${gpX + Math.round(55 * s)}" cy="${gpY + gpH}" rx="${Math.round(38 * s)}" ry="${Math.round(22 * s)}" fill="#1a202c"/>
  <ellipse cx="${gpX + gpW - Math.round(55 * s)}" cy="${gpY + gpH}" rx="${Math.round(38 * s)}" ry="${Math.round(22 * s)}" fill="#1a202c"/>

  <!-- D-Pad vertical -->
  <rect x="${dpCx - dpW / 2}" y="${dpCy - dpL / 2}" width="${dpW}" height="${dpL}" rx="${Math.round(4 * s)}" fill="#FCFF52"/>
  <!-- D-Pad horizontal -->
  <rect x="${dpCx - dpL / 2}" y="${dpCy - dpW / 2}" width="${dpL}" height="${dpW}" rx="${Math.round(4 * s)}" fill="#FCFF52"/>

  <!-- Button A - Base blue -->
  <circle cx="${btnCx + Math.round(28 * s)}" cy="${btnCy}" r="${btnR}" fill="#0052FF"/>
  <!-- Button B - MegaETH pink -->
  <circle cx="${btnCx}" cy="${btnCy + Math.round(28 * s)}" r="${btnR}" fill="#FF8AA8"/>
  <!-- Button X - Soneium purple -->
  <circle cx="${btnCx}" cy="${btnCy - Math.round(28 * s)}" r="${btnR}" fill="#7B61FF"/>
  <!-- Button Y - Celo yellow -->
  <circle cx="${btnCx - Math.round(28 * s)}" cy="${btnCy}" r="${btnR}" fill="#FCFF52"/>

  <!-- Start/Select -->
  <rect x="${cx - Math.round(22 * s)}" y="${gpY + Math.round(75 * s)}" width="${Math.round(18 * s)}" height="${Math.round(10 * s)}" rx="${Math.round(5 * s)}" fill="#4B5563"/>
  <rect x="${cx + Math.round(4 * s)}" y="${gpY + Math.round(75 * s)}" width="${Math.round(18 * s)}" height="${Math.round(10 * s)}" rx="${Math.round(5 * s)}" fill="#4B5563"/>

  <!-- Text: MINI GAMES -->
  <text x="${cx}" y="${textY}" font-family="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
        font-size="${fontSize}" font-weight="900" fill="#FFFFFF" text-anchor="middle"
        letter-spacing="${Math.round(2 * s)}">MINI</text>
  <text x="${cx}" y="${subY}" font-family="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
        font-size="${subFontSize}" font-weight="700" fill="#9CA3AF" text-anchor="middle"
        letter-spacing="${Math.round(6 * s)}">GAMES</text>
</svg>`;
}

async function generateIcon(size, filename, maskable = false) {
  const svg = makeSVG(size, maskable);
  const outPath = path.join(OUT_DIR, filename);
  await sharp(Buffer.from(svg))
    .png({ quality: 100, compressionLevel: 6 })
    .toFile(outPath);
  console.log(`✅ ${filename} (${size}x${size})`);
}

async function main() {
  console.log('🎮 Generating Mini Games Portal PWA icons...\n');

  await generateIcon(512, 'icon-512.png', false);
  await generateIcon(192, 'icon-192.png', false);
  await generateIcon(512, 'icon-maskable-512.png', true);
  await generateIcon(192, 'icon-maskable-192.png', true);
  await generateIcon(180, 'apple-touch-icon.png', false);
  await generateIcon(32,  'favicon-32.png', false);

  console.log('\n✨ All icons generated in public/');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
