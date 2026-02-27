import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import SimpleSEO from './SimpleSEO';

const BASE_URL = 'https://egreet.in';

const CARD_TYPE_META = {
  birthday: 'Birthday Card',
  valentine: 'Valentine Card',
  wedding: 'Wedding Card',
  anniversary: 'Anniversary Card',
  'thank-you': 'Thank You Card',
  congratulations: 'Congratulations Card',
  'get-well': 'Get Well Card',
  graduation: 'Graduation Card',
  'new-baby': 'New Baby Card',
  sympathy: 'Sympathy Card',
  'long-distance': 'Long Distance Card',
  apology: 'Apology Card',
  invite: 'Invitation Card',
  capsule: 'Time Capsule Card',
  'wish-jar': 'Wish Jar Card',
  crush: 'Crush Ask Out Card',
  'just-because': 'Just Because Card',
  'bon-voyage': 'Bon Voyage Card',
  housewarming: 'Housewarming Card',
  friendship: 'Friendship Card',
  'self-care': 'Self Care Card',
  'missing-you': 'Missing You Card',
  christmas: 'Christmas Card',
  'new-year': 'New Year Card',
  easter: 'Easter Card',
  halloween: 'Halloween Card',
  'good-luck': 'Good Luck Card',
  retirement: 'Retirement Card',
  'thinking-of-you': 'Thinking of You Card',
  'cat-lovers': 'Cat Lovers Card',
  'balloon-celebration': 'Balloon Celebration Card',
  bouquet: 'Digital Bouquet Card',
  'piano': 'Piano Love Song Card'
};

const SELF_MANAGED_SEO_PATTERNS = [
  /^\/$/,
  /^\/cards$/,
  /^\/cards\/[^/]+$/,
  /^\/about$/,
  /^\/blog\/?$/,
  /^\/greeting-card-maker$/,
  /^\/congratulations-card-maker$/,
  /^\/greetings-card-maker$/,
  /^\/beautiful-cards$/,
  /^\/bouquet-card-maker$/,
  /^\/admin$/
];

const noIndexConfig = (title, description, pathname) => ({
  title,
  description,
  canonical: `${BASE_URL}${pathname}`,
  noIndex: true
});

const indexedConfig = (title, description, pathname) => ({
  title,
  description,
  canonical: `${BASE_URL}${pathname}`
});

const toCreateTitle = (label) => `Create ${label} Online | EGreet`;

const toCreateDesc = (label) =>
  `Create a personalized ${label.toLowerCase()} with EGreet's free online card maker.`;

const toViewTitle = (label) => `${label} | EGreet`;

const toViewDesc = (label) =>
  `View this personalized ${label.toLowerCase()} shared on EGreet and create your own online.`;

const getRouteSEO = (pathname) => {
  if (SELF_MANAGED_SEO_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return null;
  }

  if (pathname === '/contact') {
    return indexedConfig(
      'Contact EGreet | Greeting Card Support',
      'Contact EGreet for help, feedback, and card maker support.',
      pathname
    );
  }

  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname === '/saved-cards' ||
    pathname === '/profile' ||
    pathname === '/coming-soon' ||
    pathname.startsWith('/__/auth')
  ) {
    return noIndexConfig(
      'Account Page | EGreet',
      'Account and utility page on EGreet.',
      pathname
    );
  }

  if (pathname === '/view' || pathname.startsWith('/view/')) {
    return indexedConfig(
      'Shared Greeting Card | EGreet',
      'View a shared greeting card on EGreet and create your own personalized card.',
      pathname
    );
  }

  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) {
    return null;
  }

  const [segment, second] = parts;

  if (segment === 'ask' && second) {
    const label = CARD_TYPE_META.crush;
    return indexedConfig(toViewTitle(label), toViewDesc(label), pathname);
  }

  if (second === 'create' && CARD_TYPE_META[segment]) {
    const label = CARD_TYPE_META[segment];
    return noIndexConfig(toCreateTitle(label), toCreateDesc(label), pathname);
  }

  if (second && CARD_TYPE_META[segment]) {
    const label = CARD_TYPE_META[segment];
    return indexedConfig(toViewTitle(label), toViewDesc(label), pathname);
  }

  return indexedConfig(
    'EGreet | Online Greeting Card Maker',
    'Create and share beautiful greeting cards online with EGreet.',
    pathname
  );
};

const GlobalRouteSEO = () => {
  const { pathname } = useLocation();

  const seo = useMemo(() => getRouteSEO(pathname), [pathname]);
  if (!seo) {
    return null;
  }

  return <SimpleSEO {...seo} />;
};

export default GlobalRouteSEO;
