# Content guide

Everything you need to add or update projects. You don't need to touch any layout or component code.

## Adding a project

1. Open [`src/content/projects.ts`](../src/content/projects.ts) and add an entry. **Order in the file = order on the site.**
2. Create a folder `src/content/projects/<slug>/` and add your images (see below).
3. Run `npm run dev` and check the result. The build stops with a clear message if something is wrong, such as a duplicate slug.

### Fields

| Field | Required | What to write |
|---|---|---|
| `kind` | ✓ | `'website'`, `'mobile'` or `'game'` |
| `slug` | ✓ | Lowercase, numbers and dashes, e.g. `kindred-clinic`. Used in the URL and as the image folder name. Don't change it after launch (links will break). |
| `title` | ✓ | Project name, e.g. `Kindred Clinic` |
| `role` | ✓ | What *you* did, e.g. `UI/UX Design · Front-end Development` |
| `description` | ✓ | 1–3 sentences: what it is, who it's for, and what you focused on. Plain, specific, no buzzwords. |
| `disciplines` | ✓ | Any of `'web-design'`, `'ui-ux'`, `'front-end'`, `'graphic-design'`, `'game'`. These become the filter tags. |
| `stack` | ✓ | Tools and technologies, e.g. `['AngularJS', 'Sass']`. Use `[]` if none apply. |
| `story` | – | The case-study story, shown in the Brief (see below) |
| `url` | – | Live site or published page |
| `featured` | – | `true` to show it on the home page. If nothing is featured, the first three projects are used. |
| `embedPath` | games only | Path to the exported game, e.g. `'/games/my-game/index.html'` |
| `controls` | games only | Short hints, e.g. `['Arrows — move', 'Z — jump']` |

There is deliberately **no year field**.

### The story

The `description` says *what the project is*. The optional `story` says *what you did and why*, which is what persuades a hiring manager. It appears under the description as labelled blocks:

```ts
story: {
  challenge: 'What was needed or wrong, in one or two sentences.',
  contribution: 'What you did. On team projects, say exactly which parts were yours.',
  decisions: [
    'A design or build choice, and why you made it.',
    'Two to four of these.',
  ],
  outcome: 'Optional: launched, still in use, published…',
},
```

**Only write what really happened.** No invented metrics, quotes or results; if you don't know an outcome, leave `outcome` out. Write decisions that were your own calls.

## Images

```
src/content/projects/kindred-clinic/
├── hero.png                  ← required: the landing-page hero
└── gallery/                  ← optional: other pages
    ├── 01-doctor-profiles.png
    └── 02-booking-confirmation.png
```

- **Hero**: a screenshot of the landing page's first screen. A small thumbnail for the home-page project wall is made from it automatically (cropped from the top); restart `npm run dev` after adding a new one.
- **Gallery**: other pages. They're sorted by file name, and the name becomes the caption: `02-booking-confirmation.png` → "Booking confirmation". Use a number prefix to set the order.
- **Formats**: PNG, JPG, WebP or AVIF.
- **Animated GIFs** (games): put the GIF next to a still with the same name (`01-boss-fight.gif` + `01-boss-fight.png`). The still shows in the gallery with a GIF badge; the GIF plays only in the full-screen viewer, with a pause button. Game images are scaled up with hard pixel edges.
- **Size**: at least 1600px wide; 2560px is ideal for sharp retina screens. Keep the same aspect ratio across a project (16:10 or 16:9 browser viewport).
- **Capture only the page.** Leave out browser chrome and device mockups; the site adds its own frame.
- **File size**: aim for under 500 KB each (export as WebP, or compress with a tool like Squoosh) until automatic optimization is added.
- **Alt text** is generated from the title and file name, so descriptive file names help screen-reader users.

## The PICO-8 game

1. In PICO-8, run `EXPORT YOURGAME.HTML`. You'll get `yourgame.html` and `yourgame.js`.
2. Create `public/games/<slug>/` and copy both files in. Rename the HTML file to `index.html`, keeping the `.js` file's name exactly as the HTML expects. Don't edit the exported files; the site adapts them.
3. In the game's entry set `embedPath: '/games/<slug>/index.html'`, and add `controls` written as `'Key — action'` (e.g. `'X — shoot'`); the key is shown as a keycap.
4. Keep `url` pointing at the Lexaloffle page. It's shown as "Also on lexaloffle.com" and as credit.

A game with `embedPath` gets a play page at `/play/<slug>`, a "Play in the browser" button on its case study, and a "Play it" link on its featured card. With exactly one playable game, the **Playground** nav item opens it directly; with more, it lists all games.

## Site details

Edit [`src/content/site.ts`](../src/content/site.ts):
- `email`: your address
- `linkedin`: your full profile URL
- `about`: the paragraphs in the home page's About section, under the hero (first one large)
- `quote`: your own short motto, shown beside them and credited to you
- `resumeUrl`: `/Aron-Jay-Consuelo-Resume.pdf` (the file in `public/`). Set to `null` to hide résumé buttons.

## Experience, certifications and résumé

- Work history and training live in `src/content/resume.ts` and appear on the home page after Selected work (order: hero, Selected work, Experience, All work). Jobs stay in sync with the PDF.
- `certifications` is a **curated subset** of the PDF, shown as a "Training" row at the end of Experience. List only training that supports UI/UX, front-end or graphic design.
- Unlike projects, jobs show their period ("2020 – 2026"), exactly as printed on the résumé.
- The PDF lives at `public/Aron-Jay-Consuelo-Resume.pdf` (path set in `site.ts` → `resumeUrl`). It can be viewed in a new tab or downloaded. Set `resumeUrl` to `null` to hide every résumé button.
