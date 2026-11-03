# Architecture

A static single-page app (React 19 + TypeScript + Vite) for GitHub Pages. There is no backend and no runtime data fetching: all content is bundled at build time.

## Data flow

```
src/content/projects.ts ──┐
src/content/projects/<slug>/hero.*, gallery/*  ──(import.meta.glob)──┐
                          ▼                                            ▼
                 src/content/index.ts  →  projects[] (number, hero, gallery, prev/next),
                                          featuredProjects, disciplinesInUse, getProject()
                          ▼
                 pages/* and components/* (read-only)
```

- `index.ts` validates at build/dev time (slug format, duplicates, missing hero, orphan image folders).
- `scripts/thumbs.mjs` (sharp, build-only) writes a 240 × 140 WebP of each hero to `src/generated/thumbs/` before every `dev` and `build`, plus a 1024 × 640 `-card.webp`; `index.ts` attaches them as `project.thumb` (hero wall) and `project.card` (selected-work cards on the selector). The folder is gitignored and rebuilt in CI. npm `pre*` hooks don't run under `ignore-scripts`, so the step is chained inside the `dev`/`build` scripts.
- `scripts/images.mjs` (sharp, build-only, same chaining) writes the **web copies the site ships** to `src/generated/images/<slug>/`, mirroring the content folders: WebP quality 85 for screenshots, lossless WebP for small pixel-art stills (< 640 px), lossless animated WebP for GIFs (in `gallery/animated/`), SVGs and anything WebP wouldn't shrink copied as-is. `index.ts` globs only these (keys mapped back to `./projects/…`), so the originals are never bundled: 29 MB of sources ship as 5.6 MB. Cached by modification time; stale copies are pruned. The first run takes ~20 s (also in CI).
- Image glob patterns must be **string literals** (a Vite requirement); a template string silently matches nothing.
- Every list, filter, number and next/previous link is derived; no component hard-codes a project.

## Routing

A small hand-written router in `src/router/` (no dependency):

| Path | Page |
|---|---|
| `/` | `ChoosePage`: the selector between the two experiences. Shown once per browser session, like the intro: a choice made this session (`ajc-experience` in `sessionStorage`) skips it before first paint (inline script in `index.html`); `/?choose` always shows it |
| `/editorial` | `HomePage` |
| `/work` and `/work?filter=<discipline>` | `WorkPage` (the filter lives in the URL, so it can be shared) |
| `/work/<slug>` | `ProjectPage` (case study) |
| `/play/<slug>` | `PlayPage` (games with an `embedPath` only; others 404) |
| `/interactive` | `StudioPage`: the 3D studio, lazy-loaded with Three.js (see [STUDIO-DIRECTION.md](STUDIO-DIRECTION.md)) |
| anything else | `NotFoundPage` |

**Game player** (`components/project/GamePlayer.tsx`): the stock PICO-8 export is loaded unmodified in a same-origin `<iframe>` (lazy, `inert` behind a poster). Pressing Start calls the shell's `p8_run_cart()` inside that click, so audio is allowed and the cartridge `.js` only downloads then. On load the player injects a small stylesheet into the shell (our background, no scrollbars, PICO-8's side buttons hidden in favour of our Mute / Full screen / Stop toolbar) and an Esc listener that hands focus back to the page. Stop remounts the iframe. On touch devices it sets `p8_touch_detected` so the shell shows its on-screen controls, and the stage turns portrait while running.

- `routes.ts` matches paths and holds the URL builders (`paths.work()`, `paths.project(slug)`, `paths.studio()`) and `saveExperience()`, called by every link that switches experience. Never hand-type paths.
- `Router.tsx` handles `pushState` navigation, a `<Link>` that keeps new-tab and middle-click working, scroll restoration on back/forward, hash scrolling (including across pages), and **View Transitions** between pages when motion is on.
- **Static page per route** (`scripts/pages.mjs`, after `vite build`): writes `editorial.html`, `interactive.html`, `work.html`, `work/<slug>.html` and `play/<slug>.html`, copies of `index.html` with that page's title, description, `og:title`, `og:description` and `og:url` (mirroring each page's `useDocumentMeta`; keep them in sync). Pages serves `/work/ozone` from `work/ozone.html` with a 200, so link previews show the right page and URLs keep no trailing slash. Unknown paths still get `404.html` (the app's not-found page), copied in the deploy workflow.
- **Content Security Policy**: the same script adds a `<meta http-equiv="Content-Security-Policy">` to every page, with the sha256 of the inline script **as built** (line endings normalised to LF, as browsers do before hashing), so editing `index.html` can't leave a stale hash. Policy: everything `'self'`; `img-src` also `data:` and `blob:`; no inline styles (`style-src 'self'`; React's `style={…}` uses the CSSOM, which CSP doesn't block); `object-src 'none'`, `form-action 'none'`, `base-uri 'self'`. The PICO-8 player is a same-origin iframe with its own document, outside the parent policy. Not possible from a meta tag: `frame-ancestors`, reporting. Dev (`npm run dev`) has no CSP.

## Rendering structure

```
App
├─ Intro                (first-entry logo intro; renders nothing unless html[data-intro="play"])
└─ Shell
    ├─ selector or studio: main → Page only (full screen, their own UI)
    └─ editorial pages:
        ├─ SiteHeader           (nav, theme toggle, résumé, mobile Index <dialog>)
        ├─ main → Page          (switch on route)
        │   └─ DepthGauge       (per page: the layers that page actually has, numbered in order)
        └─ SiteFooter #contact  (on every editorial page)
```

## Motion architecture

- `html[data-motion="full" | "reduced"]` is set **before first paint** by an inline script in `index.html` from the OS setting. `useMotionPreference` reads it. The same script sets `html[data-theme="dark" | "light"]` from `localStorage` (`ajc-theme`, default dark); `useTheme` reads and toggles it.
- **Intro**: the same inline script decides, before first paint, whether the intro plays: the selector or the editorial home, no hash, full motion, visible tab, no Save-Data, not yet this session (`ajc-intro` in `sessionStorage`, set on any entry so deep links count). `?intro=replay` is the only accepted override, for review. It sets `html[data-intro="play"]`, which hides the header mark and adds `--intro-offset` (`--intro-hold`) to reveal delays so the hero plays as the overlay lifts. The timeline is CSS (`Intro.module.css`). The only script is the handoff: when the overlay starts lifting (its `animationstart`, with a timer backup) it measures both marks and moves the big one into the header with the Web Animations API, then sets `data-intro="done"` so the header mark doesn't replay its own load animation. Fail-safes: CSS hides the overlay and shows the header mark at 3.2s, and a JS timer finishes at the same point. Its CSP hash is recomputed on every build (`scripts/pages.mjs`), so it can be edited freely.
- Reveals: `useReveal` adds `.is-in` via IntersectionObserver; CSS in `styles/motion.css` does the animation. Hidden states only apply under `html.js`.

## Styling

- Global: `styles/tokens.css` (all values), `base.css`, `typography.css`, `layout.css` (12/4-column grid with `--c`/`--cm` placement), `motion.css`, `components.css` (buttons, tags, frames, crop marks…).
- Components and pages use **CSS Modules** (`*.module.css`). Reduced-motion overrides use `:global(html[data-motion="reduced"])`.
- Strict TypeScript includes `exactOptionalPropertyTypes`: optional props that may receive a CSS-module class must be typed `string | undefined`.
