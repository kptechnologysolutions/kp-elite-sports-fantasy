'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ModernNav } from '@/components/layout/ModernNav';
// import { EnhancedRosterView } from '@/components/roster/EnhancedRosterView';
import { MultiTeamSwitcher, MultiTeamOverview } from '@/components/teams/MultiTeamSwitcher';
import { CompetitiveMetrics } from '@/components/dashboard/CompetitiveMetrics';
import { NewsFeed } from '@/components/news/NewsFeed';
import { UpcomingGames } from '@/components/games/UpcomingGames';
import { PositionalMatchups } from '@/components/matchups/PositionalMatchups';
import { PlayoffCalculator } from '@/components/analytics/PlayoffCalculator';
import { LiveScoring } from '@/components/live/LiveScoring';
import { AdvancedAnalytics } from '@/components/dashboard/AdvancedAnalytics';
import { PerformanceWidget } from '@/components/dashboard/PerformanceWidget';
import { 
  Trophy, TrendingUp, Users, Activity, RefreshCw, 
  CheckCircle2, Clock, AlertTriangle, Star, AlertCircle, Swords
} from 'lucide-react';
import useSleeperStore from '@/lib/store/useSleeperStore';
import { cn } from '@/lib/utils';

export default function SleeperDashboard() {
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
    getPlayer,
    selectLeague,
    fetchPlayers,
    refreshData,
    _hasHydrated
  } = useSleeperStore();
  
  // Redirect to login if not logged in (but wait for hydration)
  useEffect(() => {
    if (_hasHydrated && !user) {
      console.log('Dashboard: No user after hydration, redirecting to login');
      router.replace('/login');
    } else if (_hasHydrated && user) {
      console.log('Dashboard: User found after hydration:', user.display_name);
      
      // Check if we're on an invalid URL (like /dashboard/sleeper/[user_id])
      // and redirect to the correct dashboard URL
      const currentPath = window.location.pathname;
      if (currentPath !== '/dashboard/sleeper' && currentPath.startsWith('/dashboard/sleeper/')) {
        console.log('Dashboard: Detected invalid URL, redirecting to correct dashboard');
        router.replace('/dashboard/sleeper');
      }
    }
  }, [user, router, _hasHydrated]);
  
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
  
  const handleLeagueSelect = async (leagueId: string) => {
    await selectLeague(leagueId);
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
          <div className="max-w-2xl mx-auto space-y-4">
            <Alert>
              <Trophy className="h-4 w-4" />
              <AlertDescription>
                <strong>Multiple leagues found!</strong> Please select a league from the dropdown above to view your dashboard.
              </AlertDescription>
            </Alert>
            
            <Card>
              <CardHeader>
                <CardTitle>Your Fantasy Leagues</CardTitle>
                <CardDescription>Choose which league you'd like to manage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {leagues.map((league) => (
                    <Button
                      key={league.league_id}
                      variant="outline"
                      onClick={() => handleLeagueSelect(league.league_id)}
                      className="justify-start h-auto p-4"
                      disabled={isLoading}
                    >
                      <div className="text-left">
                        <div className="font-medium">{league.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {league.total_rosters} teams • {league.season} season
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      
      {currentLeague && (
        <main className="container mx-auto p-4 space-y-6">
          {/* Enhanced Competitive Metrics */}
          <CompetitiveMetrics />
          
          {/* Current Matchup */}
          {myMatchup && opponentMatchup && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Week {currentWeek} Matchup</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="default">
                      <Activity className="h-3 w-3 mr-1" />
                      Live
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                    >
                      <RefreshCw className={cn(
                        "h-4 w-4",
                        isRefreshing && "animate-spin"
                      )} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="font-medium mb-2">{getRosterName(myMatchup.roster_id)}</div>
                    <div className="text-3xl font-bold">{myMatchup.points.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {myRoster?.settings?.wins || 0}-{myRoster?.settings?.losses || 0}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <Progress 
                      value={(myMatchup.points / Math.max(myMatchup.points + opponentMatchup.points, 1)) * 100} 
                      className="h-3 w-full"
                    />
                  </div>
                  
                  <div className="text-center">
                    <div className="font-medium mb-2">{getRosterName(opponentMatchup.roster_id)}</div>
                    <div className="text-3xl font-bold">{opponentMatchup.points.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {rosters.find(r => r.roster_id === opponentMatchup.roster_id)?.settings?.wins || 0}-
                      {rosters.find(r => r.roster_id === opponentMatchup.roster_id)?.settings?.losses || 0}
                    </div>
                  </div>
                </div>
                
                {myMatchup.points !== opponentMatchup.points && (
                  <Alert className="mt-4" variant={myMatchup.points > opponentMatchup.points ? "default" : "destructive"}>
                    <AlertDescription>
                      {myMatchup.points > opponentMatchup.points ? (
                        <>
                          <TrendingUp className="h-4 w-4 inline mr-2" />
                          You're winning by {(myMatchup.points - opponentMatchup.points).toFixed(1)} points!
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 inline mr-2" />
                          You're losing by {(opponentMatchup.points - myMatchup.points).toFixed(1)} points
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Main Content Tabs */}
          <Tabs defaultValue="roster" className="space-y-4">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="roster">My Roster</TabsTrigger>
              <TabsTrigger value="standings">Standings</TabsTrigger>
              <TabsTrigger value="scoreboard">Scoreboard</TabsTrigger>
              <TabsTrigger value="playoffs">Playoffs</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="roster">
              {myRoster && myMatchup ? (
                <div className="text-center py-8 text-muted-foreground">
                  Enhanced Roster View temporarily disabled for maintenance
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center text-muted-foreground">
                      No roster data available
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="standings">
              <Card>
                <CardHeader>
                  <CardTitle>League Standings</CardTitle>
                  <CardDescription>{currentLeague.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {standings.map((roster, idx) => (
                      <div 
                        key={roster.roster_id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border transition-all",
                          roster.roster_id === myRoster?.roster_id && "bg-primary/5 border-primary/20"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-lg font-bold text-muted-foreground">
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
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="scoreboard">
              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  The current week scoreboard is now displayed prominently above for quick access.
                  Use the tabs above for detailed roster management, league standings, and analytics.
                </AlertDescription>
              </Alert>
            </TabsContent>
            
            <TabsContent value="playoffs">
              <PlayoffCalculator />
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-6">
              <PerformanceWidget />
              <AdvancedAnalytics />
            </TabsContent>
          </Tabs>
          
          {/* League Scoreboard - Extracted from tabs for prominence */}
          <Card>
            <CardHeader>
              <CardTitle>Week {currentWeek} League Matchups</CardTitle>
              <CardDescription>Current week scoreboard for {currentLeague.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {Array.from(new Set(currentMatchups.map(m => m.matchup_id))).map(matchupId => {
                  const teams = currentMatchups.filter(m => m.matchup_id === matchupId);
                  if (teams.length !== 2) return null;
                  
                  const isMyMatchup = teams.some(t => t.roster_id === myRoster?.roster_id);
                  
                  return (
                    <div 
                      key={matchupId} 
                      className={cn(
                        "border rounded-lg p-4 transition-all",
                        isMyMatchup && "ring-2 ring-primary bg-primary/5"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{getRosterName(teams[0].roster_id)}</div>
                          <div className="text-2xl font-bold">{teams[0].points.toFixed(1)}</div>
                        </div>
                        <div className="text-sm text-muted-foreground">VS</div>
                        <div className="text-right">
                          <div className="font-medium">{getRosterName(teams[1].roster_id)}</div>
                          <div className="text-2xl font-bold">{teams[1].points.toFixed(1)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          
          {/* News and Games Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Games with Difficulty */}
            <UpcomingGames week={currentWeek} />
            
            {/* Fantasy News Feed */}
            <NewsFeed />
          </div>
          
          {/* Positional Matchups Section - Moved to bottom */}
          <PositionalMatchups />
        </main>
      )}
    </div>
  );
}