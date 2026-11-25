import React from 'react';
import TeamBidCard from './TeamBidCard';
import { bidProblem, teamFinance } from '@/lib/auction/squad';

// Why a team cannot bid right now ('' when it can).
function blockedReason({ paused, hasPlayer, actingTeamId, teamId, busy, bidderTeamId, amount, finance }) {
  if (paused) return 'Paused';
  if (!hasPlayer) return 'No player';
  if (actingTeamId && actingTeamId !== teamId) return 'Not bidding';
  if (busy) return 'Saving…';
  if (bidderTeamId === teamId) return 'Highest bid';
  return bidProblem({ amount, finance });
}

// Every team's bid controls — a column beside the auctioneer, or one row on the big screen.
export default function TeamBidList({
  teams,
  players,
  settings,
  nextAmount,
  bidderTeamId,
  actingTeamId = '',
  paused = false,
  hasPlayer = true,
  busy = false,
  layout = 'column',
  onBid,
  onJump
}) {
  const card = (team) => {
    const finance = teamFinance({ teamId: team.id, players, settings });
    return (
      <TeamBidCard
        key={team.id}
        team={team}
        finance={finance}
        nextAmount={nextAmount}
        isHighest={bidderTeamId === team.id}
        blocked={blockedReason({
          paused,
          hasPlayer,
          actingTeamId,
          teamId: team.id,
          busy,
          bidderTeamId,
          amount: nextAmount,
          finance
        })}
        onBid={onBid}
        onJump={onJump}
      />
    );
  };

  if (layout === 'row') {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {teams.map((team) => (
          <div key={team.id} className="min-w-[180px] flex-1">
            {card(team)}
          </div>
        ))}
      </div>
    );
  }

  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">{teams.map(card)}</div>;
}