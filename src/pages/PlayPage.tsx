import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { getProject, isPlayable, type PlayableProject } from '../content';
import { FadeUp, RevealLines } from '../components/Reveal';
import { domainOf } from '../components/project/FeaturedProject';
import { GamePlayer } from '../components/project/GamePlayer';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { Link } from '../router/Router';
import { paths } from '../router/routes';
import { NotFoundPage } from './NotFoundPage';
import styles from './PlayPage.module.css';

export function PlayPage({ slug }: { slug: string }) {
  const project = getProject(slug);
  const playable = project && isPlayable(project) ? project : null;
  useDocumentMeta(playable ? `Play ${playable.title}` : 'Not found', playable?.description);
  if (!playable) return <NotFoundPage />;
  return <Playground key={playable.slug} project={playable} />;
}

/** "Key — action" from the content file, split so the key can be marked up. */
function splitControl(control: string): [string, string] {
  const [key = control, ...rest] = control.split(' — ');
  return [key, rest.join(' — ')];
}

function Playground({ project }: { project: PlayableProject }) {
  // "Astrox — Into the Cosmic Chaos" → name, then the subtitle in light italic.
  const [name = project.title, ...subtitle] = project.title.split(' — ');
  const titleLines = subtitle.length > 0 ? [name, <em key="s">{subtitle.join(' — ')}</em>] : [name];

  return (
    <section className={`layer ${styles.play}`} aria-labelledby="play-title">
      <div className="wrap">
        <div className={styles.top}>
          <Link className="arrow-link" to={paths.project(project.slug)}>
            <ArrowLeft className="icon icon--left" size={16} aria-hidden="true" />
            <span>Case study</span>
          </Link>
          <span className="t-label">Playground — Nº {project.number}</span>
        </div>

        <div className={`grid ${styles.layout}`}>
          <div className={styles.head}>
            <RevealLines as="h1" id="play-title" className={`t-h2 ${styles.title}`} lines={titleLines} />
            <FadeUp as="p" delay={150} className={`t-label ${styles.role}`}>Role — {project.role}</FadeUp>
          </div>

          <FadeUp delay={200} className={styles.stage}>
            <GamePlayer project={project} />
          </FadeUp>

          <FadeUp delay={300} className={styles.details}>
            {project.controls && project.controls.length > 0 && (
              <>
                <h2 className="t-label">Controls</h2>
                <dl className={styles.controls}>
                  {project.controls.map((control) => {
                    const [key, action] = splitControl(control);
                    return (
                      <div key={control} className={styles.control}>
                        <dt><kbd className={styles.kbd}>{key}</kbd></dt>
                        <dd>{action}</dd>
                      </div>
                    );
                  })}
                </dl>
                <p className="t-small">
                  Enter or P opens the PICO-8 pause menu. On a phone, touch controls appear over the game.
                </p>
              </>
            )}

            {project.url && (
              <a className={`arrow-link ${styles.external}`} href={project.url} target="_blank" rel="noreferrer">
                <span>Also on {domainOf(project.url, project.slug)}</span>
                <ArrowUpRight className="icon icon--up-right" size={16} aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
