'use client';
import { useEffect, useState } from 'react';
import { computeExposure } from '@/lib/analytics';
import { ModernNav } from '@/components/layout/ModernNav';
import { PageHeader, ModernCard, DashboardGrid, DashboardSkeleton } from '@/components/ui/modern';
import { BarChart3, Users, Trophy, TrendingUp } from 'lucide-react';

type Roster = {
  leagueKey: string; teamKey: string; week: number;
  players: { pid: string; name: string; pos: string; nfl: string }[];
};

export default function Portfolio() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/rosters', { cache: 'no-store' });
        const json = await res.json();
        
        if (!json.ok) {
          throw new Error(json.error || 'Failed to fetch rosters');
        }
        
        const rosters: Roster[] = json.rosters || [];
        
        if (rosters.length === 0) {
          // Show mock data if no real data exists
          const mock: Roster[] = [
            { leagueKey: 'yahoo:123', teamKey: 'teamA', week: 1, players: [
              { pid: 'Aiyuk', name: 'Brandon Aiyuk', pos: 'WR', nfl: 'SF' },
              { pid: 'CMC', name: 'Christian McCaffrey', pos: 'RB', nfl: 'SF' }
            ]},
            { leagueKey: 'espn:999', teamKey: 'teamZ', week: 1, players: [
              { pid: 'CMC', name: 'Christian McCaffrey', pos: 'RB', nfl: 'SF' },
              { pid: 'Kelce', name: 'Travis Kelce', pos: 'TE', nfl: 'KC' }
            ]}
          ];
          setRows(computeExposure(mock));
        } else {
          setRows(computeExposure(rosters));
        }
      } catch (err: any) {
        setError(err.message);
        // Fallback to mock data on error
        const mock: Roster[] = [
          { leagueKey: 'demo:123', teamKey: 'teamA', week: 1, players: [
            { pid: 'Aiyuk', name: 'Brandon Aiyuk', pos: 'WR', nfl: 'SF' },
            { pid: 'CMC', name: 'Christian McCaffrey', pos: 'RB', nfl: 'SF' }
          ]},
          { leagueKey: 'demo:999', teamKey: 'teamZ', week: 1, players: [
            { pid: 'CMC', name: 'Christian McCaffrey', pos: 'RB', nfl: 'SF' },
            { pid: 'Kelce', name: 'Travis Kelce', pos: 'TE', nfl: 'KC' }
          ]}
        ];
        setRows(computeExposure(mock));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <ModernNav />
        <main className="container mx-auto p-6">
          <PageHeader 
            title="Cross-League Portfolio"
            subtitle="Loading exposure data..."
            icon={<BarChart3 className="h-6 w-6" />}
          />
          <DashboardSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ModernNav />
      <main className="container mx-auto p-6">
        <PageHeader 
          title="Cross-League Portfolio"
          subtitle="Analyze your player exposure across all fantasy leagues"
          icon={<BarChart3 className="h-6 w-6" />}
        />
        
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              ⚠️ Using demo data: {error}
            </p>
          </div>
        )}
        
        <ModernCard 
          title="Player Exposure Analysis"
          description="See which players you're most exposed to across leagues"
          icon={<Users className="h-5 w-5" />}
          interactive
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm table-modern">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Player</th>
                    <th className="px-4 py-3 text-left font-medium">Pos</th>
                    <th className="px-4 py-3 text-left font-medium">Team</th>
                    <th className="px-4 py-3 text-left font-medium">Exposure</th>
                    <th className="px-4 py-3 text-left font-medium">Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.pid} className="border-t transition-colors hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                          {r.pos}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{r.nfl}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${r.exposure * 100}%` }}
                            />
                          </div>
                          <span className="font-medium text-sm min-w-[3rem]">
                            {(r.exposure * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          r.exposure > 0.5 ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
                          r.exposure > 0.3 ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' :
                          'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        }`}>
                          {r.exposure > 0.5 ? 'High Risk' : r.exposure > 0.3 ? 'Medium' : 'Low Risk'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ModernCard>
        
        <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>💡 Portfolio Tip:</strong> High exposure ({'>'}50%) means significant risk if the player underperforms. 
            Consider diversifying across different players and positions for optimal risk management.
          </p>
        </div>
      </main>
    </div>
  );
}