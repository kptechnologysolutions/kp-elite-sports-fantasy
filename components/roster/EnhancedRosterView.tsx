'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Flame, Snowflake, TrendingUp, TrendingDown, AlertTriangle,
  Star, ArrowUpDown, Info, Target, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SleeperPlayer, SleeperMatchup, SleeperRoster } from '@/lib/services/sleeperService';
import { analyticsService, PlayerAnalytics } from '@/lib/services/analyticsService';
import { useEffect, useState } from 'react';

interface EnhancedRosterViewProps {
  roster: SleeperRoster;
  matchup: SleeperMatchup | null;
  players: Map<string, SleeperPlayer>;
  currentWeek: number;
  leagueId: string;
  rosterPositions: string[];
}

export function EnhancedRosterView({
  roster,
  matchup,
  players,
  currentWeek,
  leagueId,
  rosterPositions
}: EnhancedRosterViewProps) {
  const [playerAnalytics, setPlayerAnalytics] = useState<Map<string, PlayerAnalytics>>(new Map());
  const [showRecommendations, setShowRecommendations] = useState(false);
  
  useEffect(() => {
    // Analyze each player
    const analytics = new Map<string, PlayerAnalytics>();
    
    roster.players.forEach(playerId => {
      const player = players.get(playerId);
      if (!player) return;
      
      // Get current week points
      const currentPoints = matchup?.players_points?.[playerId] || 0;
      
      // For now, generate mock weekly scores (in production, fetch from API)
      const weeklyScores = Array.from({ length: currentWeek - 1 }, () => 
        Math.random() * 20 + 5
      );
      weeklyScores.push(currentPoints);
      
      const playerAnalytics = analyticsService.getPlayerAnalytics(
        player,
        weeklyScores,
        currentPoints
      );
      
      analytics.set(playerId, playerAnalytics);
    });
    
    setPlayerAnalytics(analytics);
  }, [roster, matchup, players, currentWeek]);
  
  // Get lineup recommendations
  const getLineupSwaps = () => {
    const starterAnalytics = roster.starters
      .map(id => playerAnalytics.get(id))
      .filter(Boolean) as PlayerAnalytics[];
    
    const benchIds = roster.players.filter(p => !roster.starters.includes(p));
    const benchAnalytics = benchIds
      .map(id => playerAnalytics.get(id))
      .filter(Boolean) as PlayerAnalytics[];
    
    return analyticsService.getLineupRecommendations(starterAnalytics, benchAnalytics);
  };
  
  const swaps = showRecommendations ? getLineupSwaps() : { swaps: [] };
  
  // Calculate bench points
  const benchPlayerIds = roster.players.filter(p => !roster.starters.includes(p));
  const totalBenchPoints = benchPlayerIds.reduce((sum, playerId) => {
    return sum + (matchup?.players_points?.[playerId] || 0);
  }, 0);

  // TODO: Add trend insights in a separate component later
  
  const PlayerRow = ({ 
    playerId, 
    position, 
    isStarter = true 
  }: { 
    playerId: string | null;
    position: string;
    isStarter?: boolean;
  }) => {
    const player = playerId ? players.get(playerId) : null;
    const analytics = playerId ? playerAnalytics.get(playerId) : null;
    const points = matchup?.players_points?.[playerId || ''] || 0;
    
    return (
      <div className={cn(
        "rounded-lg border transition-all",
        !isStarter && "opacity-80 bg-muted/30",
        analytics?.isHot && "border-orange-500/50 bg-orange-500/5",
        analytics?.isCold && "border-blue-500/50 bg-blue-500/5"
      )}>
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <Badge 
                variant={isStarter ? "default" : "outline"} 
                className="min-w-[60px] justify-center"
              >
                {position}
              </Badge>
              {analytics && (
                <div className="flex gap-0.5">
                  {analytics.isHot && <Flame className="h-3 w-3 text-orange-500" />}
                  {analytics.isCold && <Snowflake className="h-3 w-3 text-blue-500" />}
                  {analytics.isBoomBust && <Target className="h-3 w-3 text-purple-500" />}
                </div>
              )}
            </div>
            
            <div className="flex-1">
              {player ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {player.first_name} {player.last_name}
                    </span>
                    {analytics?.performance.trend === 'hot' && (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    )}
                    {analytics?.performance.trend === 'cold' && (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{player.team || 'FA'}</span>
                    {player.injury_status && (
                      <Badge variant="destructive" className="text-xs">
                        {player.injury_status}
                      </Badge>
                    )}
                    {analytics && (
                      <span className="text-xs">
                        Avg: {analytics.performance.seasonAverage.toFixed(1)} | 
                        L3: {analytics.performance.last3WeeksAverage.toFixed(1)}
                      </span>
                  )}
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">Empty Slot</div>
            )}
          </div>
          
          <div className="text-right">
          <div className="text-lg font-bold flex items-center gap-1">
            {points.toFixed(1)}
            {analytics && points > analytics.performance.seasonAverage * 1.2 && (
              <Star className="h-3 w-3 text-yellow-500" />
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {analytics && analytics.performance.projectedPoints && (
              <span>Proj: {analytics.performance.projectedPoints.toFixed(1)}</span>
            )}
          </div>
          {analytics && analytics.performance.performanceRating > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all",
                    analytics.performance.performanceRating > 70 ? "bg-green-500" :
                    analytics.performance.performanceRating > 40 ? "bg-yellow-500" :
                    "bg-red-500"
                  )}
                  style={{ width: `${analytics.performance.performanceRating}%` }}
                />
              </div>
              <span className="text-xs">{analytics.performance.performanceRating.toFixed(0)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      {/* Lineup Recommendations */}
      {swaps.swaps.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Lineup Optimization Suggestions:</div>
            {swaps.swaps.map((swap, idx) => (
              <div key={idx} className="text-sm mb-1">
                • {swap.reason}
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowRecommendations(!showRecommendations)}
        >
          <Activity className="h-4 w-4 mr-2" />
          {showRecommendations ? 'Hide' : 'Show'} Analysis
        </Button>
      </div>
      
      {/* Starters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Starting Lineup</CardTitle>
              <CardDescription>
                Week {currentWeek} • {matchup ? matchup.points.toFixed(1) : '0.0'} points
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">
                <Flame className="h-3 w-3 mr-1 text-orange-500" />
                Hot
              </Badge>
              <Badge variant="outline">
                <Snowflake className="h-3 w-3 mr-1 text-blue-500" />
                Cold
              </Badge>
              <Badge variant="outline">
                <Target className="h-3 w-3 mr-1 text-purple-500" />
                Volatile
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {rosterPositions.map((position, idx) => (
            <PlayerRow
              key={idx}
              playerId={roster.starters[idx]}
              position={position}
              isStarter={true}
            />
          ))}
          
          <div className="pt-3 border-t">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Starter Points</span>
              <span className="text-2xl font-bold">{matchup?.points.toFixed(1) || '0.0'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Bench */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bench Players</CardTitle>
              <CardDescription>
                {benchPlayerIds.length} players • {totalBenchPoints.toFixed(1)} points
              </CardDescription>
            </div>
            {totalBenchPoints > 0 && (
              <Badge variant={totalBenchPoints > 20 ? "destructive" : "secondary"}>
                {totalBenchPoints > 20 ? '⚠️ High bench points!' : 'Bench scoring'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {benchPlayerIds.length > 0 ? (
            <>
              {benchPlayerIds.map(playerId => {
                const player = players.get(playerId);
                return (
                  <PlayerRow
                    key={playerId}
                    playerId={playerId}
                    position={player?.position || 'BN'}
                    isStarter={false}
                  />
                );
              })}
              
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Bench Points</span>
                  <span className="text-xl font-bold text-muted-foreground">
                    {totalBenchPoints.toFixed(1)}
                  </span>
                </div>
                {totalBenchPoints > matchup?.points! * 0.5 && (
                  <Alert className="mt-2" variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Your bench scored {((totalBenchPoints / matchup!.points) * 100).toFixed(0)}% 
                      of your starter points. Consider lineup changes for next week.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No bench players
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Performance Summary */}
      {showRecommendations && (
        <Card>
          <CardHeader>
            <CardTitle>Player Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from(playerAnalytics.values())
              .filter(a => a.performance.recommendations.length > 0)
              .map(analytics => (
                <div key={analytics.player.player_id} className="p-2 rounded border">
                  <div className="font-medium text-sm">
                    {analytics.player.first_name} {analytics.player.last_name}
                  </div>
                  <div className="space-y-1 mt-1">
                    {analytics.performance.recommendations.map((rec, idx) => (
                      <div key={idx} className="text-xs text-muted-foreground">
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}