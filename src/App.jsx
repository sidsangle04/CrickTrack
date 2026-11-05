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
import DemoMatches from '@/pages/demo/DemoMatches';
import DemoAnalytics from '@/pages/demo/DemoAnalytics';
import DemoPlayers from '@/pages/demo/DemoPlayers';
import DemoPlayerProfile from '@/pages/demo/DemoPlayerProfile';
import DemoTournaments from '@/pages/demo/DemoTournaments';
import DemoVenues from '@/pages/demo/DemoVenues';
import DemoImport from '@/pages/demo/DemoImport';
import ModeSelection from '@/pages/ModeSelection';
import Settings from './pages/Settings';
import Dashboard from './pages/Dashboard';
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

// Pages any visitor can open without an account.
const PUBLIC_PATHS = ['/', '/About', '/Contact', '/about', '/contact'];

// Sections a signed-out visitor can explore with clearly labelled sample data.
const DEMO_PATHS = [
  '/Home',
  '/Analytics',
  '/Players',
  '/PlayerProfile',
  '/Tournaments',
  '/Venues',
  '/ImportMatch',
];

// Sections that read or write the account's own data — these always need a login.
const PRIVATE_PATHS = [
  '/Dashboard',
  '/Settings',
  '/MatchSetup',
  '/LiveScoring',
  '/Scorecard',
  '/TeamManagement',
  '/PlayerComparison',
];

// Sample-data stand-ins used while nobody is signed in.
const DEMO_PAGES = {
  '/Home': DemoMatches,
  '/Analytics': DemoAnalytics,
  '/Players': DemoPlayers,
  '/PlayerProfile': DemoPlayerProfile,
  '/Tournaments': DemoTournaments,
  '/Venues': DemoVenues,
  '/ImportMatch': DemoImport,
};

// Pages that render without a scoring mode having been chosen.
const MODE_FREE_PATHS = [...PUBLIC_PATHS, '/Dashboard'];

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, isAuthenticated } = useAuth();
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

  // Public pages and the demo sections stay open to visitors.
  const isOpenPage = PUBLIC_PATHS.includes(pathname) || DEMO_PATHS.includes(pathname);

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required' && !isOpenPage) {
      navigateToLogin();
      return null;
    }
  }

  // Anything that reads or writes your own data needs an account.
  if (!isAuthenticated && PRIVATE_PATHS.includes(pathname)) {
    navigateToLogin();
    return null;
  }

  // Mode not yet chosen — the public pages and the dashboard stay reachable, and
  // a visitor browsing the demo sections is never asked to pick one.
  const modeFree =
    MODE_FREE_PATHS.includes(pathname) || (!isAuthenticated && DEMO_PATHS.includes(pathname));
  if (!isReady && !modeFree) {
    return <ModeSelection />;
  }

  // Signed-out visitors get the sample-data version of a section; everyone else
  // gets the real thing.
  const withLayout = (pageName, Page) => {
    const Demo = !isAuthenticated ? DEMO_PAGES[`/${pageName}`] : null;
    const Comp = Demo || Page;
    return (
      <LayoutWrapper currentPageName={pageName}>
        <Comp />
      </LayoutWrapper>
    );
  };

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName="Landing">
          <Landing />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route key={path} path={`/${path}`} element={withLayout(path, Page)} />
      ))}
      <Route path="/Players" element={withLayout('Players', Players)} />
      <Route path="/PlayerProfile" element={withLayout('PlayerProfile', PlayerProfile)} />
      <Route path="/Tournaments" element={withLayout('Tournaments', Tournaments)} />
      <Route path="/Venues" element={withLayout('Venues', Venues)} />
      <Route path="/Settings" element={withLayout('Settings', Settings)} />
      <Route path="/About" element={withLayout('About', About)} />
      <Route path="/Contact" element={withLayout('Contact', Contact)} />
      <Route path="/about" element={withLayout('About', About)} />
      <Route path="/contact" element={withLayout('Contact', Contact)} />
      <Route path="/Dashboard" element={withLayout('Dashboard', Dashboard)} />
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