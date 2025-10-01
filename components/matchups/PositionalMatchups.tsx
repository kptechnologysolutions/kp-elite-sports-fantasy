'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Users, TrendingUp, TrendingDown, AlertTriangle, 
  Flame, Snowflake, Target, Shield, Zap,
  ChevronDown, ChevronUp, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useSleeperStore from '@/lib/store/useSleeperStore';

export function PositionalMatchups() {
  const {
    myRoster,
    rosters,
    leagueUsers,
    players,
    currentMatchups,
    currentWeek,
    seasonMatchups,
    currentLeague,
    getPlayer
  } = useSleeperStore();
  
  const [selectedPosition, setSelectedPosition] = useState<'QB' | 'RB' | 'WR' | 'TE' | 'FLEX' | 'IDP' | 'ROOKIES'>('RB');
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());
  
  if (!myRoster || !currentMatchups) return null;
  
  // Find my current opponent
  const myMatchup = currentMatchups.find(m => m.roster_id === myRoster.roster_id);
  const opponentMatchup = currentMatchups.find(m => 
    m.matchup_id === myMatchup?.matchup_id && 
    m.roster_id !== myMatchup?.roster_id
  );
  const opponentRoster = rosters.find(r => r.roster_id === opponentMatchup?.roster_id);
  
  // Get league scoring settings
  const scoringSettings = currentLeague?.scoring_settings || {};
  
  // Toggle player expansion
  const togglePlayerExpand = (playerId: string) => {
    const newExpanded = new Set(expandedPlayers);
    if (newExpanded.has(playerId)) {
      newExpanded.delete(playerId);
    } else {
      newExpanded.add(playerId);
    }
    setExpandedPlayers(newExpanded);
  };
  
  // Get detailed player stats based on their actual performance and scoring
  const getPlayerDetailedStats = (playerId: string, week?: number) => {
    const player = getPlayer(playerId);
    if (!player) return null;
    
    // For now, we'll estimate stats based on points scored
    // In production, this would come from actual NFL stats API
    const position = player.position;
    const targetWeek = week || currentWeek;
    
    // Find the player's points for the target week
    let weekPoints = 0;
    if (targetWeek === currentWeek) {
      const matchup = currentMatchups.find(m => m.players?.includes(playerId));
      weekPoints = matchup?.players_points?.[playerId] || 0;
    } else if (seasonMatchups && seasonMatchups.size > 0) {
      const weekMatchups = seasonMatchups.get(targetWeek);
      if (weekMatchups) {
        const matchup = weekMatchups.find(m => m.players?.includes(playerId));
        weekPoints = matchup?.players_points?.[playerId] || 0;
      }
    }
    
    // Estimate stats based on points and position
    // These are rough estimates - actual stats would come from API
    if (position === 'QB') {
      const isGoodGame = weekPoints > 20;
      const isBadGame = weekPoints < 10;
      return {
        pass_yd: Math.max(0, Math.floor(weekPoints * 12)),
        pass_td: weekPoints > 15 ? Math.floor(weekPoints / 8) : 0,
        pass_int: isBadGame ? 1 : 0,
        rush_yd: weekPoints > 25 ? Math.floor(weekPoints * 1.5) : 0,
        rush_td: weekPoints > 30 ? 1 : 0,
        pass_cmp: Math.floor(weekPoints * 1.2),
        pass_att: Math.floor(weekPoints * 1.8),
        pass_2pt: 0,
      };
    } else if (position === 'RB') {
      const touchdowns = weekPoints > 15 ? Math.floor(weekPoints / 10) : 0;
      return {
        rush_yd: Math.max(0, Math.floor((weekPoints - touchdowns * 6) * 10)),
        rush_td: touchdowns,
        rec: weekPoints > 10 ? Math.floor(weekPoints / 5) : 0,
        rec_yd: weekPoints > 10 ? Math.floor(weekPoints * 2) : 0,
        rec_td: 0,
        rush_att: Math.floor(weekPoints * 1.5),
        fum_lost: weekPoints < 5 ? 1 : 0,
      };
    } else if (position === 'WR') {
      const touchdowns = weekPoints > 15 ? Math.floor(weekPoints / 12) : 0;
      const yards = Math.max(0, Math.floor((weekPoints - touchdowns * 6) * 10));
      return {
        rec: Math.floor(weekPoints / 3),
        rec_yd: yards,
        rec_td: touchdowns,
        rec_tgt: Math.floor(weekPoints / 2),
        rush_yd: 0,
        rec_2pt: 0,
      };
    } else if (position === 'TE') {
      const touchdowns = weekPoints > 12 ? 1 : 0;
      return {
        rec: Math.floor(weekPoints / 2.5),
        rec_yd: Math.max(0, Math.floor((weekPoints - touchdowns * 6) * 10)),
        rec_td: touchdowns,
        rec_tgt: Math.floor(weekPoints / 2),
      };
    } else if (['LB', 'DL', 'DB', 'IDP'].includes(position)) {
      // IDP scoring typically values tackles, sacks, and turnovers
      const isBigGame = weekPoints > 15;
      return {
        idp_tkl_solo: Math.floor(weekPoints / 2),
        idp_tkl_ast: Math.floor(weekPoints / 4),
        idp_sack: weekPoints > 10 ? Math.floor(weekPoints / 10) : 0,
        idp_int: isBigGame ? 1 : 0,
        idp_ff: weekPoints > 12 ? 1 : 0,
        idp_fum_rec: 0,
        idp_def_td: weekPoints > 20 ? 1 : 0,
        idp_pass_def: Math.floor(weekPoints / 5),
        idp_tkl_loss: weekPoints > 8 ? 1 : 0,
      };
    }
    
    return {};
  };
  
  // Calculate points from stats based on league scoring
  const calculatePointsFromStats = (stats: any) => {
    let points = 0;
    
    Object.entries(stats).forEach(([stat, value]) => {
      const scoringValue = scoringSettings[stat];
      if (scoringValue && value) {
        points += (value as number) * scoringValue;
      }
    });
    
    return points;
  };
  
  // Calculate player performance metrics
  const getPlayerMetrics = (playerId: string) => {
    const player = getPlayer(playerId);
    if (!player) return null;
    
    // Get current week points
    const currentPoints = myMatchup?.players_points?.[playerId] || 
                         opponentMatchup?.players_points?.[playerId] || 0;
    
    // Get current week detailed stats
    const currentStats = getPlayerDetailedStats(playerId, currentWeek);
    
    // Calculate season average
    let totalPoints = 0;
    let gamesPlayed = 0;
    const weeklyPoints: number[] = [];
    const weeklyStats: any[] = [];
    
    if (seasonMatchups && seasonMatchups.size > 0) {
      for (let week = 1; week < currentWeek; week++) {
        const weekMatchups = seasonMatchups.get(week);
        if (weekMatchups) {
          const matchupWithPlayer = weekMatchups.find(m => 
            m.players?.includes(playerId)
          );
          if (matchupWithPlayer) {
            const weekPoints = matchupWithPlayer.players_points?.[playerId];
            if (weekPoints !== undefined) {
              totalPoints += weekPoints;
              gamesPlayed++;
              weeklyPoints.push(weekPoints);
              const stats = getPlayerDetailedStats(playerId, week);
              if (stats) weeklyStats.push(stats);
            }
          }
        }
      }
    }
    
    const seasonAvg = gamesPlayed > 0 ? totalPoints / gamesPlayed : 0;
    const last3 = weeklyPoints.slice(-3);
    const last3Avg = last3.length > 0 ? last3.reduce((a, b) => a + b, 0) / last3.length : 0;
    
    // Calculate season stat averages
    const seasonStatAvgs: any = {};
    if (weeklyStats.length > 0) {
      const allStatKeys = new Set<string>();
      weeklyStats.forEach(week => Object.keys(week).forEach(key => allStatKeys.add(key)));
      
      allStatKeys.forEach(stat => {
        const statValues = weeklyStats.map(w => w[stat] || 0);
        seasonStatAvgs[stat] = statValues.reduce((a, b) => a + b, 0) / statValues.length;
      });
    }
    
    // Determine trend - only show for players with meaningful performance
    let trend: 'hot' | 'cold' | 'steady' = 'steady';
    // Only mark as hot if averaging 15+ points and significantly above average
    if (last3Avg >= 15 && last3Avg > seasonAvg * 1.3) trend = 'hot';
    // Only mark as cold if they were averaging decent points but dropped significantly
    else if (seasonAvg >= 10 && last3Avg < seasonAvg * 0.6) trend = 'cold';
    
    // Calculate consistency (lower is better)
    const variance = weeklyPoints.length > 0
      ? weeklyPoints.reduce((sum, p) => sum + Math.pow(p - seasonAvg, 2), 0) / weeklyPoints.length
      : 0;
    const consistency = Math.sqrt(variance);
    
    return {
      player,
      currentPoints,
      currentStats,
      seasonAvg,
      seasonStatAvgs,
      last3Avg,
      trend,
      consistency,
      gamesPlayed,
      projection: last3Avg > 0 ? last3Avg : seasonAvg,
      weeklyStats
    };
  };
  
  // Get players by position for both teams
  const getPlayersByPosition = (roster: any, position: string) => {
    if (!roster) return [];
    
    return roster.players
      .map((playerId: string) => getPlayerMetrics(playerId))
      .filter((metrics: any) => {
        if (!metrics) return false;
        if (position === 'FLEX') {
          return ['RB', 'WR', 'TE'].includes(metrics.player.position);
        }
        if (position === 'IDP') {
          return ['LB', 'DL', 'DB', 'IDP'].includes(metrics.player.position);
        }
        if (position === 'ROOKIES') {
          // Rookies are players with 0 years experience
          return metrics.player.years_exp === 0 || metrics.player.years_exp === 1;
        }
        return metrics.player.position === position;
      })
      .sort((a: any, b: any) => b.currentPoints - a.currentPoints);  // Sort by current week performance
  };
  
  const myPlayers = getPlayersByPosition(myRoster, selectedPosition);
  const opponentPlayers = getPlayersByPosition(opponentRoster, selectedPosition);
  
  // Get all league players at this position with their owners
  const getAllLeaguePlayers = (position: string) => {
    const leaguePlayersMap = new Map();
    
    rosters.forEach(roster => {
      const owner = leagueUsers.get(roster.owner_id);
      const isMyRoster = roster.roster_id === myRoster.roster_id;
      const isOpponent = roster.roster_id === opponentRoster?.roster_id;
      
      roster.players.forEach((playerId: string) => {
        const metrics = getPlayerMetrics(playerId);
        if (!metrics) return;
        
        let includePlayer = false;
        if (position === 'FLEX') {
          includePlayer = ['RB', 'WR', 'TE'].includes(metrics.player.position);
        } else if (position === 'IDP') {
          includePlayer = ['LB', 'DL', 'DB', 'IDP'].includes(metrics.player.position);
        } else if (position === 'ROOKIES') {
          includePlayer = metrics.player.years_exp === 0 || metrics.player.years_exp === 1;
        } else {
          includePlayer = metrics.player.position === position;
        }
        
        if (includePlayer) {
          leaguePlayersMap.set(playerId, {
            ...metrics,
            owner: owner?.display_name || 'Unknown',
            ownerId: roster.owner_id,
            rosterId: roster.roster_id,
            isMyPlayer: isMyRoster,
            isOpponent: isOpponent
          });
        }
      });
    });
    
    return Array.from(leaguePlayersMap.values())
      .sort((a, b) => b.currentPoints - a.currentPoints);  // Sort by current week performance
  };
  
  const allLeaguePlayers = getAllLeaguePlayers(selectedPosition);
  
  // Calculate position strength
  const myPositionStrength = myPlayers.reduce((sum: number, p: any) => sum + p.seasonAvg, 0);
  const oppPositionStrength = opponentPlayers.reduce((sum: number, p: any) => sum + p.seasonAvg, 0);
  const strengthDiff = myPositionStrength - oppPositionStrength;
  
  // Format stat display based on position
  const getStatDisplay = (player: any, stats: any) => {
    if (!stats) return [];
    
    const position = player.position;
    
    if (position === 'QB') {
      return [
        { label: 'Pass', value: `${stats.pass_cmp || 0}/${stats.pass_att || 0}`, key: 'passing' },
        { label: 'Yards', value: `${stats.pass_yd || 0}`, key: 'pass_yd' },
        { label: 'TD', value: `${stats.pass_td || 0}`, key: 'pass_td', highlight: stats.pass_td > 0 },
        { label: 'INT', value: `${stats.pass_int || 0}`, key: 'pass_int', negative: stats.pass_int > 0 },
        { label: 'Rush', value: `${stats.rush_yd || 0}`, key: 'rush_yd' },
      ];
    } else if (position === 'RB') {
      return [
        { label: 'Carries', value: `${stats.rush_att || 0}`, key: 'rush_att' },
        { label: 'Rush Yds', value: `${stats.rush_yd || 0}`, key: 'rush_yd' },
        { label: 'Rec', value: `${stats.rec || 0}`, key: 'rec' },
        { label: 'Rec Yds', value: `${stats.rec_yd || 0}`, key: 'rec_yd' },
        { label: 'TD', value: `${(stats.rush_td || 0) + (stats.rec_td || 0)}`, key: 'td', highlight: (stats.rush_td || 0) + (stats.rec_td || 0) > 0 },
      ];
    } else if (position === 'WR' || position === 'TE') {
      return [
        { label: 'Targets', value: `${stats.rec_tgt || 0}`, key: 'rec_tgt' },
        { label: 'Rec', value: `${stats.rec || 0}`, key: 'rec' },
        { label: 'Yards', value: `${stats.rec_yd || 0}`, key: 'rec_yd' },
        { label: 'TD', value: `${stats.rec_td || 0}`, key: 'rec_td', highlight: stats.rec_td > 0 },
        { label: 'Avg', value: stats.rec > 0 ? `${(stats.rec_yd / stats.rec).toFixed(1)}` : '0', key: 'avg' },
      ];
    } else if (['LB', 'DL', 'DB', 'IDP'].includes(position)) {
      return [
        { label: 'Tackles', value: `${(stats.idp_tkl_solo || 0) + (stats.idp_tkl_ast || 0)}`, key: 'tackles' },
        { label: 'Sacks', value: `${stats.idp_sack || 0}`, key: 'idp_sack', highlight: stats.idp_sack > 0 },
        { label: 'INT', value: `${stats.idp_int || 0}`, key: 'idp_int', highlight: stats.idp_int > 0 },
        { label: 'FF', value: `${stats.idp_ff || 0}`, key: 'idp_ff', highlight: stats.idp_ff > 0 },
        { label: 'PD', value: `${stats.idp_pass_def || 0}`, key: 'idp_pass_def' },
      ];
    }
    
    return [];
  };

  const PlayerCard = ({ metrics, showOwner = false }: any) => {
    const { player, currentPoints, currentStats, seasonAvg, seasonStatAvgs, last3Avg, trend, consistency, projection } = metrics;
    const isExpanded = expandedPlayers.has(player.player_id);
    const statDisplay = getStatDisplay(player, currentStats);
    
    return (
      <div className={cn(
        "rounded-lg border transition-all",
        metrics.isMyPlayer && "bg-primary/5 border-primary/20",
        metrics.isOpponent && "bg-orange-500/5 border-orange-500/20",
        !metrics.isMyPlayer && !metrics.isOpponent && "bg-background"
      )}>
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2">
                  {player.first_name} {player.last_name}
                  {(player.years_exp === 0 || player.years_exp === 1) && (
                    <Badge variant="secondary" className="text-xs h-4">R</Badge>
                  )}
                  {trend === 'hot' && <Flame className="h-3 w-3 text-orange-500" />}
                  {trend === 'cold' && <Snowflake className="h-3 w-3 text-blue-500" />}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{player.position} • {player.team || 'FA'}</span>
                  {player.injury_status && (
                    <Badge variant="destructive" className="text-xs h-4">
                      {player.injury_status}
                    </Badge>
                  )}
                  {showOwner && (
                    <>
                      <span>•</span>
                      <span className={cn(
                        "font-medium",
                        metrics.isMyPlayer && "text-primary",
                        metrics.isOpponent && "text-orange-500"
                      )}>
                        {metrics.owner}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className={cn(
                  "text-lg font-bold",
                  currentPoints >= 20 && "text-green-500",  // Only green for 20+ point games
                  currentPoints >= 15 && currentPoints < 20 && "text-blue-500",  // Good performance
                  currentPoints < 5 && currentPoints > 0 && "text-red-500"  // Poor performance
                )}>
                  {currentPoints.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Week {currentWeek}</div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => togglePlayerExpand(player.player_id)}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {/* Current Week Stats */}
          {statDisplay.length > 0 && (
            <div className="grid grid-cols-5 gap-1 text-xs mb-2">
              {statDisplay.map((stat) => (
                <div key={stat.key} className="text-center">
                  <div className="text-muted-foreground">{stat.label}</div>
                  <div className={cn(
                    "font-medium",
                    stat.highlight && "text-green-500",
                    stat.negative && "text-red-500"
                  )}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Points Summary */}
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div>
              <div className="text-muted-foreground">Avg</div>
              <div className="font-medium">{seasonAvg.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">L3</div>
              <div className={cn(
                "font-medium",
                last3Avg > seasonAvg * 1.1 && "text-green-500",
                last3Avg < seasonAvg * 0.9 && "text-orange-500"
              )}>
                {last3Avg.toFixed(1)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Proj</div>
              <div className="font-medium">{projection.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Var</div>
              <div className={cn(
                "font-medium",
                consistency < 5 && "text-green-500",
                consistency > 10 && "text-red-500"
              )}>
                {consistency.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Expanded Season Stats */}
        {isExpanded && seasonStatAvgs && (
          <div className="border-t p-3 bg-muted/30">
            <div className="text-xs font-medium mb-2 flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Season Averages
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {getStatDisplay(player, seasonStatAvgs).map((stat) => (
                <div key={stat.key} className="flex justify-between">
                  <span className="text-muted-foreground">{stat.label}:</span>
                  <span className={cn(
                    "font-medium",
                    stat.highlight && "text-green-500",
                    stat.negative && "text-red-500"
                  )}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Scoring Breakdown */}
            <div className="mt-3 pt-3 border-t">
              <div className="text-xs font-medium mb-1">Points Breakdown</div>
              <div className="text-xs text-muted-foreground">
                Based on league scoring: {calculatePointsFromStats(currentStats).toFixed(1)} pts
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Positional Matchups
            </CardTitle>
            <CardDescription>
              Compare your players vs opponent and league by position
            </CardDescription>
          </div>
          {opponentRoster && (
            <div className="text-right">
              <div className="text-sm font-medium">
                vs {leagueUsers.get(opponentRoster.owner_id)?.display_name}
              </div>
              <div className="text-xs text-muted-foreground">
                Week {currentWeek} Opponent
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Position Tabs */}
        <Tabs value={selectedPosition} onValueChange={(v: any) => setSelectedPosition(v)}>
          <TabsList className="grid grid-cols-7 w-full">
            <TabsTrigger value="QB">QB</TabsTrigger>
            <TabsTrigger value="RB">RB</TabsTrigger>
            <TabsTrigger value="WR">WR</TabsTrigger>
            <TabsTrigger value="TE">TE</TabsTrigger>
            <TabsTrigger value="FLEX">FLEX</TabsTrigger>
            <TabsTrigger value="IDP">IDP</TabsTrigger>
            <TabsTrigger value="ROOKIES">Rookies</TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedPosition} className="space-y-4">
            {/* Position Strength Comparison */}
            {selectedPosition !== 'ROOKIES' ? (
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Your {selectedPosition}s</CardTitle>
                  </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{myPositionStrength.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">
                    Total avg points/week
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-orange-500/5 border-orange-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Opponent {selectedPosition}s</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{oppPositionStrength.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">
                    Total avg points/week
                  </div>
                </CardContent>
              </Card>
            </div>
            ) : (
              <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Star className="h-4 w-4 text-purple-500" />
                    Rookie Comparison - Week {currentWeek}
                  </CardTitle>
                  <CardDescription>
                    First and second year players across your league
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
            
            {/* Advantage Alert */}
            {Math.abs(strengthDiff) > 5 && (
              <Alert variant={strengthDiff > 0 ? "default" : "destructive"}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You have a {strengthDiff > 0 ? 'significant advantage' : 'significant disadvantage'} 
                  at {selectedPosition} ({strengthDiff > 0 ? '+' : ''}{strengthDiff.toFixed(1)} points/week)
                </AlertDescription>
              </Alert>
            )}
            
            {/* Head to Head Comparison */}
            {selectedPosition !== 'ROOKIES' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Your {selectedPosition}s
                  </h3>
                <div className="space-y-2">
                  {myPlayers.length > 0 ? (
                    myPlayers.map((metrics: any) => (
                      <PlayerCard key={metrics.player.player_id} metrics={metrics} />
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground p-3 border rounded-lg">
                      No {selectedPosition}s on roster
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-orange-500" />
                  Opponent {selectedPosition}s
                </h3>
                <div className="space-y-2">
                  {opponentPlayers.length > 0 ? (
                    opponentPlayers.map((metrics: any) => (
                      <PlayerCard key={metrics.player.player_id} metrics={metrics} />
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground p-3 border rounded-lg">
                      No {selectedPosition}s on roster
                    </div>
                  )}
                </div>
              </div>
            </div>
            )}
            
            {/* League-wide Comparison */}
            <div>
              <h3 className="font-medium mb-2">All League {selectedPosition}s</h3>
              <div className="space-y-2">
                {allLeaguePlayers.slice(0, 20).map((metrics: any) => (
                  <PlayerCard 
                    key={metrics.player.player_id} 
                    metrics={metrics} 
                    showOwner={true}
                  />
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}