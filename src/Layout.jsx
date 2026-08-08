import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Home, PlusCircle, BarChart3, Trophy, Upload, ArrowLeftRight } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const isScoring = currentPageName === 'LiveScoring' || currentPageName === 'ImportMatch';

  if (isScoring) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
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
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('Home')} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">TUCricket</h1>
                <p className="text-[10px] text-slate-400 -mt-0.5">Pro Scoring Engine</p>
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
                to={createPageUrl('PlayerComparison')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentPageName === 'PlayerComparison' ?
                'bg-emerald-500/20 text-emerald-400' :
                'text-slate-400 hover:text-white hover:bg-slate-800'}`
                }>
                
                <ArrowLeftRight className="w-4 h-4 inline mr-2" />
                Compare
              </Link>
            </nav>
            
            <Link
              to={createPageUrl('MatchSetup')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-medium text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-105">
              
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">New Match</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 px-4 py-2 z-50">
        <div className="flex justify-around">
          <Link
            to={createPageUrl('Home')}
            className={`flex flex-col items-center py-2 px-4 rounded-lg ${
            currentPageName === 'Home' ? 'text-emerald-400' : 'text-slate-500'}`
            }>
            
            <Home className="w-5 h-5" />
            <span className="text-xs mt-1">Matches</span>
          </Link>
          <Link
            to={createPageUrl('Analytics')}
            className={`flex flex-col items-center py-2 px-4 rounded-lg ${
            currentPageName === 'Analytics' ? 'text-emerald-400' : 'text-slate-500'}`
            }>
            
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs mt-1">Analytics</span>
          </Link>
          <Link
            to={createPageUrl('PlayerComparison')}
            className={`flex flex-col items-center py-2 px-4 rounded-lg ${
            currentPageName === 'PlayerComparison' ? 'text-emerald-400' : 'text-slate-500'}`
            }>
            
            <ArrowLeftRight className="w-5 h-5" />
            <span className="text-xs mt-1">Compare</span>
          </Link>
        </div>
      </nav>
    </div>);

}