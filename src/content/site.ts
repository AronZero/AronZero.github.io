/* Site-wide details. Replace the placeholders before launch. */
export const site = {
  name: 'Aron Jay Consuelo',
  roles: {
    primary: 'UI/UX Designer',
    focus: 'Front-end Development',
    also: 'Graphic Design',
    skills: ['AngularJS', 'ReactJS', 'React Native', 'Flutter', 'Bootstrap', 'TailwindCSS', 'SCSS', 'HTML', 'JavaScript', 'Microsoft SQL'],
    tools: ['Figma', 'Adobe XD', 'Adobe Illustrator', 'Adobe Photoshop', 'GitHub', 'Azure Repos', 'Claude', 'ChatGPT'],
  },
  statement: 'I design interfaces — then I build them, down to the last transition.',
  /** Shown in "About" under the hero, beside the paragraphs below. Your own words, credited to you. */
  quote: 'The mockup is a promise. The browser is where I keep it.',
  /** Shown in "About" under the hero: the first paragraph large, the second under it. */
  about: [
    'I’m a UI/UX designer who also writes the front-end code. Over ten years I’ve worked on more than 30 websites and apps for cafés, retailers, an industry association and a provincial government.',
    'Building what I design keeps my work grounded in reality. Every layout must function in the browser, not just look good in a mockup. My graphic design background is reflected in my attention to typography, composition, and imagery. Beyond professional work, I enjoy exploring personal creative projects, experimenting with ideas, and building things that combine design, technology, and creativity.',
  ],
  email: 'aronjayconsuelo@gmail.com',
  /** Full LinkedIn profile URL. */
  linkedin: 'https://www.linkedin.com/in/aron-jay-consuelo-515114103/',
  /**
   * Résumé PDF in /public. Set to null to hide every résumé button.
   */
  resumeUrl: '/Aron-Jay-Consuelo-Resume.pdf' as string | null,
} as const;
