// Writes src/generated/thumbs/<slug>.webp: a small copy of each project's hero image for the
// hero wall (120 × 70 tiles, so 240 × 140 covers 2× screens). The full hero PNGs are ~0.5–1 MB
// each; these are a few KB. Runs before `npm run dev` and `npm run build`; output is gitignored.
// Only regenerates a thumb when its hero is newer, and removes thumbs for deleted projects.
import { mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const WIDTH = 240;
const HEIGHT = 140;
const HERO = /^hero\.(png|jpe?g|webp|avif)$/i; // SVG heroes scale on their own; no thumb needed

const projectsDir = new URL('../src/content/projects/', import.meta.url);
const outDir = new URL('../src/generated/thumbs/', import.meta.url);
mkdirSync(outDir, { recursive: true });

const mtime = (url) => {
  try { return statSync(url).mtimeMs; } catch { return 0; }
};

const slugs = new Set();
let made = 0;

for (const entry of readdirSync(projectsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const slug = entry.name;
  const heroName = readdirSync(new URL(`${slug}/`, projectsDir)).find((f) => HERO.test(f));
  if (!heroName) continue;
  slugs.add(slug);

  const src = new URL(`${slug}/${heroName}`, projectsDir);
  const out = new URL(`${slug}.webp`, outDir);
  if (mtime(out) >= mtime(src)) continue;

  const image = sharp(fileURLToPath(src));
  const { width = 0, height = 0 } = await image.metadata();
  // Small sources are pixel art (game heroes): keep hard edges and crop from the centre.
  // Screenshots crop from the top, where the page header and hero section are.
  const pixel = width < WIDTH || height < HEIGHT;
  await image
    .resize(WIDTH, HEIGHT, { fit: 'cover', position: pixel ? 'centre' : 'top', kernel: pixel ? 'nearest' : 'lanczos3' })
    .webp({ quality: pixel ? 90 : 72, effort: 6 })
    .toFile(fileURLToPath(out));
  made++;
}

for (const file of readdirSync(outDir)) {
  if (!slugs.has(file.replace(/\.webp$/, ''))) rmSync(new URL(file, outDir));
}

console.log(`[thumbs] ${slugs.size} project thumbnails (${made} regenerated)`);
