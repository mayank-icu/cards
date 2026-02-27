# reCAPTCHA Enterprise Verification API

This API endpoint verifies reCAPTCHA Enterprise tokens for the EGreet application.

## Environment Variables

Set these environment variables in your deployment platform:

```
RECAPTCHA_API_KEY=your_google_recaptcha_api_key
```

## Deployment Options

### 1. Vercel Serverless Functions

1. Copy the `api` folder to your Vercel project root
2. Set the `RECAPTCHA_API_KEY` environment variable in Vercel dashboard
3. Deploy to Vercel

The endpoint will be available at: `https://your-domain.vercel.app/api/verify-recaptcha`

### 2. Netlify Functions

1. Copy the `api` folder to your Netlify project root
2. Set the `RECAPTCHA_API_KEY` environment variable in Netlify dashboard
3. Deploy to Netlify

The endpoint will be available at: `https://your-domain.netlify.app/.netlify/functions/verify-recaptcha`

### 3. AWS Lambda

1. Upload `verify-recaptcha.js` as a Lambda function
2. Set the `RECAPTCHA_API_KEY` environment variable
3. Configure API Gateway trigger

## API Usage

### Request

```bash
POST /api/verify-recaptcha
Content-Type: application/json

{
  "token": "reCAPTCHA_token_here",
  "expectedAction": "LOGIN|REGISTER|CARD_CREATE|CARD_SHARE|CONTACT",
  "siteKey": "6LdyCVMsAAAAAD4bBL2ym6vR9_a5tlsxHq-XWejL"
}
```

### Response

Success (200):
```json
{
  "success": true,
  "score": 0.9,
  "isHuman": true,
  "action": "LOGIN",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

Error (400):
```json
{
  "success": false,
  "error": "reCAPTCHA verification failed"
}
```

## Security Notes

- The API validates the site key to prevent unauthorized usage
- CORS is enabled for cross-origin requests
- Error messages are generic to prevent information leakage
- Score threshold is set to 0.5 but can be adjusted based on requirements

## Testing

You can test the API locally:

```bash
# Install dependencies
npm install

# Test with Netlify functions
npm run dev

# Or test directly with Node
node verify-recaptcha.js
```

## Monitoring

Monitor the following metrics:
- Request volume
- Success/failure rates
- Average reCAPTCHA scores
- Error rates and types
