import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const TAB_ROOTS = {
  matches: '/Home',
  analytics: '/Analytics',
  players: '/Players',
  cup: '/Tournaments',
  import: '/ImportMatch'
};

// Which tab a page belongs to. Pages that are not listed (LiveScoring, Scorecard,
// MatchSetup, Settings, ...) stay inside the tab the user is already on, so a
// scoring session started from a tab is remembered as part of that tab's stack.
const PATH_TABS = {
  '/Home': 'matches',
  '/Analytics': 'analytics',
  '/Players': 'players',
  '/PlayerProfile': 'players',
  '/PlayerComparison': 'players',
  '/Tournaments': 'cup',
  '/ImportMatch': 'import'
};

// Module scope: every tab keeps its own deepest route and scroll offset for the
// whole session, so switching tabs and coming back lands exactly where you were.
const tabState = {};
let currentTab = 'matches';

function stackFor(key) {
  if (!tabState[key]) {
    tabState[key] = { path: TAB_ROOTS[key] || '/Home', scroll: 0 };
  }
  return tabState[key];
}

export function useTabStack() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(currentTab);
  const pendingScroll = useRef(null);

  useEffect(() => {
    const tab = PATH_TABS[location.pathname];
    if (tab) {
      if (tab !== currentTab) {
        currentTab = tab;
        setActiveTab(tab);
      }
      // Only a page that belongs to a tab becomes that tab's remembered route,
      // so tapping a tab from anywhere (Settings, a live match, ...) lands on
      // the tab itself. Screens outside the tabs are never remembered.
      stackFor(tab).path = location.pathname + location.search;
    }

    if (pendingScroll.current !== null) {
      const y = pendingScroll.current;
      pendingScroll.current = null;
      const restore = () => window.scrollTo(0, y);
      const raf = requestAnimationFrame(restore);
      const timer = setTimeout(restore, 150);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }
  }, [location.key, location.pathname, location.search]);

  const switchTab = useCallback(
    (key) => {
      const target = stackFor(key);
      const targetPath = target.path || TAB_ROOTS[key];

      // Already on this tab's page: a second tap just returns to the top.
      if (location.pathname + location.search === targetPath) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Only remember a scroll offset for the tab that owns the current page.
      if (PATH_TABS[location.pathname] === currentTab) {
        stackFor(currentTab).scroll = window.scrollY;
      }

      pendingScroll.current = target.scroll || 0;
      currentTab = key;
      setActiveTab(key);
      navigate(targetPath);
    },
    [navigate, location.pathname, location.search]
  );

  return { activeTab, switchTab };
}