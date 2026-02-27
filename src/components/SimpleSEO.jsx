import React, { useEffect } from 'react';

const SEO = ({
  title = 'EGreet – Create Beautiful Greeting Cards Online',
  description = 'Create personalized greeting cards for any occasion. Free online card maker with professional templates for birthdays, Valentine\'s, weddings, anniversaries and more.',
  image = '/og-image.png',
  url = typeof window !== 'undefined' ? window.location.href : '',
  canonical = '',
  type = 'website',
  keywords = 'greeting cards, card maker, online cards, personalized cards, free card creator, birthday cards, valentine cards, custom cards, card design, digital cards',
  author = 'EGreet',
  locale = 'en_US',
  siteName = 'EGreet',
  noIndex = false,
  structuredData = null,
}) => {
  const finalUrl = canonical || url;

  // Default structured data for website
  const defaultStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    description,
    url: finalUrl,
    image,
    author: {
      '@type': 'Organization',
      name: author,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${finalUrl}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  // Use custom structured data if provided, otherwise use default
  const finalStructuredData = structuredData || defaultStructuredData;

  useEffect(() => {
    try {
      // Update document title
      document.title = title;

      // Update or create meta tags
      const updateMetaTag = (name, content, property = null) => {
        const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`;
        let meta = document.querySelector(selector);
        
        if (!meta) {
          meta = document.createElement('meta');
          if (property) {
            meta.setAttribute('property', property);
          } else {
            meta.setAttribute('name', name);
          }
          document.head.appendChild(meta);
        }
        
        meta.setAttribute('content', content);
      };

      // Basic meta tags
      updateMetaTag('description', description);
      updateMetaTag('keywords', keywords);
      updateMetaTag('author', author);
      updateMetaTag('robots', noIndex ? 'noindex, nofollow' : 'index, follow');
      updateMetaTag('language', 'English');
      updateMetaTag('revisit-after', '7 days');

      // Open Graph / Facebook
      updateMetaTag('og:type', type, 'og:type');
      updateMetaTag('og:title', title, 'og:title');
      updateMetaTag('og:description', description, 'og:description');
      updateMetaTag('og:image', image, 'og:image');
      updateMetaTag('og:image:width', '1200', 'og:image:width');
      updateMetaTag('og:image:height', '630', 'og:image:height');
      updateMetaTag('og:image:alt', title, 'og:image:alt');
      updateMetaTag('og:url', finalUrl, 'og:url');
      updateMetaTag('og:site_name', siteName, 'og:site_name');
      updateMetaTag('og:locale', locale, 'og:locale');

      // Twitter
      updateMetaTag('twitter:card', 'summary_large_image');
      updateMetaTag('twitter:title', title);
      updateMetaTag('twitter:description', description);
      updateMetaTag('twitter:image', image);
      updateMetaTag('twitter:image:alt', title);
      updateMetaTag('twitter:site', '@EGreet');
      updateMetaTag('twitter:creator', '@EGreet');

      // Additional Meta Tags
      updateMetaTag('application-name', siteName);
      updateMetaTag('apple-mobile-web-app-title', siteName);
      updateMetaTag('apple-mobile-web-app-capable', 'yes');
      updateMetaTag('apple-mobile-web-app-status-bar-style', 'default');
      updateMetaTag('mobile-web-app-capable', 'yes');
      updateMetaTag('msapplication-TileColor', '#667eea');
      updateMetaTag('theme-color', '#667eea');

      // Update canonical URL
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', finalUrl);

      // Update structured data
      let structuredDataScript = document.querySelector('script[type="application/ld+json"]');
      if (!structuredDataScript) {
        structuredDataScript = document.createElement('script');
        structuredDataScript.setAttribute('type', 'application/ld+json');
        document.head.appendChild(structuredDataScript);
      }
      structuredDataScript.textContent = JSON.stringify(finalStructuredData);

    } catch (error) {
      console.error('SEO update error:', error);
    }
  }, [title, description, image, url, canonical, finalUrl, type, keywords, author, locale, siteName, noIndex, finalStructuredData]);

  // This component doesn't render anything visible
  return null;
};

export default SEO;
