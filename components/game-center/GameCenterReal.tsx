'use client';

import { useState, useEffect } from 'react';
import { useTeamStore } from '@/lib/store/teamStore';
import { realtimeSyncService } from '@/lib/services/realtimeSync';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Trophy, Users, Activity, TrendingUp, TrendingDown,
  Clock, Zap, AlertCircle, RefreshCw, Tv, Timer,
  Target, Flame, Star, CircleDot, Shield, Swords,
  Crown, Sun, Droplets, Wind
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function GameCenterReal() {
  const { teams } = useTeamStore();
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [liveGames, setLiveGames] = useState<any[]>([]);

  // Convert real teams to game center format
  useEffect(() => {
    const convertedGames = teams.map(team => {
      const liveScore = team.liveScore || {};
      const players = team.players || [];
      
      // Get active players (those currently playing)
      const activePlayers = players.filter((p: any) => 
        p.status?.gameStatus === 'in_progress' || 
        p.status?.isActive === true ||
        (p.status?.quarter && p.status.quarter !== '')
      );

      // Get bench players with points
      const benchPlayers = players.filter((p: any) => 
        !p.status?.isActive && p.stats?.fantasyPoints > 0
      );

      // Calculate projected score
      const projectedScore = players.reduce((total: number, p: any) => {
        return total + (p.projectedPoints || 0);
      }, 0);

      // Get recent scoring plays
      const recentPlays = activePlayers
        .filter((p: any) => p.stats?.fantasyPoints > 0)
        .slice(0, 3)
        .map((p: any) => ({
          player: p.name,
          play: `${p.stats?.fantasyPoints?.toFixed(1)} points`,
          points: p.stats?.fantasyPoints || 0,
          time: p.status?.quarter || 'Q?',
          highlight: p.stats?.fantasyPoints > 15
        }));

      // Get platform info
      const platformColors: { [key: string]: string } = {
        'ESPN': 'bg-red-500',
        'Yahoo': 'bg-purple-500',
        'Sleeper': 'bg-orange-500',
        'NFL': 'bg-blue-500',
        'CBS': 'bg-green-500',
        'DraftKings': 'bg-yellow-500'
      };

      const platformEmojis: { [key: string]: string } = {
        'ESPN': '🔴',
        'Yahoo': '🟣',
        'Sleeper': '😴',
        'NFL': '🏈',
        'CBS': '📺',
        'DraftKings': '👑'
      };

      return {
        id: team.id,
        teamId: team.id,
        teamName: team.name || 'Unnamed Team',
        teamLogo: platformEmojis[team.platform] || '🏈',
        platform: team.platform || 'Unknown',
        platformColor: platformColors[team.platform] || 'bg-gray-500',
        week: liveScore.week || 4,
        teamScore: liveScore.teamScore || 0,
        projectedTeamScore: projectedScore,
        opponentName: liveScore.opponentName || 'Opponent',
        opponentLogo: '🎯',
        opponentScore: liveScore.opponentScore || 0,
        projectedOpponentScore: liveScore.opponentScore ? liveScore.opponentScore * 1.1 : 100,
        winProbability: calculateWinProbability(
          liveScore.teamScore || 0,
          liveScore.opponentScore || 0,
          activePlayers.length
        ),
        timeRemaining: liveScore.isLive ? 'LIVE' : 'Not Started',
        isRedZone: false,
        weather: { type: 'dome', temp: '72°F', wind: '0 mph' },
        playersActive: activePlayers.map((p: any) => ({
          name: p.name,
          position: p.position,
          points: p.stats?.fantasyPoints || 0,
          projected: p.projectedPoints || 0,
          status: 'playing',
          team: p.team,
          opponent: 'OPP',
          gameTime: p.status?.quarter || 'LIVE',
          stats: formatPlayerStats(p),
          trend: p.stats?.fantasyPoints > (p.projectedPoints || 0) ? 'up' : 'down'
        })),
        benchPlayers: benchPlayers.map((p: any) => ({
          name: p.name,
          position: p.position,
          points: p.stats?.fantasyPoints || 0,
          status: 'bench'
        })),
        recentPlays,
        leagueName: team.leagueName || 'Fantasy League',
        record: team.record || { wins: 0, losses: 0 },
        rank: team.rank || 0
      };
    });

    setLiveGames(convertedGames);
    if (convertedGames.length > 0 && !selectedTeam) {
      setSelectedTeam(convertedGames[0]);
    }
  }, [teams, selectedTeam]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = realtimeSyncService.subscribe((data) => {
      // Refresh team data when sync updates
      if (data.results?.teamsUpdated > 0) {
        // Teams will update automatically through the store
      }
    });

    // Start sync if not running
    const status = realtimeSyncService.getSyncStatus();
    if (!status.isRunning && teams.length > 0) {
      realtimeSyncService.startSync();
    }

    return unsubscribe;
  }, [teams]);

  const calculateWinProbability = (teamScore: number, oppScore: number, playersLeft: number): number => {
    const currentDiff = teamScore - oppScore;
    const potentialPoints = playersLeft * 10;
    
    if (currentDiff > 30) return 95;
    if (currentDiff > 20) return 85;
    if (currentDiff > 10) return 70;
    if (currentDiff > 0) return 55;
    if (currentDiff > -10) return 45;
    if (currentDiff > -20) return 30;
    return 15;
  };

  const formatPlayerStats = (player: any): any => {
    const stats: any = {};
    
    if (player.position === 'QB') {
      if (player.stats?.passingYards) stats.passing = `${player.stats.passingYards} yds`;
      if (player.stats?.passingTDs) stats.tds = player.stats.passingTDs.toString();
    } else if (['RB', 'WR', 'TE'].includes(player.position)) {
      if (player.stats?.rushingYards) stats.rushing = `${player.stats.rushingYards} yds`;
      if (player.stats?.receivingYards) stats.receiving = `${player.stats.receivingYards} yds`;
      if (player.stats?.receptions) stats.rec = player.stats.receptions.toString();
    }
    
    return stats;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await realtimeSyncService.forceSync();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getScoreColor = (actual: number, projected: number) => {
    const diff = actual - projected;
    if (diff > 5) return 'text-green-500';
    if (diff < -5) return 'text-red-500';
    return 'text-yellow-500';
  };

  const getWinProbabilityColor = (probability: number) => {
    if (probability >= 70) return 'from-green-500 to-green-600';
    if (probability >= 40) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-500" />;
      default: return <Activity className="h-3 w-3 text-gray-500" />;
    }
  };

  if (teams.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-gray-800 bg-gray-900">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="w-16 h-16 text-gray-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-300 mb-2">No Teams Found</h2>
            <p className="text-gray-500 mb-4">Import your fantasy teams to start tracking live games</p>
            <Button onClick={() => window.location.href = '/teams'}>
              Import Teams
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="gradient-text flex items-center gap-2">
              <Tv className="h-8 w-8" />
              Game Center
            </span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Your Live Fantasy Matchups • Week {selectedTeam?.week || 4} • {liveGames.length} teams
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge 
            variant={autoRefresh ? 'default' : 'secondary'} 
            className={cn(
              "cursor-pointer transition-all",
              autoRefresh && "animate-pulse bg-gradient-to-r from-primary to-accent"
            )}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <CircleDot className={cn("h-3 w-3 mr-1", autoRefresh && "animate-spin")} />
            {autoRefresh ? 'Live Updates ON' : 'Live Updates OFF'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('h-4 w-4 mr-1', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Your Teams List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-primary/20 bg-gray-900">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Your Teams
                </span>
                <Badge variant="outline" className="text-xs">
                  {liveGames.length} Total
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {liveGames.map((game, idx) => (
                    <div
                      key={game.id}
                      onClick={() => setSelectedTeam(game)}
                      className={cn(
                        'relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300',
                        'hover:scale-[1.02] hover:shadow-xl',
                        selectedTeam?.id === game.id 
                          ? 'border-primary bg-gradient-to-br from-primary/10 to-accent/10' 
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      {/* Platform Badge */}
                      <div className="absolute -top-2 -right-2">
                        <Badge className={cn("text-xs px-2", game.platformColor)}>
                          {game.platform}
                        </Badge>
                      </div>

                      {/* Team Info */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{game.teamLogo}</span>
                            <div>
                              <div className="font-semibold text-sm">{game.teamName}</div>
                              <div className="text-xs text-gray-400">{game.leagueName}</div>
                              <div className={cn('text-xl font-bold', getScoreColor(game.teamScore, game.projectedTeamScore))}>
                                {game.teamScore.toFixed(1)}
                              </div>
                            </div>
                          </div>
                          {game.record && (
                            <div className="text-right">
                              <div className="text-xs text-gray-400">Record</div>
                              <div className="text-sm font-medium">
                                {game.record.wins}-{game.record.losses}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <Separator className="my-2" />
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl opacity-60">{game.opponentLogo}</span>
                            <div>
                              <div className="text-sm text-muted-foreground">{game.opponentName}</div>
                              <div className="text-xl font-bold">
                                {game.opponentScore.toFixed(1)}
                              </div>
                            </div>
                          </div>
                          <Badge 
                            variant={game.timeRemaining === 'LIVE' ? 'default' : 'secondary'} 
                            className="text-xs"
                          >
                            {game.timeRemaining}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Win Probability Bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Win %</span>
                          <span className="font-medium">{game.winProbability}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn('h-full bg-gradient-to-r transition-all duration-500', getWinProbabilityColor(game.winProbability))}
                            style={{ width: `${game.winProbability}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Game Details */}
        <div className="lg:col-span-3 space-y-6">
          {selectedTeam && (
            <>
              {/* Main Score Board */}
              <Card className="border-primary/30 bg-gradient-to-br from-gray-900 to-gray-950 overflow-hidden">
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-3xl flex items-center gap-3">
                        <span className="text-4xl">{selectedTeam.teamLogo}</span>
                        {selectedTeam.teamName}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span>{selectedTeam.platform} League</span>
                        <span>•</span>
                        <span>{selectedTeam.leagueName}</span>
                        <span>•</span>
                        <span>Week {selectedTeam.week}</span>
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {selectedTeam.timeRemaining}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  {/* Score Display */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                      <div className="text-5xl font-bold gradient-text mb-2">
                        {selectedTeam.teamScore.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Projected: {selectedTeam.projectedTeamScore.toFixed(1)}
                      </div>
                      <div className="mt-3">
                        {selectedTeam.teamScore > selectedTeam.opponentScore ? (
                          <Badge className="bg-green-500">WINNING</Badge>
                        ) : (
                          <Badge variant="destructive">LOSING</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center">
                      <Swords className="h-8 w-8 text-muted-foreground" />
                    </div>
                    
                    <div className="text-center p-6 rounded-xl bg-muted/50 border">
                      <div className="text-5xl font-bold mb-2">
                        {selectedTeam.opponentScore.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Projected: {selectedTeam.projectedOpponentScore.toFixed(1)}
                      </div>
                      <div className="mt-3 text-sm text-muted-foreground">
                        {selectedTeam.opponentName}
                      </div>
                    </div>
                  </div>
                  
                  {/* Win Probability */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-background to-muted/50 border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        <span className="font-medium">Win Probability</span>
                      </div>
                      <span className="text-2xl font-bold">{selectedTeam.winProbability}%</span>
                    </div>
                    <div className="h-4 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          'h-full bg-gradient-to-r transition-all duration-1000',
                          getWinProbabilityColor(selectedTeam.winProbability)
                        )}
                        style={{ width: `${selectedTeam.winProbability}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Players */}
              {selectedTeam.playersActive.length > 0 && (
                <Card className="overflow-hidden bg-gray-900 border-gray-800">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Active Players
                      <Badge variant="outline" className="ml-auto">
                        {selectedTeam.playersActive.length} Playing
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      {selectedTeam.playersActive.map((player: any, idx: number) => (
                        <div 
                          key={idx} 
                          className="relative p-4 rounded-xl border-2 transition-all duration-300
                                   hover:scale-[1.02] hover:shadow-lg hover:border-primary/50
                                   bg-gradient-to-br from-gray-800 to-gray-900"
                        >
                          {/* Position Badge */}
                          <div className="absolute -top-3 -left-3">
                            <Badge className="bg-gradient-to-r from-primary to-accent px-3">
                              {player.position}
                            </Badge>
                          </div>
                          
                          <div className="space-y-3 mt-2">
                            {/* Player Name & Team */}
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-lg">{player.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {player.team} • {player.gameTime}
                                </div>
                              </div>
                              {getTrendIcon(player.trend)}
                            </div>
                            
                            {/* Points Display */}
                            <div className="flex items-center justify-between">
                              <div>
                                <div className={cn(
                                  'text-3xl font-bold',
                                  getScoreColor(player.points, player.projected)
                                )}>
                                  {player.points.toFixed(1)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Proj: {player.projected.toFixed(1)}
                                </div>
                              </div>
                              {Object.keys(player.stats).length > 0 && (
                                <div className="text-right space-y-1">
                                  {Object.entries(player.stats).map(([key, value]) => (
                                    <div key={key} className="text-xs text-muted-foreground">
                                      <span className="font-medium">{key}:</span> {value}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">Performance</div>
                              <Progress 
                                value={(player.points / player.projected) * 100} 
                                className="h-2"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Bench Players */}
                    {selectedTeam.benchPlayers.length > 0 && (
                      <div className="mt-6 pt-6 border-t">
                        <div className="flex items-center gap-2 mb-4">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">Bench Players</span>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                          {selectedTeam.benchPlayers.map((player: any, idx: number) => (
                            <Badge key={idx} variant="secondary" className="px-3 py-1">
                              {player.name} ({player.position}): {player.points.toFixed(1)} pts
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Recent Plays */}
              {selectedTeam.recentPlays.length > 0 && (
                <Card className="overflow-hidden bg-gray-900 border-gray-800">
                  <CardHeader className="bg-gradient-to-r from-accent/10 to-primary/10">
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Live Scoring Feed
                      <Badge variant="default" className="ml-auto animate-pulse">
                        LIVE
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {selectedTeam.recentPlays.map((play: any, idx: number) => (
                        <div 
                          key={idx} 
                          className={cn(
                            "flex items-start gap-4 p-4 rounded-xl transition-all duration-300",
                            play.highlight 
                              ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-l-4 border-yellow-500" 
                              : "bg-muted/30 hover:bg-muted/50"
                          )}
                        >
                          <div className="mt-1">
                            {play.highlight ? (
                              <Star className="h-5 w-5 text-yellow-500 animate-pulse" />
                            ) : (
                              <Flame className="h-5 w-5 text-orange-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold">{play.player}</div>
                            <div className="text-sm text-muted-foreground">{play.play}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-500">+{play.points.toFixed(1)}</div>
                            <div className="text-xs text-muted-foreground">{play.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}