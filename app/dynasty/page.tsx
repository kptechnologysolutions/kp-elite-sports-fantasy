'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModernNav } from '@/components/layout/ModernNav';
import { DynastyDashboard } from '@/components/dynasty/DynastyDashboard';
import { MultiTeamSwitcher } from '@/components/teams/MultiTeamSwitcher';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import useSleeperStore from '@/lib/store/useSleeperStore';

export default function DynastyPage() {
  const router = useRouter();
  const {
    user,
    leagues,
    currentLeague,
    error
  } = useSleeperStore();
  
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
      
      {/* Multi-Team Switcher */}
      {leagues.length > 0 && (
        <div className="container mx-auto p-4">
          <div className="max-w-md">
            <MultiTeamSwitcher />
          </div>
        </div>
      )}
      
      {error && (
        <div className="container mx-auto px-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
      
      {!currentLeague && leagues.length > 1 && (
        <div className="container mx-auto p-4">
          <Alert>
            <AlertDescription>
              Please select a league from above to view dynasty analysis
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {currentLeague && (
        <main className="container mx-auto p-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Dynasty League Analysis</h1>
            <p className="text-muted-foreground">
              Long-term team building and player valuation for {currentLeague.name}
            </p>
          </div>
          
          <DynastyDashboard />
        </main>
      )}
    </div>
  );
}