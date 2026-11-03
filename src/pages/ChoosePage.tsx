import { ArrowRight } from 'lucide-react';
import { BrandMark } from '../components/shell/BrandMark';
import { featuredProjects, projects } from '../content';
import { site } from '../content/site';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { Link } from '../router/Router';
import { paths, saveExperience } from '../router/routes';
import { loadStudio } from '../studio/load';
import still1600 from '../studio/assets/studio-still-1600.webp';
import still800 from '../studio/assets/studio-still-800.webp';
import styles from './ChoosePage.module.css';

/*
 * The selector at '/': two ways into the same portfolio. The choice is remembered for the session, and index.html skips this
 * page next time (paths.choose() brings it back). Both halves are plain links, so they work with the keyboard,
 * middle-click and new tabs.
 */
export function ChoosePage() {
  useDocumentMeta(null);
  // Start fetching Three.js and the room as soon as the visitor leans toward the studio.
  const warmStudio = () => void loadStudio();
  const selected = featuredProjects.filter((p) => p.card).slice(0, 4);

  return (
    <div className={styles.choose}>
      <header className={styles.top}>
        <BrandMark className={styles.mark} intro />
        <h1 className={styles.name}>{site.name}</h1>
        <span className={`t-label ${styles.role}`}>
          {site.roles.primary} · {site.roles.focus}
        </span>
      </header>

      <nav className={styles.halves} aria-label="Choose how to see the portfolio">
        <Link
          to={paths.studio()}
          className={styles.half}
          data-kind="interactive"
          onClick={() => saveExperience('interactive')}
          onPointerEnter={warmStudio}
          onFocus={warmStudio}
        >
          <img
            className={styles.still}
            src={still1600}
            srcSet={`${still800} 800w, ${still1600} 1600w`}
            sizes="(max-width: 719px) 100vw, 50vw"
            width={1600}
            height={1216}
            alt=""
            decoding="async"
          />
          <span className={styles.copy}>
            <span className="t-label">
              <span className={styles.num}>01</span> Interactive
            </span>
            <span className={`t-h2 ${styles.title}`}>
              Walk the studio, <em>after hours.</em>
            </span>
            <span className={styles.desc}>
              A 3D room where each object opens part of my work. Best on a laptop or a recent phone.
            </span>
            <span className={styles.go}>
              Enter the 3D studio <ArrowRight className="icon" size={16} aria-hidden="true" />
            </span>
          </span>
        </Link>

        <Link to={paths.home()} className={styles.half} data-kind="editorial" onClick={() => saveExperience('editorial')}>
          <span className={`rule-strata ${styles.rule}`} aria-hidden="true" />
          {/* A taste of the editorial site: its selected work, as screenshots. */}
          <span className={styles.work} aria-hidden="true">
            {selected.map((project) => (
              <span key={project.slug} className={styles.card}>
                <img
                  className={styles.cardImg}
                  src={project.card!}
                  width={640}
                  height={400}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  data-pixel={project.hero?.pixel || undefined}
                />
                <span className={styles.cardLabel}>
                  <span className={styles.num}>{project.number}</span>
                  {project.title}
                </span>
              </span>
            ))}
          </span>
          <span className={styles.copy}>
            <span className="t-label">
              <span className={styles.num}>02</span> Editorial
            </span>
            <span className={`t-h2 ${styles.title}`}>
              Read the work, <em>case by case.</em>
            </span>
            <span className={styles.desc}>
              {projects.length} selected projects, each with its role, story and stack. Quick to scan, easy to share.
            </span>
            <span className={styles.go}>
              Open the editorial site <ArrowRight className="icon" size={16} aria-hidden="true" />
            </span>
          </span>
        </Link>
      </nav>

      <p className={`t-label ${styles.foot}`}>Same work either way. You can switch at any time.</p>
    </div>
  );
}
