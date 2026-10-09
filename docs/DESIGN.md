# Design system

Approved on 2026-10-08 via the style tile in [`/style-tile`](../style-tile/index.html). Values live in [`src/styles/tokens.css`](../src/styles/tokens.css); this document explains the **rules and reasons** behind them.

## Direction

**Strata, set like a monograph.** Every project is presented as layers you move through, from the surface people see to the stack it ships on. The layout and typography borrow from editorial print: large display type, narrow reading columns, images that break the grid, crop marks, numbered folios. It should feel modern, dark, precise and quietly confident, and never look like a template developer portfolio.

The site itself is evidence of the front-end skill: the interactions must be smooth, accessible and fast.

## Logo

**Strata Signature** (approved 2026-10-09). The initials **AJC** in Barlow Condensed 600, cut into three layers like the site: Surface, Structure, Stack. The middle layer is displaced 3 units to the right and carries the spot color; the outer two are `--text-1`.

- Component: `src/components/shell/BrandMark.tsx`. Inline SVG outlined from the font (no live text), height = `1em` so size it with `font-size`. Decorative (`aria-hidden`); the wrapping link carries the accessible name.
- Props: `tone="mono"` drops the orange (footer, small print); `intro` plays the load animation (header only).
- Layer cuts never cross the A crossbar. Cap height 32.2 units; cuts at 9.7 and 19.7 with 1.5-unit gaps.
- Used in: header (22px, 19px on mobile), Index dialog, footer colophon (14px, mono, `--text-3`).
- **Favicon** (`public/favicon.svg`): the **A alone, ink centered exactly** in a dark 32px tile (rx 6). Middle layer shifted 2 units; cuts sized so they survive 16px. The full AJC is unreadable at that size.
- Motion: on load the layers slide in from staggered offsets once (1000ms, expo-out); on first entry the **Intro** hands off into the mark instead (see Motion). Hovering or focusing the home link settles the displaced layer into line. Reduced motion: static mark, no hover movement.
- Not yet applied to the résumé PDF or social profiles.
- Barlow Condensed is SIL OFL 1.1, which permits outlining glyphs for a logo.

## Typography

| Role | Face | Notes |
|---|---|---|
| Hero, display, headings, quotes | **Barlow Condensed** 500 (hero 600) | Tall and tight, used large and sparingly |
| Emphasis inside display type | Barlow Condensed **300 italic** | Emphasis = weight contrast, never color |
| Body, UI, buttons | **Geist** (variable) | Body max 62ch; lead text weight 300 |
| Labels, metadata, stacks, code | **Geist Mono** (variable) | Labels are uppercase, +8% tracking, 12px |

The type scale is fluid (`clamp()`). On mobile the hero name still fills the width; display type is never scaled down into timidity.

## Color

- **Background `#0F0E0D`**: warm near-black so the orange feels at home. Never pure black.
- **Text**: primary `#F2F0ED` (headings), body `#D6D3CE`, secondary `#A3A09B`, tertiary `#8A867F`. The smallest gray is 5.3:1.
- **Accent `#F99E35`** works like a printer's spot color. It marks the current state (active nav, current layer, focus ring, primary action, selected filter) and appears once or twice per screen. It is never decoration.
- **On accent, text is always dark** (9.2:1). White on orange is 2.1:1 and fails.
- `--line` is for decorative hairlines only. Interactive boundaries use `--line-strong` (3.2:1).
- Project screenshots bring their own color; the UI around them stays neutral.

## Layout

- 12 columns on desktop and 4 on mobile. Children place themselves with `--c` (desktop) and `--cm` (mobile).
- Asymmetry has a reason: text keeps a narrow measure, images break out of it, and nothing is centered by default.
- Section rhythm runs 192px (96px mobile) between layers. Larger gaps signal a bigger change of topic.
- Every section opens with a **layer head**: a hairline, an orange layer number and a mono label ("03 — Structure").
- Screenshots sit in a minimal browser frame (URL bar only, no traffic lights) with **print crop marks**, a nod to graphic design.

## Components

- **Buttons**: primary is orange with dark text; secondary is outlined with `--line-strong` and gets an accent border plus wash on hover. 3px radius. 48px tall (40px small; 44px minimum on touch).
- **Links**: inline links are always underlined. On hover the underline turns orange, drawing from left to right.
- **Tags**: disciplines are outlined pills in sans; technologies are mono, slash-separated text. They are told apart by shape and typeface, not color. A selected filter is filled orange and shows a check icon.
- **Depth gauge**: fixed on the right edge on desktop. The current layer gets a longer orange tick and its number. Below 1100px it becomes a slim layer bar under the header.
- **Project index**: Monograph contents rows (number, title, role, stack, arrow). On hover the other rows dim and an orange hairline draws in. Desktop also shows a floating preview that follows the cursor. On mobile, inline thumbnails alternate left and right.

## Motion

House easing is `cubic-bezier(.16, 1, .3, 1)` (expo-out). Micro-interactions take 160–280ms; reveals take 600–1000ms. Nothing loops or auto-plays.

**Approved**
- Line-mask text reveals, staggered 90ms in reading order.
- **Strata layer transition**: a pinned, scroll-driven scene where the Surface layer lifts and tilts away to reveal Structure, then Stack.
- **Structure lens**: hover over a screenshot to see a blueprint reading of it underneath, with a slider as the keyboard and touch alternative. It is generated from the screenshot and labelled as such.
- Hover micro-interactions: underline draws, arrow nudges, row dimming, the floating preview.
- **Hero room** (approved 2026-10-09, `src/components/hero/HeroRoom.*`): behind the hero name, someone works in a dark room lit only by a monitor. It's a secondary discovery, so the name always stays dominant. The one approved exception to "nothing loops": a quiet idle (typing, breathing, a glance, screen light). With a fine pointer he turns toward a nearby cursor; inside his personal space he raises the near arm, waves it off with a random line ("Shooo!", "I'm busy."…), then pointedly returns to work, with a cooldown that doubles when pestered. Tunables are `ROOM_CONFIG` / `ROOM_PHRASES`. Touch devices get only the idle; reduced motion gets a still scene. Colors are the `--room-*` tokens.

- **Intro** (approved 2026-10-09, `src/components/shell/Intro.*`, preview in `style-tile/intro.html`): on first entry the Strata Signature assembles in the centre of a `--bg` overlay. Three hairlines draw at the layer edges (the Structure one in `--accent-ink`), then the layers rise out of them from the foundation up: Stack, Structure (which steps out into its displaced position), Surface. At 1.36s the overlay lifts while the mark moves into the header slot, and the hero reveals play as it clears. About 2.3s in all; Aron chose this half-speed timing over a 1.15s draft. It plays **once per browser session**, only on `/` without a hash, and never on route changes. There is deliberately **no skip**: it is short, never takes focus or clicks, and the content is in the DOM from the start. No intro under reduced motion, Save-Data or a hidden tab. It is not a loader: no progress, no waiting on assets.

**Rejected**
- The cinematic "Lightbox stage" (a screenshot rising out of the dark with a spotlight and tilt). Too much; don't reintroduce it.
- Scroll-jacking, smooth-scroll libraries, looping or decorative animation.

**Reduced motion**: motion is on by default and follows only the OS setting (no manual toggle). Pinned scenes become plain stacked content, reveals become short fades, and nothing transforms.

## Responsive

Mobile is a recomposition, not a scale-down:
- Images bleed edge to edge; frames lose their side borders.
- Margin notes fold in under the image with an orange rule.
- Hover interactions become touch ones: the lens becomes a slider, the floating preview becomes inline thumbnails.
- Navigation moves into a full-screen Index dialog.
- No horizontal page scroll at any width, down to 320px.

## Accessibility

WCAG 2.2 AA minimum: landmarks, one `h1`, a skip link, a visible orange focus ring, native `<dialog>` for overlays (Esc closes it and focus returns), alt text for every screenshot, and decorative layers hidden from screen readers.

## Light theme

Dark is the default and the primary identity. A header toggle (also in the Index dialog) switches to a light theme, stored in `localStorage` (`ajc-theme`) and applied before first paint.

- Light values override the color tokens under `:root[data-theme="light"]` in `tokens.css`; components never branch on theme.
- Background is warm paper `#F5F2ED`, never `#FFF`.
- Orange **fills** (primary button, selected filter) stay `--accent` with dark text in both themes. Orange as **text, hairline or focus ring** uses `--accent-ink`, which is `#F99E35` in dark and `#A04B08` in light (5.4:1).
- The structure lens uses a per-theme SVG filter (`Blueprint.tsx`).
