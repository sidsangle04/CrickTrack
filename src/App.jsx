import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Players from './pages/Players';
import PlayerProfile from './pages/PlayerProfile';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import SplashVideo from '@/components/SplashVideo';
import Landing from './pages/Landing';
import Tournaments from '@/pages/Tournaments';
import Venues from '@/pages/Venues';
import ModeSelection from '@/pages/ModeSelection';
import Settings from './pages/Settings';
import About from './pages/About';
import Contact from './pages/Contact';
import WebViewBackHandler from '@/components/WebViewBackHandler';
import { GroundShapeProvider, useGroundShape } from '@/lib/GroundShapeContext';
import { ThemeProvider } from 'next-themes';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const { isReady } = useGroundShape();
  const { pathname } = useLocation();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Trust pages stay reachable before a scoring mode has been chosen
  const isTrustPage = pathname === '/' || pathname === '/About' || pathname === '/Contact';

  // Mode not yet chosen at launch — show the mode selection landing screen
  if (!isReady && !isTrustPage) {
    return <ModeSelection />;
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName="Landing">
          <Landing />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/Players" element={
        <LayoutWrapper currentPageName="Players">
          <Players />
        </LayoutWrapper>
      } />
      <Route path="/PlayerProfile" element={
        <LayoutWrapper currentPageName="PlayerProfile">
          <PlayerProfile />
        </LayoutWrapper>
      } />
      <Route path="/Tournaments" element={
        <LayoutWrapper currentPageName="Tournaments">
          <Tournaments />
        </LayoutWrapper>
      } />
      <Route path="/Venues" element={
        <LayoutWrapper currentPageName="Venues">
          <Venues />
        </LayoutWrapper>
      } />
      <Route path="/Settings" element={
        <LayoutWrapper currentPageName="Settings">
          <Settings />
        </LayoutWrapper>
      } />
      <Route path="/About" element={
        <LayoutWrapper currentPageName="About">
          <About />
        </LayoutWrapper>
      } />
      <Route path="/Contact" element={
        <LayoutWrapper currentPageName="Contact">
          <Contact />
        </LayoutWrapper>
      } />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <SplashVideo />
            <NavigationTracker />
            <WebViewBackHandler />
            <GroundShapeProvider>
              <AuthenticatedApp />
            </GroundShapeProvider>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App