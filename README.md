# EGreet - Free Greeting Card Maker

> Create and send beautiful digital greeting cards. Play piano songs even if you've never played, build custom bouquets, and express love without paywalls.

**Live Site:** [egreet.in](https://egreet.in)

---

## What This Is

A completely free platform for creating digital greeting cards. No ads, no login required, no paywalls.

**Features:**
- 🎹 **Piano Cards** - Play songs with guided keys (even if you've never played)
- 💐 **Digital Bouquets** - Create custom flower arrangements
- 🎂 **30+ Card Categories** - Birthdays, anniversaries, holidays, and more
- 📱 **Mobile-Friendly** - Works on any device

**Philosophy:** Love shouldn't have a paywall.

---

## Running Locally

```bash
# Clone the repo
git clone https://github.com/yourusername/egreet.git
cd egreet

# Install dependencies
npm install

# Create .env file with your Firebase & Cloudinary credentials
# (See .env for required variables)

# Start dev server
npm run dev
```

Then open `http://localhost:5173`

---

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_GA_MEASUREMENT_ID=your_ga_measurement_id

REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
REACT_APP_CLOUDINARY_API_KEY=your_cloudinary_api_key
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

You'll need to set up your own Firebase and Cloudinary accounts for storage and media handling.

---

## Built With

**Frontend:**
- React + Vite
- Tailwind CSS
- Framer Motion (animations)
- Three.js (3D effects)

**Audio:**
- Tone.js (piano playback)
- @tonejs/midi (MIDI parsing)

**Services:**
- Firebase (database, storage, auth)
- Cloudflare (CDN)
- Netlify (hosting)

**Animations:**
- Lottie animations from [LottieFiles](https://lottiefiles.com/) community creators

---

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

---

## Stats

- 500K+ page views
- 100K+ monthly visitors
- 50K+ cards created
- 100% free forever

---

## Why It's Free

I'm 16 and built this because I wanted to send a digital card to someone, but every site either wanted money or made you watch ads.

So I made my own. No ads, no tracking, no login required. 

The receiver doesn't see ads either - they just get a beautiful card.

**Philosophy:** Love shouldn't have a paywall.

---

## Contributing

Not really looking for contributions right now since this is a personal project, but feel free to fork it and make your own version!

If you find bugs, open an issue and I'll try to fix them.

---

## License

MIT License - feel free to use the code, but please keep it free and don't put greeting cards behind paywalls :)

---

## Credits

Thanks to everyone who made this possible - from the open source maintainers to the Lottie creators to the people who believed in keeping digital expression free.

---

*"Love shouldn't have a paywall."*
