import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({
  title = 'EGreet – Create Beautiful Greeting Cards Online',
  description = 'Create personalized greeting cards for any occasion. Free online card maker with professional templates for birthdays, Valentine\'s, weddings, anniversaries and more.',
  image = '/og-image.png',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  keywords = 'greeting cards, card maker, online cards, personalized cards, free card creator, birthday cards, valentine cards, custom cards, card design, digital cards',
  author = 'EGreet',
  locale = 'en_US',
  siteName = 'EGreet',
  noIndex = false,
  structuredData = null,
}) => {
  // Default structured data for website
  const defaultStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    description,
    url,
    image,
    author: {
      '@type': 'Organization',
      name: author,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${url}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  // Use custom structured data if provided, otherwise use default
  const finalStructuredData = structuredData || defaultStructuredData;

  try {
    return (
      <Helmet>
        {/* Basic */}
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content={author} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta charSet="utf-8" />
        <link rel="canonical" href={url} />
        
        {/* Robots */}
        {noIndex && <meta name="robots" content="noindex, nofollow" />}
        {!noIndex && <meta name="robots" content="index, follow" />}

        {/* Open Graph / Facebook */}
        <meta property="og:type" content={type} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={title} />
        <meta property="og:url" content={url} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:locale" content={locale} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
        <meta name="twitter:image:alt" content={title} />
        <meta name="twitter:site" content="@EGreet" />
        <meta name="twitter:creator" content="@EGreet" />

        {/* Additional Meta Tags */}
        <meta name="application-name" content={siteName} />
        <meta name="apple-mobile-web-app-title" content={siteName} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#667eea" />
        <meta name="theme-color" content="#667eea" />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="7 days" />

        {/* Preload critical fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Comfortaa:wght@300;400;600&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(finalStructuredData)}
        </script>
      </Helmet>
    );
  } catch (error) {
    console.error('Helmet error:', error);
    return null;
  }
};

export default SEO;
