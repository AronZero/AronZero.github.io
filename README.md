# Aron Jay Consuelo — Portfolio

UI/UX Designer & Front-end Developer. Built with React, TypeScript and Vite; hosted on GitHub Pages.

## Run it

Requires Node.js 24 LTS.

```bash
npm ci            # install exactly what package-lock.json records
npm run dev       # local dev server
npm run build     # type-check + production build into dist/
npm run preview   # serve the production build locally
```

## Deploying

Every push to `main` builds the site and publishes `dist/` to GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). One-time repo setting: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Adding a project

1. Add an entry to [`src/content/projects.ts`](src/content/projects.ts) (order = order on the site).
2. Create `src/content/projects/<slug>/` with:
   - `hero.png` — the landing-page hero screenshot (required)
   - `gallery/01-page-name.png`, `gallery/02-…` — other pages (optional; the file name becomes the caption)

Pages, filters, featured projects and next/previous links all update automatically.

Site-wide details (email, LinkedIn, résumé) live in [`src/content/site.ts`](src/content/site.ts).

## Dependency policy

Keep the dependency list small and trusted:

- Prefer native CSS and plain JavaScript; add a library only when it clearly does something the platform can't.
- Only well-known, widely used packages from their official maintainers.
- Pin exact versions (`.npmrc` sets `save-exact`) and only pick versions published at least two weeks ago.
- Install scripts are disabled (`ignore-scripts=true` in `.npmrc`).
- After any change, run `npm run audit:deps` (known vulnerabilities + registry signature/provenance checks).

## Folders

| Path | What it is |
|---|---|
| `src/styles/` | Design tokens and global styles (approved in the style tile) |
| `src/content/` | Project data, images and the loader that connects them |
| `src/hooks/` | Shared behavior: motion preference, scroll reveals |
| `style-tile/` | The approved visual style tile (reference only; not part of the build) |

## Licence

The **code** is MIT licensed (see [LICENSE](LICENSE)). The **content** (project screenshots, résumé, logo, copy, and the Astrox game and its art) is © Aron Jay Consuelo, all rights reserved. Fonts and libraries keep their own licences (see `public/third-party-licenses.txt`); the Astrox music is by Gruber, used under licence and credited on its project page.
