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
      'Design, build and maintain websites using authoring and scripting languages, content creation and management tools, and digital media, on schedule.',
      'Examine user needs to determine technical requirements.',
      'Keep up with current web technologies and programming practices.',
    ],
  },
  {
    title: 'Software Developer',
    company: 'Intellismart Technology Inc.',
    period: '2016 – 2020',
    duties: [
      'Responsible for the layout, visual appearance and usability of company and client websites and mobile apps.',
      'Developed multimedia presentations, web pages, promotional products, technical illustrations and computer artwork for products, technical manuals and slide shows.',
    ],
  },
];

export const certifications: readonly Certification[] = [
  { name: 'Virtualization using VMware', issuer: 'ITechtivity' },
  { name: 'Data Mining using RapidMiner', issuer: 'ITechtivity' },
  { name: 'NoSQL DBMS', issuer: 'ITechtivity' },
  { name: 'HTML5', issuer: 'EGlobio Training' },
  { name: 'Graphic Design', issuer: 'EGlobio Training' },
  { name: '3D Animation', issuer: 'EGlobio Training' },
  { name: 'Getting Started in UX', issuer: 'LinkedIn Learning' },
  { name: 'Design Thinking at Work', issuer: 'LinkedIn Learning' },
];
