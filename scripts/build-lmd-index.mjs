import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const md5JsonPath = path.join(projectRoot, 'md5_to_paths.json');
const lmdRoot = path.join(projectRoot, 'lmd_matched');
const outDir = path.join(projectRoot, 'data');
const outPath = path.join(outDir, 'lmd_search_index.json');

const normalizePath = (value) => String(value || '').replace(/\\/g, '/');
const cleanToken = (value) => String(value || '')
  .replace(/\.mid[i]?$/i, '')
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const chooseBestAlias = (aliases) => {
  if (!Array.isArray(aliases) || aliases.length === 0) return '';
  const sorted = aliases
    .map((item) => normalizePath(item))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  return sorted[0] || '';
};

const pickArtist = (alias) => {
  const [first] = normalizePath(alias).split('/');
  const artist = cleanToken(first);
  return artist && artist.length <= 48 ? artist : 'Unknown Artist';
};

const pickTitle = (alias, md5) => {
  const fileName = normalizePath(alias).split('/').pop() || `${md5}.mid`;
  const title = cleanToken(fileName);
  return title || `Song ${md5.slice(0, 8)}`;
};

const enumerateMidiFiles = (rootDir) => {
  const map = new Map();
  const stack = [rootDir];
  let scanned = 0;

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolute);
        continue;
      }
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.mid')) continue;

      scanned += 1;
      if (scanned % 50000 === 0) {
        console.log(`Scanned ${scanned} MIDI files...`);
      }

      const md5 = entry.name.replace(/\.mid$/i, '').toLowerCase();
      if (!map.has(md5)) {
        map.set(md5, normalizePath(path.relative(rootDir, absolute)));
      }
    }
  }

  return map;
};

if (!fs.existsSync(md5JsonPath)) {
  throw new Error(`Missing ${md5JsonPath}`);
}
if (!fs.existsSync(lmdRoot)) {
  throw new Error(`Missing ${lmdRoot}`);
}

console.log('Loading md5_to_paths.json...');
const rawMap = JSON.parse(fs.readFileSync(md5JsonPath, 'utf8'));
console.log('Scanning lmd_matched files...');
const md5ToKey = enumerateMidiFiles(lmdRoot);

console.log('Building search index...');
const results = [];
let included = 0;
let skipped = 0;

for (const [md5Raw, aliasesRaw] of Object.entries(rawMap)) {
  const md5 = String(md5Raw).toLowerCase();
  const objectKey = md5ToKey.get(md5);
  if (!objectKey) {
    skipped += 1;
    continue;
  }

  const aliasForMeta = chooseBestAlias(aliasesRaw);
  const aliases = Array.isArray(aliasesRaw)
    ? [...new Set(aliasesRaw.map((item) => cleanToken(item)).filter(Boolean))].slice(0, 5)
    : [];

  results.push({
    id: md5,
    title: pickTitle(aliasForMeta, md5),
    artist: pickArtist(aliasForMeta),
    aliases,
    objectKey
  });
  included += 1;
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(results));

console.log(`Done. Index written to ${outPath}`);
console.log(`Indexed: ${included}, skipped (missing midi file): ${skipped}`);

