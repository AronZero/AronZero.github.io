import type { CSSProperties } from 'react';
import { ArrowRight } from 'lucide-react';
import { featuredProjects, projects, type Project } from '../content';
import { site } from '../content/site';
import { col, FadeUp, RevealLines } from '../components/Reveal';
import { DepthGauge, type GaugeLayer } from '../components/shell/DepthGauge';
import { FeaturedProject } from '../components/project/FeaturedProject';
import { HeroRoom } from '../components/hero/HeroRoom';
import { ProjectIndex } from '../components/project/ProjectIndex';
import { Certifications, Experience } from '../components/resume/Resume';
import { StrataScene } from '../components/project/StrataScene';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useReveal } from '../hooks/useReveal';
import { Link } from '../router/Router';
import { paths } from '../router/routes';
import styles from './HomePage.module.css';

const withHero = (p: Project | undefined): (Project & { hero: NonNullable<Project['hero']> }) | null =>
  p?.hero ? (p as Project & { hero: NonNullable<Project['hero']> }) : null;

function LayerHead({ num, label, aside }: { num: string; label: string; aside?: string }) {
  return (
    <div className="layer-head">
      <span className="t-label"><span className="layer-head__num">{num}</span> — {label}</span>
      {aside && <span className="t-label">{aside}</span>}
    </div>
  );
}

export function HomePage() {
  useDocumentMeta(null, `Portfolio of ${site.name}, a UI/UX designer specialising in front-end development, with a background in graphic design.`);
  const strataRef = useReveal<HTMLDivElement>();
  const sceneProject = withHero(featuredProjects.find((p) => p.hero) ?? projects.find((p) => p.hero));

  // Sections present on this page, numbered in order for the depth gauge.
  const layers: GaugeLayer[] = [
    { id: 'cover', name: 'Cover' },
    { id: 'experience', name: 'Experience' },
    { id: 'certifications', name: 'Certifications' },
    ...(sceneProject ? [{ id: 'layers', name: 'Layers' }] : []),
    { id: 'selected', name: 'Selected' },
    { id: 'index', name: 'Index' },
    { id: 'contact', name: 'Contact' },
  ].map((l, i) => ({ ...l, num: String(i).padStart(2, '0') }));
  const numOf = (id: string) => layers.find((l) => l.id === id)?.num ?? '';
  const total = layers[layers.length - 1]?.num ?? '';

  return (
    <>
      <DepthGauge layers={layers} />

      <section id="cover" className={`layer ${styles.hero}`} aria-labelledby="hero-name">
        <div className="wrap">
          <div className={styles.heroTop}>
            <FadeUp as="p" className="t-label">Portfolio — UI/UX Design &amp; Front-end Development</FadeUp>
            <FadeUp as="p" delay={120} className="t-label">{projects.length} projects · index below</FadeUp>
          </div>

          <div className={styles.stage}>
            <HeroRoom />
            <RevealLines
              as="h1"
              id="hero-name"
              className={`t-hero ${styles.name}`}
              lines={['Hey, I’m', 'Aron Jay']}
            />
          </div>

          <div ref={strataRef} className={`strata-lines reveal-draw ${styles.strata}`} aria-hidden="true">
            <i style={{ '--i': 0 } as CSSProperties} />
            <i style={{ '--i': 1 } as CSSProperties} />
            <i style={{ '--i': 2 } as CSSProperties} />
          </div>

          <div className={`grid ${styles.heroGrid}`}>
            <FadeUp as="dl" delay={300} className={styles.roles} style={col('1 / 5')}>
              <dt className="t-label">Role</dt><dd>{site.roles.primary}</dd>
              <dt className="t-label">Focus</dt><dd>{site.roles.focus}</dd>
              <dt className="t-label">Also</dt><dd>{site.roles.also}</dd>
            </FadeUp>
            <div style={col('6 / 13')}>
              <FadeUp as="p" delay={450} className={`t-statement ${styles.statement}`}>
                I design interfaces — <em className="text-color-accent">then I build them,</em> down to the last transition.
              </FadeUp>
              <FadeUp as="p" delay={600} className="t-body">
                From user flows to production-ready front-end code, with a graphic designer’s eye for type,
                composition and detail. Every project here reads in layers: from the surface people see to the
                stack it ships on.
              </FadeUp>
              <FadeUp delay={750} className={styles.actions}>
                <Link className="btn btn--primary" to="#selected">
                  View selected work <ArrowRight className="icon" size={16} aria-hidden="true" />
                </Link>
              </FadeUp>
            </div>
          </div>
        </div>
      </section>

      <Experience head={<LayerHead num={numOf('experience')} label="Experience" aside={`Layer ${numOf('experience')} / ${total}`} />} />
      <Certifications head={<LayerHead num={numOf('certifications')} label="Certifications" aside={`Layer ${numOf('certifications')} / ${total}`} />} />

      {sceneProject && (
        <section className={styles.layersSection} aria-label="How to read a project">
          <div className="wrap">
            <LayerHead num={numOf('layers')} label="Layers" aside={`Layer ${numOf('layers')} / ${total}`} />
          </div>
          <StrataScene id="layers" project={sceneProject} />
        </section>
      )}

      <section id="selected" className="layer" aria-labelledby="selected-title">
        <div className="wrap">
          <LayerHead num={numOf('selected')} label="Selected work" aside={`Layer ${numOf('selected')} / ${total}`} />
          <div className={`grid ${styles.intro}`}>
            <RevealLines as="h2" id="selected-title" className="t-h2" lines={['Selected', <em key="w">work</em>]} />
            <FadeUp as="p" className="t-body" style={col('9 / 13')}>
              A few projects that show the whole range — research and interface design through to the front-end
              code that ships it.
            </FadeUp>
          </div>
          {featuredProjects.map((p, i) => <FeaturedProject key={p.slug} project={p} flip={i % 2 === 1} />)}
        </div>
      </section>

      <section id="index" className="layer" aria-labelledby="index-title">
        <div className="wrap">
          <LayerHead num={numOf('index')} label="Index" aside={`Layer ${numOf('index')} / ${total}`} />
          <div className={styles.indexHead}>
            <RevealLines as="h2" id="index-title" className="t-h2" lines={['All', <em key="w">work</em>]} />
            <Link className="arrow-link" to={paths.work()}>
              <span>Browse and filter the index</span>
              <ArrowRight className="icon icon--right" size={16} aria-hidden="true" />
            </Link>
          </div>
          <ProjectIndex projects={projects} />
        </div>
      </section>
    </>
  );
}
