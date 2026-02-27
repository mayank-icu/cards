// Backend API endpoint for reCAPTCHA Enterprise verification
// This should be deployed as a serverless function (e.g., Vercel, Netlify, AWS Lambda)

const https = require('https');
const url = require('url');

// Your reCAPTCHA Enterprise API key
const RECAPTCHA_API_KEY = process.env.RECAPTCHA_API_KEY || 'YOUR_API_KEY_HERE';
const RECAPTCHA_PROJECT_ID = 'cards-f5abc';

/**
 * Verify reCAPTCHA token with Google's reCAPTCHA Enterprise API
 * @param {string} token - The reCAPTCHA token to verify
 * @param {string} expectedAction - The expected action for this token
 * @returns {Promise<Object>} - Verification result
 */
async function verifyRecaptchaToken(token, expectedAction) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      event: {
        token: token,
        expectedAction: expectedAction,
        siteKey: '6LdyCVMsAAAAAD4bBL2ym6vR9_a5tlsxHq-XWejL'
      }
    });

    const options = {
      hostname: 'recaptchaenterprise.googleapis.com',
      port: 443,
      path: `/v1/projects/${RECAPTCHA_PROJECT_ID}/assessments?key=${RECAPTCHA_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(new Error('Failed to parse reCAPTCHA response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Main handler function for the API endpoint
 */
async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, expectedAction, siteKey } = req.body;

    // Validate required fields
    if (!token || !expectedAction || !siteKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: token, expectedAction, siteKey'
      });
    }

    // Verify the site key matches our expected key
    if (siteKey !== '6LdyCVMsAAAAAD4bBL2ym6vR9_a5tlsxHq-XWejL') {
      return res.status(400).json({
        success: false,
        error: 'Invalid site key'
      });
    }

    // Verify token with reCAPTCHA Enterprise
    const verificationResult = await verifyRecaptchaToken(token, expectedAction);

    // Check if the verification was successful
    if (verificationResult.tokenProperties && 
        verificationResult.tokenProperties.valid === true &&
        verificationResult.riskAnalysis &&
        verificationResult.riskAnalysis.score !== undefined) {
      
      // Determine if the score is acceptable (threshold can be adjusted)
      const isHuman = verificationResult.riskAnalysis.score >= 0.5;

      return res.status(200).json({
        success: true,
        score: verificationResult.riskAnalysis.score,
        isHuman: isHuman,
        action: verificationResult.tokenProperties.action,
        timestamp: verificationResult.tokenProperties.createTime
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'reCAPTCHA verification failed',
        details: verificationResult
      });
    }

  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during reCAPTCHA verification'
    });
  }
}

// Export for different deployment platforms
module.exports = { handler, verifyRecaptchaToken };

// For Vercel serverless functions
if (process.env.VERCEL) {
  module.exports = async (req, res) => {
    // Parse JSON body for Vercel
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          req.body = JSON.parse(body);
          return handler(req, res);
        } catch (error) {
          return res.status(400).json({ error: 'Invalid JSON' });
        }
      });
    } else {
      return handler(req, res);
    }
  };
}

// For Netlify functions
if (process.env.NETLIFY) {
  exports.handler = async (event) => {
    const req = {
      method: event.httpMethod,
      body: event.body ? JSON.parse(event.body) : {},
      headers: event.headers
    };
    
    const res = {
      status: (code) => ({
        statusCode: code,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      }),
      json: (data) => {
        res.body = JSON.stringify(data);
        return res;
      }
    };

    const result = await handler(req, res);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result.body || result)
    };
  };
}
