# After Hours Studio: visual direction

Status: **Milestones 1–3 approved (2026-11-02/03). Milestone 4 (selector at `/`, the real `/interactive` route, station dock, picture fallback) built 2026-11-03, awaiting Aron's review; the performance, accessibility, security and licence passes follow.** The bench route `/interactive/bench` is gone; its URL switches now work on `/interactive`.

Reference render: [art/lookdev/iso-study.png](../art/lookdev/iso-study.png). Its script, [art/lookdev/iso_study.py](../art/lookdev/iso_study.py), is the source of truth for layout, palette and lights. Every number in §2–§4 comes from it.

```bash
# full view (~1 min on the RX 6600)
blender -b --factory-startup --python art/lookdev/iso_study.py -- out.png 128 src/content/projects
# close-up check: target x,y,z and orthographic scale
blender -b --factory-startup --python art/lookdev/iso_study.py -- out.png 48 src/content/projects "0.6,3.4,0.8,1.6"
```

**How we got here:** flat SVG concept boards (rejected), then stylised realism at eye level (rejected), then an isometric diorama with violet/neon lighting (structure liked, mood too loud), then **the same diorama, dark and warm** (approved). Mood reference: daniels-architects.com.

---

## 1. Audit

| Item | Where | Status |
|---|---|---|
| Iso look-dev | `art/lookdev/iso_study.py`, `iso-study.png` | **Approved.** Blockout-plus quality: right forms, proportions and lighting; not final asset detail |
| Concept canvas A1–A3, B1–B3 | claude.ai artifact "Portfolio Playground Concepts" | Superseded. Kept only for the station list and the dock idea |
| Hero room / project wall / game player | `src/components/hero/*`, `/play/<slug>` | Unchanged. Their behaviour and content get reused (below) |
| Three.js | — | Not installed yet. `feature/dual-experience` still matches `main` in `src/` |

**Keep and reuse:** the six stations and their numbers, the station dock (secondary and keyboard navigation), the HTML content panel, `ROOM_CONFIG`/`ROOM_PHRASES` (the character's state machine), `scripts/thumbs.mjs` (textures for the screens and frames), content from `src/content/*`, the `/play/astrox` player, and the design tokens.

**Discarded:** the eye-level camera, stylised realism, the violet fill, the magenta neon, the checker floor, and the eye-level light study (deleted).

---

## 2. Art direction

**One line:** a designer's studio at night, seen as a cut-away model on a dark table: cozy, warm and full of small true details.

**Style: semi-lowpoly diorama.**
- **Hard-surface objects** get chamfered edges (1–2 bevel segments, angle-limited) and stay flat-shaded, so each edge catches a soft highlight. Curved parts (mouse, lamp shade, wheels) are smooth-shaded with moderate segment counts (12–24).
- **Organic forms** (plants, the character's head and hands) are faceted on purpose: icosphere-level detail with visible planes.
- **Materials are mostly colour plus roughness**, with almost no image textures. The exceptions: the wood floor (procedural boards), the screens and framed prints (real project images), and the arcade art (Astrox).
- **Density over fidelity.** Many small, readable props that tell the story (§2.2), each simple on its own.

**Not:** photoreal textures, toon outlines, neon or RGB "gamer" light, cool or violet ambient light, or pure black (`#000`) anywhere.

### 2.1 Palette (from the study)

| Role | Value | Notes |
|---|---|---|
| Backdrop, ground | `#0F0E0D` world, `#141210` ground | Site `--bg`. A faint cool glow low-left keeps the base from going flat |
| Cut edges (slab, wall tops) | `#141210` | Reads as a dark plinth |
| Walls | `#2B2622` / `#26221F` | Dark warm plaster; the light paints them |
| Wood: floor boards | `#6A4A34` / `#4E3424`, seams `#1E140E` | Satin finish (roughness .38) for soft reflections |
| Wood: desk, slats, frames | walnut `#5A3A24`, slats `#8A5A3C`, light oak `#B48460`, frames `#8E6B47` | |
| Steel / dark plastics | `#1B1B1C`, `#1E1D1C`, `#2C2A2E` | Desk legs, lamp, monitor, chair |
| Retro beige | `#CFC4B2` / `#A89C8A` | Old computer, keyboards, mouse |
| Textiles | sofa moss `#2E3A34`, cushion `#B5835A`, shade linen `#E8DCC8` | |
| Plants | `#4A6B3E` / `#38553A`, pots `#8E5A3C` | |
| **Accent `#F99E35`** | **The rug tiles only** | Echoes the brand. In the UI, the accent stays reserved for hover and focus |

### 2.2 Storytelling (true to Aron, or generic)
- The monitor and the frames show **real project screenshots** (`hero.png`). The arcade runs **Astrox**, which Aron made and drew.
- A retro beige computer with a green terminal, next to a modern monitor: old habits, new tools.
- A pinboard of notes, a pen tablet with stylus, a sketchbook, a pencil cup, a mug, books, speakers and plants: a working desk, lived-in but tidy.
- Book spines and note scribbles are abstract marks, never real titles or real sketches (content honesty, §9).

---

## 3. Composition and camera

**Room:** 4.4 × 4.4 m floor, walls 3.0 m high and 0.16 m thick, standing on the west (`x = 0`, screen-left) and north (`y = D`, screen-right) sides. The south and east sides are open.

```
            screen-left wall (x=0)                screen-right wall (y=D)
   ┌─ slats ─┬── 04 pinboard ──┬─ L-desk corner ─┬── shelf + speakers ──┬─ 02 frames ─┐
   │ 03      │                 │ 01 monitor,     │ desk plant, tablet   │ ledge,      │
   │ arcade  │  retro PC, lamp │ chair + sitter  │ mug, drawers         │ floor plant │
   │         │                 │                 │                      │             │
   │   sofa ── rug (accent tiles) ── side table (06?) ── floor lamp     open edges   │
   └──────────────────────────────────────────────────────────────────────────────┘
```

**Overview camera:** orthographic. It looks along (1, −1, 0.95) toward (2.0, 2.3, 0.95), which is 45° yaw and about 34° down. Ortho scale 8.4 at 1600 × 1216. The diorama fills about 70% of the frame height, with dark space around it for the UI (as in the Daniels reference).

**Station shots:** the same angle, zoomed in. Each station is a target point plus an ortho scale, so moving between stations is a pan and zoom, never a rotation. The diorama always keeps its iso read. Transition: expo-out, about 1.1 s.

| Station | Target (x, y, z) | Ortho scale |
|---|---|---|
| 01 Featured Work (desk) | 0.6, 3.6, 1.05 | 1.8 |
| 02 All Projects (frames) | 3.4, 4.3, 1.6 | 2.0 |
| 03 Games (arcade) | 0.42, 0.95, 1.3 | 1.4 |
| 04 About (pinboard) | 0.1, 2.5, 1.6 | 1.6 |
| 05 Skills & Tools (shelf) | 1.25, 4.3, 1.8 | 1.8 |
| 06 Contact (desk phone, side table) | 3.25, 1.75, 0.5 | 1.2 |

Optional: a small drag or tilt parallax (±6° yaw) for depth, turned off under reduced motion. The content panel sits on the right, so each shot keeps its subject in the left 60%. The station table needs its offset applied at build time.

---

## 4. Lighting rig

Cycles look-dev, AgX "Medium High Contrast", exposure 0. Every light is warm except the monitor's and CRT's small glows and the backdrop's cool kiss.

| Light | Type, energy | Colour | Purpose |
|---|---|---|---|
| Desk lamp | Point 130 W, r 4 cm, inside the shade | 2700K-ish `(1, .66, .38)` | **Key.** Warm pool on the desk, keyboard and sitter |
| Cove strips | Emissive tubes (5) + two strip area lights, 30 W each | warm | Outlines both walls and grazes them from the top |
| Shelf underlight | Area 1.8 × 0.15 m, 40 W, facing down | warm | Pool on the wall and desk under the shelf |
| Floor lamp | Point 70 W, r 12 cm, plus an emissive linen shade | warm | Lights the sofa and rug side |
| Monitor | Area 10 W | cool `(.7, .85, 1)` | Small cool kiss on the sitter, keeps the screen believable |
| Retro CRT | Area 6 W | green | Terminal glow on the desk |
| Arcade | Screen area 8 W + marquee area 6 W, emissive warm edge trim (3) | neutral / warm | The cabinet reads in the dark corner |
| Fill | Area 4 m, 70 W, from the camera side | warm-neutral | Keeps shadow detail above black |
| Top | Area 3 m, 14 W | warm | Lifts the floor |
| Backdrop glow | Area 5 m, 120 W, low front-left, aimed at the ground | cool | The faint indigo glow under the model, as in the reference |
| World | `#0F0E0D`, strength .25 | — | Reflections and base ambient |

**Value rule:** shadowed surfaces a visitor needs to read stay above about L\* 12. Only the backdrop may go darker.

**Runtime (Three.js):** static lighting is **baked into lightmaps** in Cycles: the soft pools, contact shadows and colour bleed at no runtime cost. At runtime: emissive materials, one shadow-casting light for the character (the lamp), AgX tone mapping (to match), and selective bloom on emissives only (lamp, cove strips, shades, screens, marquee).

---

## 5. Production approach

- **Scripted Blender (`bpy`).** [art/blender/studio.py](../art/blender/studio.py) builds the whole room (grown from the look-dev script). It is the source of truth: reproducible, reviewable in git, tweakable by numbers.
- **Stills:** `blender -b --factory-startup --python art/blender/studio.py -- out.png 128 src/content/projects ["x,y,z,scale"] [--no-figure]`. Reference stills live in `art/renders/`, which is gitignored (about 11 MB, reproducible with these commands).
- **Bake and export** (about 6 min on the RX 6600): `blender -b --factory-startup --python art/blender/studio.py -- <out_dir> 256 <absolute path to src/content/projects> --bake` (from PowerShell, a relative project path fails to load the hero images), then copy the three files into `src/studio/assets/`. After every bake also refresh the derived files: the phone atlas `studio-bake-2048.jpg` (sharp: 2048 × 2048, lanczos3, JPEG quality 86, mozjpeg) and, from a fresh overview still, `studio-still-1600/800.webp`. The bake:
  1. removes the stand-in figure (the character is a separate, animated asset), applies all bevels, and converts curves and text to meshes;
  2. deletes faces the fixed camera can never see, plus faces buried under other surfaces;
  3. joins everything into `static` and `monitor` (the station-01 object) and smart-unwraps both into **one 4096 atlas**;
  4. bakes Cycles **Combined** lighting *from the camera direction* (`view_from = ACTIVE_CAMERA`). The camera never rotates, so baked reflections stay correct;
  5. denoises the bake and saves it **through the AgX view** as JPEG, so the texture already looks final;
  6. exports `studio.glb` (no materials or normals) with `ground` (1024 bake) and the live screens `mon_screen` and `arc_screen`.
- **Runtime** ([src/studio/StudioScene.ts](../src/studio/StudioScene.ts)): baked meshes use `MeshBasicMaterial` with no tone mapping, so the browser shows the Cycles result. The monitor screen is a canvas texture cycling the featured projects; the arcade shows the Astrox title screen.
- **Not needed so far:** `gltf-transform`. The GLB is 0.46 MB and the atlas 1.4 MB as-is. Revisit when the full room grows.
- Semi-lowpoly suits scripting well: almost every asset is chamfered boxes, cylinders and swept curves. The character is the one asset that needs real modelling (§7).

---

## 6. Asset specifications

"Tris" = triangle budget after export. Dimensions are real-world. The study has every object at the right size and place. Milestone work raises the detail to the level below.

### 01 Workstation (Milestone 1 benchmark)
| Asset | Final detail | Tris | Interaction |
|---|---|---|---|
| L-desk | Walnut top with a chamfered edge, slim steel legs (no leg in the inner corner), drawer unit with pulls, cable grommet | 2k | — |
| Monitor | Thin bezel, chamfered back shell, neck and foot, cable into the foot | 1.5k | **Screen = live texture** cycling the featured project; click → 01 |
| Main keyboard | Case + 70 individual chamfered keycaps, two-tone (beige + charcoal modifiers), coiled cable to a hub | 10k, **instanced** | Keys dip on idle typing |
| Mouse | Smooth egg shell, split line, scroll wheel, cable (done in the study) | 1k | — |
| Retro computer | Case with floppy slot and LED, CRT with recessed glass, back hump, its own keyboard | 3k | Terminal lines scroll (a texture loop) |
| Desk lamp | Base, two-segment arm with joints, smooth cone shade facing down (done in the study) | 1k | Click → toggle (easter egg, optional) |
| Chair | Five-star base with casters, gas lift, chamfered seat and back, armrests | 2k | Swivels with the character |
| Props | Mug with handle, pen tablet + stylus, sketchbook, pencil cup with pencils, desk plant (spiral leaves), speakers | 4k total | — |
| Shelf + books | Oak board, ~30 books in leaning groups and a flat stack, abstract spine marks | 4k, instanced | (station 05) |

### 02 Project wall
Five or six frames (oak profile, off-white mat, real `hero.png` prints), a ledge with a colour swatch card. About 1k tris. Hover lifts a frame 1 cm; click opens that project.

### 03 Arcade cabinet
Our own side profile (extruded), screen leaning back with the cabinet slope, the "ASTROX" marquee (final font: Barlow Condensed, OFL), a control panel with two sticks and buttons, coin door, warm edge trim. About 4k tris. The screen plays an Astrox attract loop (WebM, about 10 s, muted, decoded only when visible). "Play" → `/play/astrox`.

### 04 Pinboard
Framed cork board, eight notes with abstract scribble lines and push pins. About 1k tris. Each note opens an About section.

### 05 Skills shelf
The book shelf above the desk is station 05. Hover labels name the skill groups (text from the site content, no software logos).

### Room shell and lounge
Slab and walls with cut edges, cove cornices with LED tubes, walnut slat panel (22 slats, instanced), plank floor, tiled accent rug, sofa with cushion, tripod floor lamp, side table with books, bin, floor plant. About 15k tris.

---

## 7. Character

| Aspect | Spec |
|---|---|
| Style | **Matches the props:** faceted lowpoly head and hands, chamfered clothing volumes, simple hair mass. No realistic face; the likeness comes from silhouette (hair, glasses, build, clothes) |
| Build | Hand-built in Blender on an **MPFB2** base (CC0 assets; the add-on's GPL covers only the tool), decimated and re-topologised to the lowpoly style |
| Budget | ≈ 6k tris, one small palette texture, ≤ 30 bones |
| Clips | `idle_type`, `glance`, `turn_to_visitor`, `shoo` (ported from the hero room), `point`, `seated_still` (reduced motion) |
| Runtime | Animation mixer. Head turns toward the cursor within limits. HTML speech bubble using `ROOM_PHRASES` |
| Animation source | Hand-keyed in Blender (decided). Neutral designer, no likeness |

The seated pose must keep the head and shoulders visible above the chair back from the overview camera (the chair back was lowered for this).

**Built (2026-11-02, checkpoint 1):** [art/blender/character.py](../art/blender/character.py), called by `studio.py` (`character.build(parent=chair)`). A neutral designer: short dark hair with a quiff, round glasses, slate-blue hoodie (`#36475A`) with hood, drawstrings and pocket, dark trousers, off-white sneakers. Made of **rigid faceted parts** (head, neck, torso, upper arms, forearms, hands, thighs, shins, shoes) modelled in the seated typing pose at the real chair and desk heights. Each part will ride one bone, so hand-keyed motion never deforms a mesh.
- Turnaround: `blender -b --factory-startup --python art/blender/studio.py -- <prefix> 128 src/content/projects --turnaround` writes four views (front, three-quarter, side, back), stitched with sharp into `art/renders/character-turnaround.png`.
- In the room: `art/renders/character-in-scene.png`, `overview-with-character.png`. In Cycles the desk lamp is light-linked away from the character (its bulb is 35 cm from the shoulder and blew it to white). A gentler warm light lights only the character; the runtime will mirror this with one real-time warm light.
- **Design approved by Aron (2026-11-02).**
- **Rig:** 14 bones (root, spine, chest, neck, head; upper arm, forearm and hand per side). Parts are parented rigidly to bones, with no skinning; sides are anatomical (its right is −X; it faces −Y).
- **Clips (hand-keyed, 30 fps):** `type` (2 s loop: hands tap in turn, breath, small nod), `notice_r`/`notice_l` (looks over that shoulder, hands off the keys), `shoo_r`/`shoo_l` (1.5 s: elbow out, forearm up, hand flicks outward three times), `still` (reduced motion). Poses are written as character-space rotations or as **aimed bone directions** (`{"aim": dir}`), so a forearm can point "up" whatever the upper arm is doing. `_l` clips are generated by mirroring.
- **Preview:** `... studio.py -- <prefix> 24 src/content/projects --clips` renders key frames from the room camera and from the front.
- **Export:** `... studio.py -- src/studio/assets 16 src/content/projects --character` writes `character.glb` (46 parts, about 1.8k triangles, 218 KB) with the six clips and two light markers.
- **Runtime** ([src/studio/StudioCharacter.ts](../src/studio/StudioCharacter.ts)): the hero room's behaviour with the same `ROOM_CONFIG` and `ROOM_PHRASES`. *idle* (typing) → *notice* (cursor within 2.2 head-heights of the head for 160 ms, almost touching him (Aron): turns toward the cursor's side, the head follows it. The side is judged from where his head was when he noticed, with a 0.6 head-height dead zone and a 450 ms hold, so a cursor right above him no longer flips him left and right: fixed 2026-11-03) → *shoo* (within 1.1 head-heights: shoo clip plus an HTML speech bubble; cooldown doubles if pestered) → *ignore* (back to work for 1 s). Lit live by a warm point light at the lamp marker, a faint cool one at the monitor and a warm hemisphere; AgX tone mapping applies to the character only. Reduced motion: `still`, no behaviour. Touch: typing only.
- **Bench switches:** `?cursor=x,y` (virtual cursor in canvas pixels) and `?clip=name@seconds` (freeze a clip) for headless checks.
- **Known follow-ups:** the character casts no shadow on the baked desk; at station 01 it covers part of the keyboard (the camera could sit a little higher there).

---

## 8. Interaction design

- **Objects are the navigation.** On hover: pointer cursor, a soft accent outline around the object, a label chip ("03 · Arcade"), and a small physical response (frame lifts, joystick tilts, lamp flickers).
- **First visit:** the camera eases in from slightly wider; the character turns and nods; the cove strips brighten once, left to right. Skipped under reduced motion.
- **Keyboard:** every object has a real `<button>` in a DOM layer over its screen position. Tab runs 01→06, ← → step between stations, 1–6 jump, Esc returns to the overview. The dock is always visible as a second menu.
- **Screen readers:** the canvas is `aria-hidden`; the DOM layer and panels carry all content. A "List view" link goes to the editorial content.
- **Touch:** tap = select. Hit areas are at least 44 px. On phones the dock is the main control, and the camera starts closer.
- **Cursor spotlight on the ground (Aron, 2026-11-02, after daniels-architects.com):** when the mouse is over the floor *outside* the room, a soft **cool (bluish) glow** follows it and reveals a faint 0.5 m grid lying on the ground plane, so the lines share the room's iso angle. No warm centre (Aron, 2026-11-02). The floor is effectively endless (a 400 m plane; the baked shadow is mapped by world position and fades into the page), so no edge ever shows. Mouse only (no touch). Under reduced motion it follows the cursor without easing. The room's bounding box hides it over the diorama.
- **Room turns toward the cursor (Aron, 2026-11-02):** the camera orbits up to 6° around the vertical axis following the mouse's horizontal position, so the room turns toward the side the cursor is on (less at close-ups, eased). Mouse only; none under reduced motion. The baked reflections stay believable at this small angle.
- **Highlight:** hover and keyboard focus show a clean accent **frame** just outside the monitor bezel, plus the label chip. It hides while the station is open. (An inflated back-face outline was tried and rejected: it broke into slivers around the stand.) Hover comes from the DOM button over the object, which is also the keyboard route.

---

## 9. External assets and licensing

| Source | Licence | Use | Decision |
|---|---|---|---|
| Blender 4.5 | GPL (tool only) | Modelling, baking | ✅ Outputs are ours |
| MPFB2 / MakeHuman base assets | CC0 (assets), GPL (add-on) | Character base | ✅ verify each asset at download |
| Poly Haven / ambientCG | CC0 | Only if a texture is needed (maybe floor detail) | ✅ optional |
| Mixamo | Adobe terms | — | ❌ Not used (hand-keyed instead) |
| Barlow Condensed | SIL OFL | Arcade marquee | ✅ (the study uses Blender's default font) |
| Project screenshots, Astrox art and music | Aron's (rights confirmed 2026-10-09) | Screens, frames, arcade | ✅ |
| Low-poly asset packs (Kenney, Quaternius, Sketchfab) | various | — | ❌ Not needed. Everything is scripted to one consistent style |

**Trademarks:** no real product silhouettes or logos (the beige computer, monitor, chair and arcade are generic), no software logos, no film posters or other people's game art. The first reference's posters and arcade game were deliberately not reused.

**Content honesty:** pinboard notes and spines stay abstract unless Aron supplies real material. No invented sketches attached to real projects.

---

## 10. Performance budget and fallbacks

| Budget | Desktop | Mobile |
|---|---|---|
| JS (three + scene code), gzip | ≤ 230 KB, lazy-loaded on `/interactive` only | same |
| Scene download (GLB + lightmaps + screen images) | ≤ 3 MB | ≤ 2 MB (half-res lightmaps) |
| Triangles | ≤ 60k | same |
| Draw calls | ≤ 80 (merge by material, instance repeats) | ≤ 60 |
| Real-time shadows | 1 (character) | 0 (baked) |
| Target | 60 fps on integrated GPUs | 30+ fps on mid-range phones |

- **Dependencies:** `three` (MIT, approved). Loaders, meshopt decoding and post-processing come from `three/examples`. Dev only: `@gltf-transform/cli`, vetted with `vet-dependency` before install.
- **Reduced motion:** camera cuts with a short crossfade; character holds `seated_still`; no idle loops, pulses or video.
- **No WebGL, low memory or Save-Data:** the pre-rendered `iso-study`-style still with the same DOM buttons on top, so all six stations still work.

---

## 11. Milestones

| # | Milestone | Review checkpoint |
|---|---|---|
| 0 | Direction and look | ✅ Look approved 2026-11-02 |
| **1** | **Workstation benchmark**: the 01 assets at final detail (§6), the room shell, the full lighting rig and bake. Deliverables: (a) a Cycles still at the station-01 camera, (b) the same corner live in Three.js on a scratch route (`/interactive/bench`, not linked), with the monitor showing projects, hover/focus on the monitor, and the overview → 01 camera move | You judge it in the browser at desktop and 390 px. Everything after must match it |
| 2 | Character: turnaround → rig and clips → seated at the desk | Turnaround review before rigging |
| 3 | Remaining stations to benchmark detail; full-room bake | One combined review |
| 4 | Selector screen, `/interactive` route, panels, dock, fallbacks, performance, accessibility, security and licence pass | Full visual check (desktop, 390 px, full and reduced motion) |

**Milestone 1 acceptance criteria**
1. At the 01 close-up, every hard edge shows a chamfer highlight; no stretched or unbevelled boxes.
2. The browser version matches the Cycles still in mood: same warm pools, same darkness, no blown highlights (side-by-side screenshot).
3. Keycaps read as individual caps at the 01 shot.
4. Contact shadows under the keyboards, mouse, mug, lamp and monitor foot (baked).
5. Nothing floats or overhangs the desk (checked with close-up renders).
6. 60 fps on this machine and within §10 budgets; the bench route lazy-loads `three`.
7. The monitor station is reachable and selectable by keyboard, with a visible focus state.

---

## 11a. Milestone 1 result (2026-11-02)

| Criterion | Result |
|---|---|
| 1. Chamfer highlights, no raw boxes at the 01 shot | ✅ see `art/renders/station-01-cycles.png` |
| 2. Browser matches the Cycles still | ✅ Same pools, darkness and baked reflections (headless side-by-side). Aron to confirm on his screen |
| 3. Keycaps read individually | ✅ |
| 4. Contact shadows under keyboard, mouse, mug, lamp, monitor foot | ✅ baked |
| 5. Nothing floats or overhangs | ✅ (fixed in look-dev: items moved onto the desk) |
| 6. 60 fps, within budget, three lazy-loaded | Budget ✅: 14k triangles, ~5 draw calls, three chunk 156 KB gzip, only on this route. Headless software rendering reaches 38–46 fps; **real-GPU fps to confirm in Aron's browser** (counter bottom-left) |
| 7. Monitor reachable by keyboard with visible focus | ✅ Tab → accent outline + chip; Enter opens; focus moves into the panel; Esc returns focus to the monitor |

**Bench switches (screenshots only):** `?station=01` opens the panel; `?spot=x,y` pins the ground spotlight at a Blender floor position; `?tilt=-1..1` holds the room turned as if the mouse were left or right. All are validated.
**Known follow-ups:** the atlas still spends space on the floor under the rug and on very small islands; the cove strip renders without bloom (matches Cycles); the "List view" and the dock come with Milestone 4.

## 11b. Milestone 3: six stations (2026-11-02)

- **Bake:** `studio.py --bake` now splits the stations into their own meshes in the same atlas: `monitor`, `st_projects` (frames, ledge, swatch), `st_arcade` (cabinet; its screen stays live), `st_pinboard`, `st_shelf` (books and speakers), `st_phone` (phone and letter tray). Everything else stays in `static`.
- **Station table:** [src/studio/stations.ts](../src/studio/stations.ts) holds each station's number, label, meshes and close-up camera. It is the one place to retune a framing.
- **Pointer:** mouse and touch hit-test the station meshes (small, cheap) on the canvas; hover shows the pointer cursor, the label chip and the outline; a click or tap opens the station. The DOM buttons over each station are for keyboards and screen readers only (`pointer-events: none`).
- **No-hover screens (phones, tablets; `(hover: hover) and (pointer: fine)` fails):** every station shows a softer outline (60%) and its label chip at all times in the overview; the chips are tap targets too (44 px hit area) and are laid out to stay on screen and clear of each other. The open panel gets a prev / next row at its foot, naming the neighbouring stations, in place of the "← → / Esc" hint. Bench switch `?touch=1` forces this under a mouse. **Leader lines** (Aron, 2026-11-03): a 1 px `--text-2` hairline runs from each label's bottom edge to a small dot at the middle of its object, so labels stacked on a 390 px screen still point at their objects. They are drawn under the labels.
- **Outline:** a silhouette for any shape. The hovered station is drawn white into a mask (render layer 1), and a full-screen pass paints a 3 px accent line just outside the mask's edge. This replaced the monitor's rectangular frame, so all six stations highlight the same way.
- **Keyboard:** Tab runs 01→06; 1–6 open a station from anywhere; ← → step between stations while one is open; Esc returns to the room and gives focus back to that station's button.
- **Panels** ([src/studio/StationPanel.tsx](../src/studio/StationPanel.tsx)), all from `src/content`: 01 the featured project on the monitor; 02 every project (number, title, role) plus the index link; 03 Astrox with Play and case study; 04 the About quote and paragraphs plus résumé; 05 disciplines in use, every tool named in the projects' stacks (most used first) and the training list; 06 email, LinkedIn and résumé.
- **Bench switches:** `?station=01..06` opens a panel; `?outline=01..06` shows a hover outline.

## 11c. Milestone 4: selector, route, dock, fallback (2026-11-03)

- **URLs (Aron):** only the home page moves. `/` is the selector, `/editorial` the editorial home, `/interactive` the studio. `/work`, `/work/<slug>` and `/play/<slug>` keep their URLs, so résumé, LinkedIn and preview links still work.
- **Selector** ([src/pages/ChoosePage.tsx](../src/pages/ChoosePage.tsx), Aron chose split halves): a slim header (the Intro hands its logo off into this mark), then two full-height halves that are plain links: 01 Interactive on the left (top on phones), 02 Editorial on the right (Aron, 2026-11-03). Editorial shows its selected work as screenshots (the `featured` projects, up to four; two on phones), from 1024 × 640 `-card.webp` copies that `scripts/thumbs.mjs` writes beside the hero-wall thumbs (Aron, 2026-11-03: images, not a text list). Interactive shows the overview render fading out above its copy. Hovering a half widens it (full motion only). Hovering or focusing the studio half starts loading its chunk.
- **Saved choice, once per session** (Aron, 2026-11-03: like the intro, not persisted): every link that switches experience calls `saveExperience()` (`ajc-experience` in sessionStorage), so a new tab or browser session meets the selector again. The inline script also deletes the old localStorage copy. The inline script in `index.html` rewrites `/` to the saved experience before the app reads the URL, so the selector never flashes; `/?choose` always shows it. Switch links: the studio's "Editorial site" (top-left), and on the editorial side a floating accent-filled "3D studio" pill (dark text, like `.btn--primary`) at the bottom-right of every page except the game player, whose touch controls sit at the bottom (Aron, 2026-11-03; `components/shell/StudioSwitch`).
- **Chrome:** the site header and footer render only on editorial pages. The selector and the studio are full screen with their own UI.
- **Station dock:** bottom-left on desktop, a numbered list of the six stations; the open one gets an accent number and a bar (not colour alone). Hovering an entry outlines its object. Choosing the open station closes it, and Esc returns focus to the dock entry when the dock opened it. On phones it is a pill row of 44 px numbers (names stay in the accessible name) with the bottom-sheet panel above it.
- **Picture fallback:** no WebGL 2, a failed load, Save-Data or `deviceMemory` ≤ 2 show the overview render (edges feathered into the page) with a short note; panels and the dock work as usual. Save-Data and low memory also get a "Load the 3D studio (about 2.5 MB)" button. Switch: `?still=1`. The still is a `sharp` resize of `art/renders/overview-with-character.png` to 1600 and 800 px WebP at quality 80 (64 KB and 26 KB) in `src/studio/assets/`; redo it after a new bake.
- **Nav:** the editorial "Playground" item is now "Games". The fps counter only shows with `?fps=1`.

### Milestone 4 passes (2026-11-03)

- **Security:** `npm audit` 0 vulnerabilities, all 40 packages signature-verified. No secrets or `.env` files in the new work. No `innerHTML` or `eval` in the studio; the one external link (LinkedIn) has `rel="noreferrer"`; URL switches are validated against allowlists and ranges. `art/blender/__pycache__` is now gitignored.
- **Content Security Policy (shipped 2026-11-03, `scripts/pages.mjs`; checked with 0 violations on the selector, editorial, studio, a case study and the game page):** a `<meta>` policy written at build time, so the inline script's hash always matches:
  `default-src 'self'; script-src 'self' 'sha256-<inline script>'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; media-src 'self'; frame-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'none'; upgrade-insecure-requests`.
  The studio needs nothing beyond `'self'`: `fetch` for the GLBs (`connect-src`), images and canvas textures, no workers or WASM decoders. React's `style={…}` goes through the CSSOM, which `style-src` doesn't block. The PICO-8 player is a same-origin iframe (`frame-src 'self'`) with its own document, so the parent policy doesn't reach its inline scripts. `frame-ancestors` can't be set from a meta tag on GitHub Pages.
- **Licences:** `three` (MIT) is in `scripts/licenses.mjs` and `public/third-party-licenses.txt`. Blender (GPL) is a tool only. The baked "ASTROX" marquee is set in **Barlow Condensed SemiBold** (OFL) since 2026-11-03: `art/blender/fonts/` holds a TTF converted from the Fontsource WOFF by `woff-to-ttf.mjs` (Blender can't read web fonts; the OFL allows format conversion) and the licence. It is used only at bake time, as rendered pixels; no font file ships from there.
- **Performance:** the studio chunk is 168 KB gzip (budget 230 KB) and loads only on `/interactive` (or early, when the selector's studio half is hovered or focused). The monitor and arcade screens now use the 1024 × 640 `-card.webp` copies instead of the full hero PNGs (0.5–1 MB each), so the whole studio download is about 2.1 MB of assets plus the code: within the 3 MB desktop budget. Phones (`max-width: 719px`) load `studio-bake-2048.jpg`, a half-resolution atlas (0.4 MB instead of 1.3 MB), so a phone downloads about 1.2 MB: within the 2 MB target (2026-11-03). Leaving the studio now frees the WebGL context at once (`forceContextLoss`), since browsers keep only about 16 alive. **Real-GPU frame rate still to confirm in Aron's browser** (`?fps=1`).
- **Accessibility:** see the visual check in full and reduced motion (desktop, 390 px). Every station is reachable three ways (objects, Tab-order buttons, dock); the dock marks the open station with a bar and accent number, not colour alone; phone targets are 44 px; the canvas is `aria-hidden`; loading and fallback notes are live regions. **A real screen-reader run (NVDA) through the panels and dock is still to do by hand.**

## 12. Decisions (Aron, 2026-11-02)

1. **Plan approved.** Milestone 1 started.
2. **Contact station (06):** a **retro desk phone** (with a letter tray) on the side table in the foreground. Station 06 target: the side table, ortho scale ≈ 1.2.
3. **Character:** a **neutral designer** (no likeness). Animation is **hand-keyed** in Blender with simpler motion. No Mixamo.
4. **Pinboard and notes:** **abstract** marks only.
