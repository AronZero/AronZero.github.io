import { useId } from 'react';
import styles from './BrandMark.module.css';

/*
 * Strata Signature — the initials AJC cut into three layers, like the site:
 * Surface, Structure (displaced, in the spot color) and Stack.
 * Glyphs are outlined from Barlow Condensed 600 (SIL Open Font License 1.1),
 * cap height 32.2 units. The source geometry and the favicon live in DESIGN.md → Logo.
 */
export const GLYPHS =
  'M14.44 31.69L13.57 26.86Q13.57 26.63 13.29 26.63L6.58 26.63Q6.3 26.63 6.3 26.86L5.43 31.69Q5.38 32.2 4.83 32.2L0.64 32.2Q0 32.2 0.14 31.6L6.95 0.51Q7.04 0 7.54 0L12.42 0Q12.93 0 13.02 0.51L19.83 31.6L19.83 31.79Q19.83 32.2 19.32 32.2L15.04 32.2Q14.49 32.2 14.44 31.69ZM7.36 22.45L12.47 22.45Q12.74 22.45 12.7 22.22L10.03 7.68Q9.98 7.54 9.89 7.54Q9.8 7.54 9.75 7.68L7.13 22.22Q7.08 22.45 7.36 22.45ZM20.75 24.24L20.75 20.84Q20.75 20.61 20.91 20.45Q21.07 20.29 21.3 20.29L25.54 20.29Q25.77 20.29 25.93 20.45Q26.09 20.61 26.09 20.84L26.09 24.33Q26.09 25.94 26.96 26.96Q27.84 27.97 29.26 27.97Q30.69 27.97 31.59 26.96Q32.48 25.94 32.48 24.33L32.48 0.55Q32.48 0.32 32.64 0.16Q32.8 0 33.03 0L37.27 0Q37.5 0 37.66 0.16Q37.82 0.32 37.82 0.55L37.82 24.24Q37.82 28.01 35.45 30.29Q33.08 32.57 29.26 32.57Q25.44 32.57 23.1 30.29Q20.75 28.01 20.75 24.24ZM41.78 23.92L41.78 8.23Q41.78 4.28 44.15 1.96Q46.52 -0.37 50.43 -0.37Q54.38 -0.37 56.78 1.96Q59.17 4.28 59.17 8.23L59.17 8.79Q59.17 9.02 59.01 9.2Q58.85 9.38 58.62 9.38L54.34 9.57Q53.79 9.57 53.79 9.02L53.79 7.87Q53.79 6.26 52.87 5.24Q51.95 4.23 50.43 4.23Q48.96 4.23 48.04 5.24Q47.12 6.26 47.12 7.87L47.12 24.33Q47.12 25.94 48.04 26.96Q48.96 27.97 50.43 27.97Q51.95 27.97 52.87 26.96Q53.79 25.94 53.79 24.33L53.79 23.18Q53.79 22.95 53.95 22.79Q54.11 22.63 54.34 22.63L58.62 22.82Q58.85 22.82 59.01 22.98Q59.17 23.14 59.17 23.37L59.17 23.92Q59.17 27.83 56.78 30.2Q54.38 32.57 50.43 32.57Q46.52 32.57 44.15 30.2Q41.78 27.83 41.78 23.92Z';

/** Mark box: cap top to baseline plus a little room for the C overshoot. Shared with Intro. */
export const VIEWBOX = '0 -0.5 62.2 33.2';

/** Layer cuts in mark units (cap top = 0, baseline = 32.2). Gaps never cross the A crossbar. */
export const BANDS = [
  { y: -2, h: 11.7 },   // Surface
  { y: 11.2, h: 8.5 },  // Structure
  { y: 21.2, h: 14 },   // Stack
] as const;

type Props = {
  className?: string | undefined;
  /** 'mono' drops the spot color (footer, small print). */
  tone?: 'spot' | 'mono';
  /** Layers settle into place once when the page loads (full motion only).
   *  On first entry the Intro hands off into this mark instead (data-intro-target). */
  intro?: boolean;
};

export function BrandMark({ className, tone = 'spot', intro = false }: Props) {
  // useId() can contain characters that break url(#…) references.
  const id = 'bm' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const layerClass = [styles.surface, styles.structure, styles.stack];
  return (
    <svg
      className={[styles.mark, tone === 'mono' && styles.mono, intro && styles.intro, className].filter(Boolean).join(' ')}
      viewBox={VIEWBOX}
      data-intro-target={intro || undefined}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <path id={`${id}-g`} d={GLYPHS} />
        {BANDS.map((b, i) => (
          <clipPath key={i} id={`${id}-${i}`}>
            <rect x="-6" y={b.y} width="76" height={b.h} />
          </clipPath>
        ))}
      </defs>
      {BANDS.map((_, i) => (
        <g key={i} className={layerClass[i]}>
          <use href={`#${id}-g`} clipPath={`url(#${id}-${i})`} />
        </g>
      ))}
    </svg>
  );
}
