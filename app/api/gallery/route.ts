import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const publicGalleryDir = path.join(process.cwd(), 'public', 'gallery');
    const rootGalleryDir = path.join(process.cwd(), 'gallery');
    const publicManifestPath = path.join(publicGalleryDir, 'manifest.json');
    const rootManifestPath = path.join(rootGalleryDir, 'manifest.json');

    if (!fs.existsSync(publicGalleryDir)) {
      fs.mkdirSync(publicGalleryDir, { recursive: true });
    }
    if (!fs.existsSync(rootGalleryDir)) {
      fs.mkdirSync(rootGalleryDir, { recursive: true });
    }

    const validExts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.avif', '.bmp']);

    // Bi-directional synchronization between root gallery and public/gallery
    try {
      const rootFiles = fs.readdirSync(rootGalleryDir);
      for (const f of rootFiles) {
        if (validExts.has(path.extname(f).toLowerCase())) {
          const src = path.join(rootGalleryDir, f);
          const dest = path.join(publicGalleryDir, f);
          if (!fs.existsSync(dest)) {
            fs.copyFileSync(src, dest);
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
          }
        }
      }
    } catch (_) {}

    const files = fs.readdirSync(publicGalleryDir);

    // Natural sort so photo1, photo2, photo10 sort logically
    const images = files
      .filter((file) => validExts.has(path.extname(file).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
      .map((file) => `gallery/${file}`);

    // Keep both manifest.json files automatically synchronized
    try {
      const newManifest = JSON.stringify(images, null, 2) + '\n';
      for (const mPath of [publicManifestPath, rootManifestPath]) {
        let oldManifest = '';
        if (fs.existsSync(mPath)) {
          oldManifest = fs.readFileSync(mPath, 'utf8');
        }
        if (oldManifest !== newManifest) {
          fs.writeFileSync(mPath, newManifest, 'utf8');
        }
      }
    } catch (_) {}

    return NextResponse.json(
      { images },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('Failed to read gallery folder:', error);
    return NextResponse.json({ images: [] }, { status: 500 });
  }
}
