'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ModernNav } from '@/components/layout/ModernNav';
import { 
  EnhancedCard, 
  StatCard, 
  Grid, 
  Container, 
  Section, 
  PageHeader,
  SectionHeader 
} from '@/components/ui/enhanced';
import { 
  Trophy, TrendingUp, Users, Activity, RefreshCw, 
  CheckCircle2, Clock, AlertTriangle, Star, AlertCircle, Swords,
  Target, Award, BarChart3
} from 'lucide-react';
import useSleeperStore from '@/lib/store/useSleeperStore';
import { cn } from '@/lib/utils';

export default function RedesignedDashboard() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const {
    user,
    leagues,
    currentLeague,
    myRoster,
    rosters,
    leagueUsers,
    currentMatchups,
    currentWeek,
    players,
    isLoading,
    error,
    selectLeague,
    fetchPlayers,
    refreshData
  } = useSleeperStore();
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);
  
  // Fetch players if needed
  useEffect(() => {
    if (user && players.size === 0) {
      fetchPlayers();
    }
  }, [user]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };
  
  // Get display name for a roster
  const getRosterName = (rosterId: number) => {
    const roster = rosters.find(r => r.roster_id === rosterId);
    if (!roster) return `Team ${rosterId}`;
    
    const owner = roster.owner_id ? leagueUsers.get(roster.owner_id) : undefined;
    return owner?.team_name || owner?.display_name || `Team ${rosterId}`;
  };
  
  // Calculate standings with proper sorting
  const standings = [...rosters].sort((a, b) => {
    const aWins = a.settings?.wins || 0;
    const aLosses = a.settings?.losses || 0;
    const bWins = b.settings?.wins || 0;
    const bLosses = b.settings?.losses || 0;
    
    // Sort by win percentage first
    const aWinPct = aWins / Math.max(aWins + aLosses, 1);
    const bWinPct = bWins / Math.max(bWins + bLosses, 1);
    
    if (aWinPct !== bWinPct) return bWinPct - aWinPct;
    
    // Then by total points
    return (b.settings?.fpts || 0) - (a.settings?.fpts || 0);
  });
  
  // Find my matchup
  const myMatchup = currentMatchups.find(m => m.roster_id === myRoster?.roster_id);
  const opponentMatchup = myMatchup ? 
    currentMatchups.find(m => 
      m.matchup_id === myMatchup.matchup_id && 
      m.roster_id !== myMatchup.roster_id
    ) : null;

  // Calculate stats
  const myRecord = myRoster?.settings ? 
    `${myRoster.settings.wins || 0}-${myRoster.settings.losses || 0}` : '0-0';
  const totalPoints = myRoster?.settings?.fpts || 0;
  const leagueRank = standings.findIndex(r => r.roster_id === myRoster?.roster_id) + 1;
  const winPct = myRoster?.settings ? 
    ((myRoster.settings.wins || 0) / Math.max((myRoster.settings.wins || 0) + (myRoster.settings.losses || 0), 1) * 100).toFixed(1) : '0.0';
  
  if (!user) return null;
  
  return (
    <div className="min-h-screen bg-background">
      <ModernNav />
      
      <Container size="xl" className="py-8">
        <Section spacing="xl">
          {/* Page Header */}
          <PageHeader
            title="Fantasy Dashboard"
            subtitle={currentLeague?.name || 'Select a league to get started'}
            description="Manage your fantasy teams, track performance, and make winning decisions"
            icon={Trophy}
            actions={
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={cn(
                    "h-4 w-4 mr-2",
                    isRefreshing && "animate-spin"
                  )} />
                  Refresh
                </Button>
                <Badge variant="outline">
                  <Activity className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </div>
            }
          />

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* League Selection State */}
          {!currentLeague && leagues.length > 0 && (
            <Alert>
              <AlertDescription>
                Please select a league to view your dashboard
              </AlertDescription>
            </Alert>
          )}

          {/* Dashboard Content */}
          {currentLeague && (
            <>
              {/* Key Stats */}
              <Section spacing="lg">
                <SectionHeader 
                  title="Team Performance"
                  subtitle="Your current season stats and ranking"
                />
                
                <Grid cols={4} gap="md">
                  <StatCard
                    title="Record"
                    value={myRecord}
                    change={`${winPct}% win rate`}
                    changeType={parseFloat(winPct) >= 50 ? 'positive' : 'negative'}
                    icon={Trophy}
                    loading={isLoading}
                  />
                  <StatCard
                    title="Total Points"
                    value={totalPoints.toFixed(1)}
                    change={`Rank #${leagueRank} of ${rosters.length}`}
                    changeType={leagueRank <= rosters.length / 2 ? 'positive' : 'negative'}
                    icon={Target}
                    loading={isLoading}
                  />
                  <StatCard
                    title="Current Week"
                    value={`Week ${currentWeek}`}
                    change={myMatchup ? `${myMatchup.points.toFixed(1)} pts` : 'No matchup'}
                    changeType="neutral"
                    icon={Clock}
                    loading={isLoading}
                  />
                  <StatCard
                    title="League Rank"
                    value={`#${leagueRank}`}
                    change={`Top ${Math.round((leagueRank / rosters.length) * 100)}%`}
                    changeType={leagueRank <= rosters.length / 2 ? 'positive' : 'negative'}
                    icon={Award}
                    loading={isLoading}
                  />
                </Grid>
              </Section>

              {/* Current Matchup */}
              {myMatchup && opponentMatchup && (
                <Section spacing="lg">
                  <SectionHeader 
                    title={`Week ${currentWeek} Matchup`}
                    subtitle="Live scoring and head-to-head comparison"
                  />
                  
                  <EnhancedCard
                    title="Live Matchup"
                    icon={Swords}
                    variant={myMatchup.points > opponentMatchup.points ? 'success' : myMatchup.points < opponentMatchup.points ? 'warning' : 'info'}
                    loading={isLoading}
                  >
                    <div className="space-y-6">
                      {/* Score Display */}
                      <div className="grid grid-cols-3 gap-6 items-center">
                        <div className="text-center">
                          <div className="space-y-2">
                            <p className="font-semibold text-foreground">{getRosterName(myMatchup.roster_id)}</p>
                            <div className="text-3xl font-bold text-primary">{myMatchup.points.toFixed(1)}</div>
                            <Badge variant="outline" className="text-xs">
                              {myRoster?.settings?.wins || 0}-{myRoster?.settings?.losses || 0}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">VS</p>
                          <Progress 
                            value={(myMatchup.points / Math.max(myMatchup.points + opponentMatchup.points, 1)) * 100} 
                            className="h-2 w-full"
                          />
                        </div>
                        
                        <div className="text-center">
                          <div className="space-y-2">
                            <p className="font-semibold text-foreground">{getRosterName(opponentMatchup.roster_id)}</p>
                            <div className="text-3xl font-bold text-foreground">{opponentMatchup.points.toFixed(1)}</div>
                            <Badge variant="outline" className="text-xs">
                              {rosters.find(r => r.roster_id === opponentMatchup.roster_id)?.settings?.wins || 0}-
                              {rosters.find(r => r.roster_id === opponentMatchup.roster_id)?.settings?.losses || 0}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Matchup Status */}
                      {myMatchup.points !== opponentMatchup.points && (
                        <div className={cn(
                          "text-center p-3 rounded-lg border",
                          myMatchup.points > opponentMatchup.points 
                            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800" 
                            : "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
                        )}>
                          <p className={cn(
                            "text-sm font-medium",
                            myMatchup.points > opponentMatchup.points ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"
                          )}>
                            {myMatchup.points > opponentMatchup.points ? (
                              <>
                                <TrendingUp className="h-4 w-4 inline mr-1" />
                                Winning by {(myMatchup.points - opponentMatchup.points).toFixed(1)} points
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="h-4 w-4 inline mr-1" />
                                Behind by {(opponentMatchup.points - myMatchup.points).toFixed(1)} points
                              </>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </EnhancedCard>
                </Section>
              )}

              {/* Main Content Tabs */}
              <Section spacing="lg">
                <Tabs defaultValue="overview" className="space-y-6">
                  <TabsList className="grid grid-cols-5 w-full max-w-2xl">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="roster">Roster</TabsTrigger>
                    <TabsTrigger value="standings">Standings</TabsTrigger>
                    <TabsTrigger value="matchups">Matchups</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview">
                    <Grid cols={2} gap="lg">
                      <EnhancedCard
                        title="Quick Stats"
                        subtitle="Season performance at a glance"
                        icon={BarChart3}
                        loading={isLoading}
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Season Record</span>
                            <span className="font-medium">{myRecord}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Points</span>
                            <span className="font-medium">{totalPoints.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">League Rank</span>
                            <span className="font-medium">#{leagueRank} of {rosters.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Win Percentage</span>
                            <span className="font-medium">{winPct}%</span>
                          </div>
                        </div>
                      </EnhancedCard>

                      <EnhancedCard
                        title="Recent Activity"
                        subtitle="Latest updates and notifications"
                        icon={Activity}
                        loading={isLoading}
                      >
                        <div className="space-y-3">
                          <div className="text-sm text-muted-foreground">
                            No recent activity to display. Check back during game time for live updates.
                          </div>
                        </div>
                      </EnhancedCard>
                    </Grid>
                  </TabsContent>
                  
                  {/* Add other tab contents here */}
                  <TabsContent value="roster">
                    <EnhancedCard
                      title="Team Roster"
                      subtitle="Your current lineup and bench"
                      icon={Users}
                      loading={isLoading}
                    >
                      <div className="text-center py-8 text-muted-foreground">
                        Roster view coming soon...
                      </div>
                    </EnhancedCard>
                  </TabsContent>
                  
                  <TabsContent value="standings">
                    <EnhancedCard
                      title="League Standings"
                      subtitle={currentLeague.name}
                      icon={Trophy}
                      loading={isLoading}
                    >
                      <div className="space-y-3">
                        {standings.slice(0, 8).map((roster, idx) => (
                          <div 
                            key={roster.roster_id}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border transition-all hover:bg-muted/50",
                              roster.roster_id === myRoster?.roster_id && "bg-primary/5 border-primary/20"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-lg font-bold text-muted-foreground min-w-[24px]">
                                {idx + 1}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {getRosterName(roster.roster_id)}
                                  {roster.roster_id === myRoster?.roster_id && (
                                    <Badge className="ml-2" variant="secondary">You</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {roster.settings?.wins || 0}-{roster.settings?.losses || 0}
                                  {(roster.settings?.ties || 0) > 0 && `-${roster.settings.ties}`}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="font-bold">{(roster.settings?.fpts || 0).toFixed(1)}</div>
                              <div className="text-xs text-muted-foreground">PF</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </EnhancedCard>
                  </TabsContent>
                  
                  <TabsContent value="matchups">
                    <EnhancedCard
                      title={`Week ${currentWeek} Scoreboard`}
                      subtitle="All league matchups this week"
                      icon={Swords}
                      loading={isLoading}
                    >
                      <div className="space-y-4">
                        {Array.from(new Set(currentMatchups.map(m => m.matchup_id))).map(matchupId => {
                          const teams = currentMatchups.filter(m => m.matchup_id === matchupId);
                          if (teams.length !== 2) return null;
                          
                          const isMyMatchup = teams.some(t => t.roster_id === myRoster?.roster_id);
                          
                          return (
                            <div 
                              key={matchupId} 
                              className={cn(
                                "border rounded-lg p-4 transition-all hover:bg-muted/30",
                                isMyMatchup && "ring-2 ring-primary bg-primary/5"
                              )}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium">{getRosterName(teams[0].roster_id)}</div>
                                  <div className="text-2xl font-bold">{teams[0].points.toFixed(1)}</div>
                                </div>
                                <div className="text-sm text-muted-foreground font-medium">VS</div>
                                <div className="text-right">
                                  <div className="font-medium">{getRosterName(teams[1].roster_id)}</div>
                                  <div className="text-2xl font-bold">{teams[1].points.toFixed(1)}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </EnhancedCard>
                  </TabsContent>
                  
                  <TabsContent value="analytics">
                    <EnhancedCard
                      title="Advanced Analytics"
                      subtitle="Detailed performance metrics and insights"
                      icon={BarChart3}
                      loading={isLoading}
                    >
                      <div className="text-center py-8 text-muted-foreground">
                        Advanced analytics coming soon...
                      </div>
                    </EnhancedCard>
                  </TabsContent>
                </Tabs>
              </Section>
            </>
          )}
        </Section>
      </Container>
    </div>
  );
}