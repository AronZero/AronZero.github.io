import { useEffect, useId, useRef, useState } from 'react';
import { GLYPHS, VIEWBOX } from './BrandMark';
import styles from './Intro.module.css';

/*
 * First-entry intro: the Strata Signature assembles from three hairlines, then
 * hands off into the header mark while the overlay lifts onto the real hero.
 * Whether it plays is decided before first paint by the inline script in
 * index.html (html[data-intro="play"]): home page, once per browser session,
 * full motion only. Decorative: hidden from assistive tech, never takes focus
 * or clicks. The timeline lives in Intro.module.css; only the handoff is
 * scripted, because it has to measure where the header mark is.
 */

/** When the overlay starts to lift (Intro.module.css .bg delay), and how long the move takes. */
const HANDOFF_AT = 1360;
const HANDOFF_MS = 960;
/** Hard stop, also enforced in CSS, in case the handoff never runs. */
const FAILSAFE_MS = 3200;
const EASE = 'cubic-bezier(.16, 1, .3, 1)';

/** Intro bands: each ends exactly on its hairline (the Stack band stops at the baseline). */
const BANDS = [
  { name: 'surface', y: -2, h: 11.7, line: 9.7 },
  { name: 'structure', y: 11.2, h: 8.5, line: 19.7 },
  { name: 'stack', y: 21.2, h: 11.4, line: 32.6 },
] as const;

export function Intro() {
  const [playing, setPlaying] = useState(() => document.documentElement.dataset.intro === 'play');
  const bgRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<SVGSVGElement>(null);
  const id = 'intro' + useId().replace(/[^a-zA-Z0-9_-]/g, '');

  useEffect(() => {
    if (!playing) return;
    const root = document.documentElement;
    const bg = bgRef.current;
    const mark = markRef.current;
    let move: Animation | null = null;

    const finish = () => {
      // 'done', not removed: the header mark must not replay its own load animation now.
      root.dataset.intro = 'done';
      setPlaying(false);
    };
    const timer = window.setTimeout(finish, FAILSAFE_MS);

    // When the overlay starts to lift, measure both marks (so a late viewport change,
    // like a mobile URL bar, can't throw it off) and move this one into the header slot.
    let handedOff = false;
    const handoff = () => {
      if (handedOff) return;
      handedOff = true;
      const target = document.querySelector('[data-intro-target]');
      if (!mark || !target) return finish();
      try {
        const from = mark.getBoundingClientRect();
        const to = target.getBoundingClientRect();
        const scale = to.height / from.height;
        move = mark.animate(
          [{ transform: 'none' }, { transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${scale})` }],
          { duration: HANDOFF_MS, easing: EASE, fill: 'forwards' },
        );
        move.finished.then(finish, () => {});
      } catch {
        // No Web Animations: the CSS lift and the fail-safe still clear the screen.
      }
    };
    bg?.addEventListener('animationstart', handoff, { once: true });
    // Backup in case the animation event never arrives: the same moment on the overlay's own clock.
    const lift = bg?.getAnimations()[0];
    const elapsed = typeof lift?.currentTime === 'number' ? lift.currentTime : 0;
    const backup = window.setTimeout(handoff, Math.max(0, HANDOFF_AT - elapsed) + 50);

    // Reduced motion switched on mid-intro: stop at once.
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotion = (event: MediaQueryListEvent) => {
      if (event.matches) finish();
    };
    query.addEventListener('change', onMotion);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(backup);
      bg?.removeEventListener('animationstart', handoff);
      query.removeEventListener('change', onMotion);
      move?.cancel();
    };
  }, [playing]);

  if (!playing) return null;

  return (
    <div className={styles.intro} aria-hidden="true">
      <div ref={bgRef} className={styles.bg} />
      <svg ref={markRef} className={styles.mark} viewBox={VIEWBOX} focusable="false">
        <defs>
          <path id={`${id}-g`} d={GLYPHS} />
          {BANDS.map((b) => (
            <clipPath key={b.name} id={`${id}-${b.name}`}>
              <rect x="-6" y={b.y} width="76" height={b.h} />
            </clipPath>
          ))}
        </defs>
        <g className={styles.lines}>
          {BANDS.map((b) => (
            <line key={b.name} className={`${styles.line} ${styles[b.name]}`} x1="-6" x2="68.2" y1={b.line} y2={b.line} />
          ))}
        </g>
        {/* The outer clip stays on the hairline; the same clip on the moving layer keeps only
            that layer's slice, so it rises out of the line. Stack first: built from the foundation up. */}
        {[...BANDS].reverse().map((b) => (
          <g key={b.name} clipPath={`url(#${id}-${b.name})`}>
            <g className={`${styles.band} ${styles[b.name]}`}>
              <use href={`#${id}-g`} clipPath={`url(#${id}-${b.name})`} />
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}
