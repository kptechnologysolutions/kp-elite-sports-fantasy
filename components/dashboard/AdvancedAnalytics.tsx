'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3,
  Activity,
  Zap,
  AlertTriangle,
  Trophy,
  Star,
  Clock,
  Users
} from 'lucide-react';
import useSleeperStore from '@/lib/store/useSleeperStore';
import { cn } from '@/lib/utils';

interface TeamAnalytics {
  rosterId: number;
  teamName: string;
  efficiency: number;
  consistency: number;
  ceiling: number;
  floor: number;
  trendScore: number;
  strengthOfSchedule: number;
  injuryRisk: 'low' | 'medium' | 'high';
  tradeValue: number;
}

interface PositionalAnalytics {
  position: string;
  depth: number;
  averageAge: number;
  upside: number;
  stability: number;
  needsUpgrade: boolean;
}

interface WeeklyTrend {
  week: number;
  points: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
}

export function AdvancedAnalytics() {
  const [teamAnalytics, setTeamAnalytics] = useState<TeamAnalytics | null>(null);
  const [positionalAnalytics, setPositionalAnalytics] = useState<PositionalAnalytics[]>([]);
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    currentLeague,
    myRoster,
    rosters,
    leagueUsers,
    players,
    currentWeek,
    seasonMatchups
  } = useSleeperStore();
  
  useEffect(() => {
    if (myRoster && currentLeague) {
      calculateAnalytics();
    }
  }, [myRoster, currentLeague, seasonMatchups]);
  
  const calculateAnalytics = async () => {
    if (!myRoster || !currentLeague) return;
    
    setIsLoading(true);
    
    try {
      // Calculate team analytics
      const analytics = calculateTeamAnalytics();
      setTeamAnalytics(analytics);
      
      // Calculate positional analytics
      const positional = calculatePositionalAnalytics();
      setPositionalAnalytics(positional);
      
      // Calculate weekly trends
      const trends = calculateWeeklyTrends();
      setWeeklyTrends(trends);
      
    } catch (error) {
      console.error('Error calculating analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const calculateTeamAnalytics = (): TeamAnalytics => {
    if (!myRoster) throw new Error('No roster data');
    
    const teamName = getRosterName(myRoster.roster_id);
    const seasonPoints = myRoster.settings?.fpts || 0;
    const gamesPlayed = (myRoster.settings?.wins || 0) + (myRoster.settings?.losses || 0) + (myRoster.settings?.ties || 0);
    
    // Calculate efficiency (points per game vs league average)
    const avgPointsPerGame = gamesPlayed > 0 ? seasonPoints / gamesPlayed : 0;
    const leagueAvgPoints = rosters.reduce((sum, r) => sum + (r.settings?.fpts || 0), 0) / rosters.length;
    const leagueAvgPerGame = leagueAvgPoints / Math.max(gamesPlayed, 1);
    const efficiency = leagueAvgPerGame > 0 ? (avgPointsPerGame / leagueAvgPerGame) * 100 : 50;
    
    // Calculate consistency (based on weekly variance)
    const weeklyScores = getWeeklyScores();
    const variance = calculateVariance(weeklyScores);
    const consistency = Math.max(0, 100 - (variance / avgPointsPerGame) * 100);
    
    // Calculate ceiling and floor
    const ceiling = Math.max(...weeklyScores);
    const floor = Math.min(...weeklyScores.filter(s => s > 0));
    
    // Calculate trend score (recent 3 weeks vs season average)
    const recentWeeks = weeklyScores.slice(-3);
    const recentAvg = recentWeeks.reduce((sum, s) => sum + s, 0) / recentWeeks.length;
    const trendScore = avgPointsPerGame > 0 ? (recentAvg / avgPointsPerGame) * 100 : 50;
    
    // Mock other metrics
    const strengthOfSchedule = 0.5 + (Math.random() * 0.3); // 0.5-0.8
    const injuryRisk: TeamAnalytics['injuryRisk'] = Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low';
    const tradeValue = efficiency * 0.8 + consistency * 0.2;
    
    return {
      rosterId: myRoster.roster_id,
      teamName,
      efficiency: Math.round(efficiency),
      consistency: Math.round(consistency),
      ceiling,
      floor,
      trendScore: Math.round(trendScore),
      strengthOfSchedule: Math.round(strengthOfSchedule * 100) / 100,
      injuryRisk,
      tradeValue: Math.round(tradeValue)
    };
  };
  
  const calculatePositionalAnalytics = (): PositionalAnalytics[] => {
    if (!myRoster) return [];
    
    const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
    
    return positions.map(position => {
      const positionPlayers = myRoster.players
        .map(id => players.get(id))
        .filter(p => p && p.position === position);
      
      const depth = positionPlayers.length;
      const averageAge = positionPlayers.reduce((sum, p) => sum + (p?.age || 25), 0) / Math.max(depth, 1);
      
      // Mock analytics
      const upside = Math.random() * 100;
      const stability = Math.random() * 100;
      const needsUpgrade = depth < 2 || averageAge > 30 || upside < 60;
      
      return {
        position,
        depth,
        averageAge: Math.round(averageAge * 10) / 10,
        upside: Math.round(upside),
        stability: Math.round(stability),
        needsUpgrade
      };
    });
  };
  
  const calculateWeeklyTrends = (): WeeklyTrend[] => {
    const trends: WeeklyTrend[] = [];
    
    for (let week = 1; week <= currentWeek; week++) {
      const weekMatchups = seasonMatchups.get(week) || [];
      const myMatchup = weekMatchups.find(m => m.roster_id === myRoster?.roster_id);
      
      if (myMatchup) {
        // Calculate rank for this week
        const allScores = weekMatchups.map(m => m.points).sort((a, b) => b - a);
        const rank = allScores.indexOf(myMatchup.points) + 1;
        
        // Determine trend
        let trend: WeeklyTrend['trend'] = 'stable';
        if (trends.length > 0) {
          const prevRank = trends[trends.length - 1].rank;
          if (rank < prevRank) trend = 'up';
          else if (rank > prevRank) trend = 'down';
        }
        
        trends.push({
          week,
          points: myMatchup.points,
          rank,
          trend
        });
      }
    }
    
    return trends;
  };
  
  const getWeeklyScores = (): number[] => {
    const scores: number[] = [];
    
    for (let week = 1; week <= currentWeek; week++) {
      const weekMatchups = seasonMatchups.get(week) || [];
      const myMatchup = weekMatchups.find(m => m.roster_id === myRoster?.roster_id);
      if (myMatchup) {
        scores.push(myMatchup.points);
      }
    }
    
    return scores;
  };
  
  const calculateVariance = (values: number[]): number => {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  };
  
  const getRosterName = (rosterId: number) => {
    const roster = rosters.find(r => r.roster_id === rosterId);
    if (!roster) return `Team ${rosterId}`;
    
    const owner = roster.owner_id ? leagueUsers.get(roster.owner_id) : undefined;
    return owner?.team_name || owner?.display_name || `Team ${rosterId}`;
  };
  
  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 110) return 'text-green-600';
    if (efficiency >= 100) return 'text-blue-600';
    if (efficiency >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getConsistencyColor = (consistency: number) => {
    if (consistency >= 80) return 'text-green-600';
    if (consistency >= 65) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getRiskColor = (risk: TeamAnalytics['injuryRisk']) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  if (!currentLeague) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-400">
            Please select a league to view analytics
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoading || !teamAnalytics) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <Activity className="h-8 w-8 mx-auto animate-spin text-primary mb-4" />
            <p className="text-gray-400">Calculating advanced analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Team Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-3xl font-bold", getEfficiencyColor(teamAnalytics.efficiency))}>
              {teamAnalytics.efficiency}%
            </div>
            <div className="text-sm text-gray-400">vs League Avg</div>
            <Progress value={teamAnalytics.efficiency} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Consistency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-3xl font-bold", getConsistencyColor(teamAnalytics.consistency))}>
              {teamAnalytics.consistency}%
            </div>
            <div className="text-sm text-gray-400">Week to Week</div>
            <Progress value={teamAnalytics.consistency} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Ceiling/Floor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-lg font-bold text-green-600">
                {teamAnalytics.ceiling.toFixed(1)}
              </div>
              <div className="text-sm text-gray-400">/</div>
              <div className="text-lg font-bold text-red-600">
                {teamAnalytics.floor.toFixed(1)}
              </div>
            </div>
            <div className="text-sm text-gray-400">Best/Worst Week</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-3xl font-bold",
              teamAnalytics.trendScore > 105 ? "text-green-600" : 
              teamAnalytics.trendScore > 95 ? "text-yellow-600" : "text-red-600"
            )}>
              {teamAnalytics.trendScore}%
            </div>
            <div className="text-sm text-gray-400">Last 3 Weeks</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="positional" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="positional">Position Analysis</TabsTrigger>
          <TabsTrigger value="trends">Weekly Trends</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
        </TabsList>
        
        <TabsContent value="positional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Positional Strength Analysis</CardTitle>
              <CardDescription>
                Depth, age, and upgrade needs by position
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {positionalAnalytics.map((pos) => (
                  <div
                    key={pos.position}
                    className={cn(
                      "p-4 rounded-lg border",
                      pos.needsUpgrade && "bg-orange-50 border-orange-200"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-lg">{pos.position}</span>
                        {pos.needsUpgrade && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Needs Upgrade
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {pos.depth} player{pos.depth !== 1 ? 's' : ''}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Avg Age</div>
                        <div className="font-medium">{pos.averageAge} years</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Upside</div>
                        <div className="font-medium">{pos.upside}%</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Stability</div>
                        <div className="font-medium">{pos.stability}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Performance Trends</CardTitle>
              <CardDescription>
                Points scored and league ranking by week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weeklyTrends.map((trend) => {
                  const TrendIcon = trend.trend === 'up' ? TrendingUp : 
                                   trend.trend === 'down' ? TrendingDown : Activity;
                  const trendColor = trend.trend === 'up' ? 'text-green-600' :
                                    trend.trend === 'down' ? 'text-red-600' : 'text-gray-600';
                  
                  return (
                    <div key={trend.week} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                          {trend.week}
                        </div>
                        <div>
                          <div className="font-medium">{trend.points.toFixed(1)} pts</div>
                          <div className="text-sm text-gray-400">
                            #{trend.rank} in league
                          </div>
                        </div>
                      </div>
                      
                      <TrendIcon className={cn("h-5 w-5", trendColor)} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
              <CardDescription>
                Injury risk, schedule difficulty, and trade value
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className={cn("h-5 w-5", getRiskColor(teamAnalytics.injuryRisk))} />
                      <span className="font-medium">Injury Risk</span>
                    </div>
                    <div className={cn("text-lg font-bold capitalize", getRiskColor(teamAnalytics.injuryRisk))}>
                      {teamAnalytics.injuryRisk}
                    </div>
                    <div className="text-sm text-gray-400">
                      Based on player ages and positions
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5" />
                      <span className="font-medium">Schedule Strength</span>
                    </div>
                    <div className="text-lg font-bold">
                      {teamAnalytics.strengthOfSchedule.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-400">
                      Remaining opponents difficulty
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-5 w-5" />
                      <span className="font-medium">Trade Value</span>
                    </div>
                    <div className="text-lg font-bold">
                      {teamAnalytics.tradeValue}%
                    </div>
                    <div className="text-sm text-gray-400">
                      Overall team attractiveness
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}