/**
 * Netlify function: /api/itunes-proxy
 * Fetches an iTunes preview MP3 URL and streams it back to the browser.
 * This bypasses CORS since the iTunes CDN doesn't allow cross-origin audio decoding.
 *
 * Query params:
 *   url - the iTunes previewUrl (must be an audio-mzstatic.com URL)
 */
exports.handler = async function handler(event) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Range'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  try {
    const rawUrl = (event.queryStringParameters?.url || '').trim();
    if (!rawUrl) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing url parameter' })
      };
    }

    // Security: only allow iTunes CDN URLs
    let parsedUrl;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid URL' })
      };
    }

    const allowedHosts = [
      'audio-ssl.itunes.apple.com',
      'audio.itunes.apple.com',
      'a1.mzstatic.com',
      'a2.mzstatic.com',
      'a3.mzstatic.com',
      'a4.mzstatic.com',
      'a5.mzstatic.com',
      'audio-mzstatic-content.apple.com'
    ];

    if (!allowedHosts.some((h) => parsedUrl.hostname === h || parsedUrl.hostname.endsWith('.mzstatic.com') || parsedUrl.hostname.endsWith('.apple.com'))) {
      return {
        statusCode: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'URL not from allowed iTunes CDN' })
      };
    }

    const upstream = await fetch(rawUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PianoLove/1.0)',
        Accept: 'audio/mpeg, audio/*'
      }
    });

    if (!upstream.ok) {
      return {
        statusCode: upstream.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Upstream responded ${upstream.status}` })
      };
    }

    // Read as binary and forward
    const arrayBuffer = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': upstream.headers.get('Content-Type') || 'audio/mpeg',
        'Content-Length': String(buffer.byteLength),
        'Cache-Control': 'public, max-age=3600'
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error?.message || 'Proxy failed' })
    };
  }
};
