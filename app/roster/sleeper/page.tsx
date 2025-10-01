'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ModernNav } from '@/components/layout/ModernNav';
import { 
  Users, Plus, Minus, ArrowUpDown, TrendingUp, TrendingDown,
  AlertTriangle, Star, Shield, Zap, Flame, Snowflake, Activity,
  Target, ChevronUp, ChevronDown, Minus as MinusIcon
} from 'lucide-react';
import useSleeperStore from '@/lib/store/useSleeperStore';
import { analyticsService, PlayerAnalytics } from '@/lib/services/analyticsService';
import { cn } from '@/lib/utils';

export default function SleeperRosterPage() {
  const router = useRouter();
  const [playerAnalytics, setPlayerAnalytics] = useState<Map<string, PlayerAnalytics>>(new Map());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const {
    user,
    currentLeague,
    myRoster,
    players,
    currentMatchups,
    seasonMatchups,
    currentWeek,
    getPlayer,
    fetchPlayers,
    optimizeLineup
  } = useSleeperStore();
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);
  
  // Fetch players if needed
  useEffect(() => {
    if (players.size === 0) {
      fetchPlayers();
    }
  }, []);
  
  // Analyze player performance when data is ready
  useEffect(() => {
    if (myRoster && players.size > 0 && seasonMatchups && seasonMatchups.size > 0) {
      analyzePlayerPerformance();
    }
  }, [myRoster, players, seasonMatchups, currentMatchups]);
  
  const analyzePlayerPerformance = () => {
    setIsAnalyzing(true);
    const analytics = new Map<string, PlayerAnalytics>();
    
    myRoster?.players.forEach(playerId => {
      const player = getPlayer(playerId);
      if (!player) return;
      
      // Get player's weekly scores from matchup history
      const weeklyScores: number[] = [];
      for (let week = 1; week <= currentWeek; week++) {
        const weekMatchups = seasonMatchups?.get(week);
        if (weekMatchups) {
          const myMatchup = weekMatchups.find(m => m.roster_id === myRoster.roster_id);
          if (myMatchup?.players_points) {
            weeklyScores.push(myMatchup.players_points[playerId] || 0);
          }
        }
      }
      
      // Get current week points
      const currentPoints = currentMatchups?.find(m => m.roster_id === myRoster.roster_id)
        ?.players_points?.[playerId] || 0;
      
      // If no history, use mock data for demonstration
      if (weeklyScores.length === 0) {
        for (let i = 0; i < currentWeek; i++) {
          weeklyScores.push(Math.random() * 20 + 5);
        }
      }
      
      const playerAnalytics = analyticsService.getPlayerAnalytics(
        player,
        weeklyScores,
        currentPoints
      );
      
      analytics.set(playerId, playerAnalytics);
    });
    
    setPlayerAnalytics(analytics);
    setIsAnalyzing(false);
  };
  
  const handleOptimizeLineup = () => {
    const optimized = optimizeLineup();
    console.log('Optimized lineup:', optimized);
    // In real app, this would update the roster on Sleeper
  };
  
  // Get trend indicator for a player
  const getTrendIndicator = (analytics?: PlayerAnalytics) => {
    if (!analytics) return null;
    
    if (analytics.performance.trend === 'hot') {
      return <ChevronUp className="h-4 w-4 text-green-500" />;
    } else if (analytics.performance.trend === 'cold') {
      return <ChevronDown className="h-4 w-4 text-red-500" />;
    }
    return <MinusIcon className="h-4 w-4 text-gray-500" />;
  };
  
  // Get performance color
  const getPerformanceColor = (rating: number) => {
    if (rating >= 80) return 'text-green-500';
    if (rating >= 60) return 'text-green-400';
    if (rating >= 40) return 'text-yellow-500';
    if (rating >= 20) return 'text-orange-500';
    return 'text-red-500';
  };
  
  // Group players by position
  const positionGroups = {
    QB: [] as any[],
    RB: [] as any[],
    WR: [] as any[],
    TE: [] as any[],
    K: [] as any[],
    DEF: [] as any[],
    FLEX: [] as any[]
  };
  
  myRoster?.players.forEach(playerId => {
    const player = getPlayer(playerId);
    if (player) {
      const pos = player.position as keyof typeof positionGroups;
      if (positionGroups[pos]) {
        positionGroups[pos].push({ ...player, isStarter: myRoster.starters.includes(playerId) });
      }
    }
  });
  
  const PlayerCard = ({ player, isStarter }: any) => {
    const analytics = playerAnalytics.get(player.player_id);
    const currentPoints = currentMatchups?.find(m => m.roster_id === myRoster?.roster_id)
      ?.players_points?.[player.player_id] || 0;
    
    return (
      <div className={cn(
        "p-3 rounded-lg border transition-all hover:shadow-md",
        isStarter ? "bg-primary/5 border-primary/20" : "bg-background",
        analytics?.isHot && "border-green-500/50 bg-green-500/5",
        analytics?.isCold && "border-red-500/50 bg-red-500/5"
      )}>
        <div className="space-y-2">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <Badge variant={isStarter ? "default" : "outline"} className="min-w-[50px] justify-center">
                  {player.position}
                </Badge>
                {/* Performance Icons */}
                <div className="flex gap-0.5 mt-1">
                  {analytics?.isHot && <Flame className="h-3 w-3 text-orange-500" />}
                  {analytics?.isCold && <Snowflake className="h-3 w-3 text-blue-500" />}
                  {analytics?.isBoomBust && <Target className="h-3 w-3 text-purple-500" />}
                  {isStarter && <Star className="h-3 w-3 text-yellow-500" />}
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{player.first_name} {player.last_name}</span>
                  {getTrendIndicator(analytics)}
                  {analytics?.shouldSell && (
                    <Badge variant="destructive" className="text-xs">Sell High</Badge>
                  )}
                  {analytics?.shouldBuy && (
                    <Badge variant="secondary" className="text-xs">Buy Low</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{player.team || 'FA'}</span>
                  {player.injury_status && (
                    <>
                      <span>•</span>
                      <Badge variant="destructive" className="text-xs">
                        {player.injury_status}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Current Week Points */}
            <div className="text-right">
              <div className={cn(
                "text-xl font-bold",
                currentPoints > (analytics?.performance.seasonAverage || 0) * 1.2 
                  ? "text-green-500" 
                  : currentPoints < (analytics?.performance.seasonAverage || 0) * 0.8
                  ? "text-red-500"
                  : "text-foreground"
              )}>
                {currentPoints.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">Week {currentWeek}</div>
            </div>
          </div>
          
          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="text-center">
              <div className="text-muted-foreground">Season</div>
              <div className="font-semibold">
                {analytics?.performance.seasonAverage.toFixed(1) || '-'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">L3</div>
              <div className={cn(
                "font-semibold",
                analytics && analytics.performance.last3WeeksAverage > analytics.performance.seasonAverage
                  ? "text-green-500"
                  : "text-red-500"
              )}>
                {analytics?.performance.last3WeeksAverage.toFixed(1) || '-'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Trend</div>
              <div className={cn(
                "font-semibold capitalize",
                analytics?.performance.trend === 'hot' ? "text-green-500" :
                analytics?.performance.trend === 'cold' ? "text-red-500" :
                "text-yellow-500"
              )}>
                {analytics?.performance.trend || '-'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Rating</div>
              <div className={cn(
                "font-semibold",
                getPerformanceColor(analytics?.performance.performanceRating || 0)
              )}>
                {analytics?.performance.performanceRating.toFixed(0) || '-'}
              </div>
            </div>
          </div>
          
          {/* Performance Bar */}
          {analytics && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Performance</span>
                <span>{analytics.performance.performanceRating.toFixed(0)}%</span>
              </div>
              <Progress 
                value={analytics.performance.performanceRating} 
                className="h-2"
              />
            </div>
          )}
          
          {/* Recommendations */}
          {analytics && analytics.performance.recommendations.length > 0 && (
            <div className="pt-2 border-t">
              <div className="space-y-1">
                {analytics.performance.recommendations.slice(0, 2).map((rec, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground">
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Action Button */}
        <div className="flex justify-end mt-2">
          <Button variant="ghost" size="sm">
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };
  
  if (!user) return null;
  
  return (
    <div className="min-h-screen bg-background">
      <ModernNav />
      
      <main className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Roster Management</h1>
            <p className="text-muted-foreground">
              {currentLeague?.name || 'Select a league'}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleOptimizeLineup}>
              <Star className="h-4 w-4 mr-2" />
              Optimize Lineup
            </Button>
            <Button variant="outline" onClick={analyzePlayerPerformance} disabled={isAnalyzing}>
              <Activity className="h-4 w-4 mr-2" />
              {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
            </Button>
          </div>
        </div>
        
        {/* Performance Summary Cards */}
        {playerAnalytics.size > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  Hot Players
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {Array.from(playerAnalytics.values()).filter(a => a.isHot).length}
                </div>
                <div className="text-xs text-muted-foreground">
                  Trending up
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <Snowflake className="h-3 w-3 text-blue-500" />
                  Cold Players
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {Array.from(playerAnalytics.values()).filter(a => a.isCold).length}
                </div>
                <div className="text-xs text-muted-foreground">
                  Need attention
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  Avg Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "text-2xl font-bold",
                  Array.from(playerAnalytics.values()).filter(a => a.performance.trend === 'hot').length >
                  Array.from(playerAnalytics.values()).filter(a => a.performance.trend === 'cold').length
                    ? "text-green-500" : "text-red-500"
                )}>
                  {Array.from(playerAnalytics.values()).filter(a => a.performance.trend === 'hot').length > 
                   Array.from(playerAnalytics.values()).filter(a => a.performance.trend === 'cold').length
                    ? "Rising" : "Falling"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Overall direction
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <Target className="h-3 w-3 text-purple-500" />
                  Trade Targets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-500">
                  {Array.from(playerAnalytics.values()).filter(a => a.shouldSell || a.shouldBuy).length}
                </div>
                <div className="text-xs text-muted-foreground">
                  Buy/Sell opportunities
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {!myRoster ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No roster data available. Please select a league from the dashboard.
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="starters">Starters</TabsTrigger>
              <TabsTrigger value="bench">Bench</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              {/* Hot/Cold Alert */}
              {playerAnalytics.size > 0 && (
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-1">Roster Insights:</div>
                    {Array.from(playerAnalytics.values()).filter(a => a.isHot).length > 0 && (
                      <div className="text-sm mb-1">
                        🔥 {Array.from(playerAnalytics.values()).filter(a => a.isHot).map(a => 
                          `${a.player.first_name} ${a.player.last_name}`).join(', ')} on hot streaks
                      </div>
                    )}
                    {Array.from(playerAnalytics.values()).filter(a => a.isCold).length > 0 && (
                      <div className="text-sm">
                        ❄️ {Array.from(playerAnalytics.values()).filter(a => a.isCold).map(a => 
                          `${a.player.first_name} ${a.player.last_name}`).join(', ')} need attention
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Quarterbacks */}
                {positionGroups.QB.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        Quarterbacks
                        <Badge variant="outline">
                          {positionGroups.QB.filter(p => p.isStarter).length}/{positionGroups.QB.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {positionGroups.QB.map(player => (
                        <PlayerCard key={player.player_id} player={player} isStarter={player.isStarter} />
                      ))}
                    </CardContent>
                  </Card>
                )}
                
                {/* Running Backs */}
                {positionGroups.RB.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        Running Backs
                        <Badge variant="outline">
                          {positionGroups.RB.filter(p => p.isStarter).length}/{positionGroups.RB.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {positionGroups.RB.map(player => (
                        <PlayerCard key={player.player_id} player={player} isStarter={player.isStarter} />
                      ))}
                    </CardContent>
                  </Card>
                )}
                
                {/* Wide Receivers */}
                {positionGroups.WR.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Wide Receivers</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {positionGroups.WR.map(player => (
                        <PlayerCard key={player.player_id} player={player} isStarter={player.isStarter} />
                      ))}
                    </CardContent>
                  </Card>
                )}
                
                {/* Tight Ends */}
                {positionGroups.TE.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Tight Ends</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {positionGroups.TE.map(player => (
                        <PlayerCard key={player.player_id} player={player} isStarter={player.isStarter} />
                      ))}
                    </CardContent>
                  </Card>
                )}
                
                {/* Kickers & Defense */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">K & DEF</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[...positionGroups.K, ...positionGroups.DEF].map(player => (
                      <PlayerCard key={player.player_id} player={player} isStarter={player.isStarter} />
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="starters">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Starting Lineup
                    <div className="flex gap-2">
                      <Badge variant="default">
                        {myRoster.starters.filter(Boolean).length} Active
                      </Badge>
                      {playerAnalytics.size > 0 && (
                        <Badge 
                          variant={
                            Array.from(playerAnalytics.values())
                              .filter(a => myRoster.starters.includes(a.player.player_id) && a.isHot).length > 2
                              ? "default" : "secondary"
                          }
                        >
                          {Array.from(playerAnalytics.values())
                            .filter(a => myRoster.starters.includes(a.player.player_id) && a.isHot).length} Hot
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Your active players for Week {currentWeek}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {myRoster.starters.map(playerId => {
                    const player = getPlayer(playerId);
                    if (!player) return null;
                    return <PlayerCard key={playerId} player={player} isStarter={true} />;
                  })}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="bench">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Bench Players
                    <div className="flex gap-2">
                      <Badge variant="secondary">
                        {myRoster.players.filter(p => !myRoster.starters.includes(p)).length} Benched
                      </Badge>
                      {playerAnalytics.size > 0 && (
                        <Badge 
                          variant={
                            Array.from(playerAnalytics.values())
                              .filter(a => !myRoster.starters.includes(a.player.player_id) && a.isHot).length > 0
                              ? "destructive" : "outline"
                          }
                        >
                          {Array.from(playerAnalytics.values())
                            .filter(a => !myRoster.starters.includes(a.player.player_id) && a.isHot).length > 0
                            ? '⚠️ Hot on bench!' : 'No hot players'}
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Players not in your starting lineup
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {myRoster.players
                    .filter(p => !myRoster.starters.includes(p))
                    .map(playerId => {
                      const player = getPlayer(playerId);
                      if (!player) return null;
                      return <PlayerCard key={playerId} player={player} isStarter={false} />;
                    })}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
        
        {/* Quick Stats */}
        {myRoster && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Players</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myRoster.players.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Starters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myRoster.starters.filter(Boolean).length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Bench</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {myRoster.players.length - myRoster.starters.filter(Boolean).length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Injured</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {myRoster.players.filter(p => {
                    const player = getPlayer(p);
                    return player?.injury_status;
                  }).length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}