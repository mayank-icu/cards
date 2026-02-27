import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const midiRoot = path.join(projectRoot, 'midi');
const outDir = path.join(projectRoot, 'data');
const outPath = path.join(outDir, 'song-index.json');

const normalizeWhitespace = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const stripExtensions = (fileName) => {
  let base = String(fileName || '');
  base = base.replace(/\.mid(\.mid)?$/i, '');
  return base;
};

const toTitleArtist = (fileNameNoExt) => {
  const cleaned = normalizeWhitespace(
    String(fileNameNoExt || '')
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/\([^)]*\)/g, ' ')
      .replace(/[_]+/g, ' ')
      .replace(/\s+-\s+/g, ' - ')
  );

  const parts = cleaned.split(' - ').map((p) => normalizeWhitespace(p)).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0];
    const b = parts.slice(1).join(' - ');

    const aLen = a.length;
    const bLen = b.length;

    if (bLen <= aLen) {
      return { title: a, artist: b };
    }
    return { title: b, artist: a };
  }

  return { title: cleaned || 'Unknown Title', artist: 'Unknown Artist' };
};

const enumerateMidiFiles = (rootDir) => {
  const entries = [];
  const stack = [rootDir];

  while (stack.length) {
    const current = stack.pop();
    const items = fs.readdirSync(current, { withFileTypes: true });
    for (const item of items) {
      const abs = path.join(current, item.name);
      if (item.isDirectory()) {
        stack.push(abs);
        continue;
      }

      const lower = item.name.toLowerCase();
      if (!(lower.endsWith('.mid') || lower.endsWith('.mid.mid'))) continue;

      const rel = path.relative(rootDir, abs);
      const parts = rel.split(path.sep);
      const folder = parts.length > 1 ? parts[0] : '';
      const file = parts.length > 1 ? parts.slice(1).join('/') : parts[0];

      entries.push({ folder, file });
    }
  }

  entries.sort((x, y) => {
    const folderCmp = String(x.folder).localeCompare(String(y.folder));
    if (folderCmp !== 0) return folderCmp;
    return String(x.file).localeCompare(String(y.file));
  });

  return entries;
};

if (!fs.existsSync(midiRoot)) {
  console.error(`Missing midi directory: ${midiRoot}`);
  process.exit(1);
}

const files = enumerateMidiFiles(midiRoot);

const folderCounters = new Map();
const results = files.map(({ folder, file }) => {
  const current = (folderCounters.get(folder) || 0) + 1;
  folderCounters.set(folder, current);

  const baseName = stripExtensions(path.posix.basename(file));
  const { title, artist } = toTitleArtist(baseName);

  const safeFolder = (folder || 'misc').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
  const id = `${safeFolder}-${String(current).padStart(3, '0')}`;

  return {
    id,
    title,
    artist,
    folder,
    file: path.posix.basename(file)
  };
});

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

console.log(`[build-song-index] Wrote ${results.length} songs -> ${outPath}`);
for (const [folder, count] of [...folderCounters.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])))) {
  console.log(`[build-song-index] folder=${folder || '(root)'} count=${count}`);
}
