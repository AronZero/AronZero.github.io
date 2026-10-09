import { useEffect, useRef, useState, type RefObject } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { DISCIPLINE_LABELS, type Discipline, type Project } from '../../content';
import { useMotionPreference } from '../../hooks/useMotionPreference';
import { Link } from '../../router/Router';
import { paths } from '../../router/routes';
import styles from './ProjectIndex.module.css';

interface FilterProps {
  options: readonly Discipline[];
  active: Discipline | null;
  onChange: (value: Discipline | null) => void;
  total: number;
  shown: number;
}

export function DisciplineFilter({ options, active, onChange, total, shown }: FilterProps) {
  const choices: (Discipline | null)[] = [null, ...options];
  return (
    <div className={styles.filter}>
      <div className="tags" role="group" aria-label="Filter projects by discipline">
        {choices.map((d) => (
          <button key={d ?? 'all'} className="tag" type="button" aria-pressed={active === d} onClick={() => onChange(d)}>
            {d ? DISCIPLINE_LABELS[d] : 'All'}
            <Check className="tag__check" size={14} aria-hidden="true" />
          </button>
        ))}
      </div>
      <p className="t-label" role="status">Showing {shown} of {total} projects</p>
    </div>
  );
}

/** Floating screenshot that trails the cursor over the index (fine pointers only). */
function FloatPreview({ projects, activeSlug, visible, pointer }: {
  projects: readonly Project[];
  activeSlug: string | null;
  visible: boolean;
  pointer: RefObject<{ x: number; y: number }>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced } = useMotionPreference();

  useEffect(() => {
    if (!visible) return;
    const el = ref.current;
    if (!el) return;
    const pos = { ...pointer.current };
    let frame = 0;
    const tick = () => {
      const k = reduced ? 1 : 0.16;
      pos.x += (pointer.current.x - pos.x) * k;
      pos.y += (pointer.current.y - pos.y) * k;
      const w = el.offsetWidth, h = el.offsetHeight;
      let x = pos.x + 32;
      if (x + w > window.innerWidth - 16) x = pos.x - w - 32;
      const y = Math.min(Math.max(pos.y - h / 2, 16), window.innerHeight - h - 16);
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [visible, reduced, pointer]);

  return (
    <div ref={ref} className={styles.float} data-visible={visible || undefined} aria-hidden="true">
      <div className={styles.floatInner}>
        {projects.map((p) => p.hero && (
          <div key={p.slug} className="frame" hidden={p.slug !== activeSlug}>
            <img className="frame__shot" src={p.hero.src} data-pixel={p.hero.pixel || undefined} alt="" decoding="async" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Monograph-style contents list of projects. */
export function ProjectIndex({ projects, headingLevel = 'h3' }: { projects: readonly Project[]; headingLevel?: 'h2' | 'h3' }) {
  const Title = headingLevel;
  const pointer = useRef({ x: 0, y: 0 });
  const [hovered, setHovered] = useState<string | null>(null);
  const [armed, setArmed] = useState(false); // render preview images only after first hover
  const canPreview = () => window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 720px)').matches;

  return (
    <div
      onPointerMove={(e) => { pointer.current = { x: e.clientX, y: e.clientY }; }}
      onPointerLeave={() => setHovered(null)}
    >
      <ol className={styles.index} role="list">
        {projects.map((p, i) => (
          <li key={p.slug} className={styles.row} data-side={i % 2 ? 'end' : 'start'}>
            <Link
              to={paths.project(p.slug)}
              onPointerEnter={(e) => {
                if (!canPreview()) return;
                pointer.current = { x: e.clientX, y: e.clientY };
                setArmed(true);
                setHovered(p.slug);
              }}
            >
              {p.hero && (
                <span className={`frame ${styles.thumb}`} aria-hidden="true">
                  <img className="frame__shot" src={p.hero.src} data-pixel={p.hero.pixel || undefined} alt="" loading="lazy" decoding="async" />
                </span>
              )}
              <span className={styles.num}>{p.number}</span>
              <Title className={styles.title}>{p.title}</Title>
              <span className={styles.role}>{p.role}</span>
              <span className={styles.stack}>{p.stack.join(' / ') || DISCIPLINE_LABELS[p.disciplines[0] ?? 'web-design']}</span>
              <ArrowRight className={styles.arrow} size={18} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>
      {armed && <FloatPreview projects={projects} activeSlug={hovered} visible={hovered !== null} pointer={pointer} />}
    </div>
  );
}
