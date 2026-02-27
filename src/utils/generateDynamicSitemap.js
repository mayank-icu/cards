// Dynamic Sitemap Generator for User-Generated Cards
// This utility generates sitemap entries for user-created greeting cards

import { getDatabase, ref, get } from 'firebase/database';

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

/**
 * Generate sitemap entries for user-generated cards
 * @param {Object} card - Card object from database
 * @returns {string} XML sitemap entry
 */
function generateCardEntry(card) {
  const lastmod = card.lastUpdated || card.createdAt || new Date().toISOString().split('T')[0];
  const route = CARD_ROUTES[card.type] || '/view/';
  const url = `${BASE_URL}${route}${card.id}`;
  
  return `
  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
}

/**
 * Fetch all public cards from database
 * @returns {Promise<Array>} Array of card objects
 */
async function fetchAllCards() {
  const db = getDatabase();
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
}

/**
 * Generate dynamic sitemap XML for user-generated cards
 * @returns {Promise<string>} Complete sitemap XML string
 */
export async function generateDynamicSitemap() {
  try {
    const cards = await fetchAllCards();
    
    let sitemapEntries = '';
    cards.forEach(card => {
      sitemapEntries += generateCardEntry(card);
    });
    
    return sitemapEntries;
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
    return '';
  }
}

/**
 * Complete sitemap generator that combines static and dynamic entries
 * @param {string} staticSitemap - Static sitemap content
 * @returns {Promise<string>} Complete sitemap XML
 */
export async function generateCompleteSitemap(staticSitemap) {
  const dynamicEntries = await generateDynamicSitemap();
  
  // Insert dynamic entries before the closing </urlset> tag
  const closingTagIndex = staticSitemap.lastIndexOf('</urlset>');
  if (closingTagIndex === -1) {
    return staticSitemap;
  }
  
  const beforeClosing = staticSitemap.substring(0, closingTagIndex);
  const afterClosing = staticSitemap.substring(closingTagIndex);
  
  return `${beforeClosing}${dynamicEntries}${afterClosing}`;
}

/**
 * Server-side function to update sitemap periodically
 * This should be called by a cron job or serverless function
 */
export async function updateSitemap() {
  try {
    const staticSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static entries would be here -->
  <!-- This function should be called with the actual static sitemap content -->
</urlset>`;
    
    const completeSitemap = await generateCompleteSitemap(staticSitemap);
    
    // In a real implementation, you would save this to your hosting
    // For example, writing to a file or updating via API
    console.log('Sitemap updated successfully');
    
    return completeSitemap;
  } catch (error) {
    console.error('Failed to update sitemap:', error);
    throw error;
  }
}

// For client-side usage - generate sitemap for cards created in current session
export function generateClientCardEntries(cards) {
  let entries = '';
  cards.forEach(card => {
    entries += generateCardEntry(card);
  });
  return entries;
}
