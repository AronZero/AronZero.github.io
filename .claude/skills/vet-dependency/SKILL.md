---
name: vet-dependency
description: Vet, pin and install an npm package (or upgrade one) for this portfolio safely. Use before adding ANY dependency or changing a version in package.json.
---

# Vet a dependency

The user's rule: **native CSS/JS first**, and only well-known, widely used, safe packages. Malware-free is a hard requirement.

## 1. Justify it (before touching anything)

- Can native CSS (scroll-driven animations, View Transitions, `:has()`, container queries) or ~50 lines of plain TS do the job? If so, don't add a package.
- Tell the user what the package does, why native isn't enough, and its cost (bundle size, number of transitive packages). Wait for approval.

## 2. Check the package

```powershell
npm view <pkg> repository.url homepage maintainers --json
npm view <pkg>@<version> _npmUser --json                      # who published
npm view <pkg>@<version> dist.attestations.provenance --json  # SLSA provenance, if any
```

Red flags (stop and report them): a typo-squatted name, a recently changed maintainer, a repository that doesn't match the official project, very low adoption for a popular-sounding name, or install scripts.

## 3. Pick a version at least 2 weeks old

`npm view --before` does **not** filter results, so read the publish timestamps:

```powershell
$cut = (Get-Date).AddDays(-14)
$time = npm view <pkg> time --json | ConvertFrom-Json
$time.PSObject.Properties | Where-Object { $_.Name -match '^\d+\.\d+\.\d+$' -and [datetime]$_.Value -lt $cut } |
  Sort-Object { [datetime]$_.Value } | Select-Object -Last 1
```

Prefer a stable release (no `-beta`/`-rc`) and check its peer dependencies match what's installed.

## 4. Install pinned

`.npmrc` already enforces `ignore-scripts=true` and `save-exact=true`; never change those.

```powershell
npm install <pkg>@<exact-version>        # add -D for build-only tools
```

## 5. Verify

```powershell
npm query ":attr(scripts, [preinstall]), :attr(scripts, [install]), :attr(scripts, [postinstall])"   # expect nothing
npm audit                     # expect 0 vulnerabilities
npm audit signatures          # every package has a verified signature
npm ls --all                  # review new transitive packages
npm run build
```

Report to the user: the package and version, its publish date, who published it, provenance, how many new transitive packages came in, and the audit results.
