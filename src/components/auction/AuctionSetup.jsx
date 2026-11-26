import React from 'react';
import { CalendarPlus, PlayCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SettingsPanel from './setup/SettingsPanel';
import TeamsPanel from './setup/TeamsPanel';
import PlayersPanel from './setup/PlayersPanel';
import { iconCountFor } from '@/lib/auction/draw';

export default function AuctionSetup({ auction, teams, players, tournament, refresh, onStart }) {
  const canStart = teams.length >= 2;
  const icons = iconCountFor(auction);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-slate-800/50 border border-slate-700/60 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-base font-semibold text-white mb-1">Set up the auction</h2>
            <p className="text-sm text-slate-400">
              {teams.length} team{teams.length === 1 ? '' : 's'} · {players.length} player
              {players.length === 1 ? '' : 's'} registered · squad size{' '}
              {auction.required_squad_size || 8} · purse {auction.purse || 2000}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {icons
                ? `${icons} icon player${icons === 1 ? '' : 's'} per team, drawn before the bidding.`
                : 'No icon players — every player goes under the hammer.'}
            </p>
            {!canStart && (
              <p className="text-xs text-amber-400 mt-1">
                Add at least two teams before starting.
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {icons > 0 && (
              <Button
                onClick={() => onStart('draft')}
                disabled={!canStart}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" /> Icon draft · {icons} per team
              </Button>
            )}
            <Button
              onClick={() => onStart('auction')}
              disabled={!canStart}
              variant={icons > 0 ? 'outline' : 'default'}
              className={
                icons > 0
                  ? 'border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              {icons > 0 ? 'Skip to auction' : 'Start the auction'}
            </Button>
          </div>
        </div>
      </div>

      <SettingsPanel auction={auction} refresh={refresh} />
      <TeamsPanel
        auction={auction}
        teams={teams}
        players={players}
        tournament={tournament}
        refresh={refresh}
      />
      <PlayersPanel
        auction={auction}
        players={players}
        teams={teams}
        tournament={tournament}
        refresh={refresh}
      />

      <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
        <CalendarPlus className="w-3.5 h-3.5" />
        Every team needs {auction.required_squad_size || 8} players in total.{' '}
        {icons
          ? 'Icon players are free but still fill a squad slot.'
          : 'There are no icon players, so every squad slot is bid for.'}
      </p>
    </div>
  );
}