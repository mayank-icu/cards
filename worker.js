/**
 * MIDI Backend Worker
 * Handles song search and MIDI file proxying from JSDelivr.
 */

const SONGS_JSON_URL = "https://cdn.jsdelivr.net/gh/mayank-icu/midi@main/songs.json";
const JSDELIVR_BASE = "https://cdn.jsdelivr.net/gh/mayank-icu/midi@main/";

let cachedSongs = null;
let lastFetchTime = 0;
const CACHE_TTL = 300000; // 5 minutes

async function fetchSongs() {
  const now = Date.now();
  if (cachedSongs && (now - lastFetchTime < CACHE_TTL)) {
    return cachedSongs;
  }

  try {
    console.log(`[worker] Fetching remote songs from: ${SONGS_JSON_URL}`);
    const resp = await fetch(SONGS_JSON_URL);
    if (!resp.ok) throw new Error(`Failed to fetch songs.json: ${resp.status}`);
    const data = await resp.json();

    cachedSongs = data.map((s, idx) => {
      // Basic extraction of filename
      const parts = s.file.split('/');
      const filename = parts[parts.length - 1];

      return {
        id: `s-${idx}-${filename.replace('.mid', '')}`,
        title: s.title,
        artist: s.artist,
        folder: s.category,
        file: filename,
        fullPath: s.file
      };
    });

    lastFetchTime = now;
    return cachedSongs;
  } catch (err) {
    console.error(`[worker] Error loading remote songs: ${err.message}`);
    return cachedSongs || [];
  }
}

function normalizeCategory(input) {
  const q = String(input || '').trim().toLowerCase();
  if (!q) return '';
  const mapping = {
    'movie': 'movies',
    'movies': 'movies',
    'pop': 'pop',
    'anime': 'anime',
    'classical': 'classical',
    'love': 'love'
  };
  return mapping[q] || q;
}

function getSongCategory(song) {
  const f = song.folder;
  if (['movie'].includes(f)) return 'movies';
  if (['multi-lang', 'anime'].includes(f)) return 'anime';
  if (['timeless', 'intro'].includes(f)) return 'classical';
  if (f === 'love') return 'love';
  if (['pop-icon', 'modern', 'hits', 'universal', 'new1', '2023-26_modern-hits', 'new', 'emotional'].includes(f)) return 'pop';
  return 'pop';
}

function buildMidiUrl(song, url) {
  const origin = new URL(url).origin;
  return `${origin}/api/midi-object?key=${encodeURIComponent(song.fullPath)}`;
}

function ngramScore(needle, haystack, n = 3) {
  if (needle.length < n) return haystack.includes(needle) ? 1 : 0;
  let hits = 0;
  for (let i = 0; i <= needle.length - n; i++) {
    if (haystack.includes(needle.slice(i, i + n))) hits++;
  }
  return hits / (needle.length - n + 1);
}

function searchSongs(pool, query, url, limit = 25) {
  const originalQuery = String(query || '').trim();
  const q = normalizeCategory(originalQuery);
  if (!q) return [];

  const standardCategories = ["pop", "movies", "anime", "classical", "love"];
  if (standardCategories.includes(q)) {
    return pool.filter(song => {
      if (q === "pop") return ['pop-icon', 'modern', 'hits', 'universal', 'new1', '2023-26_modern-hits', 'emotional'].includes(song.folder);
      if (q === "movies") return song.folder === 'movie';
      if (q === "anime") return ['multi-lang', 'anime'].includes(song.folder);
      if (q === "classical") return ['intro', 'timeless'].includes(song.folder);
      if (q === "love") return song.folder === 'love' || ['Perfect', 'All of Me', 'A Thousand Years', 'Photograph', 'Until I Found You', 'Say You Won\'t Let Go'].includes(song.title);
      return false;
    }).slice(0, 50).map(song => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      midiUrl: buildMidiUrl(song, url),
      category: getSongCategory(song),
    }));
  }

  const tokens = q.split(/\s+/).filter(t => t.length >= 2);
  const scored = [];

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
      id: song.id,
      title: song.title,
      artist: song.artist,
      midiUrl: buildMidiUrl(song, url),
      category: getSongCategory(song),
    }));

  if (results.length === 0) {
    const shuffle = (arr) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    return shuffle(pool.filter(s => ['universal', 'new1', 'modern', 'hits', 'pop-icon'].includes(s.folder)))
      .slice(0, 18)
      .map(song => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        midiUrl: buildMidiUrl(song, url),
        category: getSongCategory(song),
        isTopPicksFallback: true,
      }));
  }

  return results;
}

const BOT_AGENTS = [
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
  'pinterest',
  'slackbot',
  'discordbot'
];

const getDynamicOgTags = (pathname) => {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return null;

  const category = parts[0];
  const CARD_TYPES = {
    'valentine': 'Valentine',
    'birthday': 'Birthday',
    'crush': 'Crush',
    'apology': 'Apology',
    'long-distance': 'Long Distance',
    'invite': 'Invitation',
    'capsule': 'Time Capsule',
    'wish-jar': 'Wish Jar',
    'anniversary': 'Anniversary',
    'thank-you': 'Thank You',
    'congratulations': 'Congratulations',
    'get-well': 'Get Well Soon',
    'graduation': 'Graduation',
    'wedding': 'Wedding',
    'new-baby': 'New Baby',
    'sympathy': 'Sympathy',
    'just-because': 'Just Because',
    'bon-voyage': 'Bon Voyage',
    'housewarming': 'Housewarming',
    'friendship': 'Friendship',
    'self-care': 'Self-Care',
    'missing-you': 'Missing You',
    'christmas': 'Christmas',
    'new-year': 'New Year',
    'easter': 'Easter',
    'halloween': 'Halloween',
    'good-luck': 'Good Luck',
    'retirement': 'Retirement',
    'thinking-of-you': 'Thinking of You',
    'cat-lovers': 'Cat Lovers',
    'balloon-celebration': 'Balloon Celebration',
    'bouquet': 'Digital Bouquet',
    'piano': 'Piano Love Song',
    'view': 'Greeting'
  };

  if (category && CARD_TYPES[category]) {
    const cardName = CARD_TYPES[category];
    return {
      title: `A Special ${cardName} Card For You | EGreet`,
      description: `Someone has sent you a personalized ${cardName.toLowerCase()} card! Tap to view the beautiful message they created on EGreet.`,
      image: 'https://egreet.in/og.webp' // Fallback to main OG image
    };
  }

  // Generic static page SEO can also be handled here
  if (category === 'cards') {
    return {
      title: 'Browse All Greeting Cards | EGreet',
      description: 'Choose from 30+ categories of personalized digital greeting cards. Free and easy to make.',
      image: 'https://egreet.in/og.webp'
    };
  }

  return null;
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    // Handle MIDI APIs
    if (url.pathname === '/api/midi-search') {
      const pool = await fetchSongs();
      const query = url.searchParams.get('q') || '';

      let results;
      if (!query) {
        const shuffle = (array) => {
          let currentIndex = array.length, randomIndex;
          while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
          }
          return array;
        };
        const candidatePool = pool.filter(s => ['universal', 'new1', 'modern', 'hits', 'pop-icon'].includes(s.folder));
        results = shuffle(candidatePool)
          .slice(0, 18)
          .map(song => ({
            id: song.id,
            title: song.title,
            artist: song.artist,
            midiUrl: buildMidiUrl(song, request.url),
            category: getSongCategory(song),
          }));
      } else {
        results = searchSongs(pool, query, request.url);
      }

      return new Response(JSON.stringify({ results, meta: { totalIndexed: pool.length } }), { headers });
    }

    if (url.pathname === '/api/midi-object') {
      const rawKey = url.searchParams.get('key') || '';
      const key = decodeURIComponent(rawKey).replace(/^(\.\.\/|\.\.\\)+/, '');

      if (!key) return new Response('Missing key', { status: 400 });

      const encodedKey = key.split('/').map(encodeURIComponent).join('/');
      const jsDelivrUrl = `${JSDELIVR_BASE}${encodedKey}`;

      try {
        const resp = await fetch(jsDelivrUrl);
        if (resp.ok) {
          const body = await resp.arrayBuffer();
          const responseHeaders = new Headers(resp.headers);
          responseHeaders.set('Access-Control-Allow-Origin', '*');
          responseHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
          return new Response(body, {
            status: 200,
            headers: responseHeaders
          });
        }
        return new Response(`Error from JSDelivr: ${resp.status}`, { status: resp.status });
      } catch (e) {
        return new Response(`Fetch error: ${e.message}`, { status: 500 });
      }
    }

    // Handle OG Meta Tags for Social Sharing Bots
    const userAgent = (request.headers.get('User-Agent') || '').toLowerCase();
    const isBot = BOT_AGENTS.some(bot => userAgent.includes(bot));

    if (isBot) {
      const ogData = getDynamicOgTags(url.pathname);
      if (ogData) {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${ogData.title}</title>
    <meta property="og:title" content="${ogData.title}">
    <meta property="og:description" content="${ogData.description}">
    <meta property="og:image" content="${ogData.image}">
    <meta property="og:url" content="${request.url}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${ogData.title}">
    <meta name="twitter:description" content="${ogData.description}">
    <meta name="twitter:image" content="${ogData.image}">
</head>
<body>
    <script>window.location.replace("${request.url}");</script>
</body>
</html>`;
        return new Response(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
    }

    // Default: Proxy request to Netlify frontend (assuming Worker is mapped to domain)
    // If not mapped, this fallback is required to let Cloudflare pass the request through.
    return fetch(request);
  }
};
