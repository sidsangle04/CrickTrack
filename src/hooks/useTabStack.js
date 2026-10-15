import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const TAB_ROOTS = {
  matches: '/Home',
  analytics: '/Analytics',
  players: '/Players',
  compare: '/PlayerComparison',
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
  '/PlayerComparison': 'compare',
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
    if (tab && tab !== currentTab) {
      currentTab = tab;
      setActiveTab(tab);
    }
    stackFor(currentTab).path = location.pathname + location.search;

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
      if (key === currentTab) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      stackFor(currentTab).scroll = window.scrollY;
      const target = stackFor(key);
      pendingScroll.current = target.scroll || 0;
      currentTab = key;
      setActiveTab(key);
      navigate(target.path || TAB_ROOTS[key]);
    },
    [navigate]
  );

  return { activeTab, switchTab };
}