import type { ReactNode } from 'react';
import { ArrowUpRight, Download } from 'lucide-react';
import { certifications, experience, type Certification } from '../../content/resume';
import { site } from '../../content/site';
import { col, FadeUp, RevealLines } from '../Reveal';
import styles from './Resume.module.css';

/** View (new tab) + download links for the résumé PDF. Renders nothing until `site.resumeUrl` is set. */
export function ResumeLinks({ className }: { className?: string }) {
  if (!site.resumeUrl) return null;
  return (
    <div className={[styles.links, className].filter(Boolean).join(' ')}>
      <a className="btn btn--primary" href={site.resumeUrl} target="_blank" rel="noreferrer">
        View résumé <ArrowUpRight className="icon" size={16} aria-hidden="true" />
        <span className="sr-only">(PDF, opens in a new tab)</span>
      </a>
      <a className="arrow-link" href={site.resumeUrl} download>
        <Download className="icon" size={16} aria-hidden="true" />
        <span>Download PDF</span>
      </a>
    </div>
  );
}

export function Experience({ head }: { head: ReactNode }) {
  return (
    <section id="experience" className="layer" aria-labelledby="experience-title">
      <div className="wrap">
        {head}
        <div className={`grid ${styles.intro}`}>
          <RevealLines as="h2" id="experience-title" className="t-h2" lines={['Work', <em key="e">experience</em>]} />
          <FadeUp style={col('9 / 13')}>
            <p className="t-body">Ten years of designing, building and maintaining websites and apps — from layout and usability to the code behind them.</p>
            <ResumeLinks />
          </FadeUp>
        </div>

        <ol className={styles.jobs}>
          {experience.map((job) => (
            <FadeUp as="li" key={job.company} className={`grid ${styles.job}`}>
              <p className={`t-label ${styles.period}`} style={col('1 / 4')}>{job.period}</p>
              <div style={col('4 / 8')}>
                <h3 className="t-h3">{job.title}</h3>
                <p className={styles.company}>{job.company}</p>
              </div>
              <ul className={styles.duties} style={col('8 / 13')}>
                {job.duties.map((d) => <li key={d}>{d}</li>)}
              </ul>
            </FadeUp>
          ))}
        </ol>
      </div>
    </section>
  );
}

function byIssuer(list: readonly Certification[]): [string, string[]][] {
  const groups = new Map<string, string[]>();
  for (const c of list) groups.set(c.issuer, [...(groups.get(c.issuer) ?? []), c.name]);
  return [...groups];
}

const GROUP_COLS = ['1 / 5', '5 / 9', '9 / 13'];

export function Certifications({ head }: { head: ReactNode }) {
  return (
    <section id="certifications" className="layer" aria-labelledby="certifications-title">
      <div className="wrap">
        {head}
        <div className={`grid ${styles.intro}`}>
          <RevealLines as="h2" id="certifications-title" className="t-h2" lines={['Training &', <em key="c">certifications</em>]} />
        </div>

        <div className={`grid ${styles.certGrid}`}>
          {byIssuer(certifications).map(([issuer, names], i) => (
            <FadeUp key={issuer} delay={i * 120} className={styles.group} style={col(GROUP_COLS[i % GROUP_COLS.length] ?? '1 / -1')}>
              <h3 className={`t-label ${styles.issuer}`}>
                <span>{issuer}</span>
                <span>{String(names.length).padStart(2, '0')}</span>
              </h3>
              <ul className={styles.certs}>
                {names.map((n) => <li key={n}>{n}</li>)}
              </ul>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
