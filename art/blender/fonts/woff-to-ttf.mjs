// Turns a WOFF 1.0 font back into the TrueType file it wraps, for Blender (which can't read web fonts).
// WOFF 1.0 is an sfnt whose tables are each zlib-compressed; this inflates them and rewrites the sfnt
// header and table directory. Format conversion is allowed by the SIL Open Font License.
//   node art/blender/fonts/woff-to-ttf.mjs <in.woff> <out.ttf>
import { readFileSync, writeFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error('usage: woff-to-ttf.mjs <in.woff> <out.ttf>');

const woff = readFileSync(input);
if (woff.toString('latin1', 0, 4) !== 'wOFF') throw new Error(`${input} is not a WOFF 1.0 file`);
const flavor = woff.readUInt32BE(4);
const numTables = woff.readUInt16BE(12);

const tables = [];
for (let i = 0; i < numTables; i++) {
  const at = 44 + i * 20;
  const tag = woff.toString('latin1', at, at + 4);
  const offset = woff.readUInt32BE(at + 4);
  const compLength = woff.readUInt32BE(at + 8);
  const origLength = woff.readUInt32BE(at + 12);
  const checksum = woff.readUInt32BE(at + 16);
  const raw = woff.subarray(offset, offset + compLength);
  const data = compLength < origLength ? inflateSync(raw) : raw;
  if (data.length !== origLength) throw new Error(`table ${tag}: expected ${origLength} bytes, got ${data.length}`);
  tables.push({ tag, checksum, data });
}
tables.sort((a, b) => (a.tag < b.tag ? -1 : 1)); // sfnt directories are sorted by tag

const pad4 = (n) => (n + 3) & ~3;
const headerSize = 12 + numTables * 16;
const total = tables.reduce((sum, t) => sum + pad4(t.data.length), headerSize);
const out = Buffer.alloc(total);

const entrySelector = Math.floor(Math.log2(numTables));
const searchRange = 2 ** entrySelector * 16;
out.writeUInt32BE(flavor, 0);
out.writeUInt16BE(numTables, 4);
out.writeUInt16BE(searchRange, 6);
out.writeUInt16BE(entrySelector, 8);
out.writeUInt16BE(numTables * 16 - searchRange, 10);

let offset = headerSize;
tables.forEach((t, i) => {
  const at = 12 + i * 16;
  out.write(t.tag, at, 'latin1');
  out.writeUInt32BE(t.checksum, at + 4);
  out.writeUInt32BE(offset, at + 8);
  out.writeUInt32BE(t.data.length, at + 12);
  t.data.copy(out, offset);
  offset += pad4(t.data.length);
});

writeFileSync(output, out);
console.log(`${output}: ${numTables} tables, ${out.length} bytes`);
