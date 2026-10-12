/*
 * Hero wall — review sample (not part of the build).
 * Open with the dev server running: http://localhost:5173/style-tile/hero-wall.html
 *
 * The real HeroRoom sits in front; ProjectWall is the prototype behind it. The wall reads
 * the same `projects` list the site uses, so adding a project in src/content/projects.ts
 * adds a tile here on the next reload.
 */
import { StrictMode, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource/barlow-condensed/latin-300-italic.css';
import '@fontsource/barlow-condensed/latin-500.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '../src/styles/index.css';
import './hero-wall.css';

import { projects } from '../src/content';
import { HeroRoom } from '../src/components/hero/HeroRoom';
import { useMotionPreference } from '../src/hooks/useMotionPreference';

/* ───────────────────────── The prototype ───────────────────────── */

type Tile = { key: string; src: string; pixel: boolean };

/** Split into `rows` rows as evenly as possible; earlier rows take the remainder. Empty rows are dropped. */
function splitRows<T>(items: readonly T[], rows: number): T[][] {
  const out: T[][] = [];
  let start = 0;
  for (let r = 0; r < rows; r++) {
    const size = Math.floor(items.length / rows) + (r < items.length % rows ? 1 : 0);
    if (size > 0) out.push(items.slice(start, start + size));
    start += size;
  }
  return out;
}

interface WallProps {
  tiles: readonly Tile[];
  rows: number;
  speed: number; // px per second, the same for every row
}

function ProjectWall({ tiles, rows, speed }: WallProps) {
  const { reduced } = useMotionPreference();
  const wallRef = useRef<HTMLDivElement>(null);
  // Width of the wall and of one tile step (tile + gap), measured so the loop never shows a seam.
  const [size, setSize] = useState({ wall: 0, step: 0 });
  const [active, setActive] = useState(true);

  useLayoutEffect(() => {
    const wall = wallRef.current;
    if (!wall) return;
    const measure = () => {
      const tile = wall.querySelector<HTMLElement>('[data-tile]');
      const step = tile ? tile.getBoundingClientRect().width : 0;
      setSize((s) => (s.wall === wall.clientWidth && s.step === step ? s : { wall: wall.clientWidth, step }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wall);
    return () => ro.disconnect();
  }, []);

  // Off screen or in a background tab, nothing runs (same rule as the room).
  useEffect(() => {
    const wall = wallRef.current;
    if (!wall || reduced) return;
    let inView = true;
    const update = () => setActive(inView && document.visibilityState === 'visible');
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; update(); });
    io.observe(wall);
    document.addEventListener('visibilitychange', update);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, [reduced]);

  const lines = splitRows(tiles, rows);

  return (
    <div ref={wallRef} className="wall" data-active={active} aria-hidden="true">
      <div className="wallRows">
        {lines.map((line, r) => {
          // Repeat the row until one half of the track is at least as wide as the wall, then
          // double it: sliding by exactly half lands on an identical frame.
          const setWidth = line.length * size.step;
          const copies = reduced || !setWidth ? 1 : Math.max(1, Math.ceil(size.wall / setWidth));
          const track = reduced ? line : Array.from({ length: copies * 2 }, () => line).flat();
          const style = { '--dur': `${setWidth && speed ? (setWidth * copies) / speed : 0}s` } as CSSProperties;
          return (
            <div key={r} className="wallRow" data-dir={r % 2 === 0 ? 'ltr' : 'rtl'} style={style}>
              <div className="wallTrack">
                {track.map((t, i) => (
                  <span key={`${t.key}-${i}`} className="wallTile" data-tile>
                    <img src={t.src} alt="" loading="lazy" decoding="async" data-pixel={t.pixel || undefined} />
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── Review harness ───────────────────────── */

/* 240 × 140 WebP thumbs written by scripts/thumbs.mjs (runs before dev/build). */
const realTiles: Tile[] = projects.flatMap((p) => (p.thumb ? [{ key: p.slug, src: p.thumb, pixel: p.kind === 'game' }] : []));

/** Simulate more or fewer projects by cycling the real ones. */
function simulate(count: number): Tile[] {
  if (!realTiles.length) return [];
  return Array.from({ length: count }, (_, i) => ({ ...realTiles[i % realTiles.length], key: `${realTiles[i % realTiles.length].key}~${i}` }));
}

function Preview() {
  const [count, setCount] = useState(realTiles.length);
  const [rows, setRows] = useState(2);
  const [speed, setSpeed] = useState(20);
  const [opacity, setOpacity] = useState<number | null>(null); // null = theme default
  const [theme, setTheme] = useState(document.documentElement.dataset.theme ?? 'dark');
  const [motion, setMotion] = useState(document.documentElement.dataset.motion ?? 'full');
  const [panel, setPanel] = useState(() => window.matchMedia('(min-width: 720px)').matches);

  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => { document.documentElement.dataset.motion = motion; }, [motion]);

  const tiles = count === realTiles.length ? realTiles : simulate(count);
  const stageStyle = opacity === null ? undefined : ({ '--wall-opacity': opacity } as CSSProperties);

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div className="heroTop">
            <p className="t-label">Portfolio — UI/UX Design &amp; Front-end Development</p>
            <p className="t-label">{count} projects · index below</p>
          </div>
          {/* key remounts the room so it picks up a motion change */}
          <div className="stage" style={stageStyle} key={motion}>
            <ProjectWall tiles={tiles} rows={rows} speed={speed} />
            <HeroRoom />
            <h1 className="t-hero name">
              <span className="line">Hey, I’m</span>
              <span className="line">Aron Jay</span>
            </h1>
          </div>
          <div className="strata-lines strata" aria-hidden="true"><i /><i /><i /></div>
        </div>
      </section>

      <aside className="panel" data-open={panel}>
        <button type="button" className="panelToggle" onClick={() => setPanel((v) => !v)} aria-expanded={panel}>
          {panel ? 'Hide controls' : 'Controls'}
        </button>
        {panel && (
          <div className="panelBody">
            <label>
              <span>Projects <b>{count}</b>{count !== realTiles.length && <em> simulated</em>}</span>
              <input type="range" min={1} max={24} value={count} onChange={(e) => setCount(+e.target.value)} />
            </label>
            <label>
              <span>Rows <b>{rows}</b></span>
              <input type="range" min={1} max={3} value={rows} onChange={(e) => setRows(+e.target.value)} />
            </label>
            <label>
              <span>Speed <b>{speed}px/s</b></span>
              <input type="range" min={4} max={60} value={speed} onChange={(e) => setSpeed(+e.target.value)} />
            </label>
            <label>
              <span>Opacity <b>{opacity === null ? 'theme default' : opacity.toFixed(2)}</b></span>
              <input type="range" min={0.04} max={0.6} step={0.01} value={opacity ?? 0.18} onChange={(e) => setOpacity(+e.target.value)} />
            </label>
            <div className="panelRow">
              <button type="button" onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}>Theme: {theme}</button>
              <button type="button" onClick={() => setMotion((m) => (m === 'full' ? 'reduced' : 'full'))}>Motion: {motion}</button>
            </div>
            <div className="panelRow">
              <button type="button" onClick={() => { setCount(realTiles.length); setRows(2); setSpeed(20); setOpacity(null); }}>Reset</button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root');
createRoot(root).render(<StrictMode><Preview /></StrictMode>);
