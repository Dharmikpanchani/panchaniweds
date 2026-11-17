const fs = require('fs');
const path = require('path');

const galleryDir = path.join(__dirname, 'public', 'gallery');
const manifestPath = path.join(galleryDir, 'manifest.json');
const validExts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.avif', '.bmp']);

function updateManifest() {
  try {
    if (!fs.existsSync(galleryDir)) {
      fs.mkdirSync(galleryDir, { recursive: true });
    }
    const files = fs.readdirSync(galleryDir);
    const images = files
      .filter(f => validExts.has(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
      .map(f => `/gallery/${f}`);

    const newContent = JSON.stringify(images, null, 2) + '\n';
    let oldContent = '';
    if (fs.existsSync(manifestPath)) {
      oldContent = fs.readFileSync(manifestPath, 'utf8');
    }
    if (oldContent !== newContent) {
      fs.writeFileSync(manifestPath, newContent, 'utf8');
      console.log(`[Gallery Auto-Sync] Updated manifest.json with ${images.length} images:`, images);
    }
    return images;
  } catch (err) {
    console.error('[Gallery Auto-Sync Error]', err.message);
    return [];
  }
}

// Initial sync
updateManifest();

// Watch gallery directory for any changes
let timer = null;
if (fs.existsSync(galleryDir)) {
  try {
    fs.watch(galleryDir, (eventType, filename) => {
      if (!filename || filename === 'manifest.json' || filename.startsWith('.')) return;
      clearTimeout(timer);
      timer = setTimeout(updateManifest, 80);
    });
    console.log('[Gallery Auto-Sync] Live watcher active on public/gallery');
  } catch (err) {
    console.warn('[Gallery Watch Warning]', err.message);
  }
}

module.exports = { updateManifest };

if (require.main === module) {
  console.log('Gallery Watcher running in standalone mode.');
}
