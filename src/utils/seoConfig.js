// SEO Configuration for all pages
export const seoConfig = {
  // Homepage
  home: {
    title: 'E Greet - Create Beautiful Greeting Cards Online | Free Card Maker',
    description: 'Create personalized greeting cards for any occasion with E Greet. Free online card maker with professional templates for birthdays, Valentine\'s, weddings, anniversaries and more. No login required!',
    keywords: 'E Greet, egreet, e greet card maker, greeting cards, card maker, online cards, personalized cards, free card creator',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'E Greet',
      description: 'Create beautiful, personalized greeting cards for any occasion without any coding experience with E Greet. Free online card maker with professional templates.',
      url: 'https://egreet.in',
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      creator: {
        '@type': 'Organization',
        name: 'EGreet'
      },
      featureList: [
        'Birthday Cards',
        'Valentine Cards',
        'Anniversary Cards',
        'Wedding Invitations',
        'Thank You Cards',
        'Congratulations Cards',
        'Get Well Soon Cards',
        'Custom Card Design'
      ]
    }
  },

  // Birthday Cards
  birthday: {
    title: 'Birthday Cards - Create Personalized Birthday Greetings | EGreet',
    description: 'Design beautiful birthday cards with custom messages, photos, and themes. Free online birthday card maker with professional templates. Make their special day unforgettable!',
    keywords: 'birthday cards, happy birthday cards, personalized birthday cards, custom birthday greetings, birthday card maker, free birthday cards, birthday wishes',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Birthday Cards - EGreet',
      description: 'Create personalized birthday cards with custom messages and designs',
      url: 'https://egreet.in/cards/birthday',
      mainEntity: {
        '@type': 'CreativeWork',
        name: 'Birthday Card Creator',
        description: 'Online tool for creating personalized birthday cards'
      }
    }
  },

  // Valentine Cards
  valentine: {
    title: 'Valentine Cards - Romantic Valentine\'s Day Cards | EGreet',
    description: 'Create romantic Valentine\'s Day cards with love messages and beautiful designs. Free online Valentine card maker. Express your love perfectly this Valentine\'s Day!',
    keywords: 'valentine cards, valentine\'s day cards, romantic cards, love cards, valentine card maker, free valentine cards, romantic greetings',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Valentine Cards - EGreet',
      description: 'Create romantic Valentine\'s Day cards with custom love messages',
      url: 'https://egreet.in/cards/valentine',
      mainEntity: {
        '@type': 'CreativeWork',
        name: 'Valentine Card Creator',
        description: 'Online tool for creating romantic Valentine\'s Day cards'
      }
    }
  },

  // Anniversary Cards
  anniversary: {
    title: 'Anniversary Cards - Celebrate Your Love Story | EGreet',
    description: 'Create beautiful anniversary cards to celebrate your love. Custom anniversary card maker with romantic designs. Perfect for wedding anniversaries and relationship milestones.',
    keywords: 'anniversary cards, wedding anniversary cards, romantic anniversary cards, custom anniversary cards, anniversary card maker, free anniversary cards',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Anniversary Cards - EGreet',
      description: 'Create beautiful anniversary cards to celebrate your love',
      url: 'https://egreet.in/cards/anniversary',
      mainEntity: {
        '@type': 'CreativeWork',
        name: 'Anniversary Card Creator',
        description: 'Online tool for creating anniversary cards'
      }
    }
  },

  // Wedding Cards
  wedding: {
    title: 'Wedding Invitations & Cards - Beautiful Wedding Stationery | EGreet',
    description: 'Design stunning wedding invitations and cards with custom designs. Free online wedding invitation maker. Create the perfect wedding stationery for your special day.',
    keywords: 'wedding invitations, wedding cards, custom wedding invitations, wedding invitation maker, free wedding invitations, wedding stationery',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Wedding Cards - EGreet',
      description: 'Create beautiful wedding invitations and cards',
      url: 'https://egreet.in/cards/wedding',
      mainEntity: {
        '@type': 'CreativeWork',
        name: 'Wedding Card Creator',
        description: 'Online tool for creating wedding invitations and cards'
      }
    }
  },

  // Thank You Cards
  thankYou: {
    title: 'Thank You Cards - Express Gratitude Beautifully | EGreet',
    description: 'Create heartfelt thank you cards with custom messages and designs. Free online thank you card maker. Show your appreciation with beautiful personalized cards.',
    keywords: 'thank you cards, gratitude cards, appreciation cards, custom thank you cards, thank you card maker, free thank you cards',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Thank You Cards - EGreet',
      description: 'Create heartfelt thank you cards with custom messages',
      url: 'https://egreet.in/cards/thank-you',
      mainEntity: {
        '@type': 'CreativeWork',
        name: 'Thank You Card Creator',
        description: 'Online tool for creating thank you cards'
      }
    }
  },

  // Congratulations Cards
  congratulations: {
    title: 'Congratulations Cards - Celebrate Achievements | EGreet',
    description: 'Create congratulations cards for achievements, milestones, and special moments. Free online congratulations card maker with professional templates.',
    keywords: 'congratulations cards, achievement cards, milestone cards, custom congratulations cards, congratulations card maker, free congratulations cards',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Congratulations Cards - EGreet',
      description: 'Create congratulations cards for achievements and milestones',
      url: 'https://egreet.in/cards/congratulations',
      mainEntity: {
        '@type': 'CreativeWork',
        name: 'Congratulations Card Creator',
        description: 'Online tool for creating congratulations cards'
      }
    }
  },

  // Get Well Soon Cards
  getWell: {
    title: 'Get Well Soon Cards - Send Healing Wishes | EGreet',
    description: 'Create thoughtful get well soon cards to wish someone a speedy recovery. Free online get well card maker with caring designs and messages.',
    keywords: 'get well soon cards, recovery cards, healing wishes, custom get well cards, get well card maker, free get well cards',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Get Well Soon Cards - EGreet',
      description: 'Create thoughtful get well soon cards for recovery wishes',
      url: 'https://egreet.in/cards/get-well',
      mainEntity: {
        '@type': 'CreativeWork',
        name: 'Get Well Card Creator',
        description: 'Online tool for creating get well soon cards'
      }
    }
  },

  // Graduation Cards
  graduation: {
    title: 'Graduation Cards - Honor Academic Achievements | EGreet',
    description: 'Create graduation cards to celebrate academic success. Free online graduation card maker with professional designs for all graduation levels.',
    keywords: 'graduation cards, academic cards, graduation congratulations, custom graduation cards, graduation card maker, free graduation cards',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Graduation Cards - EGreet',
      description: 'Create graduation cards to celebrate academic achievements',
      url: 'https://egreet.in/cards/graduation',
      mainEntity: {
        '@type': 'CreativeWork',
        name: 'Graduation Card Creator',
        description: 'Online tool for creating graduation cards'
      }
    }
  },

  // New Baby Cards
  newBaby: {
    title: 'New Baby Cards - Welcome New Life with Joy | EGreet',
    description: 'Create beautiful new baby cards to welcome newborns. Free online baby card maker with adorable designs. Perfect for baby announcements and congratulations.',
    keywords: 'new baby cards, baby announcement cards, newborn cards, custom baby cards, baby card maker, free baby cards',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'New Baby Cards - EGreet',
      description: 'Create beautiful new baby cards to welcome newborns',
      url: 'https://egreet.in/cards/new-baby',
      mainEntity: {
        '@type': 'CreativeWork',
        name: 'New Baby Card Creator',
        description: 'Online tool for creating new baby cards'
      }
    }
  },

  // Sympathy Cards
  sympathy: {
    title: 'Sympathy Cards - Offer Comfort and Support | EGreet',
    description: 'Create thoughtful sympathy cards to offer comfort during difficult times. Free online sympathy card maker with respectful and caring designs.',
    keywords: 'sympathy cards, condolence cards, comfort cards, custom sympathy cards, sympathy card maker, free sympathy cards',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Sympathy Cards - EGreet',
      description: 'Create thoughtful sympathy cards to offer comfort',
      url: 'https://egreet.in/cards/sympathy',
      mainEntity: {
        '@type': 'CreativeWork',
        name: 'Sympathy Card Creator',
        description: 'Online tool for creating sympathy cards'
      }
    }
  },

  // Long Distance Cards
  longDistance: {
    title: 'Long Distance Cards - Stay Connected Across Miles | EGreet',
    description: 'Create long distance relationship cards to stay connected. Free online long distance card maker with heartfelt messages for couples far apart.',
    keywords: 'long distance cards, relationship cards, missing you cards, custom long distance cards, distance relationship cards, free long distance cards',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Long Distance Cards - EGreet',
      description: 'Create long distance relationship cards to stay connected',
      url: 'https://egreet.in/cards/long-distance',
      mainEntity: {
        '@type': 'CreativeWork',
        name: 'Long Distance Card Creator',
        description: 'Online tool for creating long distance relationship cards'
      }
    }
  },

  // Apology Cards
  apology: {
    title: 'Apology Cards - Say Sorry with Heartfelt Messages | EGreet',
    description: 'Create sincere apology cards with thoughtful messages. Free online apology card maker to help you express your regrets and make amends.',
    keywords: 'apology cards, sorry cards, forgiveness cards, custom apology cards, apology card maker, free apology cards',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Apology Cards - EGreet',
      description: 'Create sincere apology cards with thoughtful messages',
      url: 'https://egreet.in/cards/apology',
      mainEntity: {
        '@type': 'CreativeWork',
        name: 'Apology Card Creator',
        description: 'Online tool for creating apology cards'
      }
    }
  },

  // Formal Invitations
  invite: {
    title: 'Formal Invitations - Professional Event Invitations | EGreet',
    description: 'Create professional formal invitations for special events. Free online invitation maker with elegant designs for corporate events, parties, and ceremonies.',
    keywords: 'formal invitations, professional invitations, event invitations, custom invitations, invitation maker, free invitations',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Formal Invitations - EGreet',
      description: 'Create professional formal invitations for special events',
      url: 'https://egreet.in/cards/invite',
      mainEntity: {
        '@type': 'CreativeWork',
        name: 'Formal Invitation Creator',
        description: 'Online tool for creating formal invitations'
      }
    }
  },

  // Time Capsule
  capsule: {
    title: 'Time Capsule Cards - Preserve Memories for the Future | EGreet',
    description: 'Create time capsule cards to preserve precious memories. Free online time capsule card maker to capture moments that will last forever.',
    keywords: 'time capsule cards, memory cards, future cards, custom time capsule cards, time capsule maker, free time capsule cards',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Time Capsule Cards - EGreet',
      description: 'Create time capsule cards to preserve memories',
      url: 'https://egreet.in/cards/capsule',
      mainEntity: {
        '@type': 'CreativeWork',
        name: 'Time Capsule Card Creator',
        description: 'Online tool for creating time capsule cards'
      }
    }
  },

  // Wish Jar
  wishJar: {
    title: 'Wish Jar - Share Wishes and Dreams Creatively | EGreet',
    description: 'Create wish jar cards to share wishes and dreams. Free online wish jar maker with creative designs for expressing hopes and aspirations.',
    keywords: 'wish jar cards, wish cards, dream cards, custom wish jar cards, wish jar maker, free wish jar cards',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Wish Jar Cards - EGreet',
      description: 'Create wish jar cards to share wishes and dreams',
      url: 'https://egreet.in/cards/wish-jar',
      mainEntity: {
        '@type': 'CreativeWork',
        name: 'Wish Jar Creator',
        description: 'Online tool for creating wish jar cards'
      }
    }
  },

  // Crush Ask Out
  crush: {
    title: 'Crush Ask Out Cards - Make the First Move | EGreet',
    description: 'Create creative cards to ask your crush out. Free online crush card maker with fun and romantic designs to express your feelings.',
    keywords: 'crush cards, ask out cards, romantic cards, custom crush cards, crush card maker, free crush cards',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Crush Ask Out Cards - EGreet',
      description: 'Create creative cards to ask your crush out',
      url: 'https://egreet.in/cards/crush',
      mainEntity: {
        '@type': 'CreativeWork',
        name: 'Crush Card Creator',
        description: 'Online tool for creating crush ask out cards'
      }
    }
  },

  // About Page
  about: {
    title: 'About EGreet - Our Story & Mission | EGreet',
    description: 'Learn about EGreet\'s mission to help people create beautiful greeting cards. Discover our story, values, and commitment to making card creation easy and fun.',
    keywords: 'about egreet, egreet story, greeting card maker, card creation platform, about page',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About EGreet',
      description: 'Learn about EGreet\'s mission and story',
      url: 'https://egreet.in/about',
      mainEntity: {
        '@type': 'Organization',
        name: 'EGreet',
        description: 'Online platform for creating beautiful greeting cards'
      }
    }
  },

  // Contact Page
  contact: {
    title: 'Contact EGreet - Get in Touch | EGreet',
    description: 'Contact EGreet for support, feedback, or inquiries. We\'re here to help you create beautiful greeting cards. Reach out to our team.',
    keywords: 'contact egreet, egreet support, customer service, contact us, get in touch',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact EGreet',
      description: 'Contact EGreet for support and inquiries',
      url: 'https://egreet.in/contact'
    }
  },

  // Login Page
  login: {
    title: 'Login to EGreet - Access Your Account | EGreet',
    description: 'Login to your EGreet account to save your cards, access templates, and manage your creations. Secure and easy login process.',
    keywords: 'login egreet, egreet account, sign in, user login, secure login',
    noIndex: true
  },

  // Register Page
  register: {
    title: 'Register for EGreet - Create Your Free Account | EGreet',
    description: 'Create your free EGreet account to start making beautiful greeting cards. Save your work, access premium features, and join our community.',
    keywords: 'register egreet, egreet signup, create account, free registration, join egreet',
    noIndex: true
  },

  // Profile Page
  profile: {
    title: 'My Profile - Manage Your EGreet Account | EGreet',
    description: 'Manage your EGreet profile, saved cards, and account settings. Personalize your experience and track your card creation history.',
    keywords: 'egreet profile, my account, manage profile, saved cards, account settings',
    noIndex: true
  },

  // Saved Cards Page
  savedCards: {
    title: 'My Saved Cards - EGreet Collection | EGreet',
    description: 'View and manage your saved greeting cards on EGreet. Access your collection, edit existing cards, and continue creating beautiful designs.',
    keywords: 'saved cards, my cards, card collection, egreet cards, saved designs',
    noIndex: true
  },

  // Coming Soon Pages
  comingSoon: {
    title: 'Coming Soon - New Card Types on EGreet | EGreet',
    description: 'Exciting new card types coming soon to EGreet! Stay tuned for more creative ways to express yourself with beautiful greeting cards.',
    keywords: 'coming soon, new cards, future features, egreet updates, card types',
    noIndex: true
  },

  // Blog Page
  blog: {
    title: 'EGreet Blog - Card Making Tips & Inspiration | EGreet',
    description: 'Discover card making tips, design inspiration, and creative ideas on the EGreet blog. Learn how to create the perfect greeting cards for any occasion.',
    keywords: 'egreet blog, card making tips, greeting card ideas, design inspiration, card tutorials',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'EGreet Blog',
      description: 'Card making tips, design inspiration, and creative ideas',
      url: 'https://egreet.in/blog'
    }
  },

  greetingCardMaker: {
    title: 'Online Greeting Card Maker | Create Free Cards in Minutes | EGreet',
    description: 'Use EGreet as your online greeting card maker. Create beautiful birthday, anniversary, wedding, thank you, and congratulations cards for free.',
    keywords: 'greeting card maker, online greeting card maker, free greeting card maker, digital card maker, custom greeting cards',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Online Greeting Card Maker',
      description: 'Create custom greeting cards online for free.',
      url: 'https://egreet.in/greeting-card-maker'
    }
  },

  congratulationsCardMaker: {
    title: 'Congratulations Card Maker | Create Free Congrats Cards | EGreet',
    description: 'Create congratulations cards for graduations, promotions, and milestones with EGreet\'s free congratulations card maker.',
    keywords: 'congratulations card maker, congrats card maker, graduation congratulations card, promotion card maker',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Congratulations Card Maker',
      description: 'Create and share congratulations cards online.',
      url: 'https://egreet.in/congratulations-card-maker'
    }
  },

  greetingsCardMaker: {
    title: 'Greetings Card Maker | Make Greetings Cards Online Free | EGreet',
    description: 'Use EGreet as a free greetings card maker. Design greetings cards online for birthdays, anniversaries, and celebrations.',
    keywords: 'greetings card maker, make greetings cards online, free greetings card maker',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Greetings Card Maker',
      description: 'Make greetings cards online for free.',
      url: 'https://egreet.in/greetings-card-maker'
    }
  },

  beautifulCards: {
    title: 'Beautiful Cards Online | Create Beautiful Greeting Cards | EGreet',
    description: 'Create beautiful cards online with EGreet for birthdays, weddings, and meaningful celebrations.',
    keywords: 'beautiful cards, beautiful greeting cards, make a beautiful card',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Beautiful Cards Online',
      description: 'Create beautiful personalized cards online.',
      url: 'https://egreet.in/beautiful-cards'
    }
  },

  bouquetCardMaker: {
    title: 'Bouquet Card Maker | Create Digital Flower Bouquet Cards | E Greet',
    description: 'Create digital flower bouquet cards with personal notes and music on E Greet.',
    keywords: 'bouquet card maker, digital flower bouquet, egreet bouquet, e greet bouquet',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Bouquet Card Maker',
      description: 'Create personalized digital bouquet greeting cards.',
      url: 'https://egreet.in/bouquet-card-maker'
    }
  },

  freeEcardMaker: {
    title: 'Free Ecard Maker Online | Design & Send ECards | E Greet',
    description: 'Use the E Greet free ecard maker online to design and send beautiful digital ecards for any occasion. High-quality templates, zero cost.',
    keywords: 'free ecard maker online, free ecard maker, make ecards free, e greet ecards, egreet',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Free Ecard Maker',
      description: 'Design and send free ecards online for any occasion.',
      url: 'https://egreet.in/free-ecard-maker'
    }
  },

  onlineThankYouCardMaker: {
    title: 'Online Thank You Card Maker | Free & Custom Cards | E Greet',
    description: 'Express your gratitude with the E Greet online thank you card maker. Create beautiful, customized thank you cards for free.',
    keywords: 'online thank you card maker, thank you card maker free, custom thank you cards, e greet thank you, egreet gratitude',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Online Thank You Card Maker',
      description: 'Create beautiful, customized thank you cards for free online.',
      url: 'https://egreet.in/online-thank-you-card-maker'
    }
  }
};

// Helper function to get SEO config by route
export const getSEOConfig = (path) => {
  // Remove leading slash and convert to lowercase
  const cleanPath = path.replace(/^\//, '').toLowerCase();

  // Handle root path
  if (cleanPath === '' || cleanPath === 'home') {
    return seoConfig.home;
  }

  // Handle card details pages
  if (cleanPath.startsWith('cards/')) {
    const cardType = cleanPath.replace('cards/', '');
    return seoConfig[cardType] || seoConfig.home;
  }

  // Handle other specific pages
  const pageMap = {
    'about': seoConfig.about,
    'contact': seoConfig.contact,
    'login': seoConfig.login,
    'register': seoConfig.register,
    'profile': seoConfig.profile,
    'saved-cards': seoConfig.savedCards,
    'blog': seoConfig.blog,
    'coming-soon': seoConfig.comingSoon,
    'greeting-card-maker': seoConfig.greetingCardMaker,
    'congratulations-card-maker': seoConfig.congratulationsCardMaker,
    'greetings-card-maker': seoConfig.greetingsCardMaker,
    'beautiful-cards': seoConfig.beautifulCards,
    'bouquet-card-maker': seoConfig.bouquetCardMaker,
    'free-ecard-maker': seoConfig.freeEcardMaker,
    'online-thank-you-card-maker': seoConfig.onlineThankYouCardMaker
  };

  return pageMap[cleanPath] || seoConfig.home;
};
