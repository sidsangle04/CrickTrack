import Analytics from './pages/Analytics';
import Home from './pages/Home';
import LiveScoring from './pages/LiveScoring';
import MatchSetup from './pages/MatchSetup';
import Scorecard from './pages/Scorecard';
import TeamManagement from './pages/TeamManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analytics": Analytics,
    "Home": Home,
    "LiveScoring": LiveScoring,
    "MatchSetup": MatchSetup,
    "Scorecard": Scorecard,
    "TeamManagement": TeamManagement,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};