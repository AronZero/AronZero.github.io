import type { Ref } from 'react';
import styles from './Blueprint.module.css';

/** Edge color per theme: --accent-ink in dark (#F99E35) and light (#A04B08). */
const FILTERS = [
  { id: 'ajc-blueprint', rgb: '0.976  0 0 0 0 0.62  0 0 0 0 0.208' },
  { id: 'ajc-blueprint-light', rgb: '0.627  0 0 0 0 0.294  0 0 0 0 0.031' },
];

/**
 * SVG filters that turn any screenshot into a "structure" reading:
 * grayscale → edge detection (Laplacian) → edges drawn in the accent color.
 * Rendered once in the app shell; Blueprint.module.css picks one per theme.
 */
export function BlueprintDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      {FILTERS.map(({ id, rgb }) => (
        <filter key={id} id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" result="gray" />
          <feConvolveMatrix in="gray" order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" result="edges" />
          <feColorMatrix in="edges" type="matrix" values={`0 0 0 0 ${rgb}  3 3 3 0 -0.08`} />
        </filter>
      ))}
    </svg>
  );
}

/** A blueprint rendering of a screenshot, filling its positioned parent. Decorative. */
export function BlueprintImage({ src, className, ref }: { src: string; className?: string | undefined; ref?: Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className={[styles.blueprint, className].filter(Boolean).join(' ')} aria-hidden="true">
      <svg width="100%" height="100%" preserveAspectRatio="none">
        <image className={styles.edges} href={src} width="100%" height="100%" preserveAspectRatio="none" />
      </svg>
    </div>
  );
}
