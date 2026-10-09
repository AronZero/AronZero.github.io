import { useEffect, useId, useRef, useState, type PointerEvent } from 'react';
import type { ProjectImage } from '../../content';
import { BlueprintImage } from './Blueprint';
import styles from './StructureLens.module.css';

interface StructureLensProps {
  image: ProjectImage;
  /** Text in the frame's address bar, e.g. a domain or "Structure". */
  barLabel: string;
  barNum: string;
}

/**
 * Hover a screenshot to see its generated structure underneath; the slider is
 * the keyboard/touch equivalent. clip-path is set imperatively so pointer
 * movement never re-renders React.
 */
export function StructureLens({ image, barLabel, barNum }: StructureLensProps) {
  const id = useId();
  const lensRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const [split, setSplit] = useState(0);
  const [lensing, setLensing] = useState(false);
  const last = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.style.clipPath = split > 0 ? `inset(0 ${100 - split}% 0 0)` : 'circle(0px at 50% 50%)';
  }, [split]);

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (split > 0 || event.pointerType !== 'mouse') return;
    const lens = lensRef.current, layer = layerRef.current, ring = ringRef.current;
    if (!lens || !layer || !ring) return;
    const box = lens.getBoundingClientRect();
    const x = event.clientX - box.left, y = event.clientY - box.top, r = box.width * 0.15;
    last.current = { x, y };
    layer.style.clipPath = `circle(${r}px at ${x}px ${y}px)`;
    ring.style.width = ring.style.height = `${2 * r}px`;
    ring.style.transform = `translate(${x - r}px, ${y - r}px)`;
    if (!lensing) setLensing(true);
  };

  const onLeave = () => {
    if (split > 0) return;
    setLensing(false);
    const { x, y } = last.current;
    if (layerRef.current) layerRef.current.style.clipPath = `circle(0px at ${x}px ${y}px)`;
  };

  return (
    <div>
      <div className="crop bleed-m">
        <div className="frame">
          <div className="frame__bar" aria-hidden="true"><span>{barNum}</span><span>{barLabel}</span></div>
          <div
            ref={lensRef}
            className={styles.lens}
            data-lensing={lensing || undefined}
            data-split={split > 0 || undefined}
            onPointerMove={onMove}
            onPointerLeave={onLeave}
          >
            <img className="frame__shot" src={image.src} data-pixel={image.pixel || undefined} alt={image.alt} loading="lazy" decoding="async" />
            <BlueprintImage ref={layerRef} src={image.src} data-pixel={image.pixel || undefined} className={styles.layer} />
            <span ref={ringRef} className={styles.ring} aria-hidden="true" />
            <span className={styles.divider} style={{ left: `${split}%` }} aria-hidden="true" />
          </div>
        </div>
        <span className="crop__marks" aria-hidden="true" />
      </div>
      <div className={styles.control}>
        <label className="t-label c-1" htmlFor={id}>Structure lens</label>
        <input
          id={id}
          className="range"
          type="range"
          min={0}
          max={100}
          step={1}
          value={split}
          aria-valuetext={split === 0 ? 'Structure hidden' : `${split}% of the screenshot shows its structure`}
          onChange={(e) => {
            setLensing(false);
            setSplit(Number(e.target.value));
          }}
        />
        <output className="t-label" htmlFor={id}>{split}%</output>
      </div>
    </div>
  );
}
