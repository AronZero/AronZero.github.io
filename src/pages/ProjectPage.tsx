import { ArrowLeft, ArrowRight, ArrowUpRight, Play } from 'lucide-react';
import { DISCIPLINE_LABELS, getProject, isPlayable, type Project } from '../content';
import { col, FadeUp, RevealLines } from '../components/Reveal';
import { DepthGauge, type GaugeLayer } from '../components/shell/DepthGauge';
import { domainOf } from '../components/project/FeaturedProject';
import { Gallery } from '../components/project/Gallery';
import { StructureLens } from '../components/project/StructureLens';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { Link } from '../router/Router';
import { paths } from '../router/routes';
import { NotFoundPage } from './NotFoundPage';
import styles from './ProjectPage.module.css';

function LayerHead({ layer, total, label }: { layer: GaugeLayer; total: string; label: string }) {
  return (
    <div className="layer-head">
      <span className="t-label"><span className="layer-head__num">{layer.num}</span> — {label}</span>
      <span className="t-label">Layer {layer.num} / {total}</span>
    </div>
  );
}

export function ProjectPage({ slug }: { slug: string }) {
  const project = getProject(slug);
  useDocumentMeta(project ? project.title : 'Not found', project?.description);
  if (!project) return <NotFoundPage />;
  return <CaseStudy key={project.slug} project={project} />;
}

function CaseStudy({ project }: { project: Project }) {
  const next = getProject(project.nextSlug);
  const domain = domainOf(project.url, project.slug);
  const liveLabel = project.kind === 'game' ? 'Play the game' : 'Visit the live site';
  const playable = isPlayable(project);
  const finalName = playable ? 'Play' : project.url ? 'Live' : 'Next';

  // Only the layers this project has content for, numbered in order.
  const layers: GaugeLayer[] = [
    { id: 'cover', name: 'Cover', show: true },
    { id: 'brief', name: 'Brief', show: true },
    { id: 'surface', name: 'Surface', show: project.gallery.length > 0 },
    { id: 'structure', name: 'Structure', show: project.hero !== null },
    { id: 'stack', name: 'Stack', show: project.stack.length > 0 },
    { id: 'next', name: finalName, show: true },
  ]
    .filter((l) => l.show)
    .map(({ id, name }, i) => ({ id, name, num: String(i).padStart(2, '0') }));
  const total = layers[layers.length - 1]?.num ?? '';
  const layer = (id: string) => layers.find((l) => l.id === id);
  const surface = layer('surface'), structure = layer('structure'), stack = layer('stack');

  return (
    <>
      <DepthGauge layers={layers} />

      {/* 00 Cover */}
      <section id="cover" className={`layer ${styles.cover}`} aria-labelledby="project-title">
        <div className="wrap">
          <div className={styles.coverTop}>
            <Link className="arrow-link" to={paths.work()}>
              <ArrowLeft className="icon icon--left" size={16} aria-hidden="true" />
              <span>All work</span>
            </Link>
            <span className="t-label">Nº {project.number} — {project.kind === 'game' ? 'Game' : 'Website'}</span>
          </div>
          <RevealLines as="h1" id="project-title" className={`t-display ${styles.title}`} lines={[project.title]} />
          <FadeUp delay={200} className={styles.coverMeta}>
            <p className="t-label">Role — {project.role}</p>
            <ul className="tags" role="list">
              {project.disciplines.map((d) => <li key={d} className="tag">{DISCIPLINE_LABELS[d]}</li>)}
            </ul>
          </FadeUp>
          {project.hero && (
            <FadeUp delay={300} className={`crop bleed-m ${styles.hero} ${project.hero.pixel ? styles.heroSquare : ''}`}>
              <div className="frame">
                <div className="frame__bar" aria-hidden="true"><span>{project.number}</span><span>{domain}</span></div>
                <img className="frame__shot" src={project.hero.src} data-pixel={project.hero.pixel || undefined} alt={project.hero.alt} fetchPriority="high" decoding="async" />
              </div>
              <span className="crop__marks" aria-hidden="true" />
            </FadeUp>
          )}
        </div>
      </section>

      {/* 01 Brief */}
      <section id="brief" className="layer" aria-labelledby="brief-title">
        <div className="wrap">
          <LayerHead layer={layer('brief')!} total={total} label="Brief" />
          <div className={`grid ${styles.brief}`}>
            <div style={col('1 / 8')}>
              <h2 id="brief-title" className="sr-only">Brief</h2>
              <FadeUp as="p" className="t-lead">{project.description}</FadeUp>
            </div>
            <FadeUp as="dl" delay={150} className="meta" style={col('9 / 13')}>
              <dt className="t-label">Role</dt><dd>{project.role}</dd>
              <dt className="t-label">Discipline</dt><dd>{project.disciplines.map((d) => DISCIPLINE_LABELS[d]).join(' · ')}</dd>
              {project.stack.length > 0 && (
                <>
                  <dt className="t-label">Built with</dt>
                  <dd><ul className="stack" role="list">{project.stack.map((s) => <li key={s}>{s}</li>)}</ul></dd>
                </>
              )}
              {project.url && (
                <>
                  <dt className="t-label">Live</dt>
                  <dd>
                    <a className="arrow-link" style={{ minHeight: 0 }} href={project.url} target="_blank" rel="noreferrer">
                      <span>{domain}</span>
                      <ArrowUpRight className="icon icon--up-right" size={16} aria-hidden="true" />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </dd>
                </>
              )}
            </FadeUp>
          </div>
        </div>
      </section>

      {/* 02 Surface */}
      {surface && (
        <section id="surface" className="layer" aria-labelledby="surface-title">
          <div className="wrap">
            <LayerHead layer={surface} total={total} label="Surface" />
            <div className={`grid ${styles.sectionIntro}`}>
              <RevealLines as="h2" id="surface-title" className="t-h2" lines={['More', <em key="s">screens.</em>]} />
              <FadeUp as="p" className="t-body" style={col('9 / 13')}>
                {project.kind === 'game'
                  ? `${project.gallery.length === 1 ? 'A clip' : `${project.gallery.length} clips`} of gameplay. Select one to play it full screen.`
                  : `${project.gallery.length === 1 ? 'Another page' : `${project.gallery.length} more pages`} from the project. Select any image to view it full screen.`}
              </FadeUp>
            </div>
            <Gallery images={project.gallery} figPrefix={surface.num} layout={project.kind === 'game' ? 'pairs' : 'editorial'} />
          </div>
        </section>
      )}

      {/* 03 Structure */}
      {structure && project.hero && (
        <section id="structure" className="layer" aria-labelledby="structure-title">
          <div className="wrap">
            <LayerHead layer={structure} total={total} label="Structure" />
            <div className={`grid ${styles.structure}`}>
              <div style={col('1 / 5')}>
                <RevealLines as="h2" id="structure-title" className="t-h2" lines={['Look', <em key="u">underneath.</em>]} />
                <FadeUp as="p" className={`t-body ${styles.structureText}`}>
                  A structure view generated from the screenshot. Edges are traced to show layout rhythm,
                  alignment and hierarchy. Hover over the image, or use the slider.
                </FadeUp>
              </div>
              <div style={col('6 / 13')}>
                <StructureLens image={project.hero} barNum={structure.num} barLabel={`Structure · ${domain}`} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 04 Stack */}
      {stack && (
        <section id="stack" className="layer" aria-labelledby="stack-title">
          <div className="wrap">
            <LayerHead layer={stack} total={total} label="Stack" />
            <div className="grid">
              <h2 id="stack-title" className="t-label c-1" style={col('1 / 4')}>Built with</h2>
              <ol className={styles.stackList} role="list" style={col('4 / 13')}>
                {project.stack.map((s, i) => (
                  <li key={s}>
                    <span className="t-label">{String(i + 1).padStart(2, '0')}</span>
                    <span className="t-h2">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}

      {/* 05 Live / Next */}
      <section id="next" className="layer" aria-labelledby="next-title">
        <div className="wrap">
          <LayerHead layer={layer('next')!} total={total} label={finalName} />
          {playable && (
            <div className={styles.live}>
              <h2 id="next-title" className="sr-only">Play the game</h2>
              <Link className="btn btn--primary" to={paths.play(project.slug)}>
                Play in the browser <Play className="icon" size={16} aria-hidden="true" />
              </Link>
              {project.url && (
                <a className="arrow-link" href={project.url} target="_blank" rel="noreferrer">
                  <span>Also on {domain}</span>
                  <ArrowUpRight className="icon icon--up-right" size={16} aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              )}
            </div>
          )}
          {!playable && project.url && (
            <div className={styles.live}>
              <h2 id="next-title" className="sr-only">{liveLabel}</h2>
              <a className="btn btn--primary" href={project.url} target="_blank" rel="noreferrer">
                {liveLabel} <ArrowUpRight className="icon" size={16} aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
              <span className="t-label">{domain}</span>
            </div>
          )}
          {!project.url && <h2 id="next-title" className="sr-only">Next project</h2>}
          {next && next.slug !== project.slug && (
            <Link className={styles.nextLink} to={paths.project(next.slug)}>
              <span className="t-label">Next project — Nº {next.number}</span>
              <span className={`t-display ${styles.nextTitle}`}>
                {next.title} <ArrowRight className={styles.nextArrow} aria-hidden="true" />
              </span>
              <span className="t-small">{next.role}</span>
            </Link>
          )}
        </div>
      </section>
    </>
  );
}
