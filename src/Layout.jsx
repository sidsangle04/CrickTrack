import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Home, PlusCircle, BarChart3, Trophy, Upload, ArrowLeftRight, RefreshCw, Users, MapPin, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGroundShape } from '@/lib/GroundShapeContext';
import MobileTabBar from '@/components/MobileTabBar';
import TrustFooter from '@/components/TrustFooter';
import { useTabStack } from '@/hooks/useTabStack';

export default function Layout({ children, currentPageName }) {
  const isScoring = currentPageName === 'LiveScoring' || currentPageName === 'ImportMatch';
  const { mode, clearMode } = useGroundShape();
  const isCircular = mode === 'circular';
  const { activeTab, switchTab } = useTabStack();

  const handleChangeMode = () => {
    clearMode();
    // navigate to the landing page so the mode selection screen mounts
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  };

  if (isScoring) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {children}
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <style>{`
        :root {
          --primary: #10b981;
          --primary-dark: #059669;
          --accent: #f59e0b;
          --bg-dark: #0f172a;
          --bg-card: #1e293b;
        }
      `}</style>
      
      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('Home')} className="flex items-center gap-3">
              <img
                src="https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/c49e9414c_CrickTrackLogo.png"
                alt="CrickTrack"
                className="h-10 w-auto rounded-lg shadow-lg shrink-0 bg-white p-1" />
              
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-white tracking-tight">CrickTrack</h1>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                    isCircular
                      ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                  }`}>
                    {isCircular ? 'Standard' : 'TURF'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 -mt-0.5">Tag | Analyse | Elevate </p>
              </div>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to={createPageUrl('Home')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentPageName === 'Home' ?
                'bg-emerald-500/20 text-emerald-400' :
                'text-slate-400 hover:text-white hover:bg-slate-800'}`
                }>
                
                <Home className="w-4 h-4 inline mr-2" />
                Matches
              </Link>
              <Link
                to={createPageUrl('Analytics')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentPageName === 'Analytics' ?
                'bg-emerald-500/20 text-emerald-400' :
                'text-slate-400 hover:text-white hover:bg-slate-800'}`
                }>
                
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Analytics
              </Link>
              <Link
                to={createPageUrl('Players')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentPageName === 'Players' ?
                'bg-emerald-500/20 text-emerald-400' :
                'text-slate-400 hover:text-white hover:bg-slate-800'}`
                }>
                <Users className="w-4 h-4 inline mr-2" />
                Players
              </Link>
              <Link
                to={createPageUrl('PlayerComparison')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentPageName === 'PlayerComparison' ?
                'bg-emerald-500/20 text-emerald-400' :
                'text-slate-400 hover:text-white hover:bg-slate-800'}`
                }>
                
                <ArrowLeftRight className="w-4 h-4 inline mr-2" />
                Compare
              </Link>
              <Link
                to={createPageUrl('Tournaments')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentPageName === 'Tournaments' ?
                'bg-emerald-500/20 text-emerald-400' :
                'text-slate-400 hover:text-white hover:bg-slate-800'}`
                }>
                <Trophy className="w-4 h-4 inline mr-2" />
                Tournaments
              </Link>
              <Link
                to={createPageUrl('Venues')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentPageName === 'Venues' ?
                'bg-emerald-500/20 text-emerald-400' :
                'text-slate-400 hover:text-white hover:bg-slate-800'}`
                }>
                <MapPin className="w-4 h-4 inline mr-2" />
                Venues
              </Link>
            </nav>
            
            <div className="flex items-center gap-2">
              <Link
                to="/Settings"
                className={`p-2 rounded-lg shrink-0 transition-all ${
                  currentPageName === 'Settings'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                title="Settings">
                <SettingsIcon className="w-4 h-4" />
              </Link>
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
                  isCircular
                    ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                }`}
                title={`Active mode: ${isCircular ? 'Standard' : 'TURF'}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {isCircular ? 'Standard' : 'TURF'}
              </div>
              <button
                onClick={handleChangeMode}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-medium text-xs hover:text-white hover:bg-slate-700 transition-all"
                title="Switch mode (TURF / Standard)"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Change</span>
              </button>
              <Link
                to={createPageUrl('MatchSetup')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-medium text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-105">
                
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">New Match</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPageName}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}>
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <TrustFooter />

      {/* Mobile Nav — tabs keep their own route and scroll position */}
      <MobileTabBar activeTab={activeTab} onSelectTab={switchTab} />

            </div>);
            }