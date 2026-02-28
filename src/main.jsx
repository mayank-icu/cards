import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { lazy } from 'react'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { AdminAuthProvider } from './contexts/AdminAuthContext.jsx'
import LoadingSpinner from './components/LoadingSpinner.jsx'
import NotFound from './components/NotFound.jsx'
import Analytics from './components/Analytics.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import GlobalRouteSEO from './components/GlobalRouteSEO.jsx'

// Register service worker for performance (only in production)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .catch(() => { });
  });
}

// Lazy load components for better performance
const ValentineCreator = lazy(() => import('./valentine/pages/ValentineCreator.jsx'))
const ValentineView = lazy(() => import('./valentine/pages/ValentineView.jsx'))
const CreateWish = lazy(() => import('./birthday/components/CreateWish.jsx'))
const BirthdayPage = lazy(() => import('./birthday/components/BirthdayView.jsx'))
const WishDisplay = lazy(() => import('./birthday/components/BirthdayView.jsx').then((module) => ({ default: module.WishDisplay })))
const CreateWishJar = lazy(() => import('./wish-jar/components/CreateWishJar.jsx'))
const WishJar = lazy(() => import('./wish-jar/components/WishJar.jsx'))
const CreateLink = lazy(() => import('./crush-ask/components/CreateLink.jsx'))
const AskPage = lazy(() => import('./crush-ask/components/AskPage.jsx'))
const CreateApology = lazy(() => import('./apology/components/CreateApology.jsx'))
const ApologyPage = lazy(() => import('./apology/components/ApologyPage.jsx'))
const CreateLongDistance = lazy(() => import('./long-distance/components/CreateLongDistance.jsx'))
const LongDistancePage = lazy(() => import('./long-distance/components/LongDistancePage.jsx'))
const CreateInvite = lazy(() => import('./formal-invite/components/CreateInvite.jsx'))
const InvitePage = lazy(() => import('./formal-invite/components/InvitePage.jsx'))
const CreateCapsule = lazy(() => import('./time-capsule/components/CreateCapsule.jsx'))
const CapsulePage = lazy(() => import('./time-capsule/components/CapsulePage.jsx'))
const CreateAnniversary = lazy(() => import('./anniversary/components/CreateAnniversary.jsx'))
const AnniversaryPage = lazy(() => import('./anniversary/components/AnniversaryPage.jsx'))
const CreateThankYou = lazy(() => import('./thank-you/components/CreateThankYou.jsx'))
const ThankYouPage = lazy(() => import('./thank-you/components/ThankYouPage.jsx'))
const CreateCongratulations = lazy(() => import('./congratulations/components/CreateCongratulations.jsx'))
const CongratulationsPage = lazy(() => import('./congratulations/components/CongratulationsPage.jsx'))
const CreateGetWell = lazy(() => import('./get-well/components/CreateGetWell.jsx'))
const GetWellPage = lazy(() => import('./get-well/components/GetWellPage.jsx'))
const CreateGraduation = lazy(() => import('./graduation/components/CreateGraduation.jsx'))
const GraduationPage = lazy(() => import('./graduation/components/GraduationPage.jsx'))
const CreateWedding = lazy(() => import('./wedding/components/CreateWedding.jsx'))
const WeddingPage = lazy(() => import('./wedding/components/WeddingPage.jsx'))
const CreateNewBaby = lazy(() => import('./new-baby/components/CreateNewBaby.jsx'))
const NewBabyPage = lazy(() => import('./new-baby/components/NewBabyPage.jsx'))
const CreateSympathy = lazy(() => import('./sympathy/components/CreateSympathy.jsx'))
const SympathyPage = lazy(() => import('./sympathy/components/SympathyPage.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const Register = lazy(() => import('./pages/Register.jsx'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'))
const SavedCards = lazy(() => import('./pages/SavedCards.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const ComingSoonPage = lazy(() => import('./pages/ComingSoonPage.jsx'))
const CardDetailsPage = lazy(() => import('./pages/CardDetailsPage.jsx'))
const CreateJustBecause = lazy(() => import('./just-because/components/CreateJustBecause.jsx'))
const JustBecausePage = lazy(() => import('./just-because/components/JustBecausePage.jsx'))
const CreateBonVoyage = lazy(() => import('./bon-voyage/components/CreateBonVoyage.jsx'))
const BonVoyagePage = lazy(() => import('./bon-voyage/components/BonVoyagePage.jsx'))
const CreateHousewarming = lazy(() => import('./housewarming/components/CreateHousewarming.jsx'))
const HousewarmingPage = lazy(() => import('./housewarming/components/HousewarmingPage.jsx'))
const CreateFriendship = lazy(() => import('./friendship/components/CreateFriendship.jsx'))
const FriendshipPage = lazy(() => import('./friendship/components/FriendshipPage.jsx'))
const CreateSelfCare = lazy(() => import('./self-care/components/CreateSelfCare.jsx'))
const SelfCarePage = lazy(() => import('./self-care/components/SelfCarePage.jsx'))
const CreateMissingYou = lazy(() => import('./missing-you/components/CreateMissingYou.jsx'))
const MissingYouView = lazy(() => import('./missing-you/components/MissingYouView.jsx'))
const CreateChristmas = lazy(() => import('./christmas/components/CreateChristmas.jsx'))
const ChristmasView = lazy(() => import('./christmas/components/ChristmasView.jsx'))
const CreateNewYear = lazy(() => import('./new-year/components/CreateNewYear.jsx'))
const NewYearView = lazy(() => import('./new-year/components/NewYearView.jsx'))
const CreateEaster = lazy(() => import('./easter/components/CreateEaster.jsx'))
const EasterView = lazy(() => import('./easter/components/EasterView.jsx'))
const CreateHalloween = lazy(() => import('./halloween/components/CreateHalloween.jsx'))
const HalloweenView = lazy(() => import('./halloween/components/HalloweenView.jsx'))
const CreateGoodLuck = lazy(() => import('./good-luck/components/CreateGoodLuck.jsx'))
const GoodLuckView = lazy(() => import('./good-luck/components/GoodLuckView.jsx'))
const CreateRetirement = lazy(() => import('./retirement/components/CreateRetirement.jsx'))
const RetirementView = lazy(() => import('./retirement/components/RetirementView.jsx'))
const CreateThinkingOfYou = lazy(() => import('./thinking-of-you/components/CreateThinkingOfYou.jsx'))
const ThinkingOfYouView = lazy(() => import('./thinking-of-you/components/ThinkingOfYouView.jsx'))
const CreateCatLovers = lazy(() => import('./cat-lovers/components/CreateCatLovers.jsx'))
const CatLoversView = lazy(() => import('./cat-lovers/components/CatLoversView.jsx'))
const CreateBalloonCelebration = lazy(() => import('./balloon-celebration/components/CreateBalloonCelebration.jsx'))
const BalloonCelebrationView = lazy(() => import('./balloon-celebration/components/BalloonCelebrationView.jsx'))
const CreateBouquet = lazy(() => import('./bouquet/components/CreateBouquet.jsx'))
const BouquetView = lazy(() => import('./bouquet/components/BouquetView.jsx'))
const PianoLoveTool = lazy(() => import('./piano-love/components/PianoLoveTool.jsx'))
const PianoLoveView = lazy(() => import('./piano-love/components/PianoLoveView.jsx'))
const Piano3DView = lazy(() => import('./piano-love/components/Piano3DView.jsx'))

// Admin
const AdminDashboard = lazy(() => import('./components/AdminDashboard.jsx'))

const About = lazy(() => import('./pages/About.jsx'))
const Contact = lazy(() => import('./pages/Contact.jsx'))
const AllCardsPage = lazy(() => import('./pages/AllCardsPage.jsx'))
const Blog = lazy(() => import('./pages/Blog.jsx'))
const GreetingCardMakerPage = lazy(() => import('./pages/GreetingCardMakerPage.jsx'))
const CongratulationsCardMakerPage = lazy(() => import('./pages/CongratulationsCardMakerPage.jsx'))
const GreetingsCardMakerPage = lazy(() => import('./pages/GreetingsCardMakerPage.jsx'))
const BeautifulCardsPage = lazy(() => import('./pages/BeautifulCardsPage.jsx'))
const BouquetCardMakerPage = lazy(() => import('./pages/BouquetCardMakerPage.jsx'))
const FreeEcardMakerPage = lazy(() => import('./pages/FreeEcardMakerPage.jsx'))
const OnlineThankYouCardMakerPage = lazy(() => import('./pages/OnlineThankYouCardMakerPage.jsx'))

// Minimal card view for fast loading
const MinimalCardView = lazy(() => import('./components/MinimalCardView.jsx'))
const FirebaseAuthHandler = lazy(() => import('./components/FirebaseAuthHandler.jsx'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AdminAuthProvider>
        <BrowserRouter>
          <GlobalRouteSEO />
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/login" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Login />
              </Suspense>
            } />
            <Route path="/register" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Register />
              </Suspense>
            } />
            <Route path="/forgot-password" element={
              <Suspense fallback={<LoadingSpinner />}>
                <ForgotPassword />
              </Suspense>
            } />
            <Route path="/saved-cards" element={
              <Suspense fallback={<LoadingSpinner />}>
                <ProtectedRoute>
                  <SavedCards />
                </ProtectedRoute>
              </Suspense>
            } />
            <Route path="/profile" element={
              <Suspense fallback={<LoadingSpinner />}>
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              </Suspense>
            } />
            <Route path="/cards" element={
              <Suspense fallback={<LoadingSpinner />}>
                <AllCardsPage />
              </Suspense>
            } />
            <Route path="/greeting-card-maker" element={
              <Suspense fallback={<LoadingSpinner />}>
                <GreetingCardMakerPage />
              </Suspense>
            } />
            <Route path="/congratulations-card-maker" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CongratulationsCardMakerPage />
              </Suspense>
            } />
            <Route path="/greetings-card-maker" element={
              <Suspense fallback={<LoadingSpinner />}>
                <GreetingsCardMakerPage />
              </Suspense>
            } />
            <Route path="/beautiful-cards" element={
              <Suspense fallback={<LoadingSpinner />}>
                <BeautifulCardsPage />
              </Suspense>
            } />
            <Route path="/bouquet-card-maker" element={
              <Suspense fallback={<LoadingSpinner />}>
                <BouquetCardMakerPage />
              </Suspense>
            } />
            <Route path="/free-ecard-maker" element={
              <Suspense fallback={<LoadingSpinner />}>
                <FreeEcardMakerPage />
              </Suspense>
            } />
            <Route path="/online-thank-you-card-maker" element={
              <Suspense fallback={<LoadingSpinner />}>
                <OnlineThankYouCardMakerPage />
              </Suspense>
            } />
            <Route path="/cards/:occasion" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CardDetailsPage />
              </Suspense>
            } />
            <Route path="/valentine/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <ValentineCreator />
              </Suspense>
            } />
            <Route path="/valentine/:id" element={
              <Suspense fallback={<LoadingSpinner />}>
                <ValentineView />
              </Suspense>
            } />
            <Route path="/birthday/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateWish />
              </Suspense>
            } />
            <Route path="/view/:id" element={
              <Suspense fallback={
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '50vh',
                  fontSize: '1.2rem',
                  color: '#667eea'
                }}>
                  Loading card...
                </div>
              }>
                <MinimalCardView />
              </Suspense>
            } />
            <Route path="/view/:id/:viewId" element={
              <Suspense fallback={
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '50vh',
                  fontSize: '1.2rem',
                  color: '#667eea'
                }}>
                  Loading card...
                </div>
              }>
                <MinimalCardView />
              </Suspense>
            } />
            <Route path="/birthday/:wishId" element={
              <Suspense fallback={<LoadingSpinner />}>
                <BirthdayPage />
              </Suspense>
            } />
            <Route path="/wish/:wishId" element={
              <Suspense fallback={<LoadingSpinner />}>
                <WishDisplay />
              </Suspense>
            } />
            <Route path="/wish-jar/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateWishJar />
              </Suspense>
            } />
            <Route path="/wish-jar/:jarId" element={
              <Suspense fallback={<LoadingSpinner />}>
                <WishJar />
              </Suspense>
            } />
            <Route path="/crush/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateLink />
              </Suspense>
            } />
            <Route path="/ask/:slug" element={
              <Suspense fallback={<LoadingSpinner />}>
                <AskPage />
              </Suspense>
            } />
            <Route path="/apology/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateApology />
              </Suspense>
            } />
            <Route path="/apology/:id" element={
              <Suspense fallback={<LoadingSpinner />}>
                <ApologyPage />
              </Suspense>
            } />
            <Route path="/long-distance/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateLongDistance />
              </Suspense>
            } />
            <Route path="/long-distance/:id" element={
              <Suspense fallback={<LoadingSpinner />}>
                <LongDistancePage />
              </Suspense>
            } />
            <Route path="/invite/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateInvite />
              </Suspense>
            } />
            <Route path="/invite/:id" element={
              <Suspense fallback={<LoadingSpinner />}>
                <InvitePage />
              </Suspense>
            } />
            <Route path="/capsule/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateCapsule />
              </Suspense>
            } />
            <Route path="/capsule/:id" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CapsulePage />
              </Suspense>
            } />
            <Route path="/anniversary/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateAnniversary />
              </Suspense>
            } />
            <Route path="/anniversary/:id" element={
              <Suspense fallback={<LoadingSpinner />}>
                <AnniversaryPage />
              </Suspense>
            } />
            <Route path="/thank-you/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateThankYou />
              </Suspense>
            } />
            <Route path="/thank-you/:id" element={
              <Suspense fallback={<LoadingSpinner />}>
                <ThankYouPage />
              </Suspense>
            } />
            <Route path="/congratulations/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateCongratulations />
              </Suspense>
            } />
            <Route path="/congratulations/:id" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CongratulationsPage />
              </Suspense>
            } />
            <Route path="/get-well/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateGetWell />
              </Suspense>
            } />
            <Route path="/get-well/:id" element={
              <Suspense fallback={<LoadingSpinner />}>
                <GetWellPage />
              </Suspense>
            } />
            <Route path="/graduation/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateGraduation />
              </Suspense>
            } />
            <Route path="/graduation/:id" element={
              <Suspense fallback={<LoadingSpinner />}>
                <GraduationPage />
              </Suspense>
            } />
            <Route path="/wedding/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateWedding />
              </Suspense>
            } />
            <Route path="/wedding/:id" element={
              <Suspense fallback={<LoadingSpinner />}>
                <WeddingPage />
              </Suspense>
            } />
            <Route path="/new-baby/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateNewBaby />
              </Suspense>
            } />
            <Route path="/new-baby/:id" element={
              <Suspense fallback={<LoadingSpinner />}>
                <NewBabyPage />
              </Suspense>
            } />
            <Route path="/sympathy/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateSympathy />
              </Suspense>
            } />
            <Route path="/sympathy/:id" element={
              <Suspense fallback={<LoadingSpinner />}>
                <SympathyPage />
              </Suspense>
            } />
            <Route path="/just-because/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateJustBecause />
              </Suspense>
            } />
            <Route path="/just-because/:id" element={
              <Suspense fallback={<LoadingSpinner />}>
                <JustBecausePage />
              </Suspense>
            } />
            <Route path="/bon-voyage/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateBonVoyage />
              </Suspense>
            } />
            <Route path="/bon-voyage/:id" element={
              <Suspense fallback={<LoadingSpinner />}>
                <BonVoyagePage />
              </Suspense>
            } />
            <Route path="/housewarming/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateHousewarming />
              </Suspense>
            } />
            <Route path="/housewarming/:id" element={
              <Suspense fallback={<LoadingSpinner />}>
                <HousewarmingPage />
              </Suspense>
            } />
            <Route path="/friendship/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateFriendship />
              </Suspense>
            } />
            <Route path="/friendship/:id" element={
              <Suspense fallback={<LoadingSpinner />}>
                <FriendshipPage />
              </Suspense>
            } />
            <Route path="/self-care/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateSelfCare />
              </Suspense>
            } />
            <Route path="/self-care/:id" element={
              <Suspense fallback={<LoadingSpinner />}>
                <SelfCarePage />
              </Suspense>
            } />
            <Route path="/missing-you/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateMissingYou />
              </Suspense>
            } />
            <Route path="/missing-you/:wishId" element={
              <Suspense fallback={<LoadingSpinner />}>
                <MissingYouView />
              </Suspense>
            } />
            <Route path="/christmas/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateChristmas />
              </Suspense>
            } />
            <Route path="/christmas/:wishId" element={
              <Suspense fallback={<LoadingSpinner />}>
                <ChristmasView />
              </Suspense>
            } />
            <Route path="/new-year/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateNewYear />
              </Suspense>
            } />
            <Route path="/new-year/:wishId" element={
              <Suspense fallback={<LoadingSpinner />}>
                <NewYearView />
              </Suspense>
            } />
            <Route path="/easter/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateEaster />
              </Suspense>
            } />
            <Route path="/easter/:wishId" element={
              <Suspense fallback={<LoadingSpinner />}>
                <EasterView />
              </Suspense>
            } />
            <Route path="/halloween/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateHalloween />
              </Suspense>
            } />
            <Route path="/halloween/:wishId" element={
              <Suspense fallback={<LoadingSpinner />}>
                <HalloweenView />
              </Suspense>
            } />
            <Route path="/good-luck/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateGoodLuck />
              </Suspense>
            } />
            <Route path="/good-luck/:wishId" element={
              <Suspense fallback={<LoadingSpinner />}>
                <GoodLuckView />
              </Suspense>
            } />
            <Route path="/retirement/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateRetirement />
              </Suspense>
            } />
            <Route path="/retirement/:wishId" element={
              <Suspense fallback={<LoadingSpinner />}>
                <RetirementView />
              </Suspense>
            } />
            <Route path="/thinking-of-you/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateThinkingOfYou />
              </Suspense>
            } />
            <Route path="/thinking-of-you/:wishId" element={
              <Suspense fallback={<LoadingSpinner />}>
                <ThinkingOfYouView />
              </Suspense>
            } />
            <Route path="/cat-lovers/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateCatLovers />
              </Suspense>
            } />
            <Route path="/cat-lovers/:wishId" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CatLoversView />
              </Suspense>
            } />
            <Route path="/balloon-celebration/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateBalloonCelebration />
              </Suspense>
            } />
            <Route path="/balloon-celebration/:wishId" element={
              <Suspense fallback={<LoadingSpinner />}>
                <BalloonCelebrationView />
              </Suspense>
            } />
            <Route path="/bouquet/create" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreateBouquet />
              </Suspense>
            } />
            <Route path="/bouquet/:id" element={
              <Suspense fallback={<LoadingSpinner />}>
                <BouquetView />
              </Suspense>
            } />
            <Route path="/piano" element={
              <Suspense fallback={<LoadingSpinner />}>
                <PianoLoveTool />
              </Suspense>
            } />
            <Route path="/piano/:id" element={
              <Suspense fallback={<LoadingSpinner />}>
                <PianoLoveView />
              </Suspense>
            } />
            <Route path="/piano-3d" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Piano3DView />
              </Suspense>
            } />
            <Route path="/coming-soon" element={
              <Suspense fallback={<LoadingSpinner />}>
                <ComingSoonPage />
              </Suspense>
            } />
            <Route path="/__/auth/handler" element={
              <Suspense fallback={<LoadingSpinner />}>
                <FirebaseAuthHandler />
              </Suspense>
            } />
            <Route path="/about" element={
              <Suspense fallback={<LoadingSpinner />}>
                <About />
              </Suspense>
            } />
            <Route path="/contact" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Contact />
              </Suspense>
            } />
            <Route path="/blog/" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Blog />
              </Suspense>
            } />
            <Route path="/blog" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Blog />
              </Suspense>
            } />
            <Route path="/admin" element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminDashboard />
              </Suspense>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster position="top-center" />
          <Analytics measurementId={import.meta.env.VITE_GA_MEASUREMENT_ID} />
        </BrowserRouter>
      </AdminAuthProvider>
    </AuthProvider>
  </StrictMode >,
)
