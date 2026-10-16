import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useGroundShape } from '@/lib/GroundShapeContext';
import ProfileCard from '@/components/dashboard/ProfileCard';
import ModeCard from '@/components/dashboard/ModeCard';
import DashboardStats from '@/components/dashboard/DashboardStats';
import QuickActions from '@/components/dashboard/QuickActions';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { mode } = useGroundShape();

  const modeLabel = mode === 'circular' ? 'Standard' : mode === 'turf' ? 'TURF' : null;
  const firstName = user?.full_name?.split(' ').filter(Boolean)[0];

  return (
    <div className="pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          {firstName ? `Welcome back, ${firstName}` : 'Your dashboard'}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Your CrickTrack profile and a shortcut into everything you score.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-1">
          <ProfileCard user={user} onLogout={() => logout()} />
          <ModeCard modeLabel={modeLabel} />
        </div>
        <div className="space-y-5 lg:col-span-2">
          <DashboardStats />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}