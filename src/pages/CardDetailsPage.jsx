import React, { useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Copy, ExternalLink, Eye, Plus, Star, Heart, MessageCircle, Users, Clock, ChevronDown, ChevronUp, Sparkles, Gift, Zap, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import SimpleSEO from '../components/SimpleSEO';
import { getSEOConfig } from '../utils/seoConfig';
import Navbar from '../components/Navbar';
import './CardDetailsPage.css';

import birthdayIcon from '../assets/occasions/birthday.webp';
import valentineIcon from '../assets/occasions/valentine.webp';
import crushAskIcon from '../assets/occasions/crush-ask.webp';
import apologyIcon from '../assets/occasions/sorry.webp';
import longDistanceIcon from '../assets/occasions/far.webp';
import formalInviteIcon from '../assets/occasions/formal-invite.webp';
import timeCapsuleIcon from '../assets/occasions/time-capsule.webp';
import wishJarIcon from '../assets/occasions/wish-jar.webp';
import anniversaryIcon from '../assets/occasions/anniversary_1.webp';
import thankYouIcon from '../assets/occasions/thank-you_1.webp';
import congratulationsIcon from '../assets/occasions/congratulations_1.webp';
import getWellIcon from '../assets/occasions/get-well-soon_1.webp';
import graduationIcon from '../assets/occasions/graduation_1.webp';
import weddingIcon from '../assets/occasions/wedding.webp';
import newBabyIcon from '../assets/occasions/new-born.webp';
import sympathyIcon from '../assets/occasions/sympathy_1.webp';
import balloonIcon from '../assets/occasions/balloon.webp';
import catIcon from '../assets/occasions/cat.webp';

const CardDetailsPage = () => {
  const navigate = useNavigate();
  const { occasion } = useParams();
  const location = useLocation();
  const [showPreview, setShowPreview] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const cardData = useMemo(() => {
    const map = {
      valentine: {
        title: 'Valentine',
        description: 'Express your love with heartfelt Valentine cards',
        icon: valentineIcon,
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        createRoute: '/valentine/create',
        viewRoutePattern: '/valentine/:id',
        previewTitle: 'A Special Note',
        previewMessage: 'Write a heartfelt message and share it with someone who matters.',
        features: ['Romantic themes & designs', 'Photo memories together', 'Love songs integration', 'Real-time love responses'],
        howItWorks: 'Creating your Valentine card is like writing a love letter, but better. Start with your heart, add your favorite photos together, choose a romantic design that speaks to your love story, and write that message you\'ve been wanting to say. Your partner can respond in real-time, making it an interactive experience.',
        whoItsFor: 'Perfect for couples celebrating Valentine\'s Day, anniversaries, or just because you want to remind someone how much they mean to you. Whether you\'ve been together for months or decades, this helps you express those feelings that are sometimes hard to put into words.',
        useCases: ['Valentine\'s Day surprises', 'Anniversary celebrations', 'Long-distance love', 'Just because moments']
      },
      birthday: {
        title: 'Birthday',
        description: 'Celebrate special birthdays with personalized cards',
        icon: birthdayIcon,
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        createRoute: '/birthday/create',
        viewRoutePattern: '/birthday/:wishId',
        previewTitle: 'Birthday Wishes',
        previewMessage: 'Add a message, a memory, and make it feel truly personal.',
        features: ['Festive birthday themes', 'Memory lane photos', 'Birthday song integration', 'Wish collection from friends'],
        howItWorks: 'Remember that feeling when someone remembers your birthday? That\'s what we help you create. Choose a fun design, add photos that capture your favorite moments together, write that personal birthday message, and even invite friends to add their wishes. It\'s like throwing a mini party online.',
        whoItsFor: 'Whether you\'re celebrating your best friend, partner, family member, or colleague - this is for anyone who deserves to feel special on their birthday. Perfect for close relationships or when you want to make someone\'s day brighter from miles away.',
        useCases: ['Best friend birthdays', 'Family celebrations', 'Office birthday wishes', 'Surprise birthday messages']
      },
      'wish-jar': {
        title: 'Wish Jar',
        description: 'Share wishes and dreams in creative ways',
        icon: wishJarIcon,
        gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
        createRoute: '/wish-jar/create',
        viewRoutePattern: '/wish-jar/:jarId',
        previewTitle: 'A Jar of Wishes',
        previewMessage: 'Collect wishes and open them whenever you need a smile.',
        features: ['Beautiful jar designs', 'Collect multiple wishes', 'Open when ready', 'Share with groups'],
        howItWorks: 'Think of this as a digital jar where people can drop their wishes, hopes, and dreams for you. Create your jar, share it with friends and family, and watch as it fills with beautiful messages. Open them when you need a boost of positivity or save them for special moments.',
        whoItsFor: 'Perfect for birthdays, weddings, graduation, or when someone needs encouragement. It\'s also beautiful for people going through tough times who need to know they\'re loved and supported.',
        useCases: ['Birthday wish collections', 'Wedding well wishes', 'Get well soon messages', 'Graduation congratulations']
      },
      crush: {
        title: 'Crush Ask Out',
        description: 'Make the first move with creative cards',
        icon: crushAskIcon,
        gradient: 'linear-gradient(135deg, #ff6b9d 0%, #c06c84 100%)',
        createRoute: '/crush/create',
        viewRoutePattern: '/ask/:slug',
        previewTitle: 'A Simple Question',
        previewMessage: 'Create a cute and confident way to ask someone out.',
        features: ['Cute & confident designs', 'Interactive response system', 'Anonymous or revealed', 'Share via link or QR'],
        howItWorks: 'We know asking someone out can be nerve-wracking, so we made it easier. Choose a design that matches your personality - from cute and playful to confident and direct. Write your message, and send it. They can respond privately, taking the pressure off that face-to-face moment.',
        whoItsFor: 'Perfect for anyone who wants to ask someone out but needs a little confidence boost. Whether it\'s your classmate, colleague, or someone you\'ve been admiring from afar - this helps you make that first move with style.',
        useCases: ['Coffee date invitations', 'Promposals', 'Movie date asks', 'Long-distance crush confessions']
      },
      apology: {
        title: 'Apology',
        description: 'Say sorry with thoughtful messages',
        icon: apologyIcon,
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        createRoute: '/apology/create',
        viewRoutePattern: '/apology/:id',
        previewTitle: 'A Thoughtful Apology',
        previewMessage: 'Write an honest message and make things right with care.',
        features: ['Sincere apology designs', 'Private message delivery', 'Response tracking', 'Forgiveness timeline'],
        howItWorks: 'Sometimes saying sorry face-to-face is hard. Our apology cards help you express your feelings thoughtfully. Choose a sincere design, write from your heart about what happened and how you feel, and send it privately. They can take their time to read and respond when ready.',
        whoItsFor: 'For those moments when you\'ve messed up and want to make things right. Whether it\'s with your partner, friend, or family member - this helps you apologize sincerely and give them space to process.',
        useCases: ['Relationship misunderstandings', 'Friendship repairs', 'Family conflicts', 'Workplace apologies']
      },
      'long-distance': {
        title: 'Long Distance',
        description: 'Stay connected across the miles',
        icon: longDistanceIcon,
        gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        createRoute: '/long-distance/create',
        viewRoutePattern: '/long-distance/:id',
        previewTitle: 'Across the Miles',
        previewMessage: 'Send a message that feels close, even from far away.',
        features: ['Distance tracking map', 'Time zone display', 'Countdown timers', 'Shared memories'],
        howItWorks: 'Being miles apart doesn\'t mean you can\'t be close. Create a card that shows your journey together, add photos from your time zones apart, write messages that bridge the distance, and even include countdown timers to when you\'ll meet again.',
        whoItsFor: 'For couples in long-distance relationships, families living apart, or best friends who moved away. Perfect for anyone missing someone who lives far away but wants to keep that connection strong.',
        useCases: ['Long-distance relationships', 'Military deployments', 'Study abroad connections', 'Family across states']
      },
      invite: {
        title: 'Formal Invite',
        description: 'Professional invitations for special events',
        icon: formalInviteIcon,
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        createRoute: '/invite/create',
        viewRoutePattern: '/invite/:id',
        previewTitle: 'A Clean Invitation',
        previewMessage: 'Create a polished invite with clear details and style.',
        features: ['Professional templates', 'RSVP tracking', 'Calendar integration', 'Event details management'],
        howItWorks: 'Planning an event should be elegant, not stressful. Choose from professional designs, add all your event details with clarity, manage your guest list with RSVP tracking, and send it out. Your guests can respond and add it to their calendar instantly.',
        whoItsFor: 'Perfect for weddings, corporate events, milestone birthdays, or any occasion that calls for a touch of class. When you want your invitation to match the importance of your event.',
        useCases: ['Wedding invitations', 'Corporate events', 'Milestone celebrations', 'Fundraising galas']
      },
      capsule: {
        title: 'Time Capsule',
        description: 'Preserve memories for the future',
        icon: timeCapsuleIcon,
        gradient: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
        createRoute: '/capsule/create',
        viewRoutePattern: '/capsule/:id',
        previewTitle: 'A Memory Capsule',
        previewMessage: 'Save a message for the future and share it at the perfect time.',
        features: ['Future delivery scheduling', 'Memory preservation', 'Group contributions', 'Opening ceremony'],
        howItWorks: 'Some memories are too precious to forget. Create a digital time capsule with photos, messages, and videos from today. Set a future date when it should be opened - maybe a year from now, or on a special future occasion. Share it with loved ones who can add their own memories too.',
        whoItsFor: 'Perfect for families wanting to preserve moments, friends creating memories together, or couples documenting their journey. Great for graduation, new babies, or just capturing today for tomorrow.',
        useCases: ['Graduation memories', 'New baby time capsules', 'Relationship milestones', 'Family history preservation']
      },
      anniversary: {
        title: 'Anniversary',
        description: 'Celebrate love and milestones together',
        icon: anniversaryIcon,
        gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
        createRoute: '/anniversary/create',
        viewRoutePattern: '/anniversary/:id',
        previewTitle: 'A Shared Moment',
        previewMessage: 'Celebrate your story with a warm, personal note.',
        features: ['Romantic anniversary themes', 'Then & now photos', 'Love timeline', 'Memory highlights'],
        howItWorks: 'Every anniversary tells a story. Create a card that celebrates your journey together with photos from when you first met to now, write about your favorite memories, and highlight what makes your relationship special. It\'s like creating a mini documentary of your love.',
        whoItsFor: 'For couples celebrating their first anniversary or their fiftieth. Whether you\'re dating, engaged, married, or in a committed relationship - this helps you honor the time you\'ve built together.',
        useCases: ['Wedding anniversaries', 'Dating milestones', 'Relationship celebrations', 'Vow renewal moments']
      },
      'thank-you': {
        title: 'Thank You',
        description: 'Express gratitude with heartfelt messages',
        icon: thankYouIcon,
        gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
        createRoute: '/thank-you/create',
        viewRoutePattern: '/thank-you/:id',
        previewTitle: 'A Simple Thank You',
        previewMessage: 'Say thank you in a way that feels meaningful and lasting.',
        features: ['Gratitude themes', 'Personal appreciation notes', 'Memory highlights', 'Impact stories'],
        howItWorks: 'Gratitude deserves more than a quick text. Create a beautiful thank you card that shows specific moments you\'re grateful for, add photos that capture those memories, and write from the heart about how someone made a difference in your life.',
        whoItsFor: 'Perfect for thanking teachers, mentors, friends, family, or anyone who\'s made an impact. When you want someone to truly know how much they mean to you.',
        useCases: ['Teacher appreciation', 'Mentor gratitude', 'Friend thank yous', 'Family appreciation']
      },
      congratulations: {
        title: 'Congratulations',
        description: 'Celebrate achievements and milestones',
        icon: congratulationsIcon,
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        createRoute: '/congratulations/create',
        viewRoutePattern: '/congratulations/:id',
        previewTitle: 'You Did It',
        previewMessage: 'Celebrate a win with a message that feels personal.',
        features: ['Celebration themes', 'Achievement highlights', 'Proud moments', 'Success stories'],
        howItWorks: 'Big achievements deserve big celebrations. Create a card that highlights their hard work, add photos of their journey, write about why you\'re proud, and celebrate every step that led to this moment. It\'s like creating a trophy they can keep forever.',
        whoItsFor: 'Perfect for graduates, newly promoted colleagues, friends who achieved goals, or anyone who worked hard and succeeded. When you want to show you noticed their effort and celebrate their success.',
        useCases: ['Graduation celebrations', 'Job promotions', 'Personal achievements', 'Sports victories']
      },
      'get-well': {
        title: 'Get Well Soon',
        description: 'Send healing wishes and support',
        icon: getWellIcon,
        gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        createRoute: '/get-well/create',
        viewRoutePattern: '/get-well/:id',
        previewTitle: 'Thinking of You',
        previewMessage: 'Send comfort and support with a calm, caring note.',
        features: ['Comforting designs', 'Healing messages', 'Support gallery', 'Recovery timeline'],
        howItWorks: 'When someone\'s not feeling well, your support matters. Create a gentle card with calming designs, share memories that make them smile, write messages of encouragement, and even invite others to add their well wishes. It\'s like sending a warm hug through the screen.',
        whoItsFor: 'For friends, family, or colleagues who are recovering from illness or surgery. Perfect for anyone who needs to know they\'re loved and supported during their recovery journey.',
        useCases: ['Surgery recovery', 'Illness support', 'Injury healing', 'Chronic condition encouragement']
      },
      graduation: {
        title: 'Graduation',
        description: 'Honor academic achievements',
        icon: graduationIcon,
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        createRoute: '/graduation/create',
        viewRoutePattern: '/graduation/:id',
        previewTitle: 'A Proud Moment',
        previewMessage: 'Celebrate the achievement with a personal message.',
        features: ['Academic themes', 'School memories', 'Future dreams', 'Achievement showcase'],
        howItWorks: 'Graduation marks the end of one chapter and the start of another. Create a card that celebrates their academic journey with photos from school days, memories of late-night study sessions, proud moments, and dreams for the future. It\'s like creating a yearbook page they\'ll treasure forever.',
        whoItsFor: 'For graduates from high school, college, or any educational program. Perfect for proud parents, supportive friends, or anyone who wants to honor this major life achievement.',
        useCases: ['High school graduation', 'College graduation', 'Master\'s degree completion', 'Professional certification']
      },
      wedding: {
        title: 'Wedding',
        description: 'Invite guests to celebrate your special day',
        icon: weddingIcon,
        gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        createRoute: '/wedding/create',
        viewRoutePattern: '/wedding/:id',
        previewTitle: 'Save the Date',
        previewMessage: 'Share your wedding details in a clean and elegant card.',
        features: ['Elegant wedding themes', 'RSVP management', 'Gift registry links', 'Event timeline'],
        howItWorks: 'Your wedding invitation is the first glimpse of your special day. Create an elegant card that reflects your wedding style, include all the important details your guests need, manage RSVPs effortlessly, and even link to your gift registry. It\'s like having a wedding planner in your pocket.',
        whoItsFor: 'For couples planning their dream wedding. Whether you\'re having an intimate ceremony or grand celebration, this helps you invite guests with style and manage everything beautifully.',
        useCases: ['Wedding invitations', 'Save the dates', 'Reception details', 'Gift registry sharing']
      },
      'new-baby': {
        title: 'New Baby',
        description: 'Welcome new life with joy and love',
        icon: newBabyIcon,
        gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ffe0e6 100%)',
        createRoute: '/new-baby/create',
        viewRoutePattern: '/new-baby/:id',
        previewTitle: 'A New Beginning',
        previewMessage: 'Share the happy news with warmth and simplicity.',
        features: ['Adorable baby themes', 'Birth announcements', 'Welcome messages', 'Memory book'],
        howItWorks: 'Welcoming a new baby is one of life\'s greatest joys. Create a beautiful announcement with photos of your little one, share their birth story, write welcome messages from family, and start collecting memories that will grow with your child. It\'s like creating their first baby book online.',
        whoItsFor: 'For new parents, grandparents, or anyone welcoming a baby. Perfect for sharing the exciting news with friends and family near and far, especially those who can\'t visit in person.',
        useCases: ['Birth announcements', 'Baby shower invitations', 'Gender reveals', 'Welcome baby messages']
      },
      sympathy: {
        title: 'Sympathy',
        description: 'Offer comfort and support during difficult times',
        icon: sympathyIcon,
        gradient: 'linear-gradient(135deg, #e0e7ff 0%, #d1d5db 100%)',
        createRoute: '/sympathy/create',
        viewRoutePattern: '/sympathy/:id',
        previewTitle: 'With Care',
        previewMessage: 'Send support with a gentle message and respectful design.',
        features: ['Comforting designs', 'Supportive messages', 'Memory sharing', 'Private delivery'],
        howItWorks: 'During difficult times, finding the right words can be hard. Our sympathy cards help you express your care with gentle designs, thoughtful messages of support, space to share fond memories, and private delivery that respects their need for space.',
        whoItsFor: 'When someone has lost a loved one and you want to show you care. Perfect for friends, family, colleagues, or anyone who needs support during their grieving process.',
        useCases: ['Loss condolences', 'Memorial services', 'Grief support', 'Comfort messages']
      },
      'just-because': {
        title: 'Just Because',
        description: 'Send a smile for no reason at all',
        icon: wishJarIcon,
        gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
        createRoute: '/just-because/create',
        viewRoutePattern: '/just-because/:id',
        previewTitle: 'Thinking of You',
        previewMessage: 'A little surprise to brighten your day.',
        features: ['Fun animations', 'Quick customization', 'Instant sharing', 'Delightful themes'],
        howItWorks: 'You don\'t need a special occasion to show you care. Choose a fun design, add a quick note, and send a smile instantly. It\'s the digital equivalent of a spontaneous hug.',
        whoItsFor: 'For anyone you want to surprise! Friends, partners, family, or coworkers who deserve a little pick-me-up.',
        useCases: ['Random acts of kindness', 'Cheering someone up', 'Saying hello', 'Sharing a joke']
      },
      'bon-voyage': {
        title: 'Bon Voyage',
        description: 'Wish them safe travels and great adventures',
        icon: longDistanceIcon,
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        createRoute: '/bon-voyage/create',
        viewRoutePattern: '/bon-voyage/:id',
        previewTitle: 'Safe Travels',
        previewMessage: 'Wishing you an amazing journey ahead!',
        features: ['Travel themes', 'Destination highlights', 'Group signatures', 'Photo memories'],
        howItWorks: 'Send them off with style! Select a travel-themed card, add wishes for their specific destination, and gather messages from the whole group to wish them a safe and exciting trip.',
        whoItsFor: 'Friends going on vacation, colleagues relocating, students studying abroad, or family members starting a new adventure.',
        useCases: ['Vacation send-offs', 'Study abroad', 'Relocation', 'Gap year travels']
      },
      'housewarming': {
        title: 'Housewarming',
        description: 'Celebrate their new home sweet home',
        icon: formalInviteIcon,
        gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
        createRoute: '/housewarming/create',
        viewRoutePattern: '/housewarming/:id',
        previewTitle: 'Welcome Home',
        previewMessage: 'Congratulations on your new place!',
        features: ['Cozy designs', 'New address sharing', 'Gift registry links', 'Party invites'],
        howItWorks: 'Moving is a big milestone. Celebrate their new space with a warm card. You can even use it to announce your own move or invite friends to a housewarming party.',
        whoItsFor: 'New homeowners, friends moving into their first apartment, or anyone settling into a new space.',
        useCases: ['New home congratulations', 'Moving announcements', 'Housewarming parties', 'Address updates']
      },
      friendship: {
        title: 'Friendship',
        description: 'Celebrate your unique bond',
        icon: thankYouIcon,
        gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
        createRoute: '/friendship/create',
        viewRoutePattern: '/friendship/:id',
        previewTitle: 'Besties Forever',
        previewMessage: 'To my partner in crime and best friend.',
        features: ['Photo collages', 'Inside jokes', 'Memory timelines', 'Fun stickers'],
        howItWorks: 'Celebrate your friendship with a card that captures your unique vibe. Upload photos of your craziest moments, share inside jokes, and remind them why they\'re your favorite person.',
        whoItsFor: 'Best friends, childhood pals, work besties, or that one person who just gets you.',
        useCases: ['Friendversaries', 'Appreciation posts', 'Cheering up a friend', 'Just being silly']
      },
      'self-care': {
        title: 'Self Care',
        description: 'Reminders to take a breath and relax',
        icon: getWellIcon,
        gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        createRoute: '/self-care/create',
        viewRoutePattern: '/self-care/:id',
        previewTitle: 'Breathe & Relax',
        previewMessage: 'A gentle reminder to prioritize yourself today.',
        features: ['Calming visuals', 'Soothing sounds', 'Wellness tips', 'Positive affirmations'],
        howItWorks: 'Send a moment of peace. Choose a calming design with soothing audio, write a message of encouragement, and help someone take a well-deserved break.',
        whoItsFor: 'Anyone who\'s stressed, burnt out, or just needs a reminder to slow down and take care of themselves.',
        useCases: ['Stress relief', 'Mental health support', 'Encouragement', 'Mindfulness reminders']
      },
      'missing-you': {
        title: 'Missing You',
        description: 'Bridge the distance with a heartfelt note',
        icon: longDistanceIcon,
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        createRoute: '/missing-you/create',
        viewRoutePattern: '/missing-you/:wishId',
        previewTitle: 'Thinking of You',
        previewMessage: 'Even when we\'re apart, you\'re in my heart.',
        features: ['Distance maps', 'Countdown to reunion', 'Voice messages', 'Virtual hugs'],
        howItWorks: 'Distance is hard, but staying connected is easy. Create a card that spans the miles, add a voice note so they can hear you, and let them know you\'re counting down the days until you meet again.',
        whoItsFor: 'Long-distance partners, family living away, or friends you haven\'t seen in a while.',
        useCases: ['Long distance relationships', 'Family abroad', 'Miss you messages', 'Reunion planning']
      },
      christmas: {
        title: 'Christmas',
        description: 'Spread holiday cheer and warmth',
        icon: wishJarIcon,
        gradient: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
        createRoute: '/christmas/create',
        viewRoutePattern: '/christmas/:wishId',
        previewTitle: 'Merry Christmas',
        previewMessage: 'Wishing you joy, peace, and love this season.',
        features: ['Festive themes', 'Snow effects', 'Holiday music', 'Family newsletters'],
        howItWorks: 'Share the magic of the season. Choose a festive design with falling snow, add your family holiday photo, and write a warm greeting to send to all your friends and family.',
        whoItsFor: 'Everyone! Perfect for family holiday cards, business greetings, or sending cheer to friends near and far.',
        useCases: ['Family Christmas cards', 'Holiday greetings', 'Secret Santa reveals', 'New Year wishes']
      },
      'new-year': {
        title: 'New Year',
        description: 'Toast to new beginnings and resolutions',
        icon: congratulationsIcon,
        gradient: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
        createRoute: '/new-year/create',
        viewRoutePattern: '/new-year/:wishId',
        previewTitle: 'Happy New Year',
        previewMessage: 'Cheers to a fresh start and new adventures!',
        features: ['Fireworks effects', 'Resolution lists', 'Year in review', 'Party vibes'],
        howItWorks: 'Ring in the new year with a bang! Select a dazzling design with fireworks, share your highlights from the past year, and send your best wishes for the year ahead.',
        whoItsFor: 'Friends, family, colleagues, and anyone you want to wish a prosperous new year.',
        useCases: ['New Year greetings', 'Party invitations', 'Year in review', 'Resolution sharing']
      },
      easter: {
        title: 'Easter',
        description: 'Hop into spring with joy and renewal',
        icon: newBabyIcon,
        gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        createRoute: '/easter/create',
        viewRoutePattern: '/easter/:wishId',
        previewTitle: 'Happy Easter',
        previewMessage: 'Wishing you a basket full of joy and treats.',
        features: ['Spring themes', 'Egg hunt games', 'Cute characters', 'Pastel colors'],
        howItWorks: 'Celebrate spring and new life! Choose a cute bunny or egg-themed design, maybe include a fun little interactive element, and send warm Easter wishes to your loved ones.',
        whoItsFor: 'Kids, families, and anyone who enjoys the freshness of spring and Easter traditions.',
        useCases: ['Easter greetings', 'Spring celebrations', 'Family gatherings', 'Kids\' surprises']
      },
      halloween: {
        title: 'Halloween',
        description: 'Spooky greetings and fun tricks',
        icon: crushAskIcon,
        gradient: 'linear-gradient(135deg, #243949 0%, #517fa4 100%)',
        createRoute: '/halloween/create',
        viewRoutePattern: '/halloween/:wishId',
        previewTitle: 'Happy Halloween',
        previewMessage: 'Have a spooktacular and fun-filled night!',
        features: ['Spooky themes', 'Interactive scares', 'Costume contests', 'Dark mode'],
        howItWorks: 'Get spooky! Pick a haunted house or pumpkin design, add some eerie sound effects, and send a fun scare to your friends. Perfect for party invites or just for fun.',
        whoItsFor: 'Friends who love horror, party guests, or anyone who enjoys the Halloween spirit.',
        useCases: ['Party invitations', 'Spooky greetings', 'Costume sharing', 'Trick or treat fun']
      },
      'good-luck': {
        title: 'Good Luck',
        description: 'Send positive vibes for big moments',
        icon: wishJarIcon,
        gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
        createRoute: '/good-luck/create',
        viewRoutePattern: '/good-luck/:wishId',
        previewTitle: 'Good Luck!',
        previewMessage: 'You\'ve got this! We\'re rooting for you.',
        features: ['Motivational quotes', 'Success symbols', 'Group cheering', 'Confidence boosters'],
        howItWorks: 'Give them a confidence boost! Choose a design with four-leaf clovers or uplifting colors, write a pep talk, and let them know you believe in them.',
        whoItsFor: 'Students taking exams, friends with job interviews, athletes competing, or anyone facing a challenge.',
        useCases: ['Exams', 'Job interviews', 'Competitions', 'New ventures']
      },
      retirement: {
        title: 'Retirement',
        description: 'Celebrate a career and new freedom',
        icon: timeCapsuleIcon,
        gradient: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
        createRoute: '/retirement/create',
        viewRoutePattern: '/retirement/:wishId',
        previewTitle: 'Happy Retirement',
        previewMessage: 'Enjoy your well-deserved freedom and relaxation.',
        features: ['Career highlights', 'Guestbook signing', 'Relaxation themes', 'Future plans'],
        howItWorks: 'Honor their hard work and celebrate their next chapter. Create a card where colleagues can leave messages, share photos from their career, and wish them a relaxing retirement.',
        whoItsFor: 'Colleagues, parents, or friends retiring from their jobs.',
        useCases: ['Retirement parties', 'Farewell messages', 'Career celebration', 'New chapter wishes']
      },
      'thinking-of-you': {
        title: 'Thinking of You',
        description: 'Reach out and say hello',
        icon: getWellIcon,
        gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
        createRoute: '/thinking-of-you/create',
        viewRoutePattern: '/thinking-of-you/:wishId',
        previewTitle: 'On My Mind',
        previewMessage: 'Just wanted to say hello and send a smile.',
        features: ['Gentle designs', 'Voice notes', 'Photo sharing', 'Warm wishes'],
        howItWorks: 'Sometimes you just want to reach out. Create a simple, beautiful card to let someone know they\'re in your thoughts, no special occasion required.',
        whoItsFor: 'Friends you haven\'t seen in a while, family members, or anyone going through a busy time.',
        useCases: ['Checking in', 'Sending love', 'Reconnecting', 'Support']
      },
      'cat-lovers': {
        title: 'Cat Lovers',
        description: 'Purr-fect cards for feline fans',
        icon: catIcon,
        gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
        createRoute: '/cat-lovers/create',
        viewRoutePattern: '/cat-lovers/:wishId',
        previewTitle: 'Meow!',
        previewMessage: 'Sending you some purrs and head boops.',
        features: ['Cat themes', 'Meow sounds', 'Cute stickers', 'Interactive yarn'],
        howItWorks: 'For the cat obsessed! Choose a design full of whiskers and paws, add cute cat photos, and send a card that\'s the cat\'s pajamas.',
        whoItsFor: 'Cat owners, animal lovers, or anyone who appreciates a cute kitten.',
        useCases: ['Cat birthdays', 'Cheering up', 'Just for fun', 'Pet appreciation']
      },
      'balloon-celebration': {
        title: 'Balloon Celebration',
        description: 'Pop some joy into their day',
        icon: balloonIcon,
        gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        createRoute: '/balloon-celebration/create',
        viewRoutePattern: '/balloon-celebration/:wishId',
        previewTitle: 'Let\'s Celebrate!',
        previewMessage: 'Sending a bunch of happiness your way.',
        features: ['Interactive balloons', 'Popping effects', 'Colorful themes', 'Party sounds'],
        howItWorks: 'Who doesn\'t love balloons? Send a virtual bouquet of balloons that they can interact with. Perfect for any celebration that needs a pop of color.',
        whoItsFor: 'Kids, party lovers, and anyone celebrating a happy occasion.',
        useCases: ['Birthdays', 'Congratulations', 'Parties', 'Surprises']
      }
    };

    console.log('CardDetailsPage occasion:', occasion);
    const key = occasion?.toLowerCase();
    return map[key] || map[occasion];
  }, [occasion]);

  const handleBack = () => {
    window.history.back();
  };

  const handleCreate = () => {
    if (cardData?.createRoute) {
      // Smooth scroll to top before navigation
      window.scrollTo({ top: 0, behavior: 'smooth' });
      navigate(cardData.createRoute);
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const createUrl = cardData?.createRoute ? `${origin}${cardData.createRoute}` : '';
  const previewUrl = cardData?.createRoute ? `${origin}${cardData.createRoute.replace('/create', '/testing')}` : '';

  const faqData = [
    {
      question: `How do I create a ${cardData?.title || 'card'}?`,
      answer: `Creating a ${cardData?.title || 'card'} is simple! Just click the "Create" button, fill in your details, customize the design, and share it with your recipient. The whole process takes less than 5 minutes.`
    },
    {
      question: 'Can I customize the design and message?',
      answer: 'Yes! All our cards are fully customizable. You can change colors, fonts, add photos, include personal messages, and even add music or interactive elements depending on the card type.'
    },
    {
      question: 'How do I share my created card?',
      answer: 'Once created, you\'ll get a unique link that you can share via text, email, social media, or QR code. Your recipient can view the card on any device without needing to download an app.'
    },
    {
      question: 'Is my card private and secure?',
      answer: 'Absolutely. All cards are private by default and only accessible through the unique link. We use secure encryption and never share your personal information or card content.'
    },
    {
      question: 'Can I edit my card after creating it?',
      answer: 'Yes, you can edit your card anytime. Simply access your card through your dashboard or the original link and make changes. Updates appear instantly for anyone viewing the card.'
    }
  ];

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleCopyLink = async (url) => {
    try {
      if (!url) return;
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error('Failed to copy');
    }
  };

  if (!cardData) {
    return (
      <div className="app">
        <Navbar />
        <div className="card-details-page">
          <div className="card-details-header">
            <button className="back-button" onClick={handleBack}>
              <ArrowLeft size={20} />
              Back
            </button>
          </div>

          <div className="card-details-missing">
            <h1>Card not found</h1>
            <p>This card may not be available yet.</p>
            <button className="primary-action" onClick={() => navigate('/')}>Go to Home</button>
          </div>
        </div>

        <div className="simple-footer">
          <p>&copy; 2026 EGreet - Create beautiful memories</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* SEO Meta Tags */}
      <SimpleSEO {...getSEOConfig(location.pathname)} />

      <Navbar />

      <div className="card-details-page">
        <div className="card-details-content">
          <div className="card-details-hero" style={{ background: cardData.gradient }}>
            <button className="back-button-inside" onClick={handleBack}>
              <ArrowLeft size={18} />
              Back
            </button>

            <div className="card-details-icon">
              <img src={cardData.icon} alt={cardData.title} />
            </div>
            <h1 className="card-details-title">{cardData.title}</h1>
            <p className="card-details-description">{cardData.description}</p>

            <div className="card-details-actions">
              <button
                className="secondary-action"
                onClick={() => {
                  setShowPreview((v) => {
                    const next = !v;
                    if (next) {
                      setIframeLoaded(false);
                      setIframeError(false);
                    }
                    return next;
                  });
                }}
              >
                <Eye size={16} />
                {showPreview ? 'Hide Preview' : 'Preview'}
              </button>

              <button className="primary-action" onClick={handleCreate}>
                <Plus size={16} />
                Create
              </button>
            </div>
          </div>

          {showPreview && (
            <div className="card-details-preview">
              <div className="preview-iframe-card">
                <div className="preview-iframe-header" style={{ background: cardData.gradient }}>
                  <div className="preview-iframe-title">
                    <div className="preview-kicker">Live Preview</div>
                    <div className="preview-url" title={createUrl}>{createUrl}</div>
                  </div>

                  <div className="preview-iframe-actions">
                    <button
                      className="secondary-action"
                      type="button"
                      onClick={() => handleCopyLink(createUrl)}
                    >
                      <Copy size={16} />
                      Copy link
                    </button>

                    <a
                      className="secondary-action"
                      href={createUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink size={16} />
                      Open
                    </a>
                  </div>
                </div>

                <div className="preview-iframe-shell">
                  {!iframeLoaded && !iframeError && (
                    <div className="preview-iframe-loading">
                      Loading preview...
                    </div>
                  )}
                  {iframeError && (
                    <div className="preview-iframe-error">
                      Preview failed to load.
                      <div className="preview-iframe-error-actions">
                        <a
                          className="primary-action"
                          href={createUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink size={16} />
                          Open in new tab
                        </a>
                      </div>
                    </div>
                  )}

                  <iframe
                    className={`preview-iframe ${iframeLoaded ? 'is-loaded' : ''}`}
                    src={previewUrl || createUrl}
                    title={`${cardData.title} preview`}
                    loading="lazy"
                    onLoad={() => setIframeLoaded(true)}
                    onError={() => setIframeError(true)}
                  />
                </div>
              </div>

              <div className="preview-info">
                <h2>Card details</h2>
                <p>
                  {cardData.previewMessage}
                </p>

                <div className="preview-metadata">
                  <div className="preview-meta-row">
                    <div className="preview-meta-label">Occasion</div>
                    <div className="preview-meta-value">{occasion}</div>
                  </div>
                  <div className="preview-meta-row">
                    <div className="preview-meta-label">Create route</div>
                    <div className="preview-meta-value">{cardData.createRoute}</div>
                  </div>
                  <div className="preview-meta-row">
                    <div className="preview-meta-label">View route</div>
                    <div className="preview-meta-value">{cardData.viewRoutePattern}</div>
                  </div>
                </div>

                <div className="preview-actions">
                  <button className="primary-action" onClick={handleCreate}>
                    <Plus size={16} />
                    Create this card
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Combined Information Section */}
          <div className="card-info-section">
            <div className="section-header">
              <div className="section-icon">
                <Sparkles size={24} />
              </div>
              <h2>Everything You Need to Know</h2>
              <p>Personal features, perfect use cases, and helpful answers</p>
            </div>

            <div className="info-content">
              {/* How It Works */}
              <div className="info-block">
                <h3>How It Works</h3>
                <p>{cardData?.howItWorks || 'Creating beautiful cards is easy. Choose your design, personalize it with your message and photos, and share it with your loved ones. Each card is crafted to make your moments special.'}</p>
              </div>

              <hr className="info-divider" />

              {/* Who It's For */}
              <div className="info-block">
                <h3>Who It's For</h3>
                <p>{cardData?.whoItsFor || 'This card is perfect for anyone who wants to create meaningful connections. Whether you\'re celebrating special moments, offering support, or expressing your feelings, this helps you do it beautifully.'}</p>
              </div>

              <hr className="info-divider" />

              {/* Features */}
              <div className="info-block">
                <h3>Premium Features</h3>
                <div className="features-list">
                  {(cardData?.features || [
                    'Beautiful templates', 'Custom messages', 'Photo uploads',
                    'Easy sharing', 'Mobile friendly', 'Instant delivery'
                  ]).map((feature, index) => (
                    <div key={index} className="feature-item">
                      <div className="feature-icon">
                        <Zap size={16} />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <hr className="info-divider" />

              {/* Use Cases */}
              <div className="info-block">
                <h3>Perfect For</h3>
                <div className="usecases-list">
                  {(cardData?.useCases || [
                    'Special occasions', 'Surprise moments', 'Personal connections',
                    'Professional events', 'Holiday greetings', 'Just because'
                  ]).map((useCase, index) => (
                    <div key={index} className="usecase-item">
                      <div className="usecase-bullet"></div>
                      <span>{useCase}</span>
                    </div>
                  ))}
                </div>
              </div>

              <hr className="info-divider" />

              {/* FAQ */}
              <div className="info-block">
                <h3>Frequently Asked Questions</h3>
                <div className="faq-list">
                  {faqData.map((faq, index) => (
                    <div key={index} className="faq-item">
                      <button
                        className="faq-question"
                        onClick={() => toggleFaq(index)}
                      >
                        <span>{faq.question}</span>
                        {expandedFaq === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                      {expandedFaq === index && (
                        <div className="faq-answer">
                          <p>{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="simple-footer">
        <p>&copy; 2026 EGreet - Create beautiful memories</p>
      </div>
    </div>
  );
};

export default CardDetailsPage;
