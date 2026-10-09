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
- Image glob patterns must be **string literals** (a Vite requirement); a template string silently matches nothing.
- Every list, filter, number and next/previous link is derived; no component hard-codes a project.

## Routing

A small hand-written router in `src/router/` (no dependency):

| Path | Page |
|---|---|
| `/` | `HomePage` |
| `/work` and `/work?filter=<discipline>` | `WorkPage` (the filter lives in the URL, so it can be shared) |
| `/work/<slug>` | `ProjectPage` (case study) |
| `/play/<slug>` | `PlayPage` (games with an `embedPath` only; others 404) |
| anything else | `NotFoundPage` |

**Game player** (`components/project/GamePlayer.tsx`): the stock PICO-8 export is loaded unmodified in a same-origin `<iframe>` (lazy, `inert` behind a poster). Pressing Start calls the shell's `p8_run_cart()` inside that click, so audio is allowed and the cartridge `.js` only downloads then. On load the player injects a small stylesheet into the shell (our background, no scrollbars, PICO-8's side buttons hidden in favour of our Mute / Full screen / Stop toolbar) and an Esc listener that hands focus back to the page. Stop remounts the iframe. On touch devices it sets `p8_touch_detected` so the shell shows its on-screen controls, and the stage turns portrait while running.

- `routes.ts` matches paths and holds the URL builders (`paths.work()`, `paths.project(slug)`). Never hand-type paths.
- `Router.tsx` handles `pushState` navigation, a `<Link>` that keeps new-tab and middle-click working, scroll restoration on back/forward, hash scrolling (including across pages), and **View Transitions** between pages when motion is on.
- **GitHub Pages deep links**: Pages has no SPA fallback, so a fresh load of `/work/<slug>` would 404. Phase 4 adds a build step that writes a real `index.html` for every route, each with its own title and link-preview tags.

## Rendering structure

```
App
├─ Intro                (first-entry logo intro; renders nothing unless html[data-intro="play"])
├─ BlueprintDefs        (the SVG filter used by the structure views, rendered once)
├─ SiteHeader           (nav, theme toggle, résumé, mobile Index <dialog>)
├─ main → Page          (switch on route)
│   └─ DepthGauge       (per page: the layers that page actually has, numbered in order)
└─ SiteFooter #contact  (on every page)
```

## Motion architecture

- `html[data-motion="full" | "reduced"]` is set **before first paint** by an inline script in `index.html` from the OS setting. `useMotionPreference` reads it. The same script sets `html[data-theme="dark" | "light"]` from `localStorage` (`ajc-theme`, default dark); `useTheme` reads and toggles it.
- **Intro**: the same inline script decides, before first paint, whether the intro plays: home page, no hash, full motion, visible tab, no Save-Data, not yet this session (`ajc-intro` in `sessionStorage`, set on any entry so deep links count). `?intro=replay` is the only accepted override, for review. It sets `html[data-intro="play"]`, which hides the header mark and adds `--intro-offset` (`--intro-hold`) to reveal delays so the hero plays as the overlay lifts. The timeline is CSS (`Intro.module.css`). The only script is the handoff: when the overlay starts lifting (its `animationstart`, with a timer backup) it measures both marks and moves the big one into the header with the Web Animations API, then sets `data-intro="done"` so the header mark doesn't replay its own load animation. Fail-safes: CSS hides the overlay and shows the header mark at 3.2s, and a JS timer finishes at the same point. Phase 4 CSP: re-hash this inline script whenever it changes.
- Reveals: `useReveal` adds `.is-in` via IntersectionObserver; CSS in `styles/motion.css` does the animation. Hidden states only apply under `html.js`.
- **StrataScene**: one rAF scroll handler writes `--t1` and `--t2` on the scene; all transforms are CSS `calc()`. In reduced mode the handler is removed and CSS stacks the layers statically.
- **StructureLens**: `clip-path` is set imperatively from pointer events, so moving the pointer never re-renders React. A range input is the keyboard and touch equivalent.
- **Blueprint**: an SVG filter chain (grayscale → Laplacian `feConvolveMatrix` → accent-colored alpha) applied to an SVG `<image>`. It works in every modern browser with no canvas or library.

## Styling

- Global: `styles/tokens.css` (all values), `base.css`, `typography.css`, `layout.css` (12/4-column grid with `--c`/`--cm` placement), `motion.css`, `components.css` (buttons, tags, frames, crop marks…).
- Components and pages use **CSS Modules** (`*.module.css`). Reduced-motion overrides use `:global(html[data-motion="reduced"])`.
- Strict TypeScript includes `exactOptionalPropertyTypes`: optional props that may receive a CSS-module class must be typed `string | undefined`.
