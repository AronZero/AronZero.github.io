// Writes public/third-party-licenses.txt from the packages that ship to the browser.
// The minifier strips license comments, so MIT / ISC / OFL notices travel in this file instead.
// Runs as part of `npm run build`; add a package here when it starts shipping at runtime.
import { readFileSync, writeFileSync } from 'node:fs';

const shipped = [
  'react',
  'react-dom',
  'scheduler',
  'lucide-react',
  '@fontsource/barlow-condensed',
  '@fontsource-variable/geist',
  '@fontsource-variable/geist-mono',
];

const rule = '='.repeat(72);
const sections = shipped.map((name) => {
  const dir = new URL(`../node_modules/${name}/`, import.meta.url);
  const pkg = JSON.parse(readFileSync(new URL('package.json', dir), 'utf8'));
  const text = readFileSync(new URL('LICENSE', dir), 'utf8').trim();
  return `${rule}\n${name} ${pkg.version} (${pkg.license})\n${rule}\n\n${text}\n`;
});

const header = [
  'Third-party software and fonts used on this site.',
  'The logo is outlined from Barlow Condensed SemiBold (SIL Open Font License 1.1).',
  '',
].join('\n');

writeFileSync(new URL('../public/third-party-licenses.txt', import.meta.url), `${header}\n${sections.join('\n')}`);
console.log(`third-party-licenses.txt: ${shipped.length} packages`);
