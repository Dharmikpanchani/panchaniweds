const fs = require('fs');
const path = require('path');

const publicGalleryDir = path.join(__dirname, 'public', 'gallery');
const rootGalleryDir = path.join(__dirname, 'gallery');
const publicManifestPath = path.join(publicGalleryDir, 'manifest.json');
const rootManifestPath = path.join(rootGalleryDir, 'manifest.json');
const validExts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.avif', '.bmp']);

function updateManifest() {
  try {
    if (!fs.existsSync(publicGalleryDir)) {
      fs.mkdirSync(publicGalleryDir, { recursive: true });
    }
    if (!fs.existsSync(rootGalleryDir)) {
      fs.mkdirSync(rootGalleryDir, { recursive: true });
    }

    // Bi-directional sync between root gallery and public/gallery
    const rootFiles = fs.readdirSync(rootGalleryDir);
    for (const f of rootFiles) {
      if (validExts.has(path.extname(f).toLowerCase())) {
        const src = path.join(rootGalleryDir, f);
        const dest = path.join(publicGalleryDir, f);
        if (!fs.existsSync(dest)) {
          fs.copyFileSync(src, dest);
          console.log(`[Gallery Auto-Sync] Synced to public: ${f}`);
        }
      }
    }

    const publicFiles = fs.readdirSync(publicGalleryDir);
    for (const f of publicFiles) {
      if (validExts.has(path.extname(f).toLowerCase())) {
        const src = path.join(publicGalleryDir, f);
        const dest = path.join(rootGalleryDir, f);
        if (!fs.existsSync(dest)) {
          fs.copyFileSync(src, dest);
          console.log(`[Gallery Auto-Sync] Synced to root: ${f}`);
        }
      }
    }

    const files = fs.readdirSync(publicGalleryDir);
    const images = files
      .filter(f => validExts.has(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
      .map(f => `gallery/${f}`);

    const newContent = JSON.stringify(images, null, 2) + '\n';
    for (const mPath of [publicManifestPath, rootManifestPath]) {
      let oldContent = '';
      if (fs.existsSync(mPath)) {
        oldContent = fs.readFileSync(mPath, 'utf8');
      }
      if (oldContent !== newContent) {
        fs.writeFileSync(mPath, newContent, 'utf8');
        console.log(`[Gallery Auto-Sync] Updated ${path.basename(path.dirname(mPath))}/manifest.json with ${images.length} images.`);
      }
    }
    return images;
  } catch (err) {
    console.error('[Gallery Auto-Sync Error]', err.message);
    return [];
  }
}

// Initial sync
updateManifest();

// Watch both gallery directories for any changes
let timer = null;
function scheduleUpdate() {
  clearTimeout(timer);
  timer = setTimeout(updateManifest, 100);
}

for (const dir of [publicGalleryDir, rootGalleryDir]) {
  if (fs.existsSync(dir)) {
    try {
      fs.watch(dir, (eventType, filename) => {
        if (!filename || filename === 'manifest.json' || filename.startsWith('.')) return;
        scheduleUpdate();
      });
      console.log(`[Gallery Auto-Sync] Live watcher active on ${path.relative(__dirname, dir)}`);
    } catch (err) {
      console.warn('[Gallery Watch Warning]', err.message);
    }
  }
}

module.exports = { updateManifest };

if (require.main === module) {
  console.log('Gallery Watcher running in standalone mode.');
}
