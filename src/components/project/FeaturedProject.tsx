import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { DISCIPLINE_LABELS, isPlayable, type Project } from '../../content';
import { Link } from '../../router/Router';
import { paths } from '../../router/routes';
import { col, FadeUp } from '../Reveal';
import styles from './FeaturedProject.module.css';

export function domainOf(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return fallback;
  }
}

/** A "core sample" of a project. Alternates image left/right for an asymmetric rhythm. */
export function FeaturedProject({ project, flip }: { project: Project; flip: boolean }) {
  const href = paths.project(project.slug);
  const titleId = `featured-${project.slug}`;

  return (
    <article className={`grid ${styles.featured}`} data-flip={flip || undefined} aria-labelledby={titleId}>
      <FadeUp style={flip ? col('6 / 13', '1 / -1') : col('1 / 8', '1 / -1')} className={styles.media}>
        <Link to={href} className={`crop bleed-m ${styles.shotLink}`} tabIndex={-1} aria-hidden="true">
          <span className="frame">
            <span className="frame__bar"><span>{project.number}</span><span>{domainOf(project.url, project.slug)}</span></span>
            {project.hero ? (
              <img className={`frame__shot ${styles.shot}`} src={project.hero.src} data-pixel={project.hero.pixel || undefined} alt="" loading="lazy" decoding="async" />
            ) : (
              <span className={styles.empty}>Screenshot coming soon</span>
            )}
          </span>
          <span className="crop__marks" />
        </Link>
      </FadeUp>

      <FadeUp delay={120} style={flip ? col('1 / 5') : col('9 / 13')} className={styles.text}>
        <div className={styles.numRow}>
          <span className="t-label c-accent">Nº {project.number}</span>
          <span className="t-label">{project.kind === 'game' ? 'Playable' : 'Featured'}</span>
        </div>
        <h3 id={titleId} className="t-h3">
          <Link to={href} className={styles.titleLink}>{project.title}</Link>
        </h3>
        <p className={`t-label ${styles.role}`}>Role — {project.role}</p>
        <p className={`t-body c-2 ${styles.desc}`}>{project.description}</p>
        <ul className="tags" role="list">
          {project.disciplines.map((d) => <li key={d} className="tag">{DISCIPLINE_LABELS[d]}</li>)}
        </ul>
        {project.stack.length > 0 && (
          <ul className={`stack ${styles.stack}`} role="list">{project.stack.map((s) => <li key={s}>{s}</li>)}</ul>
        )}
        <div className={styles.actions}>
          <Link className="btn btn--primary" to={href}>
            View case study <ArrowRight className="icon" size={16} aria-hidden="true" />
          </Link>
          {isPlayable(project) ? (
            <Link className="arrow-link" to={paths.play(project.slug)}>
              <span>Play it</span>
              <ArrowRight className="icon icon--right" size={16} aria-hidden="true" />
            </Link>
          ) : project.url && (
            <a className="arrow-link" href={project.url} target="_blank" rel="noreferrer">
              <span>Live site</span>
              <ArrowUpRight className="icon icon--up-right" size={16} aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
        </div>
      </FadeUp>
    </article>
  );
}
