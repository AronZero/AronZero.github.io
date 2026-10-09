# CLAUDE.md

Portfolio of **Aron Jay Consuelo** — UI/UX Designer specialising in Front-end Development, with Graphic Design as a secondary skill. Audience: employers and hiring managers. Hosted on GitHub Pages as a user site (`AronZero.github.io`, served from `/`).

Stack: React 19 + TypeScript 7 + Vite 8, Lucide icons, self-hosted Fontsource fonts. No other runtime dependencies.

## Commands

```bash
npm run dev         # dev server
npm run build       # strict type-check + production build (must pass before handing work back)
npm run preview     # serve dist/ on :4173
npm run audit:deps  # npm audit + registry signature/provenance checks
```

If PowerShell says `npm.ps1 cannot be loaded because running scripts is disabled`, use `npm.cmd …` (or the user can set `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`).

Node is installed but may not be on PATH in a fresh shell. In PowerShell, reload it first:
`$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`

## Non-negotiables

**Dependencies.** Use native CSS and plain JS first. Add a package only when the platform clearly can't produce the result, and only well-known, widely used packages from their official maintainers. Follow the `vet-dependency` skill for every addition or upgrade: exact pins, versions published at least 2 weeks ago, `ignore-scripts=true` stays on, audits after installing. Explain to the user why a package is needed *before* adding it. GSAP and Lenis were evaluated and rejected.

**Design.** Read [docs/DESIGN.md](docs/DESIGN.md) before UI work. In short:
- Use only the values in `src/styles/tokens.css`; never hard-code colors or sizes in components.
- Background is warm near-black `#0F0E0D`, never `#000`. The accent `#F99E35` appears once or twice per screen.
- Text on orange is always dark (`--on-accent`). White on orange fails contrast.
- Display type is Barlow Condensed. Emphasis comes from weight contrast (500/600 roman vs 300 italic), not from color.
- Approved motion: line reveals, the Strata layer transition (Surface → Structure → Stack), the structure lens, the hero room, the first-entry logo Intro (once per session), and hover micro-interactions. The cinematic "Lightbox stage" was **rejected**; don't reintroduce it.
- Every motion effect needs a static fallback under `html[data-motion="reduced"]` (set from the OS setting only; there is no motion toggle).
- Dark is the default theme; a light theme overrides tokens under `:root[data-theme="light"]`. Use `--accent-ink` for orange text, hairlines and outlines, `--accent` only for fills.

**Content honesty.** Projects have only screenshots, title, role, description, tags, stack and an optional URL. Never invent process artifacts (wireframes, sketches, metrics) or show **years** on projects; they have no dates. (Work experience in `src/content/resume.ts` shows the periods printed on the résumé.) The structure lens is generated from the screenshot and must be labelled that way.

**Accessibility.** Text contrast ≥ 4.5:1. Never rely on color alone (use underlines, icons, numbers). Keyboard alternatives exist for every hover interaction. Touch targets ≥ 44px on mobile. One `h1` per page.

**Git.** Don't commit or push unless asked. Until the Pages deploy workflow exists (Phase 4), pushing `main` publishes the raw source `index.html`.

## Where things live

| Path | Purpose |
|---|---|
| `src/content/projects.ts` | The only file edited to add or reorder projects |
| `src/content/projects/<slug>/` | `hero.*` (required) + `gallery/*` images, discovered automatically |
| `src/content/site.ts` | Name, roles, email, LinkedIn, résumé path |
| `src/content/resume.ts` | Work experience + certifications (home page, from the résumé PDF) |
| `src/styles/` | Tokens and global CSS. Components use CSS Modules. |
| `src/router/` | Hand-written History API router; use `paths.*` builders, never hand-typed URLs |
| `src/pages/` | Home, Work, Project (case study), NotFound |
| `src/components/` | `shell/` (header, footer, depth gauge, `BrandMark` logo), `project/` (index, featured, Strata scene, lens, gallery), `Reveal.tsx` |
| `src/hooks/` | `useMotionPreference`, `useTheme`, `useReveal`, `useDocumentMeta` |
| `style-tile/` | Approved visual reference (v0.1). Not part of the build. |
| `docs/` | DESIGN, CONTENT, ARCHITECTURE, ROADMAP |

## Workflow

- Big phases: propose the plan, then build. Current phase and open items are in [docs/ROADMAP.md](docs/ROADMAP.md); update it when a phase finishes.
- Verify UI changes visually at desktop and true 390px mobile using the `visual-check` skill, in both full and reduced motion.
- Content rules for the user are in [docs/CONTENT.md](docs/CONTENT.md); keep it in sync with `src/content/types.ts`.
