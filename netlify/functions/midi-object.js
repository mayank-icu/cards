/**
 * midi-object.js
 * Netlify serverless function — serves MIDI files from JSDelivr.
 */

const path = require('path');

const JSDELIVR_BASE = "https://cdn.jsdelivr.net/gh/mayank-icu/midi@main/";

// ── Handler ───────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
    const rawKey = event.queryStringParameters?.key || '';
    // Security: basic sanitization to prevent path traversal
    const key = decodeURIComponent(String(rawKey)).replace(/^(\.\.\/|\.\.\\)+/, '');

    if (!key) return { statusCode: 400, body: 'Missing key parameter' };

    const encodedKey = key.split('/').map(encodeURIComponent).join('/');
    const url = `${JSDELIVR_BASE}${encodedKey}`;

    console.log(`[midi-object] Proxying MIDI from: ${url}`);

    try {
        const resp = await fetch(url);

        if (resp.ok) {
            const data = Buffer.from(await resp.arrayBuffer());
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'audio/midi',
                    'Content-Disposition': `inline; filename="${path.basename(key)}"`,
                    'Cache-Control': 'public, max-age=31536000, immutable',
                    'Access-Control-Allow-Origin': '*',
                },
                isBase64Encoded: true,
                body: data.toString('base64'),
            };
        }

        console.error(`[midi-object] JSDelivr returned ${resp.status} for: ${url}`);
        return {
            statusCode: resp.status,
            body: `JSDelivr returned ${resp.status} for ${key}`
        };
    } catch (e) {
        console.error(`[midi-object] Fetch error: ${e.message}`);
        return {
            statusCode: 500,
            body: `Error fetching MIDI: ${e.message}`
        };
    }
};
