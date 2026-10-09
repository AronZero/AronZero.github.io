import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Copy, Download } from 'lucide-react';
import { site } from '../../content/site';
import { col, RevealLines } from '../Reveal';
import { BrandMark } from './BrandMark';
import styles from './SiteFooter.module.css';

function LinkedInIcon() {
  // Lucide no longer ships brand icons; drawn in the same stroke style.
  return (
    <svg className="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 10.5V17M8 7.5v.01M12 17v-6.5M12 13.5a3 3 0 0 1 6 0V17" />
    </svg>
  );
}

function CopyEmail() {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setState('copied');
    } catch {
      setState('failed');
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 2200);
  };

  return (
    <>
      <button className={styles.copy} data-state={state} type="button" onClick={copy}>
        {state === 'copied' ? <Check className="icon" size={16} aria-hidden="true" /> : <Copy className="icon" size={16} aria-hidden="true" />}
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Press Ctrl+C' : 'Copy'}
      </button>
      <span className="sr-only" role="status">
        {state === 'copied' ? 'Email address copied to clipboard' : state === 'failed' ? 'Copy failed. Select the address and copy it manually.' : ''}
      </span>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className={styles.footer} id="contact" aria-labelledby="contact-title">
      <div className="wrap">
        <hr className="rule-strata" />
        <RevealLines
          as="h2"
          id="contact-title"
          className={`t-display ${styles.title}`}
          lines={['Let’s build something', <em key="c" className="text-color-accent">considered.</em>]}
        />
        <div className={`grid ${styles.grid}`}>
          <div style={col('1 / 8')}>
            <p className="t-body">Open to UI/UX Designer and Front-end Developer roles. Email is the fastest way to reach me.</p>
            <div className={styles.email}>
              <a className={`link ${styles.emailLink}`} href={`mailto:${site.email}`}>{site.email}</a>
              <CopyEmail />
            </div>
          </div>
          <div className={styles.links} style={col('8 / 13')}>
            {site.resumeUrl && (
              <a className="btn btn--primary" href={site.resumeUrl} download>
                Download résumé <Download className="icon" size={16} aria-hidden="true" />
              </a>
            )}
            <a className="arrow-link" href={site.linkedin} target="_blank" rel="noreferrer">
              <LinkedInIcon />
              <span>LinkedIn</span>
              <ArrowUpRight className="icon icon--up-right" size={16} aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
        </div>
        <div className={styles.colophon}>
          <span className={`t-label ${styles.sign}`}>
            <BrandMark tone="mono" />
            © {new Date().getFullYear()} {site.name}
          </span>
          <span className="t-label">Designed and built by hand (of course not!) — no templates were harmed in the making of this site</span>
        </div>
      </div>
    </footer>
  );
}
