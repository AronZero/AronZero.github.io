# Roadmap

## Done

- [x] **Concepts**: three directions explored; Strata + Monograph chosen (2026-10-08)
- [x] **Style tile v0.1**: approved with changes: Barlow Condensed replaces Instrument Serif; orange level confirmed; layer transition kept; cinematic stage rejected; structure lens kept
- [x] **Phase 1 — Foundation**: Vite + React + TS scaffold, vetted dependencies, design tokens, self-hosted fonts, content model with auto-discovered images, motion preference + reveal hooks
- [x] **Project docs**: CLAUDE.md, DESIGN, CONTENT, ROADMAP, ARCHITECTURE; skills `vet-dependency`, `visual-check`
- [x] **Phase 2 — Core pages** (awaiting review): router with View Transitions, site shell (header, Index dialog, footer/contact, depth gauge), Home (hero, Strata layer transition, selected work, index), `/work` with URL filter, case studies (Cover, Brief, Surface gallery + lightbox, Structure lens, Stack, Live/Next), 404

- [x] **Hero room** (2026-10-09): interactive monitor-lit figure behind the hero name (see DESIGN → Motion)
- [x] **Phase 3a — Playground** (2026-10-08, awaiting review): `/play/<slug>` with the PICO-8 export in a framed player (poster → one-click start with sound, Mute / Full screen / Stop, Esc releases the keyboard, touch controls on phones); Playground nav opens it; case study "Play" layer and featured-card link. Astrox credited for Pixel Art (role + Graphic Design discipline)
- [x] **Intro** (2026-10-09): first-entry logo intro that hands off into the header (≈2.3s, once per session, no skip, none under reduced motion). See DESIGN → Motion
- [x] **Logo** (2026-10-09): Strata Signature (AJC in three layers) in header, Index dialog and footer; favicon is the centered A. See DESIGN → Logo. Résumé and social assets still to do

## Next

- [ ] **Phase 3b — About**: About page, contact polish, résumé download
- [ ] **Phase 4 — Polish + ship**: static `index.html` per route (fixes deep links on Pages, adds per-route titles and link previews), image optimization, accessibility and performance pass (Lighthouse 95+), GitHub Actions deploy to Pages

## Waiting on content (from Aron)

- [ ] Real projects: title, role, description, tags, stack, URL, screenshots (see [CONTENT.md](CONTENT.md))
- [ ] LinkedIn URL; résumé PDF saved as `public/Aron-Jay-Consuelo-Resume.pdf` (email + experience done 2026-10-08)
