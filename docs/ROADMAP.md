# Roadmap

## Done

- [x] **Concepts**: three directions explored; Strata + Monograph chosen (2026-10-08)
- [x] **Style tile v0.1**: approved with changes: Barlow Condensed replaces Instrument Serif; orange level confirmed; layer transition kept; cinematic stage rejected; structure lens kept
- [x] **Phase 1 — Foundation**: Vite + React + TS scaffold, vetted dependencies, design tokens, self-hosted fonts, content model with auto-discovered images, motion preference + reveal hooks
- [x] **Project docs**: CLAUDE.md, DESIGN, CONTENT, ROADMAP, ARCHITECTURE; skills `vet-dependency`, `visual-check`
- [x] **Phase 2 — Core pages** (awaiting review): router with View Transitions, site shell (header, Index dialog, footer/contact, depth gauge), Home (hero, selected work, experience, index; the Strata layer scene was removed 2026-10-21), `/work` with URL filter, case studies (Cover, Brief + story, Surface gallery + lightbox, Stack, Live/Next; the Structure lens was removed 2026-10-21), 404

- [x] **Hero room** (2026-10-09): interactive monitor-lit figure behind the hero name (see DESIGN → Motion)
- [x] **Phase 3a — Playground** (2026-10-08, awaiting review): `/play/<slug>` with the PICO-8 export in a framed player (poster → one-click start with sound, Mute / Full screen / Stop, Esc releases the keyboard, touch controls on phones); Playground nav opens it; case study "Play" layer and featured-card link. Astrox credited for Pixel Art (role + Graphic Design discipline)
- [x] **Intro** (2026-10-09): first-entry logo intro that hands off into the header (≈2.3s, once per session, no skip, none under reduced motion). See DESIGN → Motion
- [x] **Project wall** (2026-10-12): project thumbnails drift on the hero room's back wall; build step generates the thumbnails (see DESIGN → Motion)
- [x] **Logo** (2026-10-09): Strata Signature (AJC in three layers) in header, Index dialog and footer; favicon is the centered A. See DESIGN → Logo. Résumé and social assets still to do

## Next

- [ ] **Dual experience** (branch `feature/dual-experience`): selector at `/` → `/editorial` (current site) or `/interactive` (3D "After Hours Studio"). Look approved 2026-11-02 (isometric, semi-lowpoly, dark and warm). Plan and milestones in [STUDIO-DIRECTION.md](STUDIO-DIRECTION.md). Milestone 1 (workstation benchmark, `/interactive/bench`) approved 2026-11-02. Milestone 2 (character) approved. Milestone 3 (all six stations) approved 2026-11-03. Milestone 4: selector, `/interactive` route, dock and picture fallback built 2026-11-03; perf/a11y/security/licence passes done 2026-11-03 (results in STUDIO-DIRECTION §11c). Open: real-GPU fps check, an NVDA run, CSP meta (Phase 4), Barlow marquee at the next bake

- [ ] **Phase 3b — About**: About page, contact polish, résumé download
- [ ] **Phase 4 — Polish + ship**: ~~static page per route~~ and ~~Content Security Policy~~ done 2026-11-03 (`scripts/pages.mjs`); ~~GitHub Actions deploy~~ done 2026-10-09. Still open: image optimization (case-study PNGs and GIFs) and a Lighthouse pass (95+)

## Waiting on content (from Aron)

- [ ] Real projects: title, role, description, tags, stack, URL, screenshots (see [CONTENT.md](CONTENT.md))
- [x] LinkedIn URL (2026-10-09); résumé PDF saved as `public/Aron-Jay-Consuelo-Resume.pdf` (email + experience done 2026-10-08)
