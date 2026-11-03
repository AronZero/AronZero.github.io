import { DISCIPLINES, type Discipline } from '../content';

export type Route =
  | { name: 'choose' }
  | { name: 'home' }
  | { name: 'work'; filter: Discipline | null }
  | { name: 'project'; slug: string }
  | { name: 'play'; slug: string }
  | { name: 'studio' }
  | { name: 'not-found' };

function isDiscipline(value: string | null): value is Discipline {
  return value !== null && (DISCIPLINES as readonly string[]).includes(value);
}

export function matchRoute(pathname: string, search: string): Route {
  const path = pathname.replace(/\/+$/, '') || '/';
  // This session's choice is applied before first paint (index.html), so '/' only renders once per session and for ?choose.
  if (path === '/') return { name: 'choose' };
  if (path === '/editorial') return { name: 'home' };
  if (path === '/work') {
    const filter = new URLSearchParams(search).get('filter');
    return { name: 'work', filter: isDiscipline(filter) ? filter : null };
  }
  const project = /^\/work\/([a-z0-9-]+)$/.exec(path);
  if (project?.[1]) return { name: 'project', slug: project[1] };
  const play = /^\/play\/([a-z0-9-]+)$/.exec(path);
  if (play?.[1]) return { name: 'play', slug: play[1] };
  if (path === '/interactive') return { name: 'studio' };
  return { name: 'not-found' };
}

/** URL builders, so paths are never hand-typed in components. */
export const paths = {
  /** The selector, shown even when a choice is saved. */
  choose: () => '/?choose',
  /** The editorial home page. */
  home: () => '/editorial',
  work: (filter?: Discipline | null) => (filter ? `/work?filter=${filter}` : '/work'),
  project: (slug: string) => `/work/${slug}`,
  play: (slug: string) => `/play/${slug}`,
  /** The 3D "After Hours Studio". */
  studio: () => '/interactive',
};

/** The two ways to see the portfolio. The choice lasts for the browser session, like the intro (Aron): a new
 *  session meets the selector again. Stored under this key in sessionStorage (read by index.html too). */
export type Experience = 'editorial' | 'interactive';
const EXPERIENCE_KEY = 'ajc-experience';

export function saveExperience(experience: Experience) {
  try {
    sessionStorage.setItem(EXPERIENCE_KEY, experience);
  } catch {
    // Storage blocked: the selector simply shows again next time.
  }
}
