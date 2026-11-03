import { ArrowUpRight, Play } from 'lucide-react';
import { DISCIPLINE_LABELS, disciplinesInUse, getProject, isPlayable, projects, type Project } from '../content';
import { certifications } from '../content/resume';
import { site } from '../content/site';
import { Link } from '../router/Router';
import { paths } from '../router/routes';
import type { StationId } from './stations';
import styles from './StationPanel.module.css';

/*
 * What each station opens. All content comes from src/content (nothing is written here), so the studio and the
 * editorial site always say the same thing.
 */

/** Every tool named in a project's stack, most used first. */
const tools: readonly string[] = (() => {
  const counts = new Map<string, number>();
  for (const p of projects) for (const t of p.stack) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
})();

function CaseStudyLink({ slug, label = 'Open case study' }: { slug: string; label?: string }) {
  return (
    <Link className="arrow-link" to={paths.project(slug)}>
      <span>{label}</span>
      <ArrowUpRight className="icon" size={16} aria-hidden="true" />
    </Link>
  );
}

export function StationPanel({ id, featured, titleId }: { id: StationId; featured: Project | undefined; titleId: string }) {
  switch (id) {
    case '01':
      return featured ? (
        <>
          <h2 id={titleId} className="t-h3">{featured.title}</h2>
          <p className="t-label">{featured.role}</p>
          <p>{featured.description}</p>
          <CaseStudyLink slug={featured.slug} />
        </>
      ) : null;

    case '02':
      return (
        <>
          <h2 id={titleId} className="t-h3">All projects</h2>
          <ol className={styles.projects}>
            {projects.map((p) => (
              <li key={p.slug}>
                <Link to={paths.project(p.slug)} className={styles.project}>
                  <span className={`t-mono ${styles.num}`}>{p.number}</span>
                  <span className={styles.name}>{p.title}</span>
                  <span className={`t-label ${styles.role}`}>{p.role}</span>
                </Link>
              </li>
            ))}
          </ol>
          <Link className="arrow-link" to={paths.work()}>
            <span>The full index</span>
            <ArrowUpRight className="icon" size={16} aria-hidden="true" />
          </Link>
        </>
      );

    case '03': {
      const game = getProject('astrox');
      if (!game) return null;
      return (
        <>
          <h2 id={titleId} className="t-h3">{game.title}</h2>
          <p className="t-label">{game.role}</p>
          <p>{game.description}</p>
          {isPlayable(game) && (
            <Link className="arrow-link" to={paths.play(game.slug)}>
              <Play className="icon icon--left" size={16} aria-hidden="true" />
              <span>Play it</span>
            </Link>
          )}
          <CaseStudyLink slug={game.slug} />
        </>
      );
    }

    case '04':
      return (
        <>
          <h2 id={titleId} className="t-h3">About</h2>
          <blockquote className={styles.quote}>
            <p>{site.quote}</p>
          </blockquote>
          {site.about.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
          {site.resumeUrl && (
            <a className="arrow-link" href={site.resumeUrl}>
              <span>Résumé (PDF)</span>
              <ArrowUpRight className="icon" size={16} aria-hidden="true" />
            </a>
          )}
        </>
      );

    case '05':
      return (
        <>
          <h2 id={titleId} className="t-h3">Skills & tools</h2>
          <h3 className="t-label">Disciplines</h3>
          <ul className={styles.tags}>
            {disciplinesInUse.map((d) => (
              <li key={d}>{DISCIPLINE_LABELS[d]}</li>
            ))}
          </ul>
          <h3 className="t-label">Tools used in these projects</h3>
          <ul className={styles.tags}>
            {tools.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <h3 className="t-label">Training</h3>
          <ul className={styles.plain}>
            {certifications.map((c) => (
              <li key={c.name}>
                {c.name} <span className={styles.muted}>· {c.issuer}</span>
              </li>
            ))}
          </ul>
        </>
      );

    case '06':
      return (
        <>
          <h2 id={titleId} className="t-h3">Contact</h2>
          <p>The line is open. Leave a message:</p>
          <a className="arrow-link" href={`mailto:${site.email}`}>
            <span>{site.email}</span>
            <ArrowUpRight className="icon" size={16} aria-hidden="true" />
          </a>
          <a className="arrow-link" href={site.linkedin} target="_blank" rel="noreferrer">
            <span>LinkedIn</span>
            <ArrowUpRight className="icon" size={16} aria-hidden="true" />
          </a>
          {site.resumeUrl && (
            <a className="arrow-link" href={site.resumeUrl}>
              <span>Résumé (PDF)</span>
              <ArrowUpRight className="icon" size={16} aria-hidden="true" />
            </a>
          )}
        </>
      );
  }
}
