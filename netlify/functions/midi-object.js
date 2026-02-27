/**
 * midi-object.js
 * Netlify serverless function — serves MIDI files from GCS bucket: my-lmd-files
 *
 * Environment variables:
 *   LAKH_GCS_PUBLIC_BASE_URL  — If set, redirects to public GCS URL (fastest)
 *   LAKH_GCS_BUCKET_NAME      — e.g. my-lmd-files  (for private bucket auth)
 *   GCS_CLIENT_EMAIL          — service account email
 *   GCS_PRIVATE_KEY           — service account private key (newlines as \n)
 */

const path = require('path');
const crypto = require('crypto');

const BUCKET = process.env.LAKH_GCS_BUCKET_NAME || 'my-lmd-files';

// ── GCS service-account JWT auth ──────────────────────────────────────────────
const tokenCache = { token: '', expiresAt: 0 };

const b64url = (buf) =>
    Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

const getToken = async () => {
    const now = Math.floor(Date.now() / 1000);
    if (tokenCache.token && tokenCache.expiresAt - now > 60) return tokenCache.token;

    const email = process.env.GCS_CLIENT_EMAIL || process.env.GCP_CLIENT_EMAIL || '';
    const key = (process.env.GCS_PRIVATE_KEY || process.env.GCP_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    if (!email || !key) return '';

    const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = b64url(JSON.stringify({
        iss: email,
        scope: 'https://www.googleapis.com/auth/devstorage.read_only',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now, exp: now + 3600,
    }));

    const sig = b64url(
        crypto.createSign('RSA-SHA256').update(`${header}.${payload}`).end().sign(key)
    );

    const resp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: `${header}.${payload}.${sig}`,
        }).toString(),
    });

    if (!resp.ok) throw new Error(`GCS auth failed (${resp.status})`);
    const json = await resp.json();
    const token = String(json.access_token || '');
    if (!token) throw new Error('GCS auth returned empty token');

    tokenCache.token = token;
    tokenCache.expiresAt = now + Number(json.expires_in || 3600);
    return token;
};

// ── Handler ───────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
    const rawKey = event.queryStringParameters?.key || '';
    const key = decodeURIComponent(String(rawKey)).replace(/^(\.\.\/|\.\.\\)+/, '');

    if (!key) return { statusCode: 400, body: 'Missing key parameter' };

    const encodedKey = key.split('/').map(encodeURIComponent).join('/');

    // Option A: public bucket — proxy instead of redirect to avoid CORS
    const publicBase = process.env.LAKH_GCS_PUBLIC_BASE_URL;
    if (publicBase) {
        const url = `${publicBase.replace(/\/$/, '')}/${encodedKey}`;
        try {
            const gcsResp = await fetch(url);
            if (gcsResp.ok) {
                const data = Buffer.from(await gcsResp.arrayBuffer());
                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'audio/midi',
                        'Content-Disposition': `inline; filename="${path.basename(key)}"`,
                        'Cache-Control': 'public, max-age=31536000, immutable',
                    },
                    isBase64Encoded: true,
                    body: data.toString('base64'),
                };
            }
            return { statusCode: gcsResp.status, body: `GCS returned ${gcsResp.status}` };
        } catch (e) {
            return { statusCode: 500, body: `Proxy fetch error: ${e.message}` };
        }
    }

    // Option B: private bucket — stream via service-account token
    const email = process.env.GCS_CLIENT_EMAIL || process.env.GCP_CLIENT_EMAIL || '';
    const keyEnv = process.env.GCS_PRIVATE_KEY || process.env.GCP_PRIVATE_KEY || '';
    if (!email || !keyEnv) {
        console.warn(`[midi-object] ⚠️  No GCS credentials found (GCS_CLIENT_EMAIL / GCS_PRIVATE_KEY not set). Falling back to public redirect.`);
    }
    try {
        const token = await getToken();
        if (token) {
            console.log(`[midi-object] ✅ GCS auth token obtained for bucket: ${BUCKET} — fetching: ${key}`);
            const url = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(BUCKET)}/o/${encodedKey}?alt=media`;
            const gcsResp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (gcsResp.ok) {
                console.log(`[midi-object] ✅ Successfully served from GCS: ${key} (${gcsResp.headers.get('content-length') || '?'} bytes)`);
                const data = Buffer.from(await gcsResp.arrayBuffer());
                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'audio/midi',
                        'Content-Disposition': `inline; filename="${path.basename(key)}"`,
                        'Cache-Control': 'public, max-age=31536000, immutable',
                    },
                    isBase64Encoded: true,
                    body: data.toString('base64'),
                };
            }
            console.error(`[midi-object] ❌ GCS returned ${gcsResp.status} for: ${key} — file may not exist in bucket`);
            return { statusCode: 404, body: `MIDI file not found in bucket (GCS ${gcsResp.status}): ${key}` };
        }
    } catch (err) {
        console.error(`[midi-object] ❌ GCS error: ${err?.message}`);
        return { statusCode: 500, body: err?.message || 'midi-object error' };
    }

    // Fallback: unauthenticated public proxy (bucket must be public for this to work)
    const fallbackUrl = `https://storage.googleapis.com/${encodeURIComponent(BUCKET)}/${encodedKey}`;
    console.warn(`[midi-object] ⚠️  No auth — attempting unauthenticated public proxy to: ${fallbackUrl}`);
    try {
        const fallbackResp = await fetch(fallbackUrl);
        if (fallbackResp.ok) {
            const data = Buffer.from(await fallbackResp.arrayBuffer());
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'audio/midi',
                    'Content-Disposition': `inline; filename="${path.basename(key)}"`,
                    'Cache-Control': 'public, max-age=31536000, immutable',
                },
                isBase64Encoded: true,
                body: data.toString('base64'),
            };
        }
        return { statusCode: fallbackResp.status, body: `GCS returned ${fallbackResp.status}` };
    } catch (e) {
        return { statusCode: 500, body: `Proxy fetch error: ${e.message}` };
    }
};
