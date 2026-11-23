import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Check, Shuffle, CalendarPlus, Users, Gavel, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generateTournamentFixtures } from '@/lib/bracket';
import KnockoutPairingPicker from '@/components/tournament/KnockoutPairingPicker';
import { useGroundShape } from '@/lib/GroundShapeContext';

const shuffleArray = (a) => [...a].sort(() => Math.random() - 0.5);
const TEAM_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function CreateTournamentModal({ teams, onClose, onCreated }) {
  const queryClient = useQueryClient();
  const { mode } = useGroundShape();
  const [creationMode, setCreationMode] = useState('direct');
  const [name, setName] = useState('');
  const [format, setFormat] = useState('knockout');
  const [knockoutTeams, setKnockoutTeams] = useState(4);
  const [pairing, setPairing] = useState('standard');
  const [autoFixtures, setAutoFixtures] = useState(true);
  const [shuffle, setShuffle] = useState(false);
  const [selected, setSelected] = useState([]);
  // Auction mode: the teams are created here, with no players yet.
  const [teamNames, setTeamNames] = useState(['', '']);
  const [saving, setSaving] = useState(false);

  const isAuction = creationMode === 'auction';
  const filledNames = teamNames.map((n) => n.trim()).filter(Boolean);

  const toggle = (id) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    setSelected(next);
    if ((format === 'league_playoffs' || format === 'league_qualifiers') && next.length !== 4) {
      setFormat('knockout');
    }
  };

  const setTeamName = (i, value) =>
    setTeamNames((list) => list.map((n, idx) => (idx === i ? value : n)));
  const addTeamRow = () => setTeamNames((list) => [...list, '']);
  const removeTeamRow = (i) => setTeamNames((list) => list.filter((_, idx) => idx !== i));

  const teamCount = isAuction ? filledNames.length : selected.length;

  const isLeagueKO = format === 'league_knockout';
  const isPlayoffs = format === 'league_playoffs';
  const isQualifiers = format === 'league_qualifiers';
  const isKnockout = format === 'knockout';
  // Both four-team playoff formats need exactly four teams.
  const needsFour = isPlayoffs || isQualifiers;
  // Only offer knockout sizes the selected teams can actually fill.
  const koOptions = [2, 4, 8].filter((k) => k <= Math.max(2, teamCount));
  const effectiveKO = koOptions.includes(knockoutTeams)
    ? knockoutTeams
    : koOptions[koOptions.length - 1];
  const canCreate = name.trim() && teamCount >= 2 && (!needsFour || teamCount === 4);

  const createAuctionTournament = async () => {
    const tour = await base44.entities.Tournament.create({
      name: name.trim(),
      team_ids: [],
      num_teams: filledNames.length,
      format,
      knockout_teams: isLeagueKO ? effectiveKO : 4,
      knockout_pairing: pairing,
      ground_mode: mode,
      status: 'setup',
      creation_mode: 'auction'
    });

    // Teams for this tournament only — squads are filled by the auction.
    const createdTeams = await base44.entities.Team.bulkCreate(
      filledNames.map((teamName, i) => ({
        name: teamName,
        short_name: teamName.slice(0, 3).toUpperCase(),
        primary_color: TEAM_COLORS[i % TEAM_COLORS.length],
        ground_mode: mode,
        tournament_id: tour.id
      }))
    );

    await base44.entities.Tournament.update(tour.id, {
      team_ids: createdTeams.map((t) => t.id)
    });

    await base44.entities.AuctionTeam.bulkCreate(
      createdTeams.map((t, i) => ({
        tournament_id: tour.id,
        team_id: t.id,
        name: t.name,
        color: t.primary_color,
        order_index: i
      }))
    );

    queryClient.invalidateQueries(['tournaments']);
    queryClient.invalidateQueries(['teams', mode]);
    onCreated(tour.id, 'auction');
  };

  const handleCreate = async () => {
    if (!canCreate || saving) return;
    setSaving(true);
    try {
      if (isAuction) {
        await createAuctionTournament();
        return;
      }

      const ordered = shuffle ? shuffleArray(selected) : selected;
      const tour = await base44.entities.Tournament.create({
        name: name.trim(),
        team_ids: ordered,
        num_teams: ordered.length,
        format,
        knockout_teams: isLeagueKO ? effectiveKO : 4,
        knockout_pairing: pairing,
        ground_mode: mode,
        status: autoFixtures ? 'in_progress' : 'setup',
        creation_mode: 'direct'
      });

      if (autoFixtures) {
        const matches = generateTournamentFixtures(tour);
        if (matches.length) await base44.entities.TournamentMatch.bulkCreate(matches);
      }
      queryClient.invalidateQueries(['tournaments']);
      onCreated(tour.id, 'direct');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">New Tournament</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* How the squads are built */}
          <div>
            <Label className="text-slate-200">How are the teams and players set up?</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <button
                onClick={() => setCreationMode('direct')}
                className={`p-3 rounded-lg text-left border transition-colors ${
                  !isAuction
                    ? 'bg-emerald-500/20 border-emerald-500/50'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                  <Users className="w-3.5 h-3.5" /> Existing teams
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Pick from Teams — players already added
                </div>
              </button>
              <button
                onClick={() => setCreationMode('auction')}
                className={`p-3 rounded-lg text-left border transition-colors ${
                  isAuction
                    ? 'bg-purple-500/20 border-purple-500/50'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                  <Gavel className="w-3.5 h-3.5" /> Auction
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Create teams now, pick players at auction
                </div>
              </button>
            </div>
          </div>

          <div>
            <Label className="text-slate-200">Tournament Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sunday Knockout Cup"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {/* Format */}
          <div>
            <Label className="text-slate-200">Format</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFormat('knockout')}
                className={`p-3 rounded-lg text-left border transition-colors ${
                  format === 'knockout'
                    ? 'bg-emerald-500/20 border-emerald-500/50'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="text-sm font-medium text-white">Knockout</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Straight bracket draw</div>
              </button>
              <button
                onClick={() => setFormat('league_knockout')}
                className={`p-3 rounded-lg text-left border transition-colors ${
                  format === 'league_knockout'
                    ? 'bg-emerald-500/20 border-emerald-500/50'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="text-sm font-medium text-white">League + Knockout</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Round-robin then semis</div>
              </button>
              <button
                onClick={() => setFormat('league_playoffs')}
                disabled={teamCount !== 4}
                className={`p-3 rounded-lg text-left border transition-colors ${
                  format === 'league_playoffs'
                    ? 'bg-emerald-500/20 border-emerald-500/50'
                    : teamCount !== 4
                    ? 'bg-slate-800/60 border-slate-800 cursor-not-allowed'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div
                  className={`text-sm font-medium ${
                    teamCount !== 4 && format !== 'league_playoffs'
                      ? 'text-slate-500'
                      : 'text-white'
                  }`}
                >
                  League + Playoffs
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {teamCount !== 4 ? 'Exactly 4 teams' : 'Topper straight to final'}
                </div>
              </button>
              <button
                onClick={() => setFormat('league_qualifiers')}
                disabled={teamCount !== 4}
                className={`p-3 rounded-lg text-left border transition-colors ${
                  format === 'league_qualifiers'
                    ? 'bg-emerald-500/20 border-emerald-500/50'
                    : teamCount !== 4
                    ? 'bg-slate-800/60 border-slate-800 cursor-not-allowed'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div
                  className={`text-sm font-medium ${
                    teamCount !== 4 && format !== 'league_qualifiers'
                      ? 'text-slate-500'
                      : 'text-white'
                  }`}
                >
                  League + Qualifiers
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {teamCount !== 4 ? 'Exactly 4 teams' : 'Q1, Eliminator, Q2, Final'}
                </div>
              </button>
            </div>
          </div>

          {isLeagueKO && (
            <div>
              <Label className="text-slate-200">Teams qualifying for knockout</Label>
              <div className="flex gap-2">
                {koOptions.map((k) => (
                  <button
                    key={k}
                    onClick={() => setKnockoutTeams(k)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      effectiveKO === k
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    Top {k}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(isKnockout || isLeagueKO) && (
            <KnockoutPairingPicker
              value={pairing}
              onChange={setPairing}
              teamCount={isLeagueKO ? effectiveKO : Math.max(2, teamCount)}
            />
          )}

          {!isAuction && (
            <>
              {/* Shuffle draw */}
              <button
                onClick={() => setShuffle((s) => !s)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  shuffle
                    ? 'bg-emerald-500/10 border-emerald-500/40'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center border-slate-600">
                  {shuffle && <Check className="w-3 h-3 text-emerald-400" />}
                </div>
                <Shuffle className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-white">Shuffle teams in the draw</span>
              </button>

              {/* Fixtures can be created now or later from the tournament page */}
              <button
                onClick={() => setAutoFixtures((a) => !a)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  autoFixtures
                    ? 'bg-emerald-500/10 border-emerald-500/40'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center border-slate-600">
                  {autoFixtures && <Check className="w-3 h-3 text-emerald-400" />}
                </div>
                <CalendarPlus className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-white">Create fixtures automatically</span>
              </button>
            </>
          )}

          {isAuction ? (
            <div>
              <Label className="text-slate-200">
                Teams ({filledNames.length} added)
              </Label>
              <p className="text-[11px] text-slate-500 mb-2">
                Just the names for now — each squad is filled at the auction. These teams belong to
                this tournament only.
              </p>
              <div className="space-y-2">
                {teamNames.map((teamName, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: TEAM_COLORS[i % TEAM_COLORS.length] }}
                    />
                    <Input
                      value={teamName}
                      onChange={(e) => setTeamName(i, e.target.value)}
                      placeholder={`Team ${i + 1}`}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                    {teamNames.length > 2 && (
                      <button
                        onClick={() => removeTeamRow(i)}
                        className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10"
                        title="Remove team"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addTeamRow}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
              >
                <Plus className="w-3.5 h-3.5" /> Add another team
              </button>
            </div>
          ) : (
            <div>
              <Label className="text-slate-200">
                Select Teams ({selected.length} selected)
              </Label>
              {teams.length === 0 ? (
                <p className="text-sm text-slate-400">No teams found. Create teams first.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {teams.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => toggle(t.id)}
                      className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                        selected.includes(t.id)
                          ? 'bg-emerald-500/20 border border-emerald-500/50'
                          : 'bg-slate-800 border border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center border-slate-600">
                        {selected.includes(t.id) && <Check className="w-3 h-3 text-emerald-400" />}
                      </div>
                      <span className="text-sm font-medium text-white">{t.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-slate-500">
            {isAuction
              ? 'Create the tournament, then run its auction: every player you sell joins that team, and the squads are saved as this tournament\u2019s players. Fixtures can be created once the auction is done.'
              : isPlayoffs
              ? 'Each team plays every other team once. The table topper goes straight to the Final, 2nd plays 3rd in the Semifinal, and the last team is eliminated.'
              : isQualifiers
              ? 'Each team plays every other team once. 1st vs 2nd in Qualifier 1 — the winner goes straight to the Final, the loser gets a second chance in Qualifier 2. 3rd vs 4th in the Eliminator — the winner meets the Qualifier 1 loser in Qualifier 2, the loser is out. The Final is Qualifier 1 winner vs Qualifier 2 winner.'
              : isLeagueKO
              ? 'Each team plays every other team once. The top teams then advance to a seeded knockout bracket.'
              : 'A single-elimination bracket is generated automatically. Teams get byes if the count isn\u2019t a power of 2.'}
            {!isAuction && !autoFixtures &&
              ' You can create the fixture list from the tournament page whenever you are ready.'}
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!canCreate || saving}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isAuction ? 'Create & open auction' : 'Create Tournament'}
          </Button>
        </div>
      </div>
    </div>
  );
}