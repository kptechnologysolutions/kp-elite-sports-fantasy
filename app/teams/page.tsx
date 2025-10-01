'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModernNav } from '@/components/layout/ModernNav';
import { MultiTeamOverview } from '@/components/teams/MultiTeamSwitcher';
import useSleeperStore from '@/lib/store/useSleeperStore';

export default function MultiTeamDashboard() {
  const router = useRouter();
  const { user, leagues } = useSleeperStore();
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);
  
  if (!user) return null;
  
  return (
    <div className="min-h-screen bg-background">
      <ModernNav />
      
      <main className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Team Management Center</h1>
          <p className="text-muted-foreground">
            Manage all your fantasy teams in one place
          </p>
        </div>
        
        {leagues.length > 1 ? (
          <MultiTeamOverview />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            You are only managing one team. Join more leagues to use the multi-team features.
          </div>
        )}
      </main>
    </div>
  );
}