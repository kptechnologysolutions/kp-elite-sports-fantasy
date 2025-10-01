'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Team, Player } from '@/lib/types';
import { 
  Trophy,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Users,
  Zap,
  Shield,
  Target,
  Info,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeadToHeadProps {
  myTeam: Team;
  opponent: {
    name: string;
    score: number;
    projectedScore: number;
    players?: Player[];
  };
  week?: number;
}

export function HeadToHeadView({ myTeam, opponent, week = 10 }: HeadToHeadProps) {
  const [selectedView, setSelectedView] = useState<'overview' | 'my-team' | 'opponent' | 'comparison'>('overview');
  
  // Calculate team scores
  const myScore = myTeam.players?.reduce((sum, p) => sum + (p.stats?.fantasyPoints || 0), 0) || 0;
  const myProjected = myTeam.players?.reduce((sum, p) => sum + (p.stats?.projectedPoints || 0), 0) || 0;
  
  const scoreDiff = myScore - opponent.score;
  const isWinning = scoreDiff > 0;
  const winProbability = calculateWinProbability(myScore, myProjected, opponent.score, opponent.projectedScore);
  
  // Group players by position
  const groupPlayersByPosition = (players: Player[]) => {
    const grouped: Record<string, Player[]> = {};
    players.forEach(player => {
      if (!grouped[player.position]) grouped[player.position] = [];
      grouped[player.position].push(player);
    });
    return grouped;
  };
  
  const myPlayersByPosition = groupPlayersByPosition(myTeam.players || []);
  const positionOrder = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];

  function calculateWinProbability(myScore: number, myProj: number, oppScore: number, oppProj: number): number {
    const currentLead = myScore - oppScore;
    const projectedLead = myProj - oppProj;
    const avgLead = (currentLead + projectedLead) / 2;
    
    // Simple probability based on lead
    if (avgLead > 20) return 95;
    if (avgLead > 10) return 75;
    if (avgLead > 0) return 55;
    if (avgLead > -10) return 45;
    if (avgLead > -20) return 25;
    return 5;
  }

  const getPlayerStatusIcon = (player: Player) => {
    const points = player.stats?.fantasyPoints || 0;
    const projected = player.stats?.projectedPoints || 0;
    
    if (player.status?.gameStatus === 'yet_to_play') return <Clock className="h-4 w-4 text-gray-500" />;
    if (player.status?.gameStatus === 'in_progress') return <Activity className="h-4 w-4 text-green-500 animate-pulse" />;
    if (points > projected * 1.2) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (points < projected * 0.8) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <CheckCircle className="h-4 w-4 text-blue-500" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Week {week} Matchup</CardTitle>
            <CardDescription>Head-to-Head Breakdown</CardDescription>
          </div>
          <Badge variant={isWinning ? 'default' : 'destructive'}>
            {isWinning ? 'WINNING' : 'LOSING'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Score Overview */}
        <div className="grid grid-cols-3 gap-4">
          {/* My Team */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">{myTeam.name}</p>
            <p className="text-3xl font-bold">{myScore.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Proj: {myProjected.toFixed(1)}</p>
            {myScore > myProjected ? (
              <Badge variant="outline" className="mt-2 text-green-500">
                <TrendingUp className="mr-1 h-3 w-3" />
                +{(myScore - myProjected).toFixed(1)}
              </Badge>
            ) : (
              <Badge variant="outline" className="mt-2 text-red-500">
                <TrendingDown className="mr-1 h-3 w-3" />
                {(myScore - myProjected).toFixed(1)}
              </Badge>
            )}
          </div>

          {/* VS */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-muted-foreground">VS</div>
            <div className="mt-2">
              <Badge variant="secondary" className="px-3 py-1">
                {Math.abs(scoreDiff).toFixed(1)} PT {scoreDiff > 0 ? 'LEAD' : 'DEFICIT'}
              </Badge>
            </div>
          </div>

          {/* Opponent */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">{opponent.name}</p>
            <p className="text-3xl font-bold">{opponent.score.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Proj: {opponent.projectedScore.toFixed(1)}</p>
            {opponent.score > opponent.projectedScore ? (
              <Badge variant="outline" className="mt-2 text-green-500">
                <TrendingUp className="mr-1 h-3 w-3" />
                +{(opponent.score - opponent.projectedScore).toFixed(1)}
              </Badge>
            ) : (
              <Badge variant="outline" className="mt-2 text-red-500">
                <TrendingDown className="mr-1 h-3 w-3" />
                {(opponent.score - opponent.projectedScore).toFixed(1)}
              </Badge>
            )}
          </div>
        </div>

        {/* Win Probability */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Win Probability</span>
            <span className="font-bold">{winProbability}%</span>
          </div>
          <Progress value={winProbability} className="h-3" />
        </div>

        {/* Detailed Breakdown Tabs */}
        <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="my-team">My Team</TabsTrigger>
            <TabsTrigger value="opponent">Opponent</TabsTrigger>
            <TabsTrigger value="comparison">Compare</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Players Remaining</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-semibold">
                    {myTeam.players?.filter(p => p.status?.gameStatus === 'yet_to_play').length || 0}
                  </span>
                  <span className="text-muted-foreground">vs</span>
                  <span className="font-semibold">
                    {opponent.players?.filter(p => p.status?.gameStatus === 'yet_to_play').length || 0}
                  </span>
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Top Scorer</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-semibold text-xs">
                    {myTeam.players?.reduce((max, p) => 
                      (p.stats?.fantasyPoints || 0) > (max.stats?.fantasyPoints || 0) ? p : max
                    )?.name.split(' ').pop()}
                  </span>
                  <span className="text-xs">
                    {Math.max(...(myTeam.players?.map(p => p.stats?.fantasyPoints || 0) || [0])).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Key Players */}
            <div>
              <p className="text-sm font-medium mb-2">Key Performances</p>
              <div className="space-y-2">
                {myTeam.players
                  ?.filter(p => (p.stats?.fantasyPoints || 0) > 15)
                  .sort((a, b) => (b.stats?.fantasyPoints || 0) - (a.stats?.fantasyPoints || 0))
                  .slice(0, 3)
                  .map(player => (
                    <div key={player.id} className="flex items-center justify-between p-2 rounded-lg border">
                      <div className="flex items-center gap-2">
                        {getPlayerStatusIcon(player)}
                        <div>
                          <p className="font-medium text-sm">{player.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">{player.position}</Badge>
                            <span className="text-xs text-muted-foreground">{player.team}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{player.stats?.fantasyPoints?.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">
                          Proj: {player.stats?.projectedPoints?.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>

          {/* My Team Tab */}
          <TabsContent value="my-team" className="space-y-4">
            {positionOrder.map(position => {
              const players = myPlayersByPosition[position] || [];
              if (players.length === 0) return null;
              
              return (
                <div key={position}>
                  <p className="text-sm font-medium mb-2">{position}</p>
                  <div className="space-y-2">
                    {players.map(player => (
                      <div key={player.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          {getPlayerStatusIcon(player)}
                          <div>
                            <p className="font-medium">{player.name}</p>
                            <p className="text-sm text-muted-foreground">{player.team}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{player.stats?.fantasyPoints?.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">
                            Proj: {player.stats?.projectedPoints?.toFixed(1)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          {/* Opponent Tab */}
          <TabsContent value="opponent" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4" />
              <p>Opponent roster details not available</p>
              <p className="text-sm mt-2">Connect to your league for full opponent tracking</p>
            </div>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-4">
            {positionOrder.map(position => {
              const myPlayers = myPlayersByPosition[position] || [];
              const myTotal = myPlayers.reduce((sum, p) => sum + (p.stats?.fantasyPoints || 0), 0);
              const oppTotal = Math.random() * 20 + 5; // Mock opponent data
              
              if (myPlayers.length === 0) return null;
              
              const advantage = myTotal - oppTotal;
              
              return (
                <div key={position} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{position}</span>
                    <Badge 
                      variant={advantage > 0 ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {advantage > 0 ? '+' : ''}{advantage.toFixed(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>{myTotal.toFixed(1)}</span>
                    <div className="flex-1 mx-4">
                      <Progress 
                        value={(myTotal / (myTotal + oppTotal)) * 100} 
                        className="h-2"
                      />
                    </div>
                    <span>{oppTotal.toFixed(1)}</span>
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>

        {/* Game Info */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Week {week}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-500 animate-pulse" />
            <span className="font-medium">Live Scoring</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}