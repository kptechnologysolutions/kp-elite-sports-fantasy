'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Trophy, TrendingUp, Clock, Users, Activity, ChevronRight,
  PlayCircle, CheckCircle2, XCircle, AlertCircle, Timer,
  Zap, Shield, Star, Flame
} from 'lucide-react';
import { Team, Player } from '@/lib/types';
import { cn } from '@/lib/utils';

interface GameStatus {
  status: 'yet_to_play' | 'playing' | 'played';
  gameTime?: string;
  quarter?: string;
  timeRemaining?: string;
  score?: { home: number; away: number };
}

interface PlayerWithGameStatus extends Player {
  gameStatus?: GameStatus;
  actualPoints?: number;
  isHome?: boolean;
}

interface EnhancedHeadToHeadProps {
  myTeam: Team;
  opponentTeam?: Team;
  week: number;
  onViewAllScores?: () => void;
}

export function EnhancedHeadToHead({ myTeam, opponentTeam, week, onViewAllScores }: EnhancedHeadToHeadProps) {
  const [selectedView, setSelectedView] = useState<'overview' | 'myteam' | 'opponent'>('overview');

  // Generate game status for players (mock data for demo)
  const enhancePlayersWithGameStatus = (players: Player[], teamName: string): PlayerWithGameStatus[] => {
    return players.map((player, idx) => {
      let gameStatus: GameStatus;
      let actualPoints = 0;
      
      // Simulate different game states
      if (idx < 3) {
        // First 3 players have played
        gameStatus = { status: 'played' };
        actualPoints = player.stats?.fantasyPoints || Math.random() * 25 + 5;
      } else if (idx < 6) {
        // Next 3 are playing
        const quarters = ['1st', '2nd', '3rd', '4th'];
        gameStatus = { 
          status: 'playing',
          quarter: quarters[Math.floor(Math.random() * 4)],
          timeRemaining: `${Math.floor(Math.random() * 15)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
          score: { home: Math.floor(Math.random() * 35), away: Math.floor(Math.random() * 35) }
        };
        actualPoints = (player.stats?.fantasyPoints || 0) * Math.random();
      } else {
        // Rest yet to play
        const gameTimes = ['1:00 PM', '4:05 PM', '4:25 PM', '8:20 PM', 'Mon 8:15 PM'];
        gameStatus = { 
          status: 'yet_to_play',
          gameTime: gameTimes[Math.floor(Math.random() * gameTimes.length)]
        };
        actualPoints = 0;
      }

      return {
        ...player,
        gameStatus,
        actualPoints,
        isHome: Math.random() > 0.5
      };
    });
  };

  const myPlayers = enhancePlayersWithGameStatus(myTeam.players, myTeam.name);
  const oppPlayers = opponentTeam 
    ? enhancePlayersWithGameStatus(opponentTeam.players, opponentTeam.name)
    : enhancePlayersWithGameStatus(
        Array.from({ length: 9 }, (_, i) => ({
          id: `opp_${i}`,
          name: `Opponent Player ${i + 1}`,
          position: ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'K', 'DST'][i],
          team: 'OPP',
          jerseyNumber: i + 1,
          status: { isActive: true, gameStatus: 'playing', lastUpdated: new Date() },
          stats: { 
            season: 2024, 
            week: week,
            fantasyPoints: Math.random() * 20 + 5,
            projectedPoints: Math.random() * 20 + 8
          }
        })),
        'Opponent Team'
      );

  // Calculate scores and stats
  const myStats = {
    actualScore: myPlayers.reduce((sum, p) => sum + (p.actualPoints || 0), 0),
    projectedScore: myPlayers.reduce((sum, p) => sum + (p.stats?.projectedPoints || 0), 0),
    playersPlayed: myPlayers.filter(p => p.gameStatus?.status === 'played').length,
    playersPlaying: myPlayers.filter(p => p.gameStatus?.status === 'playing').length,
    playersYetToPlay: myPlayers.filter(p => p.gameStatus?.status === 'yet_to_play').length,
    topScorer: myPlayers.sort((a, b) => (b.actualPoints || 0) - (a.actualPoints || 0))[0]
  };

  const oppStats = {
    actualScore: oppPlayers.reduce((sum, p) => sum + (p.actualPoints || 0), 0),
    projectedScore: oppPlayers.reduce((sum, p) => sum + (p.stats?.projectedPoints || 0), 0),
    playersPlayed: oppPlayers.filter(p => p.gameStatus?.status === 'played').length,
    playersPlaying: oppPlayers.filter(p => p.gameStatus?.status === 'playing').length,
    playersYetToPlay: oppPlayers.filter(p => p.gameStatus?.status === 'yet_to_play').length,
    topScorer: oppPlayers.sort((a, b) => (b.actualPoints || 0) - (a.actualPoints || 0))[0]
  };

  const winProbability = calculateWinProbability(myStats, oppStats);

  function calculateWinProbability(myStats: any, oppStats: any): number {
    const scoreDiff = myStats.actualScore - oppStats.actualScore;
    const projDiff = myStats.projectedScore - oppStats.projectedScore;
    const playersLeftDiff = myStats.playersYetToPlay - oppStats.playersYetToPlay;
    
    let probability = 50 + (scoreDiff * 2) + (projDiff * 0.5) + (playersLeftDiff * 5);
    return Math.max(5, Math.min(95, probability));
  }

  const getGameStatusIcon = (status: GameStatus) => {
    switch (status.status) {
      case 'played':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'playing':
        return <PlayCircle className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'yet_to_play':
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getGameStatusText = (status: GameStatus) => {
    switch (status.status) {
      case 'played':
        return 'Final';
      case 'playing':
        return `${status.quarter} - ${status.timeRemaining}`;
      case 'yet_to_play':
        return status.gameTime;
    }
  };

  const PlayerRow = ({ player, showProjected = true }: { player: PlayerWithGameStatus; showProjected?: boolean }) => (
    <div className={cn(
      "flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors",
      player.gameStatus?.status === 'playing' && "bg-blue-50/50 dark:bg-blue-950/20",
      player.gameStatus?.status === 'played' && "opacity-75"
    )}>
      <div className="flex items-center gap-3 flex-1">
        <Badge variant="outline" className="w-10 text-center">
          {player.position}
        </Badge>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{player.name}</span>
            {player.gameStatus?.status === 'playing' && (
              <Flame className="h-3 w-3 text-orange-500 animate-pulse" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{player.team}</span>
            {player.gameStatus && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  {getGameStatusIcon(player.gameStatus)}
                  <span>{getGameStatusText(player.gameStatus)}</span>
                </div>
              </>
            )}
            {player.gameStatus?.status === 'playing' && player.gameStatus.score && (
              <>
                <span>•</span>
                <span className="font-mono text-xs">
                  {player.isHome ? player.gameStatus.score.home : player.gameStatus.score.away}-
                  {player.isHome ? player.gameStatus.score.away : player.gameStatus.score.home}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold text-lg">
          {player.actualPoints?.toFixed(1) || '—'}
        </div>
        {showProjected && player.gameStatus?.status === 'yet_to_play' && (
          <div className="text-xs text-muted-foreground">
            proj: {player.stats?.projectedPoints?.toFixed(1)}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Main Scoreboard */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Week {week} Matchup
            </CardTitle>
            <Button variant="outline" size="sm" onClick={onViewAllScores}>
              View All Scores
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Score Display */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">{myTeam.name}</div>
              <div className="text-4xl font-bold">{myStats.actualScore.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">
                Proj: {myStats.projectedScore.toFixed(1)}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <Badge variant={winProbability > 50 ? "default" : "secondary"} className="mb-2">
                {winProbability.toFixed(0)}% Win
              </Badge>
              <Progress value={winProbability} className="w-full h-2" />
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>{myStats.playersPlaying} Live</span>
                <span>{myStats.playersYetToPlay} Left</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">
                {opponentTeam?.name || 'Opponent'}
              </div>
              <div className="text-4xl font-bold">{oppStats.actualScore.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">
                Proj: {oppStats.projectedScore.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Player Status Summary */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">Your Team Status</div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>{myStats.playersPlayed}</span>
                </div>
                <div className="flex items-center gap-1">
                  <PlayCircle className="h-3 w-3 text-blue-500" />
                  <span>{myStats.playersPlaying}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span>{myStats.playersYetToPlay}</span>
                </div>
              </div>
              {myStats.topScorer && (
                <div className="mt-2 text-xs">
                  <span className="text-muted-foreground">Top: </span>
                  <span className="font-medium">{myStats.topScorer.name}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {myStats.topScorer.actualPoints?.toFixed(1)} pts
                  </Badge>
                </div>
              )}
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">Opponent Status</div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>{oppStats.playersPlayed}</span>
                </div>
                <div className="flex items-center gap-1">
                  <PlayCircle className="h-3 w-3 text-blue-500" />
                  <span>{oppStats.playersPlaying}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span>{oppStats.playersYetToPlay}</span>
                </div>
              </div>
              {oppStats.topScorer && (
                <div className="mt-2 text-xs">
                  <span className="text-muted-foreground">Top: </span>
                  <span className="font-medium">{oppStats.topScorer.name}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {oppStats.topScorer.actualPoints?.toFixed(1)} pts
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Roster Views */}
      <Card>
        <CardHeader>
          <Tabs value={selectedView} onValueChange={(v: any) => setSelectedView(v)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Side by Side</TabsTrigger>
              <TabsTrigger value="myteam">My Roster</TabsTrigger>
              <TabsTrigger value="opponent">Opponent Roster</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs value={selectedView}>
            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* My Team Column */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{myTeam.name}</h3>
                    <Badge variant="outline">
                      {myStats.actualScore.toFixed(1)} pts
                    </Badge>
                  </div>
                  <ScrollArea className="h-[400px] pr-2">
                    <div className="space-y-1">
                      {myPlayers.map(player => (
                        <PlayerRow key={player.id} player={player} />
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Opponent Column */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{opponentTeam?.name || 'Opponent'}</h3>
                    <Badge variant="outline">
                      {oppStats.actualScore.toFixed(1)} pts
                    </Badge>
                  </div>
                  <ScrollArea className="h-[400px] pr-2">
                    <div className="space-y-1">
                      {oppPlayers.map(player => (
                        <PlayerRow key={player.id} player={player} />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="myteam" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{myTeam.name} Full Roster</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Score: {myStats.actualScore.toFixed(1)}
                    </Badge>
                    <Badge variant="outline">
                      Proj: {myStats.projectedScore.toFixed(1)}
                    </Badge>
                  </div>
                </div>
                
                {/* Group by status */}
                {myStats.playersPlaying > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <PlayCircle className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Currently Playing</span>
                    </div>
                    <div className="space-y-1 ml-6">
                      {myPlayers.filter(p => p.gameStatus?.status === 'playing').map(player => (
                        <PlayerRow key={player.id} player={player} />
                      ))}
                    </div>
                  </div>
                )}

                {myStats.playersYetToPlay > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">Yet to Play</span>
                    </div>
                    <div className="space-y-1 ml-6">
                      {myPlayers.filter(p => p.gameStatus?.status === 'yet_to_play').map(player => (
                        <PlayerRow key={player.id} player={player} />
                      ))}
                    </div>
                  </div>
                )}

                {myStats.playersPlayed > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                    <div className="space-y-1 ml-6 opacity-75">
                      {myPlayers.filter(p => p.gameStatus?.status === 'played').map(player => (
                        <PlayerRow key={player.id} player={player} showProjected={false} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="opponent" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{opponentTeam?.name || 'Opponent'} Full Roster</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Score: {oppStats.actualScore.toFixed(1)}
                    </Badge>
                    <Badge variant="outline">
                      Proj: {oppStats.projectedScore.toFixed(1)}
                    </Badge>
                  </div>
                </div>
                
                {/* Group by status */}
                {oppStats.playersPlaying > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <PlayCircle className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Currently Playing</span>
                    </div>
                    <div className="space-y-1 ml-6">
                      {oppPlayers.filter(p => p.gameStatus?.status === 'playing').map(player => (
                        <PlayerRow key={player.id} player={player} />
                      ))}
                    </div>
                  </div>
                )}

                {oppStats.playersYetToPlay > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">Yet to Play</span>
                    </div>
                    <div className="space-y-1 ml-6">
                      {oppPlayers.filter(p => p.gameStatus?.status === 'yet_to_play').map(player => (
                        <PlayerRow key={player.id} player={player} />
                      ))}
                    </div>
                  </div>
                )}

                {oppStats.playersPlayed > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                    <div className="space-y-1 ml-6 opacity-75">
                      {oppPlayers.filter(p => p.gameStatus?.status === 'played').map(player => (
                        <PlayerRow key={player.id} player={player} showProjected={false} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}