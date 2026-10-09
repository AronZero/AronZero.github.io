---
name: visual-check
description: Screenshot the portfolio at desktop (1440px) and true mobile (390px) width with headless Edge, to verify UI changes visually. Use after any UI work, before reporting it done.
---

# Visual check

Run the bundled script from the repo root (PowerShell):

```powershell
& .claude/skills/visual-check/visual-check.ps1 -Paths '/', '/work', '/work/northbound-coffee'
```

Options:
- `-Reduced`: emulate `prefers-reduced-motion`. **Use this for full-page captures**: pinned scenes and reveals only render predictably in reduced mode.
- `-Height 900`: capture just the first screen. **Use this with full motion** to check reveals and the hero.
- `-NoBuild`: skip `npm run build` when `dist/` is already current.
- `-Out <dir>`: where PNGs go (default: `$env:TEMP\visual-check`).

The script builds, starts `vite preview` on :4173, captures each path, slices tall images into 3000px chunks named `<name>-desktop-<n>.png` / `<name>-mobile-<n>.png`, then stops the server and removes its temporary file. Read the PNGs with the Read tool and look for overflow, clipping, broken images, contrast and spacing problems.

## Why it works this way (gotchas)

- **Headless Edge won't render narrower than ~500px.** A `--window-size=390,…` capture silently lays out wider, and content looks clipped on the right. For true mobile, the script loads the page inside a 390px `<iframe>`.
- **The iframe wrapper must be served by the preview server.** A `file://` wrapper can't embed `http://localhost` content and renders blank.
- **React needs a long virtual-time budget inside the iframe** (≈20s); with a short one the capture shows an empty background.
- **A tall window makes `100svh` enormous.** The hero and pinned scenes stretch to fill it, so judge full-page captures in `-Reduced` mode.
- `prefers-reduced-motion` is emulated with Edge's `--force-prefers-reduced-motion` flag.
- PowerShell's `Remove-Item` can be blocked on paths with spaces in this environment; the script cleans up with .NET calls instead.
