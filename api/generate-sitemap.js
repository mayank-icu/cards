// Serverless function for dynamic sitemap generation
// This function generates a complete sitemap including user-generated cards
// Can be deployed on Vercel, Netlify, or other serverless platforms

const { getDatabase, ref, get } = require('firebase/database');
const { initializeApp } = require('firebase/app');

// Initialize Firebase (use your existing config)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

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

// Static sitemap content (this would be your current sitemap without user cards)
const STATIC_SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>https://egreet.in</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- All your static pages would go here -->
  <!-- This is a simplified version - you'd include all static pages -->
  
  <!-- User Generated Cards will be inserted here -->
</urlset>`;

function generateCardEntry(card) {
  const lastmod = card.lastUpdated || card.createdAt || new Date().toISOString().split('T')[0];
  const route = CARD_ROUTES[card.type] || '/view/';
  const url = `${BASE_URL}${route}${card.id}`;
  
  return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
}

async function fetchAllCards() {
  try {
    const cardsRef = ref(db, 'cards');
    const snapshot = await get(cardsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const cards = [];
    snapshot.forEach((childSnapshot) => {
      const card = childSnapshot.val();
      // Only include public cards (not private/draft)
      if (card.isPublic !== false && !card.isDraft) {
        cards.push({
          id: childSnapshot.key,
          ...card
        });
      }
    });
    
    return cards;
  } catch (error) {
    console.error('Error fetching cards:', error);
    return [];
  }
}

// Main handler for serverless function
export default async function handler(req, res) {
  try {
    // Set cache headers
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'application/xml');
    
    // Fetch all user-generated cards
    const cards = await fetchAllCards();
    
    // Generate dynamic entries
    let dynamicEntries = '';
    cards.forEach(card => {
      dynamicEntries += generateCardEntry(card);
    });
    
    // Insert dynamic entries before closing tag
    const closingTagIndex = STATIC_SITEMAP.lastIndexOf('</urlset>');
    const completeSitemap = STATIC_SITEMAP.substring(0, closingTagIndex) + 
                          dynamicEntries + 
                          STATIC_SITEMAP.substring(closingTagIndex);
    
    res.status(200).send(completeSitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
}

// For Vercel deployment
module.exports = handler;
