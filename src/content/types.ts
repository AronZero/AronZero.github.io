/** Disciplines drive the category tags and the /work filter. Order here = filter order. */
export const DISCIPLINES = ['web-design', 'ui-ux', 'front-end', 'graphic-design', 'game'] as const;
export type Discipline = (typeof DISCIPLINES)[number];

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  'web-design': 'Web Design',
  'ui-ux': 'UI/UX',
  'front-end': 'Front-end',
  'graphic-design': 'Graphic Design',
  game: 'Games',
};

/** What you write in `projects.ts`. Images are not listed here: they are discovered from folders. */
interface BaseEntry {
  /** URL-safe id, also the image folder name: lowercase letters, numbers and dashes. */
  slug: string;
  title: string;
  /** Your role on the project, e.g. "UI/UX Design · Front-end Development". */
  role: string;
  description: string;
  disciplines: readonly Discipline[];
  /** Technologies and tools, e.g. ["AngularJS", "Sass"]. */
  stack: readonly string[];
  /** Optional live site or published page. */
  url?: string;
  /** Show on the home page. If no project is featured, the first three are used. */
  featured?: boolean;
}

export interface WebsiteEntry extends BaseEntry {
  kind: 'website';
}

export interface GameEntry extends BaseEntry {
  kind: 'game';
  /** Path to the exported PICO-8 HTML under /public, e.g. "/games/my-game/index.html". */
  embedPath?: string;
  /** Short control hints shown beside the player, e.g. ["Arrows — move", "Z — jump"]. */
  controls?: readonly string[];
}

export type ProjectEntry = WebsiteEntry | GameEntry;

export interface ProjectImage {
  src: string;
  alt: string;
  /** Human-readable name derived from the file name: "02-pricing-page.png" → "Pricing page". */
  caption: string;
  /** A GIF with the same name as the still ("01-boss.gif" next to "01-boss.png"). Plays only when opened. */
  animated?: string;
  /** Pixel art (games): scaled up with hard edges instead of smoothing. */
  pixel: boolean;
}

/** A project after the loader has attached images and derived fields. */
export type Project = ProjectEntry & {
  /** Zero-padded position in the list: "01", "02", … */
  number: string;
  hero: ProjectImage | null;
  gallery: readonly ProjectImage[];
  prevSlug: string;
  nextSlug: string;
};
