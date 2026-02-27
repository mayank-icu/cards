/**
 * Netlify function: /api/itunes-search
 * Proxies iTunes Search API — avoids browser CORS restriction.
 * Query params:
 *   q    - search term (required)
 *   limit - max results (default 12)
 */
exports.handler = async function handler(event) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=120',
    'Access-Control-Allow-Origin': '*'
  };

  const CORS_PREFLIGHT = {
    statusCode: 204,
    headers: {
      ...headers,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: ''
  };

  if (event.httpMethod === 'OPTIONS') return CORS_PREFLIGHT;

  try {
    const q = (event.queryStringParameters?.q || '').trim();
    if (!q) {
      return { statusCode: 200, headers, body: JSON.stringify({ results: [] }) };
    }

    const limit = Math.min(Number(event.queryStringParameters?.limit || 12), 25);

    const url = new URL('https://itunes.apple.com/search');
    url.searchParams.set('term', q);
    url.searchParams.set('media', 'music');
    url.searchParams.set('entity', 'song');
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('country', 'US');

    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PianoLove/1.0)' }
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ results: [], error: `iTunes responded ${response.status}` })
      };
    }

    const data = await response.json();
    const raw = Array.isArray(data?.results) ? data.results : [];

    const results = raw
      .filter((item) => !!item.previewUrl) // must have a 30s preview
      .map((item) => ({
        id: String(item.trackId),
        title: item.trackName || 'Unknown Title',
        artist: item.artistName || 'Unknown Artist',
        album: item.collectionName || '',
        artworkUrl: (item.artworkUrl100 || '').replace('100x100', '300x300'),
        previewUrl: item.previewUrl,
        durationMs: item.trackTimeMillis || 30000
      }));

    return { statusCode: 200, headers, body: JSON.stringify({ results }) };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ results: [], error: error?.message || 'iTunes search failed' })
    };
  }
};
