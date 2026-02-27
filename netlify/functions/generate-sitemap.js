// Serverless function for dynamic sitemap generation
// This function generates a complete sitemap including user-generated cards
// Can be deployed on Vercel, Netlify, or other serverless platforms

const { getDatabase, ref, get } = require('firebase/database');
const { initializeApp } = require('firebase/app');

// Initialize Firebase (use your existing config)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || `https://${process.env.REACT_APP_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID
};

// Debug logging (remove in production)
console.log('Firebase config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? '***' : 'MISSING',
  databaseURL: firebaseConfig.databaseURL,
  projectId: firebaseConfig.projectId
});

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const BASE_URL = 'https://egreet.in';

// Card type route mappings
const CARD_ROUTES = {
  birthday: '/birthday/',
  valentine: '/valentine/',
  anniversary: '/anniversary/',
  wedding: '/wedding/',
  'thank-you': '/thank-you/',
  congratulations: '/congratulations/',
  'get-well': '/get-well/',
  graduation: '/graduation/',
  'new-baby': '/new-baby/',
  sympathy: '/sympathy/',
  'long-distance': '/long-distance/',
  apology: '/apology/',
  invite: '/invite/',
  capsule: '/capsule/',
  'wish-jar': '/wish-jar/',
  crush: '/ask/',
  'just-because': '/just-because/',
  'bon-voyage': '/bon-voyage/',
  housewarming: '/housewarming/',
  friendship: '/friendship/',
  'self-care': '/self-care/',
  'missing-you': '/missing-you/',
  christmas: '/christmas/',
  'new-year': '/new-year/',
  easter: '/easter/',
  halloween: '/halloween/',
  'good-luck': '/good-luck/',
  retirement: '/retirement/',
  'thinking-of-you': '/thinking-of-you/',
  'cat-lovers': '/cat-lovers/',
  'balloon-celebration': '/balloon-celebration/'
};

// Static sitemap content with all your actual pages
const STATIC_SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>https://egreet.in</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Card Type Pages -->
  <url>
    <loc>https://egreet.in/cards/birthday</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/valentine</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/anniversary</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/wedding</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/thank-you</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/congratulations</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/get-well</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/graduation</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/new-baby</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/sympathy</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/long-distance</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/apology</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/invite</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/capsule</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/wish-jar</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/crush</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/just-because</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/bon-voyage</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/housewarming</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/friendship</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/self-care</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/missing-you</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/christmas</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/new-year</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/easter</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/halloween</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/good-luck</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/retirement</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/thinking-of-you</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/cat-lovers</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards/balloon-celebration</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Card Creation Pages -->
  <url>
    <loc>https://egreet.in/birthday/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/valentine/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/anniversary/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/wedding/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/thank-you/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/congratulations/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/get-well/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/graduation/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/new-baby/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/sympathy/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/long-distance/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/apology/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/invite/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/capsule/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/wish-jar/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/crush/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/just-because/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/bon-voyage/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/housewarming/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/friendship/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/self-care/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/missing-you/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/christmas/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/new-year/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/easter/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/halloween/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/good-luck/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/retirement/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/thinking-of-you/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/cat-lovers/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/balloon-celebration/create</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Static Pages -->
  <url>
    <loc>https://egreet.in/about</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/contact</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://egreet.in/blog</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://egreet.in/cards</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://egreet.in/login</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://egreet.in/register</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://egreet.in/coming-soon</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

  <!-- Blog Posts -->
  <url>
    <loc>https://egreet.in/blog/post/creative-birthday-card-ideas.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://egreet.in/blog/post/creative-valentine-card-ideas.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://egreet.in/blog/post/creative-anniversary-card-ideas.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://egreet.in/blog/post/creative-thank-you-card-ideas.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://egreet.in/blog/post/creative-crush-ask-out-card-ideas.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://egreet.in/blog/post/creative-apology-card-ideas.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://egreet.in/blog/post/creative-long-distance-card-ideas.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://egreet.in/blog/post/creative-formal-invite-card-ideas.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://egreet.in/blog/post/creative-time-capsule-card-ideas.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://egreet.in/blog/post/creative-wish-jar-card-ideas.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://egreet.in/blog/post/creative-graduation-card-ideas.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://egreet.in/blog/post/creative-wedding-card-ideas.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://egreet.in/blog/post/creative-new-baby-card-ideas.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://egreet.in/blog/post/creative-congratulations-card-ideas.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://egreet.in/blog/post/creative-get-well-soon-card-ideas.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://egreet.in/blog/post/creative-sympathy-card-ideas.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://egreet.in/blog/post/balloon-celebration-card-ideas.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://egreet.in/blog/post/cat-lovers-card-ideas.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://egreet.in/blog/post/christmas-card-ideas.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://egreet.in/blog/post/easter-card-ideas.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://egreet.in/blog/post/good-luck-card-ideas.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://egreet.in/blog/post/halloween-card-ideas.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://egreet.in/blog/post/missing-you-card-ideas.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://egreet.in/blog/post/new-year-card-ideas.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://egreet.in/blog/post/retirement-card-ideas.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://egreet.in/blog/post/thinking-of-you-card-ideas.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- User Generated Cards will be inserted here -->
</urlset>`;

function generateCardEntry(card) {
  const lastmod = card.lastUpdated || card.createdAt || new Date().toISOString().split('T')[0];
  const route = CARD_ROUTES[card.type] || '/view/';
  const url = `${BASE_URL}${route}${card.id}`;
  
  // Determine priority based on card properties
  let priority = 0.6; // Default priority for user cards
  
  // Higher priority for public cards with more engagement
  if (card.isPublic !== false) {
    priority = 0.7;
  }
  
  // Even higher priority for cards with views/interactions
  if (card.views && card.views > 10) {
    priority = 0.8;
  }
  
  // Determine change frequency based on card age
  const cardAge = Date.now() - (card.createdAt ? new Date(card.createdAt).getTime() : 0);
  const daysOld = cardAge / (1000 * 60 * 60 * 24);
  
  let changefreq = 'monthly';
  if (daysOld < 7) {
    changefreq = 'daily'; // New cards change frequently
  } else if (daysOld < 30) {
    changefreq = 'weekly';
  }
  
  return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function fetchAllCards() {
  try {
    const cardsRef = ref(db, 'cards');
    const snapshot = await get(cardsRef);
    
    if (!snapshot.exists()) {
      console.log('No cards found in database');
      return [];
    }
    
    const cards = [];
    snapshot.forEach((childSnapshot) => {
      const card = childSnapshot.val();
      // Include ALL cards (public, private, drafts) for comprehensive indexing
      // Only exclude cards that are explicitly marked as deleted
      if (!card.isDeleted) {
        cards.push({
          id: childSnapshot.key,
          ...card
        });
      }
    });
    
    console.log(`Found ${cards.length} total cards in database`);
    return cards;
  } catch (error) {
    console.error('Error fetching cards:', error);
    return [];
  }
}

// Main handler for serverless function
const handler = async function(event, context) {
  try {
    console.log('🚀 Generating comprehensive sitemap...');
    
    // Set cache headers
    const headers = {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Content-Type': 'application/xml'
    };
    
    let dynamicEntries = '';
    let cardStats = {
      total: 0,
      byType: {},
      publicCards: 0,
      privateCards: 0,
      draftCards: 0,
      withViews: 0
    };
    
    try {
      // Fetch all user-generated cards
      const cards = await fetchAllCards();
      cardStats.total = cards.length;
      
      // Generate dynamic entries and collect statistics
      cards.forEach(card => {
        dynamicEntries += generateCardEntry(card);
        
        // Collect statistics
        const cardType = card.type || 'unknown';
        cardStats.byType[cardType] = (cardStats.byType[cardType] || 0) + 1;
        
        if (card.isPublic !== false) {
          cardStats.publicCards++;
        } else {
          cardStats.privateCards++;
        }
        
        if (card.isDraft) {
          cardStats.draftCards++;
        }
        
        if (card.views && card.views > 0) {
          cardStats.withViews++;
        }
      });
      
      console.log('📊 Sitemap Statistics:');
      console.log(`   Total cards: ${cardStats.total}`);
      console.log(`   Public cards: ${cardStats.publicCards}`);
      console.log(`   Private cards: ${cardStats.privateCards}`);
      console.log(`   Draft cards: ${cardStats.draftCards}`);
      console.log(`   Cards with views: ${cardStats.withViews}`);
      console.log('   Cards by type:', cardStats.byType);
      
    } catch (firebaseError) {
      console.error('❌ Firebase error, using fallback sitemap:', firebaseError.message);
      // Continue with empty dynamic entries if Firebase fails
      dynamicEntries = '';
    }
    
    // Insert dynamic entries before closing tag
    const closingTagIndex = STATIC_SITEMAP.lastIndexOf('</urlset>');
    const completeSitemap = STATIC_SITEMAP.substring(0, closingTagIndex) + 
                          dynamicEntries + 
                          STATIC_SITEMAP.substring(closingTagIndex);
    
    const totalUrls = (STATIC_SITEMAP.match(/<url>/g) || []).length + cardStats.total;
    console.log(`✅ Generated sitemap with ${totalUrls} total URLs`);
    
    return {
      statusCode: 200,
      headers,
      body: completeSitemap
    };
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Error generating sitemap'
    };
  }
};

// For Netlify deployment
module.exports = { handler };

// For Vercel deployment (uncomment if needed)
// export default handler;
