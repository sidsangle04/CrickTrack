import { Users } from 'lucide-react';
import TeamSquadPicker from './TeamSquadPicker';
import PreMatchPredictionCard from '@/components/prediction/PreMatchPredictionCard';

export default function PlayingXIStep({
  team1Name,
  team2Name,
  team1Players,
  team2Players,
  team1XI,
  team2XI,
  squadLimit,
  auctionTournamentName,
  onToggle,
  onChange,
  prediction,
  predictionLoading,
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Users className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-semibold text-white">Select Playing XI</h2>
        {auctionTournamentName && (
          <span className="ml-auto text-[11px] px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/40">
            {auctionTournamentName} auction squads
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <TeamSquadPicker
          name={team1Name}
          players={team1Players}
          selected={team1XI}
          limit={squadLimit}
          onToggle={(id) => onToggle(1, id)}
          onChange={(ids) => onChange(1, ids)}
        />
        <TeamSquadPicker
          name={team2Name}
          players={team2Players}
          selected={team2XI}
          limit={squadLimit}
          onToggle={(id) => onToggle(2, id)}
          onChange={(ids) => onChange(2, ids)}
        />
      </div>

      <PreMatchPredictionCard
        prediction={prediction}
        team1Name={team1Name}
        team2Name={team2Name}
        loading={predictionLoading}
      />
    </div>
  );
}