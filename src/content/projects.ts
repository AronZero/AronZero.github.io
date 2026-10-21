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
    kind: 'mobile',
    slug: 'ozone',
    title: 'OZONE',
    role: 'UI/UX Design · Front-end Development',
    description:
      'A personal mobile app that bundles multiple tools: Notes, Finance Tracker, and Book Review.',
    story: {
      challenge: 'Savings, reading and notes usually live in three apps, each asking for an account and a connection. I wanted one private place for all three that works fully offline.',
      contribution: 'A solo project: I designed the app end to end and built it in Flutter, with a local SQLite database and an AES-256 encrypted vault. No account, and nothing leaves the phone.',
      decisions: [
        'Honest charts: every chart starts at zero so bar heights compare fairly, and months without an update are marked as carried, never guessed.',
        'Accessible by default: every chart has a table view for screen readers, text follows the phone’s font size up to 200%, and animations switch off with the system setting.',
        'One colour per tool for wayfinding, plus a Monochrome theme that keeps colour only for gains, losses and warnings.',
      ],
      outcome: 'Open source on GitHub.',
    },
    disciplines: ['mobile-app-design', 'ui-ux', 'front-end'],
    stack: ['Flutter', 'Dart', 'SQLite'],
    url: 'https://github.com/AronZero/OZONE-Super-App',
    featured: true,
  },
  {
    kind: 'website',
    slug: 'glow-smoothies',
    title: 'Glow Smoothies',
    role: 'UI/UX Design · Front-end Development',
    description:
      'A storefront to provide a convenient, wholesome way to help customers fuel their bodies and achieve their daily wellness goals.',
    story: {
      challenge: 'A small collagen-smoothie brand sold through Shopee and social media, with no home of its own to explain the products and what goes into them.',
      contribution: 'I designed the site in Adobe XD and built the front end in AngularJS and Sass.',
      decisions: [
        'Kept checkout on Shopee, where customers already buy, and made “Get from Shopee.ph” the main action on every product page.',
        'Product pages lead with ingredients and benefits, because people choosing a wellness drink want to know what’s in it.',
        'A bright, fruit-filled style with pastel colours and outlined display type, to suit a young, health-minded audience.',
      ],
    },
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
    story: {
      challenge: 'A local café wanted customers to browse the full menu and order ahead from their phones, instead of reading a board at the counter.',
      contribution: 'I designed the UI in Figma and built the front end in AngularJS and Sass, working with the rest of the team.',
      decisions: [
        'The menu is the home page: categories in a sidebar, search on top, and every drink one tap from its details.',
        'Ordering happens in one sheet: size, add-ons and a note for the barista, with the running price on the Add button.',
        'A dark, photo-led layout so the drinks carry the colour, with a light mode for daytime use.',
      ],
      outcome: 'Live at amperkcafe.com.',
    },
    disciplines: ['web-design', 'ui-ux', 'front-end'],
    stack: ['Figma', 'AngularJS', 'Sass'],
    url: 'https://www.amperkcafe.com/',
    featured: false,
  },
  {
    kind: 'website',
    slug: 'bcea',
    title: 'BCEA',
    role: 'UI/UX Design · Front-end Development',
    description:
      'A website for the British Columbia Electrical Association, connecting electrical industry professionals with membership benefits, educational resources, industry events, job opportunities, and networking programs.',
    story: {
      challenge: 'A century-old association offers a lot: events, online courses, industry news, membership programs and two networks. Members and the wider industry needed one place to find all of it.',
      contribution: 'I designed the site in Figma and built the front end in AngularJS and Sass.',
      decisions: [
        'Upcoming events sit in the hero as cards that link straight to registration, because events are what bring members back.',
        'A news strip under the hero keeps the latest industry news one glance away.',
        'Navigation is grouped by audience: Membership, Development, the Women’s Network and the AMP Network each get their own menu.',
      ],
      outcome: 'Live at bcea.bc.ca.',
    },
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
    story: {
      challenge: 'A couple needed one place for guests to find the wedding details and confirm attendance, instead of chasing replies by message.',
      contribution: 'I designed the site in Adobe XD and built it in AngularJS and Sass.',
      decisions: [
        'Only four sections (Home, Our Story, The Wedding Day and RSVP), so guests find what they need quickly.',
        'The reply-by date sits right beside the “Register now” button, so guests know when to answer.',
        'Watercolour florals and script type that echo a printed invitation.',
      ],
    },
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
    story: {
      challenge: 'A skincare brand with products for many skin types and concerns needed shoppers to find the right product and trust it enough to buy.',
      contribution: 'I designed the store in Adobe XD and built the front end in AngularJS and Sass.',
      decisions: [
        'Best sellers come first on the products page, followed by a full catalogue with sort and filter.',
        'Customer reviews on product pages, because in skincare other people’s results persuade more than claims.',
        'A promo bar across the top for time-limited offers such as free shipping.',
      ],
    },
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
    story: {
      challenge: 'A landscaping company with years of finished work to show wanted a design concept for a site that turns visitors into inquiries.',
      contribution: 'I designed the concept in Adobe XD: structure, page layouts and visual design. It was a design-only project and was never built.',
      decisions: [
        'A dedicated project gallery, because landscaping is sold on photos of finished work.',
        'Deep greens and real foliage cut-outs that break out of the hero, so the brand feels like a garden rather than a template.',
      ],
    },
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
    story: {
      challenge: 'Visitors planning a trip to Romblon had to piece together destinations, events and promos from many sources. The province needed one site for all of it.',
      contribution: 'I designed the site in Adobe XD and built the front end in AngularJS and Sass.',
      decisions: [
        'Each of the 17 municipalities has its own page with quick facts and main attractions, reachable from one row of chips.',
        'Site-wide search across destinations, events and news.',
        'Travel promos and events have their own pages, so they can be updated often without touching the rest of the site.',
      ],
    },
    disciplines: ['web-design', 'ui-ux', 'front-end'],
    stack: ['Adobe XD', 'AngularJS', 'Sass'],
    featured: false,
  },
  {
    kind: 'website',
    slug: 'romblon-pmis',
    title: 'Romblon PMIS',
    role: 'UI/UX Design · Front-end Development',
    description:
      'An internal management system for Romblon’s provincial operations, streamlining document tracking, payment processing, timekeeping, and employee reporting in one place.',
    story: {
      challenge: 'The Provincial Government of Romblon handled documents, attendance, cheques and procurement on paper, across many offices. The goal was to make every transaction faster by automating repetitive tasks, and safer by keeping records in one system.',
      contribution: 'I designed the system’s interface in Adobe XD and built the front end in AngularJS and Sass.',
      decisions: [
        'The dashboard opens with what staff do every day, clocking in and out and checking monthly attendance, before the list of applications.',
        'Urgent pending documents surface in a highlighted panel at the top of Document Tracking.',
        'Every module follows the same pattern, a filter panel and then a data table, so learning one teaches them all.',
      ],
    },
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
    story: {
      challenge: 'Make a complete arcade shooter inside PICO-8’s limits: a 128 × 128 screen, 16 colours, and a tight budget for code and sprites.',
      contribution: 'A solo project: game design, pixel art and programming in Lua. Music by Gruber.',
      decisions: [
        'Fifteen waves that build up enemy ships and comets, with survivors respawning at full health, so speed matters as much as aim.',
        'Four power-ups (rapid fire, shields, bombs and extra lives) to change the pace between waves.',
      ],
      outcome: 'Published on the Lexaloffle BBS and playable on this site.',
    },
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
