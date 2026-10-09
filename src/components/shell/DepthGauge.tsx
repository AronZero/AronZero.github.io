import { useEffect, useRef, useState } from 'react';
import { Link } from '../../router/Router';
import styles from './DepthGauge.module.css';

export interface GaugeLayer {
  /** Element id of the section. */
  id: string;
  num: string;
  name: string;
}

/**
 * The Strata navigation layer: a depth gauge on the right edge (desktop) and a
 * slim layer bar under the header (below 1100px). Tracks the section crossing
 * the middle of the viewport.
 */
export function DepthGauge({ layers }: { layers: readonly GaugeLayer[] }) {
  const [active, setActive] = useState(layers[0]?.id ?? '');
  const fillRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    layers.forEach((l) => {
      const el = document.getElementById(l.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [layers]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      fillRef.current?.style.setProperty('--progress', String(max > 0 ? window.scrollY / max : 0));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const current = layers.find((l) => l.id === active) ?? layers[0];
  if (!current) return null;
  const total = layers[layers.length - 1]?.num ?? '';

  return (
    <>
      <nav className={styles.gauge} aria-label="Sections on this page">
        <ol role="list">
          {layers.map((l) => (
            <li key={l.id}>
              <Link to={`#${l.id}`} aria-current={l.id === active ? 'location' : undefined}>
                <span className={styles.text}>
                  <span>{l.num}</span>
                  <span className={styles.name}>{l.name}</span>
                </span>
                <span className={styles.tick} />
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      <div className={styles.bar} aria-hidden="true">
        <div className={`wrap ${styles.barInner}`}>
          <span className="t-label">
            <span className="c-accent">{current.num}</span> / {total} — <span className="c-1">{current.name}</span>
          </span>
        </div>
        <span ref={fillRef} className={styles.fill} />
      </div>
    </>
  );
}
