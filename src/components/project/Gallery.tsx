import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react';
import type { ProjectImage } from '../../content';
import { useMotionPreference } from '../../hooks/useMotionPreference';
import { col } from '../Reveal';
import styles from './Gallery.module.css';

/** 'pairs' (square game screenshots) always sets two side by side. */
type GalleryLayout = 'editorial' | 'pairs';

/** Layout chosen by image count: 1 inset, 2 a pair, 3+ a repeating wide / pair rhythm. */
function placement(i: number, count: number, layout: GalleryLayout): CSSProperties {
  if (layout === 'pairs') return count === 1 ? col('3 / 11') : i % 2 === 0 ? col('1 / 7') : col('7 / 13');
  if (count === 1) return col('2 / 12');
  if (count === 2) return i === 0 ? col('1 / 7') : col('7 / 13');
  const slot = i % 3;
  if (slot === 0) return col('1 / 13');
  const isLastAlone = slot === 1 && i === count - 1;
  if (isLastAlone) return col('3 / 11');
  return slot === 1 ? col('1 / 7') : col('7 / 13');
}

interface GalleryProps {
  images: readonly ProjectImage[];
  /** Figure numbering prefix, e.g. "02" → "Fig. 02.1". */
  figPrefix: string;
  layout?: GalleryLayout;
}

export function Gallery({ images, figPrefix, layout = 'editorial' }: GalleryProps) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <div className={`grid ${styles.gallery}`}>
        {images.map((img, i) => (
          <figure key={img.src} className={styles.item} style={placement(i, images.length, layout)}>
            <button className={styles.shot} type="button" onClick={() => setOpen(i)} aria-label={`View “${img.caption}”${img.animated ? " animation" : ""} full screen`}>
              <img src={img.src} data-pixel={img.pixel || undefined} alt={img.alt} loading="lazy" decoding="async" />
              {img.animated && <span className={`t-label ${styles.badge}`}><Play className="icon" size={12} aria-hidden="true" /> GIF</span>}
            </button>
            <figcaption className="t-label">Fig. {figPrefix}.{i + 1} — {img.caption}</figcaption>
          </figure>
        ))}
      </div>
      {open !== null && <Lightbox images={images} start={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function Lightbox({ images, start, onClose }: { images: readonly ProjectImage[]; start: number; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(start);
  const swipeX = useRef<number | null>(null);
  const swiped = useRef(false);
  const image = images[index];
  const count = images.length;
  // Animations start playing when opened, unless the visitor prefers reduced motion. Always pausable.
  const { reduced } = useMotionPreference();
  const [playing, setPlaying] = useState(!reduced);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const go = (delta: number) => {
    setIndex((i) => (i + delta + count) % count);
    setPlaying(!reduced);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  };
  const onPointerDown = (e: PointerEvent) => { swipeX.current = e.clientX; };
  const onPointerUp = (e: PointerEvent) => {
    if (swipeX.current === null) return;
    const dx = e.clientX - swipeX.current;
    swipeX.current = null;
    if (Math.abs(dx) > 50) {
      swiped.current = true;
      go(dx < 0 ? 1 : -1);
    }
  };

  if (!image) return null;

  return (
    <dialog
      ref={ref}
      className={styles.lightbox}
      aria-label="Screenshot viewer"
      onClose={onClose}
      onKeyDown={onKeyDown}
      onClick={(e) => {
        if (swiped.current) { swiped.current = false; return; }
        if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.backdrop) ref.current?.close(); }}
    >
      <div className={styles.lbTop}>
        <span className="t-label" aria-live="polite">{index + 1} / {count} — {image.caption}</span>
        <button className="btn btn--secondary btn--sm" type="button" onClick={() => ref.current?.close()} autoFocus>
          Close <X className="icon" size={16} aria-hidden="true" />
        </button>
      </div>
      <div className={styles.lbStage} data-backdrop="true" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        <img
          key={image.src}
          className={styles.lbImage}
          src={image.animated && playing ? image.animated : image.src}
          data-pixel={image.pixel || undefined}
          alt={image.alt}
          draggable={false}
        />
      </div>
      {image.animated && (
        <div className={styles.lbPlay}>
          <button className="btn btn--secondary btn--sm" type="button" onClick={() => setPlaying((p) => !p)}>
            {playing ? <Pause className="icon" size={16} aria-hidden="true" /> : <Play className="icon" size={16} aria-hidden="true" />}
            {playing ? 'Pause animation' : 'Play animation'}
          </button>
        </div>
      )}
      {count > 1 && (
        <div className={styles.lbNav}>
          <button className="btn btn--secondary btn--sm" type="button" onClick={() => go(-1)}>
            <ChevronLeft className="icon" size={16} aria-hidden="true" /> Previous
          </button>
          <span className="t-label">← → keys or swipe</span>
          <button className="btn btn--secondary btn--sm" type="button" onClick={() => go(1)}>
            Next <ChevronRight className="icon" size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </dialog>
  );
}
