/* Site-wide details. Replace the placeholders before launch. */
export const site = {
  name: 'Aron Jay Consuelo',
  roles: {
    primary: 'UI/UX Designer',
    focus: 'Front-end Development',
    also: 'Graphic Design',
  },
  statement: 'I design interfaces — then I build them, down to the last transition.',
  email: 'aronjayconsuelo@gmail.com',
  /** Full LinkedIn profile URL. */
  linkedin: 'https://www.linkedin.com/in/aron-jay-consuelo-515114103/',
  /**
   * Résumé PDF in /public. Set to null to hide every résumé button.
   */
  resumeUrl: '/Aron-Jay-Consuelo-Resume.pdf' as string | null,
} as const;
