// Card Image Downloader v1.0.0
// Downloads card images from Vale of Eternity Wiki

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('[download-card-images] v1.0.0 loaded');

const BASE_URL = 'https://valeofeternity.wiki.gg';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'cards');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Card image mappings (20 MVP cards)
const CARD_IMAGES = [
  // Fire Family
  { id: 'HESTIA', filename: 'hestia.png', url: '/images/thumb/Hestia.png/200px-Hestia.png?298f41' },
  { id: 'IMP', filename: 'imp.png', url: '/images/thumb/Imp.png/200px-Imp.png?696f29' },
  { id: 'FIREFOX', filename: 'firefox.png', url: '/images/thumb/Firefox.png/200px-Firefox.png?2590f9' },
  { id: 'SALAMANDER', filename: 'salamander.png', url: '/images/thumb/Salamander.png/200px-Salamander.png?560257' },

  // Water Family
  { id: 'KAPPA', filename: 'kappa.png', url: '/images/thumb/Kappa.png/200px-Kappa.png?36a54c' },
  { id: 'YUKI_ONNA', filename: 'yuki_onna.png', url: '/images/thumb/Yukionna.png/200px-Yukionna.png?ece352' },
  { id: 'UNDINE', filename: 'undine.png', url: '/images/thumb/Undine.png/200px-Undine.png?5551f2' },
  { id: 'SEA_SPIRIT', filename: 'sea_spirit.png', url: '/images/thumb/Seaspirit.png/200px-Seaspirit.png?45bd91' },

  // Earth Family
  { id: 'YOUNG_FOREST_SPIRIT', filename: 'young_forest_spirit.png', url: '/images/thumb/Youngforestspirit.png/200px-Youngforestspirit.png?222750' },
  { id: 'GOBLIN', filename: 'goblin.png', url: '/images/thumb/Goblin.png/200px-Goblin.png?9be081' },
  { id: 'FOREST_SPIRIT', filename: 'forest_spirit.png', url: '/images/thumb/Forestspirit.png/200px-Forestspirit.png?7ffc6d' },
  { id: 'GARGOYLE', filename: 'gargoyle.png', url: '/images/thumb/Gargoyle.png/200px-Gargoyle.png?21f800' },

  // Wind Family
  { id: 'HARPY', filename: 'harpy.png', url: '/images/thumb/Harpy.png/200px-Harpy.png?8e2fea' },
  { id: 'PEGASUS', filename: 'pegasus.png', url: '/images/thumb/Pegasus.png/200px-Pegasus.png?e64a15' },
  { id: 'SYLPH', filename: 'sylph.png', url: '/images/thumb/Sylph.png/200px-Sylph.png?5ccd39' },
  { id: 'TENGU', filename: 'tengu.png', url: '/images/thumb/Tengu.png/200px-Tengu.png?386057' },

  // Dragon Family
  { id: 'DRAGON_EGG', filename: 'dragon_egg.png', url: '/images/thumb/Dragonegg.png/200px-Dragonegg.png?c09608' },
  { id: 'EMBER_DRAGON', filename: 'ember_dragon.png', url: '/images/thumb/Ember.png/200px-Ember.png?321abf' },
  { id: 'TIDAL_DRAGON', filename: 'tidal_dragon.png', url: '/images/thumb/Tidal.png/200px-Tidal.png?bb5925' },
  { id: 'BOULDER_DRAGON', filename: 'boulder_dragon.png', url: '/images/thumb/Boulder.png/200px-Boulder.png?81fe5f' },
];

/**
 * Download a single image
 */
function downloadImage(card) {
  return new Promise((resolve, reject) => {
    const fullUrl = BASE_URL + card.url;
    const outputPath = path.join(OUTPUT_DIR, card.filename);

    console.log(`Downloading ${card.id}...`);

    const file = fs.createWriteStream(outputPath);

    https.get(fullUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${card.id}: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`✓ ${card.id} saved to ${card.filename}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

/**
 * Download all images sequentially
 */
async function downloadAllImages() {
  console.log(`Downloading ${CARD_IMAGES.length} card images...`);
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const card of CARD_IMAGES) {
    try {
      await downloadImage(card);
      successCount++;
    } catch (error) {
      console.error(`✗ Failed to download ${card.id}:`, error.message);
      failCount++;
    }
  }

  console.log(`\n=== Download Complete ===`);
  console.log(`✓ Success: ${successCount}`);
  console.log(`✗ Failed: ${failCount}`);
  console.log(`Total: ${CARD_IMAGES.length}`);
}

// Run the download
downloadAllImages().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
