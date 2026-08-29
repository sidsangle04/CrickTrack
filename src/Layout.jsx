import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Home, PlusCircle, BarChart3, Trophy, Upload, ArrowLeftRight, UserPlus, Circle, Square } from 'lucide-react';
import InviteUserModal from '@/components/InviteUserModal';
import { useGroundShape } from '@/lib/GroundShapeContext';

export default function Layout({ children, currentPageName }) {
  const isScoring = currentPageName === 'LiveScoring' || currentPageName === 'ImportMatch';
  const [showInvite, setShowInvite] = useState(false);
  const { groundShape, setGroundShape } = useGroundShape();
  const isCircular = groundShape === 'circular';

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
              <img
                src="https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/61a392177_Samplelogoturfcricket.png"
                alt="TURF Cricket"
                className="h-10 w-auto rounded-lg shadow-lg shrink-0" />
              
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-white tracking-tight">TURF Cricket</h1>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                    isCircular
                      ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                  }`}>
                    {isCircular ? 'Circular' : 'TURF'}
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
            </nav>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700" title="Ground shape (applies to all matches)">
                <button
                  onClick={() => setGroundShape('rectangular')}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                    !isCircular ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Square className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">TURF</span>
                </button>
                <button
                  onClick={() => setGroundShape('circular')}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isCircular ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Circle className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Circular</span>
                </button>
              </div>
              <button
                onClick={() => setShowInvite(true)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium text-sm hover:text-white hover:bg-slate-700 transition-all"
                title="Invite a person to join TURF Cricket"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Invite</span>
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
          <Link
            to={createPageUrl('Tournaments')}
            className={`flex flex-col items-center py-2 px-4 rounded-lg ${
            currentPageName === 'Tournaments' ? 'text-emerald-400' : 'text-slate-500'}`
            }>
            <Trophy className="w-5 h-5" />
            <span className="text-xs mt-1">Cup</span>
            </Link>
            </div>
            </nav>

            <InviteUserModal open={showInvite} onOpenChange={setShowInvite} />
            </div>);
            }