import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { DISCIPLINE_LABELS, type Project } from '../../content';
import { useMotionPreference } from '../../hooks/useMotionPreference';
import { Link } from '../../router/Router';
import { paths } from '../../router/routes';
import { col } from '../Reveal';
import { BlueprintImage } from './Blueprint';
import styles from './StrataScene.module.css';

const STEPS = [
  { num: '02', name: 'Surface' },
  { num: '03', name: 'Structure' },
  { num: '04', name: 'Stack' },
] as const;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/**
 * The signature scroll-driven transition: a pinned stack where the Surface
 * layer lifts away to reveal Structure, then Stack. Scroll position drives
 * two CSS variables (--t1, --t2); CSS does the rest. Reduced motion shows
 * the three layers stacked, with no pinning.
 */
export function StrataScene({ project, id }: { project: Project & { hero: NonNullable<Project['hero']> }; id: string }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const { reduced } = useMotionPreference();

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (reduced) {
      scene.style.removeProperty('--t1');
      scene.style.removeProperty('--t2');
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const box = scene.getBoundingClientRect();
      if (box.bottom < -vh || box.top > vh * 2) return;
      const p = clamp01(-box.top / Math.max(1, box.height - vh));
      const t1 = easeOut(clamp01((p - 0.1) / 0.32));
      const t2 = easeOut(clamp01((p - 0.55) / 0.32));
      scene.style.setProperty('--t1', t1.toFixed(4));
      scene.style.setProperty('--t2', t2.toFixed(4));
      const next = t1 < 0.5 ? 0 : t2 < 0.5 ? 1 : 2;
      setStep((prev) => (prev === next ? prev : next));
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
  }, [reduced]);

  const domain = project.url ? new URL(project.url).hostname.replace(/^www\./, '') : project.slug;

  return (
    <div ref={sceneRef} id={id} className={styles.scene} aria-labelledby={`${id}-title`}>
      <div className={styles.sticky}>
        <div className="wrap">
          <div className={`grid ${styles.grid}`}>
            <div style={col('1 / 5')}>
              <p className="t-label">How to read a project</p>
              <h2 id={`${id}-title`} className={`t-h3 ${styles.title}`}>
                Every project, <em>in layers.</em>
              </h2>
              <ol className={styles.steps} role="list">
                {STEPS.map((s, i) => (
                  <li key={s.name} data-active={!reduced && i === step ? '' : undefined}>
                    <span className="t-label">{s.num}</span>
                    <span className={styles.stepName}>{s.name}</span>
                    <span className={`t-label ${styles.now}`}>Viewing</span>
                  </li>
                ))}
              </ol>
              <Link className={`arrow-link ${styles.open}`} to={paths.project(project.slug)}>
                <span>Open {project.title}</span>
                <ArrowRight className="icon icon--right" size={16} aria-hidden="true" />
              </Link>
            </div>

            <div style={col('6 / 13')}>
              <div className={styles.stage}>
                <div className={`${styles.card} ${styles.card1}`}>
                  <div className="frame">
                    <div className="frame__bar" aria-hidden="true"><span>02</span><span>Surface · {domain}</span></div>
                    <img className="frame__shot" src={project.hero.src} data-pixel={project.hero.pixel || undefined} alt={project.hero.alt} loading="lazy" decoding="async" />
                  </div>
                </div>
                <div className={`${styles.card} ${styles.card2}`}>
                  <div className="frame">
                    <div className="frame__bar" aria-hidden="true"><span>03</span><span>Structure · generated from the screenshot</span></div>
                    <div className={styles.blueprintBox}>
                      <img className={`frame__shot ${styles.sizer}`} src={project.hero.src} data-pixel={project.hero.pixel || undefined} alt="" aria-hidden="true" loading="lazy" decoding="async" />
                      <BlueprintImage src={project.hero.src} data-pixel={project.hero.pixel || undefined} />
                    </div>
                  </div>
                </div>
                <div className={`${styles.card} ${styles.card3}`}>
                  <div className="frame">
                    <div className="frame__bar" aria-hidden="true"><span>04</span><span>Stack</span></div>
                    <div className={styles.spec}>
                      <div>
                        <p className="t-label c-accent">Nº {project.number} — Stack</p>
                        <p className={`t-h3 ${styles.specTitle}`}>{project.title}</p>
                      </div>
                      <dl className="meta">
                        <dt className="t-label">Role</dt><dd>{project.role}</dd>
                        <dt className="t-label">Discipline</dt><dd>{project.disciplines.map((d) => DISCIPLINE_LABELS[d]).join(' · ')}</dd>
                        {project.stack.length > 0 && (
                          <>
                            <dt className="t-label">Built with</dt>
                            <dd><ul className="stack" role="list">{project.stack.map((s) => <li key={s}>{s}</li>)}</ul></dd>
                          </>
                        )}
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
