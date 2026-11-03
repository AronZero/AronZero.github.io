// Writes src/generated/images/<slug>/…: the web copies of every project image, which are what the site
// ships. The originals in src/content/projects/ stay the editable source and are never bundled.
//   hero.* and gallery/*  → WebP, quality 85 (screenshots: ~85–90% smaller than PNG)
//   small sources (< 640 px wide, the pixel-art game stills) → lossless WebP, so pixels stay exact
//   gallery/*.gif → gallery/animated/<name>.webp, lossless animated WebP (~70% smaller than GIF)
//   SVG, or a source that WebP wouldn't shrink → copied as-is
// Runs before `npm run dev` and `npm run build`; output is gitignored. Only redoes an image when its source
// is newer, and removes copies whose source is gone.
import { copyFileSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const projectsDir = fileURLToPath(new URL('../src/content/projects/', import.meta.url));
const outDir = fileURLToPath(new URL('../src/generated/images/', import.meta.url));
const RASTER = /\.(png|jpe?g|webp|avif)$/i;
const PIXEL_ART_WIDTH = 640;

const mtime = (path) => {
  try { return statSync(path).mtimeMs; } catch { return 0; }
};

/** Every source image: [absolute source path, path relative to the projects folder]. */
function sources() {
  const list = [];
  for (const slug of readdirSync(projectsDir, { withFileTypes: true })) {
    if (!slug.isDirectory()) continue;
    const dir = join(projectsDir, slug.name);
    for (const file of readdirSync(dir)) if (/^hero\./i.test(file)) list.push(join(dir, file));
    const gallery = join(dir, 'gallery');
    try {
      for (const file of readdirSync(gallery)) list.push(join(gallery, file));
    } catch { /* no gallery */ }
  }
  return list.filter((p) => RASTER.test(p) || /\.(gif|svg)$/i.test(p)).map((p) => [p, relative(projectsDir, p)]);
}

const written = new Set();
let made = 0;
let before = 0;
let after = 0;

for (const [src, rel] of sources()) {
  const ext = extname(rel).toLowerCase();
  const base = rel.slice(0, -ext.length);
  let out;
  if (ext === '.gif') out = join(outDir, dirname(rel), 'animated', `${base.split(/[\\/]/).pop()}.webp`);
  else if (ext === '.svg') out = join(outDir, rel);
  else out = join(outDir, `${base}.webp`);

  // A copy kept as-is (WebP didn't help) has the source's extension instead.
  const kept = join(outDir, rel);
  if (ext !== '.svg' && ext !== '.gif' && mtime(kept) >= mtime(src)) out = kept;

  if (mtime(out) < mtime(src)) {
    mkdirSync(dirname(out), { recursive: true });
    if (ext === '.svg') {
      copyFileSync(src, out);
    } else if (ext === '.gif') {
      await sharp(src, { animated: true }).webp({ lossless: true, effort: 4 }).toFile(out);
    } else {
      const { width = 0 } = await sharp(src).metadata();
      const webp = width < PIXEL_ART_WIDTH
        ? sharp(src).webp({ lossless: true, effort: 6 })
        : sharp(src).webp({ quality: 85, smartSubsample: true, effort: 6 });
      const buffer = await webp.toBuffer();
      if (buffer.length < statSync(src).size) {
        writeFileSync(out, buffer);
      } else {
        out = kept;
        copyFileSync(src, out);
      }
    }
    made++;
  }
  written.add(out);
  before += statSync(src).size;
  after += statSync(out).size;
}

// Remove copies whose source was deleted or renamed.
(function prune(dir) {
  let entries = [];
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) prune(path);
    else if (!written.has(path)) rmSync(path);
  }
})(outDir);

const mb = (n) => (n / 1048576).toFixed(1);
console.log(`[images] ${written.size} project images (${made} regenerated): ${mb(before)} MB of sources → ${mb(after)} MB shipped`);
