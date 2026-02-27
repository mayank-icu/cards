import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import https from 'https'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = __dirname;
// ── Song library — read live from song-index.json ──────────────────────────
// Fallback SONGS used only if song-index.json is absent at startup
const SONGS = [];

const MIDI_DIR = path.join(PROJECT_ROOT, 'midi');
// Public GCS base – bucket is confirmed public (songs.xml listing at storage.googleapis.com/my-lmd-files)
const GCS_PUBLIC_BASE = 'https://storage.googleapis.com/my-lmd-files';

const buildGcsUrl = (song) => {
  const key = `${song.folder}/${song.file}`;
  return `/api/midi-object?key=${encodeURIComponent(key)}`;
};

// Always read fresh from disk (no caching) so restarts aren't needed after edits
const loadIndexedSongs = () => {
  try {
    const indexPath = path.join(PROJECT_ROOT, 'data', 'song-index.json');
    if (!fs.existsSync(indexPath)) return SONGS;
    const raw = fs.readFileSync(indexPath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : SONGS;
  } catch {
    return SONGS;
  }
};

const getSongPool = () => loadIndexedSongs();

const normalizeCategory = (input) => {
  const q = String(input || '').trim().toLowerCase();
  if (!q) return '';
  if (q === 'movie' || q === 'movies') return 'movies';
  if (q === 'pop') return 'pop';
  if (q === 'anime') return 'anime';
  if (q === 'classical') return 'classical';
  if (q === 'love') return 'love';
  return q;
};

const getSongCategory = (song) => {
  if (['movie'].includes(song.folder)) return 'movies';
  if (['multi-lang', 'anime'].includes(song.folder)) return 'anime';
  if (['timeless', 'intro'].includes(song.folder)) return 'classical';
  if (song.folder === 'love') return 'love';
  if (['pop-icon', 'modern', 'hits', 'universal', 'new1', '2023-26_modern-hits', 'new'].includes(song.folder)) return 'pop';
  return 'pop';
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const searchSongs = (query, limit = 50) => {
  const q = normalizeCategory(String(query || '').trim());
  if (!q) return [];

  const pool = getSongPool();

  // ── Category tab filter ──────────────────────────────────────────────────
  if (q === 'pop' || q === 'movies' || q === 'anime' || q === 'classical' || q === 'love') {
    return pool.filter(song => {
      if (q === 'pop') return ['pop-icon', 'modern', 'hits', 'universal', 'new1', '2023-26_modern-hits', 'emotional'].includes(song.folder);
      if (q === 'movies') return song.folder === 'movie';
      if (q === 'anime') return ['multi-lang', 'anime'].includes(song.folder);
      if (q === 'classical') return ['intro', 'timeless'].includes(song.folder);
      if (q === 'love') return song.folder === 'love' || ['Perfect', 'All of Me', 'A Thousand Years', 'Photograph', 'Until I Found You', "Say You Won't Let Go"].includes(song.title);
      return false;
    }).slice(0, 50).map(song => ({
      id: song.id, title: song.title, artist: song.artist,
      midiUrl: buildGcsUrl(song), category: getSongCategory(song),
    }));
  }

  // ── Text search with fuzzy ngram tolerance ───────────────────────────────
  const tokens = q.split(/\s+/).filter(t => t.length >= 2);
  const scored = [];

  const ngramScore = (needle, haystack, n = 3) => {
    if (needle.length < n) return haystack.includes(needle) ? 1 : 0;
    let hits = 0;
    for (let i = 0; i <= needle.length - n; i++) {
      if (haystack.includes(needle.slice(i, i + n))) hits++;
    }
    return hits / (needle.length - n + 1);
  };

  for (const song of pool) {
    const titleL = song.title.toLowerCase();
    const artistL = song.artist.toLowerCase();
    const haystack = `${titleL} ${artistL}`;
    let score = 0;

    if (titleL === q) score += 100;
    else if (titleL.startsWith(q)) score += 60;
    else if (titleL.includes(q)) score += 40;
    if (artistL.includes(q)) score += 20;
    if (haystack.includes(q)) score += 10;

    for (const t of tokens) {
      if (titleL.includes(t)) score += 8;
      else if (artistL.includes(t)) score += 5;
    }

    score += ngramScore(q, titleL) * 15;
    score += ngramScore(q, artistL) * 8;

    if (score > 0) scored.push({ score, song });
  }

  const results = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ song }) => ({
      id: song.id, title: song.title, artist: song.artist,
      midiUrl: buildGcsUrl(song), category: getSongCategory(song),
    }));

  // No results → fall back to random top picks so screen is never blank
  if (results.length === 0) {
    return shuffle(pool.filter(s => ['universal', 'new1', 'modern', 'hits', 'pop-icon'].includes(s.folder)))
      .slice(0, 18)
      .map(song => ({
        id: song.id, title: song.title, artist: song.artist,
        midiUrl: buildGcsUrl(song), category: getSongCategory(song),
        isTopPicksFallback: true,
      }));
  }

  return results;
};

const getFeatured = () => {
  const pool = getSongPool();
  return shuffle(pool.filter(s => ['universal', 'new1', 'modern', 'hits', 'pop-icon'].includes(s.folder)))
    .slice(0, 18)
    .map(song => ({
      id: song.id, title: song.title, artist: song.artist,
      midiUrl: buildGcsUrl(song), category: getSongCategory(song),
    }));
};

const writeJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(payload));
};

const createLocalLakhMiddleware = () => (req, res, next) => {
  try {
    if (!req.url) return next();
    const url = new URL(req.url, 'http://localhost');

    // ── Search ──
    if (url.pathname === '/api/midi-search') {
      const query = (url.searchParams.get('q') || '').trim();
      const results = query ? searchSongs(query) : getFeatured();
      const pool = getSongPool();
      // Debug: total indexed
      console.log('[local-midi-search] totalIndexed=', getSongPool().length, 'q=', query);
      writeJson(res, 200, { results, meta: { totalIndexed: pool.length } });
      return;
    }

    // ── Serve MIDI file — first try local /midi/, fallback to GCS ──
    if (url.pathname === '/api/midi-object') {
      const rawKey = url.searchParams.get('key') || '';
      const key = decodeURIComponent(String(rawKey)).replace(/^(\.\.\/|\.\.\\)+/, '');
      if (!key) { res.statusCode = 400; res.end('Missing key'); return; }

      const absPath = path.join(MIDI_DIR, key.replace(/\//g, path.sep));
      if (fs.existsSync(absPath)) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'audio/midi');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        fs.createReadStream(absPath).pipe(res);
        return;
      }

      // Local file not found — proxy from public GCS to avoid CORS
      const gcsUrl = `${GCS_PUBLIC_BASE}/${key.split('/').map(encodeURIComponent).join('/')}`;

      https.get(gcsUrl, (gcsRes) => {
        if (gcsRes.statusCode !== 200) {
          res.statusCode = gcsRes.statusCode || 404;
          res.end(`GCS error: ${gcsRes.statusCode}`);
          return;
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'audio/midi');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        gcsRes.pipe(res);
      }).on('error', (e) => {
        res.statusCode = 500;
        res.end(`Proxy error: ${e.message}`);
      });
      return;
    }

    next();
  } catch (err) {
    writeJson(res, 500, { results: [], error: err?.message || 'middleware error' });
  }
};


// https://vite.dev/config/
export default defineConfig({
  server: {
    fs: {
      max: Infinity
    },
    host: true,
    port: 5173,
    strictPort: true,
    hmr: false
  },
  plugins: [
    react({
      // Enable React Fast Refresh only in development
      fastRefresh: process.env.NODE_ENV === 'development',
      // Optimize JSX runtime
      jsxRuntime: 'automatic'
    }),
    {
      name: 'local-lakh-api',
      configureServer(server) {
        server.middlewares.use(createLocalLakhMiddleware());
      }
    }
  ],
  publicDir: 'public',
  css: {
    postcss: './postcss.config.js'
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Keep chunking predictable and avoid circular app chunks.
          // Source files are split naturally by route-level lazy imports.
          if (!id.includes('node_modules')) return;

          if (id.includes('react-dom') || /node_modules[\/](react|scheduler)[\/]/.test(id)) return 'vendor-react';
          if (id.includes('firebase')) return 'vendor-firebase';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('gsap')) return 'vendor-gsap';
          if (id.includes('lottie')) return 'vendor-lottie';
          if (id.includes('axios')) return 'vendor-http';
          if (id.includes('@tonejs/midi')) return 'vendor-midi';
          if (id.includes('html2canvas')) return 'vendor-canvas';
          if (id.includes('react-hot-toast')) return 'vendor-toast';

          return 'vendor';
        },
        chunkFileNames: () => `js/[name]-[hash].js`
      }
    },
    chunkSizeWarningLimit: 1200,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        safari10: true
      },
    },
    sourcemap: false,
    target: 'es2018',
    cssCodeSplit: true,
    copyPublicDir: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  },
  // Ensure Firebase Auth routes work in production
  preview: {
    port: 4173,
    host: true
  }
})
