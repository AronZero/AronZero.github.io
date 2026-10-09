import { projectEntries } from './projects';
import { DISCIPLINES, type Discipline, type Project, type ProjectEntry, type ProjectImage } from './types';

/* Images are discovered from folders at build time; nothing to register by hand.
   (Vite needs these glob patterns as plain string literals.) */
const heroFiles = import.meta.glob<string>('./projects/*/hero.{png,PNG,jpg,JPG,jpeg,JPEG,webp,WEBP,avif,AVIF,svg,SVG}', {
  eager: true,
  import: 'default',
});
const galleryFiles = import.meta.glob<string>(
  './projects/*/gallery/*.{png,PNG,jpg,JPG,jpeg,JPEG,webp,WEBP,avif,AVIF,svg,SVG}',
  { eager: true, import: 'default' },
);

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/* GIFs pair with the still of the same name and play only on request ("Nothing loops or auto-plays"). */
const animatedFiles = import.meta.glob<string>('./projects/*/gallery/*.{gif,GIF}', { eager: true, import: 'default' });

const baseOf = (path: string): string => path.replace(/\.[^.]+$/, '');
const animatedByBase = new Map(Object.entries(animatedFiles).map(([path, src]) => [baseOf(path), src]));

function slugOf(path: string): string {
  // "./projects/<slug>/hero.png" or "./projects/<slug>/gallery/<file>"
  return path.split('/')[2] ?? '';
}

function captionOf(path: string): string {
  const name = (path.split('/').pop() ?? '').replace(/\.[^.]+$/, '');
  const words = name.replace(/^\d+[-_\s]*/, '').replace(/[-_]+/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Screenshot';
}

function imagesBySlug(files: Record<string, string>): Map<string, [string, string][]> {
  const map = new Map<string, [string, string][]>();
  for (const [path, src] of Object.entries(files)) {
    const slug = slugOf(path);
    map.set(slug, [...(map.get(slug) ?? []), [path, src]]);
  }
  for (const list of map.values()) list.sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
  return map;
}

function validate(entries: readonly ProjectEntry[], heroes: Map<string, unknown>, galleries: Map<string, unknown>): void {
  const seen = new Set<string>();
  for (const entry of entries) {
    if (!SLUG_PATTERN.test(entry.slug)) {
      throw new Error(`Project slug "${entry.slug}" must use lowercase letters, numbers and dashes only.`);
    }
    if (seen.has(entry.slug)) throw new Error(`Duplicate project slug "${entry.slug}" in src/content/projects.ts.`);
    seen.add(entry.slug);
    if (!heroes.has(entry.slug) && import.meta.env.DEV) {
      console.warn(`[content] "${entry.slug}" has no hero image. Add src/content/projects/${entry.slug}/hero.png`);
    }
  }
  if (import.meta.env.DEV) {
    for (const slug of new Set([...heroes.keys(), ...galleries.keys()])) {
      if (!seen.has(slug)) console.warn(`[content] Folder "projects/${slug}" has images but no entry in projects.ts.`);
    }
  }
}

function buildProjects(entries: readonly ProjectEntry[]): Project[] {
  const heroes = imagesBySlug(heroFiles);
  const galleries = imagesBySlug(galleryFiles);
  validate(entries, heroes, galleries);

  return entries.map((entry, i) => {
    const toImage = ([path, src]: [string, string], label: string): ProjectImage => {
      const caption = captionOf(path);
      const animated = animatedByBase.get(baseOf(path));
      return {
        src,
        caption,
        alt: `${entry.title} — ${label === 'hero' ? (entry.kind === 'game' ? 'title screen' : 'landing page hero') : caption.toLowerCase()}`,
        ...(animated ? { animated } : {}),
        pixel: entry.kind === 'game',
      };
    };
    const heroFile = heroes.get(entry.slug)?.[0];
    const prev = entries[(i - 1 + entries.length) % entries.length] ?? entry;
    const next = entries[(i + 1) % entries.length] ?? entry;

    return {
      ...entry,
      number: String(i + 1).padStart(2, '0'),
      hero: heroFile ? toImage(heroFile, 'hero') : null,
      gallery: (galleries.get(entry.slug) ?? []).map((file) => toImage(file, 'gallery')),
      prevSlug: prev.slug,
      nextSlug: next.slug,
    };
  });
}

export const projects: readonly Project[] = buildProjects(projectEntries);

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export type PlayableProject = Project & { kind: 'game'; embedPath: string };

/** A game with an exported PICO-8 build, playable at /play/<slug>. */
export function isPlayable(project: Project): project is PlayableProject {
  return project.kind === 'game' && !!project.embedPath;
}

export const playableProjects: readonly PlayableProject[] = projects.filter(isPlayable);

/** Projects flagged `featured`, or the first three when none are flagged. */
export const featuredProjects: readonly Project[] = (() => {
  const flagged = projects.filter((p) => p.featured);
  return flagged.length > 0 ? flagged : projects.slice(0, 3);
})();

/** Only the disciplines actually used, in the canonical order — feeds the filter. */
export const disciplinesInUse: readonly Discipline[] = DISCIPLINES.filter((d) =>
  projects.some((p) => p.disciplines.includes(d)),
);

export { DISCIPLINE_LABELS, DISCIPLINES } from './types';
export type { Discipline, Project, ProjectImage } from './types';
