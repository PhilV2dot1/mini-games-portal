/**
 * Icon Conversion Script
 * Converts SVG icons to PNG format
 *
 * Requirements:
 * npm install sharp
 *
 * Usage:
 * node scripts/convert-icons.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
  console.log('✓ Sharp library found');
} catch (e) {
  console.error('✗ Sharp library not found');
  console.error('Please install it with: npm install sharp');
  console.error('\nAlternatively, use one of the online converters mentioned in ICONS_CONVERSION.md');
  process.exit(1);
}

const ICON_SIZE = 512;
const ICONS_DIR = path.join(__dirname, '../public/icons');

const iconsToConvert = [
  {
    input: 'snake-improved.svg',
    output: 'snake.png',
    name: 'Snake'
  },
  {
    input: 'connectfive-improved.svg',
    output: 'connectfive.png',
    name: 'Connect 4'
  }
];

async function convertIcon(inputFile, outputFile, name) {
  const inputPath = path.join(ICONS_DIR, inputFile);
  const outputPath = path.join(ICONS_DIR, outputFile);

  if (!fs.existsSync(inputPath)) {
    console.error(`✗ Input file not found: ${inputFile}`);
    return false;
  }

  try {
    console.log(`Converting ${name}...`);

    await sharp(inputPath)
      .resize(ICON_SIZE, ICON_SIZE, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({
        quality: 100,
        compressionLevel: 9,
        palette: false
      })
      .toFile(outputPath);

    // Verify output
    const stats = fs.statSync(outputPath);
    console.log(`✓ ${name} converted successfully`);
    console.log(`  Output: ${outputFile}`);
    console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);

    return true;
  } catch (error) {
    console.error(`✗ Error converting ${name}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('SVG to PNG Icon Converter');
  console.log('='.repeat(50));
  console.log('');

  let successCount = 0;
  let failCount = 0;

  for (const icon of iconsToConvert) {
    const success = await convertIcon(icon.input, icon.output, icon.name);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    console.log('');
  }

  console.log('='.repeat(50));
  console.log(`Conversion complete: ${successCount} successful, ${failCount} failed`);
  console.log('='.repeat(50));

  if (successCount > 0) {
    console.log('');
    console.log('Next steps:');
    console.log('1. Verify the PNG files in public/icons/');
    console.log('2. Update lib/types/games.ts to use .png instead of .svg');
    console.log('3. Remove old SVG files if desired');
    console.log('4. Test the application: npm run dev');
  }
}

main().catch(console.error);
