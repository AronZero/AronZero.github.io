import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { projects } from '../../content';
import { useMotionPreference } from '../../hooks/useMotionPreference';
import styles from './ProjectWall.module.css';

/** Tunables for the wall behind the hero room. */
export const WALL_CONFIG = {
  rows: 2,
  speed: 20, // px per second, the same for every row
} as const;

interface Tile { slug: string; src: string; pixel: boolean }

const tiles: Tile[] = projects.flatMap((p) => (p.thumb ? [{ slug: p.slug, src: p.thumb, pixel: p.kind === 'game' }] : []));

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

const lines = splitRows(tiles, WALL_CONFIG.rows);

/**
 * Screenshots of every project drift across the back wall of the hero room, one row
 * left to right, the next right to left. Decorative: hidden from assistive tech.
 * Rendered before <HeroRoom /> so the figure, monitor and glow sit in front.
 */
export function ProjectWall() {
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
    const io = new IntersectionObserver(([e]) => { inView = e?.isIntersecting ?? true; update(); });
    io.observe(wall);
    document.addEventListener('visibilitychange', update);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, [reduced]);

  if (!tiles.length) return null;

  return (
    <div ref={wallRef} className={styles.wall} data-active={active} aria-hidden="true">
      <div className={styles.rows}>
        {lines.map((line, r) => {
          // Repeat the row until one half of the track is at least as wide as the wall, then
          // double it: sliding by exactly half lands on an identical frame.
          const setWidth = line.length * size.step;
          const copies = reduced || !setWidth ? 1 : Math.max(1, Math.ceil(size.wall / setWidth));
          const track = reduced ? line : Array.from({ length: copies * 2 }, () => line).flat();
          const style = { '--dur': `${setWidth ? (setWidth * copies) / WALL_CONFIG.speed : 0}s` } as CSSProperties;
          return (
            <div key={r} className={styles.row} data-dir={r % 2 === 0 ? 'ltr' : 'rtl'} style={style}>
              <div className={styles.track}>
                {track.map((t, i) => (
                  <span key={`${t.slug}-${i}`} className={styles.tile} data-tile>
                    <img src={t.src} alt="" width={240} height={140} loading="lazy" decoding="async" data-pixel={t.pixel || undefined} />
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
