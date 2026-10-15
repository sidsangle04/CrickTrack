import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  ChevronRight,
  ArrowLeft,
  UserPlus,
  Loader2,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useGroundShape } from '@/lib/GroundShapeContext';

export default function TeamManagement() {
  const queryClient = useQueryClient();
  const { mode } = useGroundShape();
  const modeLabel = mode === 'circular' ? 'Standard' : 'TURF';
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);

  const [teamForm, setTeamForm] = useState({
    name: '',
    short_name: '',
    home_ground: '',
    primary_color: '#D32F2F'
  });

  const [playerForm, setPlayerForm] = useState({
    name: '',
    jersey_number: '',
    role: 'batsman',
    batting_style: 'right_hand',
    bowling_style: 'none',
    is_captain: false,
    is_wicket_keeper: false
  });

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['teams', mode],
    queryFn: () => base44.entities.Team.list()
  });

  const modeTeams = teams.filter((t) => (t.ground_mode || 'turf') === mode);

  const { data: players = [], isLoading: playersLoading } = useQuery({
    queryKey: ['players', selectedTeam?.id],
    queryFn: () => selectedTeam 
      ? base44.entities.Player.filter({ team_id: selectedTeam.id })
      : [],
    enabled: !!selectedTeam
  });

  const createTeamMutation = useMutation({
    mutationFn: (data) => base44.entities.Team.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teams']);
      resetTeamForm();
    }
  });

  const updateTeamMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Team.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teams']);
      resetTeamForm();
    }
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (id) => base44.entities.Team.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['teams']);
      setSelectedTeam(null);
    }
  });

  const createPlayerMutation = useMutation({
    mutationFn: (data) => base44.entities.Player.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['players']);
      resetPlayerForm();
    }
  });

  const updatePlayerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Player.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['players']);
      resetPlayerForm();
    }
  });

  const deletePlayerMutation = useMutation({
    mutationFn: (id) => base44.entities.Player.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['players'])
  });

  const resetTeamForm = () => {
    setTeamForm({ name: '', short_name: '', home_ground: '', primary_color: '#D32F2F' });
    setEditingTeam(null);
    setShowTeamModal(false);
  };

  const resetPlayerForm = () => {
    setPlayerForm({
      name: '',
      jersey_number: '',
      role: 'batsman',
      batting_style: 'right_hand',
      bowling_style: 'none',
      is_captain: false,
      is_wicket_keeper: false
    });
    setEditingPlayer(null);
    setShowPlayerModal(false);
  };

  const handleTeamSubmit = () => {
    if (editingTeam) {
      updateTeamMutation.mutate({ id: editingTeam.id, data: { ...teamForm, ground_mode: mode } });
    } else {
      createTeamMutation.mutate({ ...teamForm, ground_mode: mode });
    }
  };

  const handlePlayerSubmit = () => {
    const data = {
      ...playerForm,
      team_id: selectedTeam.id,
      ground_mode: mode,
      jersey_number: playerForm.jersey_number ? parseInt(playerForm.jersey_number) : null
    };
    if (editingPlayer) {
      updatePlayerMutation.mutate({ id: editingPlayer.id, data });
    } else {
      createPlayerMutation.mutate(data);
    }
  };

  const openEditTeam = (team) => {
    setTeamForm({
      name: team.name,
      short_name: team.short_name,
      home_ground: team.home_ground || '',
      primary_color: team.primary_color || '#D32F2F'
    });
    setEditingTeam(team);
    setShowTeamModal(true);
  };

  const openEditPlayer = (player) => {
    setPlayerForm({
      name: player.name,
      jersey_number: player.jersey_number?.toString() || '',
      role: player.role,
      batting_style: player.batting_style || 'right_hand',
      bowling_style: player.bowling_style || 'none',
      is_captain: player.is_captain || false,
      is_wicket_keeper: player.is_wicket_keeper || false
    });
    setEditingPlayer(player);
    setShowPlayerModal(true);
  };

  if (selectedTeam) {
    return (
      <div className="pb-24 md:pb-6">
        <button 
          onClick={() => setSelectedTeam(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Teams
        </button>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold"
              style={{ backgroundColor: selectedTeam.primary_color || '#374151' }}
            >
              {selectedTeam.short_name}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{selectedTeam.name}</h1>
              <p className="text-slate-400 text-sm">{players.length} players</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowPlayerModal(true)}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Player
          </Button>
        </div>

        {playersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No players yet</h3>
            <p className="text-slate-400 text-sm mb-4">Add players to build your squad</p>
          </div>
        ) : (
          <div className="space-y-2">
            {players.map((player, idx) => (
              <div 
                key={player.id}
                className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-white">
                  {player.jersey_number || idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{player.name}</span>
                    {player.is_captain && (
                      <span className="px-1.5 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded">C</span>
                    )}
                    {player.is_wicket_keeper && (
                      <span className="px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">WK</span>
                    )}
                  </div>
                  <span className="text-sm text-slate-400 capitalize">{player.role?.replace('_', ' ')}</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => openEditPlayer(player)}
                    className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => deletePlayerMutation.mutate(player.id)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Player Modal */}
        <Dialog open={showPlayerModal} onOpenChange={resetPlayerForm}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>{editingPlayer ? 'Edit Player' : 'Add Player'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input 
                  value={playerForm.name}
                  onChange={(e) => setPlayerForm({...playerForm, name: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  placeholder="Player name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Jersey #</Label>
                  <Input 
                    type="number"
                    value={playerForm.jersey_number}
                    onChange={(e) => setPlayerForm({...playerForm, jersey_number: e.target.value})}
                    className="bg-slate-800 border-slate-700"
                    placeholder="99"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={playerForm.role} onValueChange={(v) => setPlayerForm({...playerForm, role: v})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="batsman">Batsman</SelectItem>
                      <SelectItem value="bowler">Bowler</SelectItem>
                      <SelectItem value="all_rounder">All-rounder</SelectItem>
                      <SelectItem value="wicket_keeper">Wicket Keeper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Batting Style</Label>
                  <Select value={playerForm.batting_style} onValueChange={(v) => setPlayerForm({...playerForm, batting_style: v})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="right_hand">Right Hand</SelectItem>
                      <SelectItem value="left_hand">Left Hand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Bowling Style</Label>
                  <Select value={playerForm.bowling_style} onValueChange={(v) => setPlayerForm({...playerForm, bowling_style: v})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="right_arm_fast">Right Arm Fast</SelectItem>
                      <SelectItem value="right_arm_medium">Right Arm Medium</SelectItem>
                      <SelectItem value="right_arm_off_spin">Right Arm Off Spin</SelectItem>
                      <SelectItem value="right_arm_leg_spin">Right Arm Leg Spin</SelectItem>
                      <SelectItem value="left_arm_fast">Left Arm Fast</SelectItem>
                      <SelectItem value="left_arm_medium">Left Arm Medium</SelectItem>
                      <SelectItem value="left_arm_orthodox">Left Arm Orthodox</SelectItem>
                      <SelectItem value="left_arm_chinaman">Left Arm Chinaman</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={playerForm.is_captain}
                    onChange={(e) => setPlayerForm({...playerForm, is_captain: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm">Captain</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={playerForm.is_wicket_keeper}
                    onChange={(e) => setPlayerForm({...playerForm, is_wicket_keeper: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm">Wicket Keeper</span>
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetPlayerForm} className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200">Cancel</Button>
              <Button onClick={handlePlayerSubmit} className="bg-emerald-500 hover:bg-emerald-600">
                {editingPlayer ? 'Update' : 'Add'} Player
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Teams</h1>
          <p className="text-slate-400 text-sm">Manage your club's teams and squads</p>
        </div>
        <Button 
          onClick={() => setShowTeamModal(true)}
          className="bg-emerald-500 hover:bg-emerald-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Team
        </Button>
      </div>

      {teamsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      ) : modeTeams.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No {modeLabel} teams yet</h3>
          <p className="text-slate-400 text-sm mb-4">Create your first {modeLabel} team to get started</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {modeTeams.map(team => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team)}
              className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 flex items-center gap-4 text-left transition-all w-full group"
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                style={{ backgroundColor: team.primary_color || '#374151' }}
              >
                {team.short_name}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">{team.name}</h3>
                {team.home_ground && (
                  <p className="text-sm text-slate-400">{team.home_ground}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); openEditTeam(team); }}
                  className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteTeamMutation.mutate(team.id); }}
                  className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-slate-300 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Team Modal */}
      <Dialog open={showTeamModal} onOpenChange={resetTeamForm}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>{editingTeam ? 'Edit Team' : 'Create Team'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Team Name</Label>
              <Input 
                value={teamForm.name}
                onChange={(e) => setTeamForm({...teamForm, name: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="e.g. Mumbai Indians"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Short Name (3-4 letters)</Label>
                <Input 
                  value={teamForm.short_name}
                  onChange={(e) => setTeamForm({...teamForm, short_name: e.target.value.toUpperCase().slice(0, 4)})}
                  className="bg-slate-800 border-slate-700"
                  placeholder="MI"
                  maxLength={4}
                />
              </div>
              <div>
                <Label>Team Color</Label>
                <Input 
                  type="color"
                  value={teamForm.primary_color}
                  onChange={(e) => setTeamForm({...teamForm, primary_color: e.target.value})}
                  className="bg-slate-800 border-slate-700 h-10"
                />
              </div>
            </div>
            <div>
              <Label>Home Ground</Label>
              <Input 
                value={teamForm.home_ground}
                onChange={(e) => setTeamForm({...teamForm, home_ground: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="e.g. Wankhede Stadium"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetTeamForm} className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200">Cancel</Button>
            <Button onClick={handleTeamSubmit} className="bg-emerald-500 hover:bg-emerald-600">
              {editingTeam ? 'Update' : 'Create'} Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}