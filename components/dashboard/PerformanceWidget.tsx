'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Medal,
  Flame,
  Snowflake,
  Activity,
  Calendar,
  BarChart3
} from 'lucide-react';
import useSleeperStore from '@/lib/store/useSleeperStore';
import { scoringService } from '@/lib/services/scoringService';
import { cn } from '@/lib/utils';

interface PlayerPerformance {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  avgPoints: number;
  lastWeekPoints: number;
  trend: 'hot' | 'cold' | 'steady';
  consistency: number;
  rosterId: number;
}

interface TeamPerformance {
  rosterId: number;
  teamName: string;
  record: string;
  pointsFor: number;
  pointsAgainst: number;
  avgPointsFor: number;
  avgPointsAgainst: number;
  powerRanking: number;
  momentum: 'up' | 'down' | 'stable';
  playoffs: boolean;
}

export function PerformanceWidget() {
  const [viewMode, setViewMode] = useState<'players' | 'teams'>('players');
  
  const {
    currentLeague,
    leagueScoring,
    rosters,
    leagueUsers,
    players,
    seasonMatchups,
    currentWeek,
    myRoster
  } = useSleeperStore();
  
  // Calculate player performances
  const playerPerformances = useMemo(() => {
    if (!myRoster || seasonMatchups.size === 0) return [];
    
    const performances: PlayerPerformance[] = [];
    
    // Get all matchups for my roster
    myRoster.players.forEach(playerId => {
      const player = players.get(playerId);
      if (!player) return;
      
      const weeklyPoints: number[] = [];
      
      // Collect points from all weeks
      for (let week = 1; week <= currentWeek; week++) {
        const weekMatchups = seasonMatchups.get(week) || [];
        const myMatchup = weekMatchups.find(m => m.roster_id === myRoster.roster_id);
        
        if (myMatchup && myMatchup.players_points[playerId]) {
          weeklyPoints.push(myMatchup.players_points[playerId]);
        }
      }
      
      if (weeklyPoints.length === 0) return;
      
      const avgPoints = weeklyPoints.reduce((sum, pts) => sum + pts, 0) / weeklyPoints.length;
      const lastWeekPoints = weeklyPoints[weeklyPoints.length - 1] || 0;
      
      // Calculate trend (last 3 weeks vs season average)
      const recentWeeks = weeklyPoints.slice(-3);
      const recentAvg = recentWeeks.reduce((sum, pts) => sum + pts, 0) / recentWeeks.length;
      
      let trend: PlayerPerformance['trend'] = 'steady';
      if (recentAvg > avgPoints * 1.15) trend = 'hot';
      else if (recentAvg < avgPoints * 0.85) trend = 'cold';
      
      // Calculate consistency (lower variance = higher consistency)
      const variance = weeklyPoints.reduce((sum, pts) => {
        return sum + Math.pow(pts - avgPoints, 2);
      }, 0) / weeklyPoints.length;
      const consistency = Math.max(0, 100 - (Math.sqrt(variance) / avgPoints) * 100);
      
      performances.push({
        playerId,
        playerName: player.full_name,
        position: player.position,
        team: player.team || 'FA',
        avgPoints: Math.round(avgPoints * 100) / 100,
        lastWeekPoints: Math.round(lastWeekPoints * 100) / 100,
        trend,
        consistency: Math.round(consistency),
        rosterId: myRoster.roster_id
      });
    });
    
    return performances.sort((a, b) => b.avgPoints - a.avgPoints);
  }, [myRoster, seasonMatchups, players, currentWeek]);
  
  // Calculate team performances
  const teamPerformances = useMemo(() => {
    const performances: TeamPerformance[] = [];
    
    rosters.forEach(roster => {
      const owner = roster.owner_id ? leagueUsers.get(roster.owner_id) : undefined;
      const teamName = owner?.team_name || owner?.display_name || `Team ${roster.roster_id}`;
      
      const wins = roster.settings?.wins || 0;
      const losses = roster.settings?.losses || 0;
      const ties = roster.settings?.ties || 0;
      const pointsFor = roster.settings?.fpts || 0;
      const pointsAgainst = roster.settings?.fpts_against || 0;
      
      const gamesPlayed = wins + losses + ties;
      const avgPointsFor = gamesPlayed > 0 ? pointsFor / gamesPlayed : 0;
      const avgPointsAgainst = gamesPlayed > 0 ? pointsAgainst / gamesPlayed : 0;
      
      // Simple power ranking based on points and record
      const winPct = gamesPlayed > 0 ? wins / gamesPlayed : 0;
      const powerRanking = winPct * 0.6 + (avgPointsFor / 150) * 0.4; // Normalize to 150 avg
      
      // Calculate momentum (last 3 weeks trend)
      let momentum: TeamPerformance['momentum'] = 'stable';
      // This would need more complex calculation with historical data
      
      // Playoff likelihood (simplified)
      const playoffs = winPct > 0.5 || avgPointsFor > 120;
      
      performances.push({
        rosterId: roster.roster_id,
        teamName,
        record: `${wins}-${losses}${ties > 0 ? `-${ties}` : ''}`,
        pointsFor,
        pointsAgainst,
        avgPointsFor: Math.round(avgPointsFor * 100) / 100,
        avgPointsAgainst: Math.round(avgPointsAgainst * 100) / 100,
        powerRanking: Math.round(powerRanking * 100),
        momentum,
        playoffs
      });
    });
    
    return performances.sort((a, b) => b.powerRanking - a.powerRanking);
  }, [rosters, leagueUsers]);
  
  const getTrendIcon = (trend: PlayerPerformance['trend']) => {
    switch (trend) {
      case 'hot': return Flame;
      case 'cold': return Snowflake;
      default: return Activity;
    }
  };
  
  const getTrendColor = (trend: PlayerPerformance['trend']) => {
    switch (trend) {
      case 'hot': return 'text-red-500';
      case 'cold': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };
  
  const getConsistencyColor = (consistency: number) => {
    if (consistency >= 80) return 'text-green-600';
    if (consistency >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  if (!currentLeague) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-400">
            Please select a league to view performance data
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Analysis
            </CardTitle>
            <CardDescription>
              Track player and team performance trends
              {leagueScoring && (
                <span className="block text-xs text-orange-500 mt-1">
                  • Calculated using {leagueScoring.type} scoring
                  {leagueScoring.isIDP && " with IDP stats"}
                </span>
              )}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'players' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('players')}
            >
              Players
            </Button>
            <Button
              variant={viewMode === 'teams' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('teams')}
            >
              Teams
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {viewMode === 'players' ? (
          <div className="space-y-3">
            {playerPerformances.slice(0, 10).map((player) => {
              const TrendIcon = getTrendIcon(player.trend);
              
              return (
                <div
                  key={player.playerId}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <TrendIcon className={cn("h-4 w-4", getTrendColor(player.trend))} />
                      <Badge variant="outline" className="text-xs">
                        {player.position}
                      </Badge>
                    </div>
                    
                    <div>
                      <div className="font-medium">{player.playerName}</div>
                      <div className="text-sm text-gray-400">
                        {player.team}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold">{player.avgPoints}</div>
                      <div className="text-xs text-gray-400">Avg PPG</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-medium">{player.lastWeekPoints}</div>
                      <div className="text-xs text-gray-400">Last Week</div>
                    </div>
                    
                    <div className="text-right min-w-[60px]">
                      <div className={cn("font-medium", getConsistencyColor(player.consistency))}>
                        {player.consistency}%
                      </div>
                      <div className="text-xs text-gray-400">Consistent</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {teamPerformances.map((team, index) => (
              <div
                key={team.rosterId}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  team.rosterId === myRoster?.roster_id && "bg-primary/5 border-primary/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {index < 3 && (
                      <Medal className={cn(
                        "h-4 w-4",
                        index === 0 ? "text-yellow-500" :
                        index === 1 ? "text-gray-400" : "text-amber-600"
                      )} />
                    )}
                    <span className="text-sm font-medium text-gray-400">
                      #{index + 1}
                    </span>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{team.teamName}</span>
                      {team.rosterId === myRoster?.roster_id && (
                        <Badge variant="secondary" className="text-xs">You</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      {team.record} • {team.avgPointsFor} PPG
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold">{team.powerRanking}</div>
                    <div className="text-xs text-gray-400">Power</div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    {team.playoffs && (
                      <Badge variant="default" className="text-xs">
                        <Trophy className="h-3 w-3 mr-1" />
                        Playoff
                      </Badge>
                    )}
                    
                    <Badge 
                      variant={team.momentum === 'up' ? 'default' : 
                              team.momentum === 'down' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {team.momentum === 'up' ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : team.momentum === 'down' ? (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      ) : (
                        <Target className="h-3 w-3 mr-1" />
                      )}
                      {team.momentum}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}