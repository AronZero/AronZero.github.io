import { DISCIPLINE_LABELS, disciplinesInUse, projects, type Discipline } from '../content';
import { site } from '../content/site';
import { col, FadeUp, RevealLines } from '../components/Reveal';
import { DisciplineFilter, ProjectIndex } from '../components/project/ProjectIndex';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useRouter } from '../router/Router';
import { paths } from '../router/routes';
import styles from './WorkPage.module.css';

export function WorkPage({ filter }: { filter: Discipline | null }) {
  const { navigate } = useRouter();
  const shown = filter ? projects.filter((p) => p.disciplines.includes(filter)) : projects;
  useDocumentMeta(filter ? `${DISCIPLINE_LABELS[filter]} — Work` : 'Work', `Index of work by ${site.name}: web design, UI/UX and front-end projects.`);

  return (
    <section className={`layer ${styles.page}`} aria-labelledby="work-title">
      <div className="wrap">
        <div className="layer-head">
          <span className="t-label"><span className="layer-head__num">Index</span> — All work</span>
          <span className="t-label">{projects.length} projects</span>
        </div>
        <div className={`grid ${styles.intro}`}>
          <RevealLines as="h1" id="work-title" className="t-display" lines={['The', <em key="w">index.</em>]} />
          <FadeUp as="p" className="t-body" style={col('8 / 13')}>
            Every project, in order. Filter by discipline, or open any project to read it in layers — from the
            surface to the stack.
          </FadeUp>
        </div>
        <div className={styles.filter}>
          <DisciplineFilter
            options={disciplinesInUse}
            active={filter}
            total={projects.length}
            shown={shown.length}
            onChange={(d) => navigate(paths.work(d), { replace: true, keepScroll: true })}
          />
        </div>
        {shown.length > 0 ? (
          <ProjectIndex projects={shown} headingLevel="h2" />
        ) : (
          <p className="t-body">No projects in this category yet.</p>
        )}
      </div>
    </section>
  );
}
