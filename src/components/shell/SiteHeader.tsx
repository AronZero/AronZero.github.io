import { useRef } from 'react';
import { Download, Menu, Moon, Sun, X } from 'lucide-react';
import { playableProjects } from '../../content';
import { site } from '../../content/site';
import { useTheme } from '../../hooks/useTheme';
import { Link, useRouter } from '../../router/Router';
import { paths } from '../../router/routes';
import { BrandMark } from './BrandMark';
import styles from './SiteHeader.module.css';

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const Icon = theme === 'dark' ? Moon : Sun;
  return (
    <button className={styles.themeToggle} type="button" onClick={toggle}>
      <Icon className="icon" size={14} aria-hidden="true" />
      Theme: {theme === 'dark' ? 'Dark' : 'Light'}
      <span className="sr-only">, switch to {theme === 'dark' ? 'light' : 'dark'}</span>
    </button>
  );
}

function ResumeButton({ className = 'btn btn--secondary btn--sm' }: { className?: string }) {
  if (!site.resumeUrl) return null;
  return (
    <a className={className} href={site.resumeUrl} download>
      Résumé <Download className="icon" size={16} aria-hidden="true" />
    </a>
  );
}

export function SiteHeader() {
  const { route } = useRouter();
  const menuRef = useRef<HTMLDialogElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);

  const nav = [
    { label: 'Work', to: paths.work(), current: route.name === 'project' || (route.name === 'work' && route.filter !== 'game') },
    {
      label: 'Playground',
      // One playable game opens straight into it; several (or none yet) list the games.
      to: playableProjects.length === 1 && playableProjects[0] ? paths.play(playableProjects[0].slug) : paths.work('game'),
      current: route.name === 'play' || (route.name === 'work' && route.filter === 'game'),
    },
    { label: 'Contact', to: '#contact', current: false },
  ];

  const openMenu = () => {
    menuRef.current?.showModal();
    openRef.current?.setAttribute('aria-expanded', 'true');
  };
  const closeMenu = () => menuRef.current?.close();

  return (
    <header className={styles.header}>
      <div className={`wrap ${styles.inner}`}>
        <Link to={paths.home()} className={styles.brand} aria-label={`${site.name}, home`}>
          <BrandMark className={styles.mark} intro />
          <span className={styles.name}>{site.name}</span>
          <span className={`t-label ${styles.role}`}>UI/UX · Front-end</span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          {nav.map((item) => (
            <Link key={item.label} to={item.to} className={styles.navLink} aria-current={item.current ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <span className={styles.desktopOnly}><ThemeToggle /></span>
          <span className={styles.desktopOnly}><ResumeButton /></span>
          <button
            ref={openRef}
            className={`btn btn--secondary btn--sm ${styles.menuBtn}`}
            type="button"
            aria-haspopup="dialog"
            aria-expanded="false"
            aria-controls="site-menu"
            onClick={openMenu}
          >
            Index <Menu className="icon" size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <dialog
        ref={menuRef}
        id="site-menu"
        className={styles.menu}
        aria-label="Site index"
        onClose={() => openRef.current?.setAttribute('aria-expanded', 'false')}
      >
        <div className={`wrap ${styles.menuInner}`}>
          <div className={styles.menuTop}>
            <span className={styles.brand}>
              <BrandMark className={styles.mark} />
              <span className={styles.name}>{site.name}</span>
            </span>
            <button className="btn btn--secondary btn--sm" type="button" onClick={closeMenu}>
              Close <X className="icon" size={16} aria-hidden="true" />
            </button>
          </div>
          <ol className={styles.menuList} role="list">
            {[{ label: 'Home', to: paths.home() }, ...nav].map((item, i) => (
              <li key={item.label}>
                <Link to={item.to} onClick={closeMenu}>
                  <span className="t-label">{String(i + 1).padStart(2, '0')}</span>
                  <em>{item.label}</em>
                </Link>
              </li>
            ))}
          </ol>
          <div className={styles.menuFoot}>
            <ResumeButton className="btn btn--primary" />
            <ThemeToggle />
          </div>
        </div>
      </dialog>
    </header>
  );
}
