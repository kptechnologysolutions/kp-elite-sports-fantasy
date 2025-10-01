'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle,
  Activity, Target, Trophy, Clock, Calendar, Shield, Star,
  ChevronUp, ChevronDown, Filter, Search, RefreshCw
} from 'lucide-react';
import { Team, Player } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FullRosterViewProps {
  team: Team;
  onPlayerClick?: (player: Player) => void;
  onLineupChange?: (players: Player[]) => void;
}

// Extended player stats interface
interface ExtendedPlayerStats {
  season: {
    gamesPlayed: number;
    totalPoints: number;
    avgPoints: number;
    projectedTotal: number;
    rank: number;
    percentStarted: number;
    consistency: number; // 0-100 score
  };
  recent: {
    last3Games: number[];
    trend: 'up' | 'down' | 'stable';
    trendPercentage: number;
  };
  matchup: {
    opponentRank: number; // Defense rank vs position
    projection: number;
    ceiling: number;
    floor: number;
    boom: number; // % chance of 20+ points
    bust: number; // % chance of <10 points
  };
  ownership: {
    rostered: number; // % rostered across leagues
    starting: number; // % started this week
    trending: 'add' | 'drop' | 'hold';
  };
}

// Position limits for lineup
const POSITION_LIMITS = {
  QB: { starters: 1, max: 3 },
  RB: { starters: 2, max: 6 },
  WR: { starters: 2, max: 6 },
  TE: { starters: 1, max: 3 },
  FLEX: { starters: 1, max: 0 }, // Flex from RB/WR/TE
  K: { starters: 1, max: 2 },
  DST: { starters: 1, max: 2 },
  BN: { starters: 0, max: 7 }
};

export function FullRosterView({ team, onPlayerClick, onLineupChange }: FullRosterViewProps) {
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'points' | 'projected' | 'trend' | 'matchup'>('points');
  const [viewMode, setViewMode] = useState<'roster' | 'lineup' | 'stats'>('roster');
  const [lineup, setLineup] = useState<Player[]>(team.players.filter(p => p.status?.isActive));

  // Generate extended stats for each player
  const getExtendedStats = (player: Player): ExtendedPlayerStats => {
    const basePoints = player.stats?.fantasyPoints || 0;
    const projected = player.stats?.projectedPoints || 0;
    
    // Generate realistic recent games
    const variance = basePoints * 0.3;
    const last3Games = [
      Math.max(0, basePoints + (Math.random() - 0.5) * variance),
      Math.max(0, basePoints + (Math.random() - 0.5) * variance),
      Math.max(0, basePoints + (Math.random() - 0.5) * variance)
    ].map(p => Math.round(p * 10) / 10);
    
    const avg3Games = last3Games.reduce((a, b) => a + b, 0) / 3;
    const trend = avg3Games > basePoints ? 'up' : avg3Games < basePoints ? 'down' : 'stable';
    
    return {
      season: {
        gamesPlayed: 10,
        totalPoints: Math.round(basePoints * 10),
        avgPoints: basePoints,
        projectedTotal: Math.round(projected * 7 + basePoints * 10), // Rest of season
        rank: Math.floor(Math.random() * 30) + 1,
        percentStarted: Math.floor(Math.random() * 40) + 60,
        consistency: Math.floor(Math.random() * 30) + 70
      },
      recent: {
        last3Games,
        trend: trend as any,
        trendPercentage: Math.round((avg3Games - basePoints) / basePoints * 100)
      },
      matchup: {
        opponentRank: Math.floor(Math.random() * 32) + 1,
        projection: projected,
        ceiling: projected * 1.4,
        floor: projected * 0.6,
        boom: Math.floor(Math.random() * 30) + 20,
        bust: Math.floor(Math.random() * 20) + 10
      },
      ownership: {
        rostered: Math.floor(Math.random() * 30) + 70,
        starting: Math.floor(Math.random() * 40) + 50,
        trending: Math.random() > 0.5 ? 'add' : Math.random() > 0.5 ? 'drop' : 'hold' as any
      }
    };
  };

  // Filter and sort players
  const filteredPlayers = team.players.filter(p => 
    selectedPosition === 'ALL' || p.position === selectedPosition
  );

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    const aStats = getExtendedStats(a);
    const bStats = getExtendedStats(b);
    
    switch(sortBy) {
      case 'projected':
        return (b.stats?.projectedPoints || 0) - (a.stats?.projectedPoints || 0);
      case 'trend':
        return bStats.recent.trendPercentage - aStats.recent.trendPercentage;
      case 'matchup':
        return aStats.matchup.opponentRank - bStats.matchup.opponentRank;
      default:
        return (b.stats?.fantasyPoints || 0) - (a.stats?.fantasyPoints || 0);
    }
  });

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'questionable': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'doubtful': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'out': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable', percentage: number) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getMatchupColor = (rank: number) => {
    if (rank <= 10) return 'text-green-600 bg-green-50 dark:bg-green-950';
    if (rank <= 20) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950';
    return 'text-red-600 bg-red-50 dark:bg-red-950';
  };

  // Calculate lineup stats
  const lineupStats = {
    totalProjected: lineup.reduce((sum, p) => sum + (p.stats?.projectedPoints || 0), 0),
    totalActual: lineup.reduce((sum, p) => sum + (p.stats?.fantasyPoints || 0), 0),
    byPosition: Object.entries(POSITION_LIMITS).reduce((acc, [pos, limits]) => {
      const posPlayers = lineup.filter(p => p.position === pos || 
        (pos === 'FLEX' && ['RB', 'WR', 'TE'].includes(p.position)));
      acc[pos] = {
        count: posPlayers.length,
        required: limits.starters,
        points: posPlayers.reduce((sum, p) => sum + (p.stats?.fantasyPoints || 0), 0)
      };
      return acc;
    }, {} as any)
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="roster">Full Roster</SelectItem>
              <SelectItem value="lineup">Active Lineup</SelectItem>
              <SelectItem value="stats">Season Stats</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPosition} onValueChange={setSelectedPosition}>
            <SelectTrigger className="w-[120px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Positions</SelectItem>
              <SelectItem value="QB">QB</SelectItem>
              <SelectItem value="RB">RB</SelectItem>
              <SelectItem value="WR">WR</SelectItem>
              <SelectItem value="TE">TE</SelectItem>
              <SelectItem value="K">K</SelectItem>
              <SelectItem value="DST">DST</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="points">Sort by Points</SelectItem>
              <SelectItem value="projected">Sort by Projected</SelectItem>
              <SelectItem value="trend">Sort by Trend</SelectItem>
              <SelectItem value="matchup">Sort by Matchup</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Sync Roster
        </Button>
      </div>

      {/* Lineup Summary (Always visible) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Lineup Overview</CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Projected:</span>
                <span className="ml-2 font-bold">{lineupStats.totalProjected.toFixed(1)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Actual:</span>
                <span className="ml-2 font-bold text-green-600">{lineupStats.totalActual.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {Object.entries(lineupStats.byPosition).map(([pos, stats]: [string, any]) => (
              <div key={pos} className="text-center">
                <div className={cn(
                  "text-xs font-medium mb-1",
                  stats.count < stats.required ? "text-red-500" : "text-muted-foreground"
                )}>
                  {pos}
                </div>
                <div className="text-sm font-bold">
                  {stats.count}/{stats.required}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stats.points.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
        <TabsContent value="roster" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Complete Roster</CardTitle>
              <CardDescription>
                All {team.players.length} players with detailed stats and projections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">Slot</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Points</TableHead>
                      <TableHead className="text-center">Projected</TableHead>
                      <TableHead className="text-center">3-Game Avg</TableHead>
                      <TableHead className="text-center">Trend</TableHead>
                      <TableHead className="text-center">Matchup</TableHead>
                      <TableHead className="text-center">Start %</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPlayers.map((player, idx) => {
                      const extStats = getExtendedStats(player);
                      const isStarter = idx < 9; // First 9 are starters
                      
                      return (
                        <TableRow 
                          key={player.id}
                          className={cn(
                            "cursor-pointer hover:bg-muted/50",
                            !isStarter && "opacity-75"
                          )}
                          onClick={() => onPlayerClick?.(player)}
                        >
                          <TableCell>
                            <Badge variant={isStarter ? "default" : "outline"}>
                              {isStarter ? player.position : 'BN'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{player.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {player.team} • #{player.jerseyNumber}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(player.status?.gameStatus || 'healthy')}
                              {player.injuryStatus && (
                                <span className="text-xs text-muted-foreground">
                                  {player.injuryStatus.type}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {player.stats?.fantasyPoints?.toFixed(1) || '0.0'}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col">
                              <span>{extStats.matchup.projection.toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground">
                                {extStats.matchup.floor.toFixed(0)}-{extStats.matchup.ceiling.toFixed(0)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col">
                              <span>{(extStats.recent.last3Games.reduce((a,b) => a+b, 0) / 3).toFixed(1)}</span>
                              <div className="flex justify-center gap-1 mt-1">
                                {extStats.recent.last3Games.map((pts, i) => (
                                  <span key={i} className="text-xs text-muted-foreground">
                                    {pts.toFixed(0)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {getTrendIcon(extStats.recent.trend, extStats.recent.trendPercentage)}
                              <span className={cn(
                                "text-xs",
                                extStats.recent.trend === 'up' ? 'text-green-600' : 
                                extStats.recent.trend === 'down' ? 'text-red-600' : ''
                              )}>
                                {extStats.recent.trendPercentage > 0 ? '+' : ''}{extStats.recent.trendPercentage}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn("text-xs", getMatchupColor(extStats.matchup.opponentRank))}>
                              vs {extStats.matchup.opponentRank}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col">
                              <span className="text-sm">{extStats.ownership.starting}%</span>
                              <span className="text-xs text-muted-foreground">
                                {extStats.ownership.rostered}% owned
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-7 px-2">
                                {isStarter ? 'Bench' : 'Start'}
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2">
                                Trade
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lineup" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Active Lineup Optimizer</CardTitle>
              <CardDescription>
                Optimize your starting lineup based on projections and matchups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Starting Lineup */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Starting Lineup</h3>
                  <div className="space-y-2">
                    {Object.entries(POSITION_LIMITS).slice(0, -1).map(([pos, limits]) => {
                      const posPlayers = lineup.filter(p => 
                        p.position === pos || 
                        (pos === 'FLEX' && ['RB', 'WR', 'TE'].includes(p.position))
                      ).slice(0, limits.starters);
                      
                      return (
                        <div key={pos} className="space-y-1">
                          <div className="text-sm font-medium text-muted-foreground">{pos}</div>
                          {Array.from({ length: limits.starters }).map((_, idx) => {
                            const player = posPlayers[idx];
                            return (
                              <div key={idx} className={cn(
                                "p-3 rounded-lg border",
                                player ? "bg-muted/30" : "border-dashed"
                              )}>
                                {player ? (
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-medium">{player.name}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {player.team} vs OPP
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold">{player.stats?.projectedPoints?.toFixed(1)}</div>
                                      <div className="text-xs text-muted-foreground">projected</div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center text-muted-foreground text-sm">
                                    Empty Slot
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bench */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Bench Players</h3>
                  <div className="space-y-2">
                    {sortedPlayers.filter(p => !lineup.includes(p)).map(player => {
                      const extStats = getExtendedStats(player);
                      return (
                        <div key={player.id} className="p-3 rounded-lg border bg-muted/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{player.position}</Badge>
                              <div>
                                <div className="font-medium">{player.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {player.team} • Proj: {extStats.matchup.projection.toFixed(1)}
                                </div>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost">
                              Swap In
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Optimization Suggestions */}
                  <Alert>
                    <Trophy className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Optimization Tip:</strong> Consider starting Mike Evans (16.5 proj) 
                      over Tyler Lockett (12.3 proj) based on matchup advantage.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="mt-0">
          <div className="grid gap-6">
            {/* Season Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Season Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sortedPlayers.slice(0, 9).map(player => {
                    const extStats = getExtendedStats(player);
                    return (
                      <div key={player.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-medium">{player.name}</div>
                            <Badge variant="outline" className="mt-1">{player.position}</Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{extStats.season.avgPoints.toFixed(1)}</div>
                            <div className="text-xs text-muted-foreground">avg pts</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Season Rank</span>
                            <span className="font-medium">#{extStats.season.rank}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Consistency</span>
                            <Progress value={extStats.season.consistency} className="w-20" />
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Boom/Bust</span>
                            <span className="font-medium">
                              {extStats.matchup.boom}%/{extStats.matchup.bust}%
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">ROS Projection</span>
                            <span className="text-sm font-bold text-green-600">
                              {extStats.season.projectedTotal} pts
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}