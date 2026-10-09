import type { ProjectEntry } from './types';

/*
 * ─────────────────────────────────────────────────────────────
 *  YOUR PROJECTS — the only file you need to edit.
 *
 *  • Order here is the order on the site.
 *  • Images live in  src/content/projects/<slug>/
 *      hero.png            ← landing-page hero (required)
 *      gallery/01-xxx.png  ← other pages (optional, sorted by name)
 *  • Every page, filter and "next project" link updates automatically.
 *
 *  PLACEHOLDER DATA below — replace with your real projects.
 * ─────────────────────────────────────────────────────────────
 */
export const projectEntries = [
  {
    kind: 'website',
    slug: 'glow-smoothies',
    title: 'Glow Smoothies',
    role: 'UI/UX Design · Front-end Development',
    description:
      'A storefront to provide a convenient, wholesome way to help customers fuel their bodies and achieve their daily wellness goals.',
    disciplines: ['web-design', 'ui-ux', 'front-end'],
    stack: ['Adobe XD', 'AngularJS', 'Sass'],
    featured: false,
  },
  {
    kind: 'website',
    slug: 'amperk-cafe',
    title: 'A.M. Perk Cafe',
    role: 'UI/UX Design · Front-end Development · Collaborator',
    description:
      'A café website where customers can explore the menu and find location details with convenient online ordering to make getting their daily coffee easier.',
    disciplines: ['web-design', 'ui-ux', 'front-end'],
    stack: ['Figma', 'AngularJS', 'Sass'],
    url: 'https://www.amperkcafe.com/',
    featured: true,
  },
  {
    kind: 'website',
    slug: 'bcea',
    title: 'BCEA - British Columbia Electrical Association',
    role: 'UI/UX Design · Front-end Development',
    description:
      'A website for the British Columbia Electrical Association, connecting electrical industry professionals with membership benefits, educational resources, industry events, job opportunities, and networking programs.',
    disciplines: ['web-design', 'ui-ux', 'front-end'],
    stack: ['Figma', 'AngularJS', 'Sass'],
    url: 'https://www.bcea.bc.ca/',
    featured: true,
  },
  {
    kind: 'website',
    slug: 'rsvp-website',
    title: 'RSVP Website',
    role: 'UI/UX Design · Front-end Development',
    description:
      'A wedding website that brings event details and guest information together, with a simple RSVP experience to help guests confirm their attendance.',
    disciplines: ['web-design', 'ui-ux', 'front-end'],
    stack: ['Adobe XD', 'AngularJS', 'Sass'],
    featured: false,
  },
  {
    kind: 'website',
    slug: 'radiance-emporium',
    title: 'Radiance Emporium',
    role: 'UI/UX Design · Front-end Development',
    description:
      'An e-commerce website for a skincare brand, featuring products for different skin types and concerns, with customer reviews to help shoppers find the right products for their skincare routine.',
    disciplines: ['web-design', 'ui-ux', 'front-end'],
    stack: ['Adobe XD', 'AngularJS', 'Sass'],
    featured: false,
  },
  {
    kind: 'website',
    slug: 'tulipa-landscaping',
    title: 'Tulipa Landscaping LLC',
    role: 'UI/UX Design',
    description:
      'A landscaping website showcasing outdoor design, garden maintenance, and construction services, including irrigation systems tailored to different spaces.',
    disciplines: ['web-design', 'ui-ux'],
    stack: ['Adobe XD'],
    featured: false,
  },
  {
    kind: 'website',
    slug: 'romblon-tourism',
    title: 'Romblon Tourism',
    role: 'UI/UX Design · Front-end Development',
    description:
      'A tourism website showcasing Romblon’s best destinations, with trip schedules, travel promos, and the latest local news to help visitors plan their next adventure.',
    disciplines: ['web-design', 'ui-ux', 'front-end'],
    stack: ['Adobe XD', 'AngularJS', 'Sass'],
    featured: false,
  },
  {
    kind: 'website',
    slug: 'romblon-pmis',
    title: 'Romblon Provincial Management System',
    role: 'UI/UX Design · Front-end Development',
    description:
      'An internal management system for Romblon’s provincial operations, streamlining document tracking, payment processing, timekeeping, and employee reporting in one place.',
    disciplines: ['web-design', 'ui-ux', 'front-end'],
    stack: ['Adobe XD', 'AngularJS', 'Sass'],
    featured: false,
  },
  {
    kind: 'game',
    slug: 'astrox',
    title: 'Astrox — Into the Cosmic Chaos',
    role: 'Game Design · Pixel Art · Programming',
    description:
      'A Galaga-inspired shoot-’em-up for PICO-8. Fight through 15 waves of enemy ships and comets, pick up rapid fire, shields, bombs and extra lives, and clear each wave fast, before the survivors respawn at full health. Music by Gruber.',
    disciplines: ['game', 'graphic-design'],
    stack: ['PICO-8', 'Lua'],
    url: 'https://www.lexaloffle.com/bbs/?pid=149887#p',
    embedPath: '/games/astrox/index.html',
    controls: ['Arrows — move', 'X — shoot', 'Z — bomb'],
  },
  //{
  //  kind: 'website',
  //  slug: 'northbound-coffee',
  //  title: 'Northbound Coffee',
  //  role: 'UI/UX Design · Front-end Development',
  //  description:
  //    'A storefront redesign for a small-batch roastery: calmer product pages, a simpler subscription flow, and a React component library the team can publish with.',
  //  disciplines: ['web-design', 'ui-ux', 'front-end'],
  //  stack: ['React', 'TypeScript', 'Figma'],
  //  url: 'https://example.com',
  //  featured: true,
  //},
  //{
  //  kind: 'website',
  //  slug: 'ledgerly',
  //  title: 'Ledgerly',
  //  role: 'UI/UX Design',
  //  description:
  //    'Invoices, expenses and tax estimates in one quiet dashboard for freelancers, designed around the three questions users ask every week.',
  //  disciplines: ['ui-ux'],
  //  stack: ['Figma', 'Design system'],
  //  featured: true,
  //},
  //{
  //  kind: 'website',
  //  slug: 'kindred-clinic',
  //  title: 'Kindred Clinic',
  //  role: 'Web Design · Front-end Development',
  //  description:
  //    'A booking site for six neighbourhood clinics with real-time availability, built to be usable one-handed on a phone in a waiting room.',
  //  disciplines: ['web-design', 'front-end'],
  //  stack: ['AngularJS', 'Sass'],
  //  url: 'https://example.com',
  //  featured: true,
  //},
] as const satisfies readonly ProjectEntry[];
