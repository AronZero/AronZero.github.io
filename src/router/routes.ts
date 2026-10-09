import { DISCIPLINES, type Discipline } from '../content';

export type Route =
  | { name: 'home' }
  | { name: 'work'; filter: Discipline | null }
  | { name: 'project'; slug: string }
  | { name: 'play'; slug: string }
  | { name: 'not-found' };

function isDiscipline(value: string | null): value is Discipline {
  return value !== null && (DISCIPLINES as readonly string[]).includes(value);
}

export function matchRoute(pathname: string, search: string): Route {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return { name: 'home' };
  if (path === '/work') {
    const filter = new URLSearchParams(search).get('filter');
    return { name: 'work', filter: isDiscipline(filter) ? filter : null };
  }
  const project = /^\/work\/([a-z0-9-]+)$/.exec(path);
  if (project?.[1]) return { name: 'project', slug: project[1] };
  const play = /^\/play\/([a-z0-9-]+)$/.exec(path);
  if (play?.[1]) return { name: 'play', slug: play[1] };
  return { name: 'not-found' };
}

/** URL builders, so paths are never hand-typed in components. */
export const paths = {
  home: () => '/',
  work: (filter?: Discipline | null) => (filter ? `/work?filter=${filter}` : '/work'),
  project: (slug: string) => `/work/${slug}`,
  play: (slug: string) => `/play/${slug}`,
};
