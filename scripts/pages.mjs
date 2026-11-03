// Runs after `vite build`. Two jobs on dist/:
//
// 1. Content Security Policy. Adds a <meta http-equiv="Content-Security-Policy"> to index.html, with the
//    sha256 of every inline script as built, so the hash can never go stale when index.html changes.
//    (GitHub Pages can't send headers, so frame-ancestors and report-uri aren't available.)
//
// 2. A static HTML file per route, so every page loads with a 200 instead of the 404.html fallback, and
//    link previews and the tab show that page's own title and description before the app runs.
//    GitHub Pages serves /work/ozone from work/ozone.html, so URLs stay as they are (no trailing slash).
//    Titles and descriptions mirror each page's useDocumentMeta() call: keep them in sync.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectEntries } from '../src/content/projects.ts';
import { site } from '../src/content/site.ts';

const dist = (path) => fileURLToPath(new URL(`../dist/${path}`, import.meta.url));
const ORIGIN = 'https://aronzero.github.io';
const DEFAULT_TITLE = `${site.name} — UI/UX Designer & Front-end Developer`;

let html = readFileSync(dist('index.html'), 'utf8');

// ---------- 1. CSP ----------
// Browsers hash the script after HTML's input normalisation (CRLF and CR become LF), so hash the same text:
// a Windows checkout has CRLF line endings, a Linux CI checkout may not.
const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1].replace(/\r\n?/g, '\n'));
const hashes = inline.map((code) => `'sha256-${createHash('sha256').update(code, 'utf8').digest('base64')}'`);
const csp = [
  "default-src 'self'",
  `script-src 'self' ${hashes.join(' ')}`,
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'", // fetch: the 3D studio's GLB files
  "media-src 'self'",
  "frame-src 'self'", // the PICO-8 game player
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  'upgrade-insecure-requests',
].join('; ');
if (html.includes('http-equiv="Content-Security-Policy"')) throw new Error('index.html already has a CSP');
// Straight after <meta charset>, before anything it has to govern.
html = html.replace(/(<meta charset="[^"]*"\s*\/?>)/i, `$1\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`);
writeFileSync(dist('index.html'), html);

// ---------- 2. One HTML file per route ----------
const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pageTitle = (title) => (title ? `${title} — ${site.name}` : DEFAULT_TITLE);

function withMeta(path, title, description) {
  const t = escape(pageTitle(title));
  let out = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${t}</title>`)
    .replace(/(<meta property="og:title" content=")[^"]*/, `$1${t}`)
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${ORIGIN}${path}`);
  if (description) {
    const d = escape(description);
    out = out
      .replace(/(<meta name="description" content=")[^"]*/, `$1${d}`)
      .replace(/(<meta property="og:description" content=")[^"]*/, `$1${d}`);
  }
  return out;
}

const routes = [
  { path: '/editorial', title: null, description: `Portfolio of ${site.name}, a UI/UX designer specialising in front-end development, with a background in graphic design.` },
  { path: '/interactive', title: 'Interactive studio', description: `${site.name}’s portfolio as a 3D studio: each object in the room opens part of the work.` },
  { path: '/work', title: 'Work', description: `Index of work by ${site.name}: web design, UI/UX and front-end projects.` },
  ...projectEntries.map((p) => ({ path: `/work/${p.slug}`, title: p.title, description: p.description })),
  ...projectEntries
    .filter((p) => p.kind === 'game' && p.embedPath)
    .map((p) => ({ path: `/play/${p.slug}`, title: `Play ${p.title}`, description: p.description })),
];

for (const route of routes) {
  const file = dist(`${route.path.slice(1)}.html`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, withMeta(route.path, route.title, route.description));
}

console.log(`[pages] CSP with ${hashes.length} inline-script hash(es); ${routes.length} route pages written`);
