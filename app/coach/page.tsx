'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { ModernNav } from '@/components/layout/ModernNav';
import { PageHeader, ModernCard, DashboardGrid, StatCard, StatGrid } from '@/components/ui/modern';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Target, TrendingUp, AlertTriangle, CheckCircle2, BarChart3, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import useSleeperStore from '@/lib/store/useSleeperStore';
import type { RiskMode } from '@/lib/types';

type Player = {
  pid: string; name: string; pos: string; nfl: string;
  proj: number;   // mean projection
  vol: number;    // standard deviation for volatility
  opp?: string;   // opponent (optional)
  startable?: boolean;
};

type Advice = {
  start: Player[]; bench: Player[];
  changes: { in: Player; out: Player; reason: string }[];
  mode: RiskMode;
};

// Simple slot order; adapt to your league config
const SLOT_ORDER = ['QB','RB','RB','WR','WR','TE','FLEX','FLEX'];

export default function CoachPage() {
  const { isAuthenticated } = useRequireAuth();
  const router = useRouter();
  const [mode, setMode] = useState<RiskMode>('balanced');
  const [roster, setRoster] = useState<Player[]>([]);

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }
  const [advice, setAdvice] = useState<Advice | null>(null);
  
  const {
    user,
    currentLeague,
    myRoster,
    players,
    getPlayer,
    fetchPlayers,
    isLoading
  } = useSleeperStore();

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Fetch players if needed
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        if (user && players.size === 0) {
          await fetchPlayers();
        }
      } catch (error) {
        console.error('Failed to fetch players in coach page:', error);
        // Continue with empty players map - will show mock data
      }
    };
    
    loadPlayers();
  }, [user, players.size, fetchPlayers]);

  // Convert Sleeper roster to Coach format or use mock data
  useEffect(() => {
    try {
      if (myRoster && players.size > 0) {
        // User has Sleeper data
        const convertedRoster: Player[] = [];
        
        myRoster.players?.forEach(playerId => {
          try {
            const player = getPlayer(playerId);
            if (player) {
              // Generate basic projections based on player position and recent performance
              const baseProjection = getBaseProjection(player.position);
              const volatility = getVolatility(player.position);
              
              convertedRoster.push({
                pid: playerId,
                name: `${player.first_name || 'Unknown'} ${player.last_name || 'Player'}`,
                pos: player.position || 'FLEX',
                nfl: player.team || 'FA',
                proj: baseProjection,
                vol: volatility,
                opp: 'TBD' // Would need opponent data from another API
              });
            }
          } catch (playerError) {
            console.error(`Error processing player ${playerId}:`, playerError);
            // Skip this player and continue
          }
        });
        
        setRoster(convertedRoster.length > 0 ? convertedRoster : []);
      } else if (!user || !isLoading) {
      // No user logged in or not loading, show mock data for demo
      const mock: Player[] = [
        { pid:'CMC', name:'Christian McCaffrey', pos:'RB', nfl:'SF', proj:22.0, vol:6.0, opp:'SEA' },
        { pid:'Aiyuk', name:'Brandon Aiyuk', pos:'WR', nfl:'SF', proj:15.0, vol:7.5, opp:'SEA' },
        { pid:'Kelce', name:'Travis Kelce', pos:'TE', nfl:'KC', proj:17.0, vol:6.5, opp:'LV' },
        { pid:'Gibbs', name:'Jahmyr Gibbs', pos:'RB', nfl:'DET', proj:16.0, vol:8.0, opp:'CHI' },
        { pid:'Puka', name:'Puka Nacua', pos:'WR', nfl:'LAR', proj:14.5, vol:6.0, opp:'ARI' },
        { pid:'Ridley', name:'Calvin Ridley', pos:'WR', nfl:'TEN', proj:12.0, vol:9.0, opp:'HOU' },
        { pid:'Diontae', name:'Diontae Johnson', pos:'WR', nfl:'CAR', proj:10.0, vol:5.0, opp:'NO' },
        { pid:'Dak', name:'Dak Prescott', pos:'QB', nfl:'DAL', proj:19.0, vol:7.0, opp:'PHI' },
        { pid:'Kirk', name:'Christian Kirk', pos:'WR', nfl:'JAX', proj:11.5, vol:4.5, opp:'IND' },
        { pid:'Moss', name:'Zack Moss', pos:'RB', nfl:'CIN', proj:8.0, vol:5.0, opp:'BAL' },
      ];
      setRoster(mock);
    }
    } catch (error) {
      console.error('Error in coach page roster setup:', error);
      // Fall back to mock data if there's any error
      const mock: Player[] = [
        { pid:'CMC', name:'Christian McCaffrey', pos:'RB', nfl:'SF', proj:22.0, vol:6.0, opp:'SEA' },
        { pid:'Aiyuk', name:'Brandon Aiyuk', pos:'WR', nfl:'SF', proj:15.0, vol:7.5, opp:'SEA' },
        { pid:'Kelce', name:'Travis Kelce', pos:'TE', nfl:'KC', proj:17.0, vol:6.5, opp:'LV' },
      ];
      setRoster(mock);
    }
  }, [myRoster, players, getPlayer, user, isLoading]);

  const computed = useMemo(() => {
    if (roster.length === 0) return null;
    return buildAdvice(roster, mode);
  }, [roster, mode]);

  useEffect(() => { setAdvice(computed); }, [computed]);

  return (
    <div className="min-h-screen bg-background">
      <ModernNav />
      <main className="container mx-auto p-6 space-y-8">
        <PageHeader 
          title="AI Lineup Coach"
          subtitle="AI-powered lineup optimization with risk management strategies"
          icon={<Brain className="h-6 w-6" />}
          actions={<ModeSwitch mode={mode} setMode={setMode} />}
        />

        {!advice ? (
          <DashboardGrid cols={3}>
            <ModernCard loading />
            <ModernCard loading />
            <ModernCard loading />
          </DashboardGrid>
        ) : (
          <>
            {/* Lineup Summary Stats */}
            <StatGrid cols={3}>
              <StatCard 
                title="Projected Points"
                value={advice.start.reduce((sum, p) => sum + p.proj, 0).toFixed(1)}
                icon={<Target className="h-5 w-5" />}
                trend="up"
                interactive
              />
              <StatCard 
                title="Risk Level"
                value={advice.mode === 'safe' ? 'Low' : advice.mode === 'aggressive' ? 'High' : 'Medium'}
                icon={<BarChart3 className="h-5 w-5" />}
                trend={advice.mode === 'safe' ? 'down' : advice.mode === 'aggressive' ? 'up' : 'neutral'}
                interactive
              />
              <StatCard 
                title="Lineup Changes"
                value={advice.changes.length}
                icon={<TrendingUp className="h-5 w-5" />}
                changeLabel="suggestions"
                interactive
              />
            </StatGrid>

            <DashboardGrid cols={2}>
              <ModernCard 
                title="Recommended Starters"
                description={`Optimized for ${advice.mode} strategy`}
                icon={<CheckCircle2 className="h-5 w-5" />}
                interactive
              >
                <div className="space-y-3">
                  {advice.start.map(p => (
                    <div key={p.pid} className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 transition-all hover:shadow-md">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs font-mono bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                            {slotFor(p, advice.start)}
                          </Badge>
                          <span className="font-semibold">{p.name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {p.pos} · {p.nfl} vs {p.opp}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-green-700 dark:text-green-300">
                          {p.proj.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ±{p.vol.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ModernCard>

              <ModernCard 
                title="Bench Players"
                description="Available alternatives for your lineup"
                icon={<Users className="h-5 w-5" />}
                interactive
              >
                <div className="space-y-2">
                  {advice.bench.map(p => (
                    <div key={p.pid} className="flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 rounded-lg transition-all micro-bounce">
                      <div className="flex-1">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {p.pos} · {p.nfl} vs {p.opp}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{p.proj.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">±{p.vol.toFixed(1)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ModernCard>
            </DashboardGrid>

            <ModernCard 
              title="Strategy & Reasoning"
              description="AI analysis and lineup optimization recommendations"
              icon={<AlertTriangle className="h-5 w-5" />}
              interactive
              glass
            >
              {advice.changes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="font-semibold text-lg mb-2">Optimal Lineup Detected!</h3>
                  <p className="text-muted-foreground">
                    No changes needed for your {advice.mode} strategy. Your current lineup is already optimized.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {advice.changes.map((c, i) => (
                    <div key={i} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-1 rounded-full bg-blue-500">
                          <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold">
                            Start <span className="text-green-600 dark:text-green-400">{c.in.name}</span> over{' '}
                            <span className="text-red-600 dark:text-red-400">{c.out.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{c.reason}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ModernCard>

            <ModernCard 
              title="Strategy Guide"
              description="Understanding risk management modes"
              interactive
            >
              <DashboardGrid cols={3} gap="md">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-2xl">🛡️</div>
                    <div className="font-semibold text-green-700 dark:text-green-300">Safe Mode</div>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Minimizes volatility and downside risk. Best for protecting leads or must-win weeks.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-2xl">⚖️</div>
                    <div className="font-semibold text-blue-700 dark:text-blue-300">Balanced Mode</div>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Optimizes for best expected outcome with moderate risk tolerance.
                  </p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-2xl">🚀</div>
                    <div className="font-semibold text-red-700 dark:text-red-300">Aggressive Mode</div>
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Maximizes upside potential. Ideal when you need ceiling performances to win.
                  </p>
                </div>
              </DashboardGrid>
            </ModernCard>
          </>
        )}
      </main>
    </div>
  );
}

function ModeSwitch({ mode, setMode }: { mode: RiskMode; setMode: (m: RiskMode)=>void }) {
  return (
    <div className="inline-flex rounded-xl overflow-hidden border bg-background shadow-lg backdrop-blur-sm">
      {(['safe','balanced','aggressive'] as RiskMode[]).map(m => (
        <Button
          key={m}
          onClick={() => setMode(m)}
          variant={mode === m ? "default" : "ghost"}
          size="sm"
          className={cn(
            "px-4 py-2 text-sm font-medium transition-all duration-200 rounded-none",
            mode === m 
              ? 'bg-primary text-primary-foreground shadow-md btn-modern' 
              : 'bg-background hover:bg-muted micro-bounce'
          )}
          title={
            m==='safe' ? 'Minimize downside risk' :
            m==='aggressive' ? 'Maximize upside potential' : 'Best median outcome'
          }
        >
          {m === 'safe' ? '🛡️ Safe' : m === 'aggressive' ? '🚀 Aggressive' : '⚖️ Balanced'}
        </Button>
      ))}
    </div>
  );
}

// ----------------- Helper Functions -----------------

function getBaseProjection(position: string): number {
  const projections: Record<string, number> = {
    'QB': 20,
    'RB': 15,
    'WR': 12,
    'TE': 10,
    'K': 8,
    'DEF': 10
  };
  return projections[position] || 8;
}

function getVolatility(position: string): number {
  const volatility: Record<string, number> = {
    'QB': 6,
    'RB': 7,
    'WR': 8,
    'TE': 6,
    'K': 5,
    'DEF': 5
  };
  return volatility[position] || 6;
}

// ----------------- Core logic -----------------

function buildAdvice(roster: Player[], mode: RiskMode): Advice {
  // Split into starters by slot then fill FLEX.
  // For simplicity, pick the best candidates based on a mode-specific score.
  const byPos = groupBy(roster, p => p.pos);

  const pickQB = pickTop(byPos['QB'] || [], mode, 1);
  const pickRB = pickTop(byPos['RB'] || [], mode, 2);
  const pickWR = pickTop(byPos['WR'] || [], mode, 2);
  const pickTE = pickTop(byPos['TE'] || [], mode, 1);

  const used = new Set<string>([...pickQB, ...pickRB, ...pickWR, ...pickTE].map(p => p.pid));
  const flexPool = roster.filter(p => !used.has(p.pid) && ['RB','WR','TE'].includes(p.pos));
  const pickFLEX = pickTop(flexPool, mode, 2);

  const starters = [...pickQB, ...pickRB, ...pickWR, ...pickTE, ...pickFLEX];
  const bench = roster.filter(p => !starters.find(s => s.pid === p.pid));

  // Changes vs a naive median-optimal lineup for explanation:
  const medianStarters = buildMedianLineup(roster);
  const changes = diffLineups(medianStarters, starters, mode);

  return { start: starters, bench, changes, mode };
}

function score(p: Player, mode: RiskMode) {
  // Mean-variance utility:
  // safe:   proj - 0.7*vol
  // balanced: proj - 0.25*vol
  // aggr:  proj + 0.5*vol (prefer upside)
  if (mode === 'safe') return p.proj - 0.7 * p.vol;
  if (mode === 'aggressive') return p.proj + 0.5 * p.vol;
  return p.proj - 0.25 * p.vol;
}

function pickTop(list: Player[], mode: RiskMode, n: number) {
  return [...list].sort((a,b)=>score(b,mode)-score(a,mode)).slice(0,n);
}

function buildMedianLineup(roster: Player[]) {
  const byPos = groupBy(roster, p => p.pos);
  const qb = [...(byPos['QB']||[])].sort((a,b)=>b.proj-a.proj).slice(0,1);
  const rb = [...(byPos['RB']||[])].sort((a,b)=>b.proj-a.proj).slice(0,2);
  const wr = [...(byPos['WR']||[])].sort((a,b)=>b.proj-a.proj).slice(0,2);
  const te = [...(byPos['TE']||[])].sort((a,b)=>b.proj-a.proj).slice(0,1);
  const used = new Set<string>([...qb,...rb,...wr,...te].map(p=>p.pid));
  const flexPool = roster.filter(p => !used.has(p.pid) && ['RB','WR','TE'].includes(p.pos));
  const flex = flexPool.sort((a,b)=>b.proj-a.proj).slice(0,2);
  return [...qb,...rb,...wr,...te,...flex];
}

function diffLineups(median: Player[], chosen: Player[], mode: RiskMode) {
  const changes: { in: Player; out: Player; reason: string }[] = [];
  for (const out of median) {
    if (!chosen.find(c => c.pid === out.pid)) {
      // find who replaced him at same slot family
      const replacement = chosen.find(c => family(c.pos).includes(out.pos) || family(out.pos).includes(c.pos)) || chosen[0];
      const why =
        mode === 'safe'
          ? `${replacement.name} has lower volatility (${replacement.vol.toFixed(1)} vs ${out.vol.toFixed(1)}) with comparable projection.`
          : mode === 'aggressive'
          ? `${replacement.name} offers higher ceiling given volatility (+${(replacement.vol - out.vol).toFixed(1)} std) and upside vs ${replacement.opp ?? 'opp'}.`
          : `${replacement.name} yields a stronger median outcome (proj ${(replacement.proj - out.proj).toFixed(1)}).`;
      changes.push({ in: replacement, out, reason: why });
    }
  }
  // Dedup if same players repeated
  const seen = new Set<string>();
  return changes.filter(c => {
    const key = `${c.in.pid}->${c.out.pid}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function groupBy<T, K extends string | number>(arr: T[], key: (t: T) => K): Record<K, T[]> {
  return arr.reduce((acc:any, item) => {
    const k = key(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {});
}

function family(pos: string): string[] {
  if (pos === 'RB' || pos === 'WR' || pos === 'TE') return ['RB','WR','TE','FLEX'];
  return [pos];
}

function slotFor(p: Player, starters: Player[]) {
  // Simple label for display based on SLOT_ORDER
  const posCounts: Record<string, number> = {};
  const assigned: Record<string, string> = {};
  for (const s of starters) {
    const f = family(s.pos);
    // try native first
    const wanted = SLOT_ORDER.find(x => x === s.pos && !Object.values(assigned).includes(x));
    const pick = wanted || SLOT_ORDER.find(x => x === 'FLEX' && f.includes('FLEX') && !Object.values(assigned).includes(x)) || s.pos;
    assigned[s.pid] = pick || s.pos;
    posCounts[s.pos] = (posCounts[s.pos] || 0) + 1;
  }
  return assigned[p.pid] || p.pos;
}