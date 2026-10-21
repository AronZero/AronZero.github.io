/* Work history and certifications, taken from the résumé PDF. Order here = order on the page. */

export interface Job {
  title: string;
  company: string;
  /** As printed on the résumé, e.g. "2020 – 2026". */
  period: string;
  duties: readonly string[];
}

export interface Certification {
  name: string;
  issuer: string;
}

export const experience: readonly Job[] = [
  {
    title: 'Web Development Coordinator',
    company: 'Kamal Osman Jamjoom Service Philippines Inc.',
    period: '2020 – 2026',
    duties: [
      'Designed, built and maintained websites end to end, from layout and content to the code and media behind them, and delivered them on schedule.',
      'Turned user needs into clear technical requirements.',
      'Kept my work current with modern web technologies and programming practices.',
    ],
  },
  {
    title: 'Software Developer',
    company: 'Intellismart Technology Inc.',
    period: '2016 – 2020',
    duties: [
      'Owned the layout, visual design and usability of company and client websites and mobile apps.',
      'Created multimedia presentations, web pages, promotional materials, technical illustrations and artwork for products, manuals and slide shows.',
    ],
  },
];

/* A curated subset of the résumé: only training that supports UI/UX, front-end and graphic design.
   (VMware, RapidMiner, NoSQL, 3D Animation and Getting Started in UX stay on the PDF only.) */
export const certifications: readonly Certification[] = [
  { name: 'Design Thinking at Work', issuer: 'LinkedIn Learning' },
  { name: 'HTML5', issuer: 'EGlobio Training' },
  { name: 'Graphic Design', issuer: 'EGlobio Training' },
];
