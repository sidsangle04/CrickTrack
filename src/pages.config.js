import Home from './pages/Home';
import TeamManagement from './pages/TeamManagement';
import MatchSetup from './pages/MatchSetup';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "TeamManagement": TeamManagement,
    "MatchSetup": MatchSetup,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};