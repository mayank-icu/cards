/**
 * midi-search.js
 * Netlify serverless function — searches our curated MIDI song library.
 * Files live in GCS bucket: my-lmd-files/<folder>/<filename>
 *
 * Environment variables:
 *   LAKH_GCS_PUBLIC_BASE_URL  — e.g. https://storage.googleapis.com/my-lmd-files
 *                               Set this once the bucket objects are made public.
 *   LAKH_GCS_BUCKET_NAME      — e.g. my-lmd-files  (used for private-bucket auth)
 *   GCS_CLIENT_EMAIL          — service account email (for private bucket)
 *   GCS_PRIVATE_KEY           — service account private key (for private bucket)
 */

const fs = require('fs');
const path = require('path');

const fs = require('fs');
const path = require('path');

// ── Remote song library ──────────────────────────────────────────────────────
const SONGS_JSON_URL = "https://cdn.jsdelivr.net/gh/mayank-icu/midi@main/songs.json";

let CACHED_SONGS = null;
let LAST_FETCH_TIME = 0;
const CACHE_TTL = 300000; // 5 minutes

const fetchSongs = async () => {
    const now = Date.now();
    if (CACHED_SONGS && (now - LAST_FETCH_TIME < CACHE_TTL)) {
        return CACHED_SONGS;
    }

    try {
        console.log(`[midi-search] Fetching remote songs from: ${SONGS_JSON_URL}`);
        const resp = await fetch(SONGS_JSON_URL);
        if (!resp.ok) throw new Error(`Failed to fetch songs.json: ${resp.status}`);
        const data = await resp.json();

        // Ensure each song has a stable ID and the properties we expect
        CACHED_SONGS = data.map((s, idx) => ({
            id: `s-${idx}-${path.basename(s.file, '.mid')}`,
            title: s.title,
            artist: s.artist,
            folder: s.category, // songs.json uses 'category' for the folder name
            file: path.basename(s.file),
            fullPath: s.file
        }));

        LAST_FETCH_TIME = now;
        return CACHED_SONGS;
    } catch (err) {
        console.error(`[midi-search] Error loading remote songs: ${err.message}`);
        return CACHED_SONGS || []; // Return cache if available, else empty
    }
};

// ── URL builder ───────────────────────────────────────────────────────────────
const buildMidiUrl = (song) => {
    // We pass the full relative path as the key
    return `/api/midi-object?key=${encodeURIComponent(song.fullPath)}`;
};

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
    const f = song.folder;
    if (['movie'].includes(f)) return 'movies';
    if (['multi-lang', 'anime'].includes(f)) return 'anime';
    if (['timeless', 'intro'].includes(f)) return 'classical';
    if (f === 'love') return 'love';
    if (['pop-icon', 'modern', 'hits', 'universal', 'new1', '2023-26_modern-hits', 'new', 'emotional'].includes(f)) return 'pop';
    return 'pop';
};

// ── Simple text search ────────────────────────────────────────────────────────
const searchSongs = (pool, query, limit = 25) => {
    const originalQuery = String(query || '').trim();
    const q = normalizeCategory(originalQuery);
    if (!q) return [];

    // Filter by Category Click
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
            midiUrl: buildMidiUrl(song),
            category: getSongCategory(song),
        }));
    }

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

        const titleFuzzy = ngramScore(q, titleL);
        const artistFuzzy = ngramScore(q, artistL);
        score += titleFuzzy * 15;
        score += artistFuzzy * 8;

        if (score > 0) scored.push({ score, song });
    }

    const results = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ song }) => ({
            id: song.id,
            title: song.title,
            artist: song.artist,
            midiUrl: buildMidiUrl(song),
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
        const fallback = shuffle(pool.filter(s => ['universal', 'new1', 'modern', 'hits', 'pop-icon'].includes(s.folder)))
            .slice(0, 18)
            .map(song => ({
                id: song.id,
                title: song.title,
                artist: song.artist,
                midiUrl: buildMidiUrl(song),
                category: getSongCategory(song),
                isTopPicksFallback: true,
            }));
        return fallback;
    }

    return results;
};

// ── Handler ───────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
    };

    console.log("[midi-search] Function invoked.");

    const pool = await fetchSongs();
    console.log(`[midi-search] Song pool size: ${pool.length}`);

    const query = (event.queryStringParameters?.q || '').trim();
    console.log(`[midi-search] Query: "${query}"`);

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
        const featured = shuffle(candidatePool)
            .slice(0, 18)
            .map(song => ({
                id: song.id,
                title: song.title,
                artist: song.artist,
                midiUrl: buildMidiUrl(song),
                category: getSongCategory(song),
            }));
        return { statusCode: 200, headers, body: JSON.stringify({ results: featured, meta: { totalIndexed: pool.length } }) };
    }

    const results = searchSongs(pool, query);
    return { statusCode: 200, headers, body: JSON.stringify({ results, meta: { totalIndexed: pool.length } }) };
};

