import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const galleryDir = path.join(process.cwd(), 'public', 'gallery');
    const manifestPath = path.join(galleryDir, 'manifest.json');

    if (!fs.existsSync(galleryDir)) {
      fs.mkdirSync(galleryDir, { recursive: true });
      return NextResponse.json({ images: [] });
    }

    const validExts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.avif', '.bmp']);
    const files = fs.readdirSync(galleryDir);

    // Natural sort so photo1, photo2, photo10 sort logically
    const images = files
      .filter((file) => validExts.has(path.extname(file).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
      .map((file) => `/gallery/${file}`);

    // Keep manifest.json automatically synchronized
    try {
      const newManifest = JSON.stringify(images, null, 2) + '\n';
      let oldManifest = '';
      if (fs.existsSync(manifestPath)) {
        oldManifest = fs.readFileSync(manifestPath, 'utf8');
      }
      if (oldManifest !== newManifest) {
        fs.writeFileSync(manifestPath, newManifest, 'utf8');
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
