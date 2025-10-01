'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Trophy, TrendingUp, Users, Activity, ChevronRight, 
  PlayCircle, CheckCircle2, Clock, Flame, Shield,
  Calendar, BarChart3, Star
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTeamStore } from '@/lib/store/teamStore';
import { cn } from '@/lib/utils';

interface Matchup {
  id: string;
  team1: {
    name: string;
    owner: string;
    score: number;
    projected: number;
    record: string;
    rank: number;
    isMyTeam?: boolean;
  };
  team2: {
    name: string;
    owner: string;
    score: number;
    projected: number;
    record: string;
    rank: number;
    isMyTeam?: boolean;
  };
  status: 'not_started' | 'in_progress' | 'final';
  playersActive: number;
  gameTime?: string;
}

interface LeagueStanding {
  rank: number;
  teamName: string;
  owner: string;
  record: string;
  pointsFor: number;
  pointsAgainst: number;
  streak: string;
  isMyTeam?: boolean;
}

export default function ScoresPage() {
  const router = useRouter();
  const { teams, currentTeam } = useTeamStore();
  const [selectedWeek, setSelectedWeek] = useState(10);
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'scores' | 'standings' | 'playoffs'>('scores');

  // Generate mock matchups
  const generateMatchups = (): Matchup[] => {
    const teamNames = [
      'The Champions', 'Dynasty Warriors', 'Waiver Hawks', 'Trade Masters',
      'Lucky Breaks', 'The Underdogs', 'Point Chasers', 'Playoff Bound',
      'Last Place Heroes', 'The Juggernauts', 'Bye Week Blues', 'Trophy Hunters'
    ];

    const matchups: Matchup[] = [];
    const myTeamName = currentTeam?.name || 'My Team';

    for (let i = 0; i < 6; i++) {
      const isMyMatchup = i === 0;
      const team1Name = isMyMatchup ? myTeamName : teamNames[i * 2];
      const team2Name = teamNames[i * 2 + 1];
      
      matchups.push({
        id: `matchup_${i}`,
        team1: {
          name: team1Name,
          owner: isMyMatchup ? 'You' : `Owner ${i * 2 + 1}`,
          score: Math.random() * 50 + 70,
          projected: Math.random() * 50 + 80,
          record: `${Math.floor(Math.random() * 8)}-${Math.floor(Math.random() * 5)}`,
          rank: Math.floor(Math.random() * 12) + 1,
          isMyTeam: isMyMatchup
        },
        team2: {
          name: team2Name,
          owner: `Owner ${i * 2 + 2}`,
          score: Math.random() * 50 + 65,
          projected: Math.random() * 50 + 75,
          record: `${Math.floor(Math.random() * 8)}-${Math.floor(Math.random() * 5)}`,
          rank: Math.floor(Math.random() * 12) + 1
        },
        status: i < 2 ? 'final' : i < 4 ? 'in_progress' : 'not_started',
        playersActive: i < 4 ? Math.floor(Math.random() * 5) + 1 : 0,
        gameTime: i >= 4 ? ['Sun 1:00 PM', 'Sun 4:25 PM'][i - 4] : undefined
      });
    }

    return matchups;
  };

  const generateStandings = (): LeagueStanding[] => {
    const standings: LeagueStanding[] = [];
    const myTeamName = currentTeam?.name || 'My Team';
    
    for (let i = 0; i < 12; i++) {
      const isMyTeam = i === 3; // Put my team at rank 4
      standings.push({
        rank: i + 1,
        teamName: isMyTeam ? myTeamName : `Team ${i + 1}`,
        owner: isMyTeam ? 'You' : `Owner ${i + 1}`,
        record: `${Math.floor(Math.random() * 3) + 6}-${Math.floor(Math.random() * 3) + 2}`,
        pointsFor: Math.random() * 500 + 1000,
        pointsAgainst: Math.random() * 500 + 950,
        streak: Math.random() > 0.5 ? `W${Math.floor(Math.random() * 3) + 1}` : `L${Math.floor(Math.random() * 2) + 1}`,
        isMyTeam
      });
    }
    
    return standings.sort((a, b) => a.rank - b.rank);
  };

  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [standings, setStandings] = useState<LeagueStanding[]>([]);

  useEffect(() => {
    setMatchups(generateMatchups());
    setStandings(generateStandings());
  }, [selectedWeek, currentTeam]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'final':
        return <Badge variant="secondary">Final</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500 text-white">Live</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStreakColor = (streak: string) => {
    if (streak.startsWith('W')) return 'text-green-600';
    if (streak.startsWith('L')) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <main className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            League Scoreboard
          </h1>
          <p className="text-muted-foreground mt-1">
            View all matchups and standings across your leagues
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedLeague} onValueChange={setSelectedLeague}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leagues</SelectItem>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.leagueId}>
                  {team.leagueName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedWeek.toString()} onValueChange={(v) => setSelectedWeek(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 17 }, (_, i) => i + 1).map(week => (
                <SelectItem key={week} value={week.toString()}>
                  Week {week}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* View Tabs */}
      <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
        <TabsList>
          <TabsTrigger value="scores">Live Scores</TabsTrigger>
          <TabsTrigger value="standings">Standings</TabsTrigger>
          <TabsTrigger value="playoffs">Playoff Picture</TabsTrigger>
        </TabsList>

        {/* Live Scores */}
        <TabsContent value="scores" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {matchups.map(matchup => (
              <Card 
                key={matchup.id}
                className={cn(
                  "hover:shadow-lg transition-shadow cursor-pointer",
                  (matchup.team1.isMyTeam || matchup.team2.isMyTeam) && "ring-2 ring-primary"
                )}
                onClick={() => {
                  if (matchup.team1.isMyTeam || matchup.team2.isMyTeam) {
                    router.push('/dashboard');
                  }
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {matchup.status === 'in_progress' && (
                        <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
                      )}
                      {getStatusBadge(matchup.status)}
                    </div>
                    {matchup.playersActive > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {matchup.playersActive} active
                      </Badge>
                    )}
                    {matchup.gameTime && (
                      <span className="text-xs text-muted-foreground">{matchup.gameTime}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Team 1 */}
                  <div className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    matchup.team1.isMyTeam ? "bg-primary/10" : "bg-muted/50",
                    matchup.status === 'final' && matchup.team1.score > matchup.team2.score && "ring-2 ring-green-500"
                  )}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{matchup.team1.name}</span>
                        {matchup.team1.isMyTeam && (
                          <Badge variant="default" className="text-xs">You</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{matchup.team1.owner}</span>
                        <span>•</span>
                        <span>{matchup.team1.record}</span>
                        <span>•</span>
                        <span>#{matchup.team1.rank}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{matchup.team1.score.toFixed(1)}</div>
                      {matchup.status !== 'final' && (
                        <div className="text-xs text-muted-foreground">
                          proj: {matchup.team1.projected.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Team 2 */}
                  <div className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    matchup.team2.isMyTeam ? "bg-primary/10" : "bg-muted/50",
                    matchup.status === 'final' && matchup.team2.score > matchup.team1.score && "ring-2 ring-green-500"
                  )}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{matchup.team2.name}</span>
                        {matchup.team2.isMyTeam && (
                          <Badge variant="default" className="text-xs">You</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{matchup.team2.owner}</span>
                        <span>•</span>
                        <span>{matchup.team2.record}</span>
                        <span>•</span>
                        <span>#{matchup.team2.rank}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{matchup.team2.score.toFixed(1)}</div>
                      {matchup.status !== 'final' && (
                        <div className="text-xs text-muted-foreground">
                          proj: {matchup.team2.projected.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Win Probability (for in-progress games) */}
                  {matchup.status === 'in_progress' && (
                    <div className="pt-2">
                      <Progress 
                        value={matchup.team1.score / (matchup.team1.score + matchup.team2.score) * 100}
                        className="h-2"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Standings */}
        <TabsContent value="standings">
          <Card>
            <CardHeader>
              <CardTitle>League Standings</CardTitle>
              <CardDescription>Current rankings and playoff positions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Rank</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-center">Record</TableHead>
                    <TableHead className="text-right">Points For</TableHead>
                    <TableHead className="text-right">Points Against</TableHead>
                    <TableHead className="text-center">Streak</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standings.map(team => (
                    <TableRow 
                      key={team.rank}
                      className={cn(
                        team.isMyTeam && "bg-primary/5",
                        "cursor-pointer hover:bg-muted/50"
                      )}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {team.rank <= 4 && <Trophy className="h-4 w-4 text-yellow-500" />}
                          {team.rank}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {team.teamName}
                          {team.isMyTeam && <Badge variant="default" className="text-xs">You</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>{team.owner}</TableCell>
                      <TableCell className="text-center">{team.record}</TableCell>
                      <TableCell className="text-right">{team.pointsFor.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{team.pointsAgainst.toFixed(1)}</TableCell>
                      <TableCell className="text-center">
                        <span className={cn("font-medium", getStreakColor(team.streak))}>
                          {team.streak}
                        </span>
                      </TableCell>
                      <TableCell>
                        {team.rank <= 4 ? (
                          <Badge className="bg-green-500 text-white">Playoff</Badge>
                        ) : team.rank <= 6 ? (
                          <Badge variant="secondary">Bubble</Badge>
                        ) : (
                          <Badge variant="outline">Eliminated</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Playoff Picture */}
        <TabsContent value="playoffs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Playoff Teams</CardTitle>
                <CardDescription>Top 4 teams qualify for playoffs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {standings.slice(0, 4).map((team, idx) => (
                    <div key={team.rank} className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-green-500 text-white">#{idx + 1}</Badge>
                        <div>
                          <div className="font-medium">{team.teamName}</div>
                          <div className="text-sm text-muted-foreground">{team.record}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{team.pointsFor.toFixed(0)} PF</div>
                        <div className="text-xs text-muted-foreground">{team.streak}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>In The Hunt</CardTitle>
                <CardDescription>Teams fighting for playoff spots</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {standings.slice(4, 8).map(team => (
                    <div key={team.rank} className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">#{team.rank}</Badge>
                        <div>
                          <div className="font-medium">{team.teamName}</div>
                          <div className="text-sm text-muted-foreground">{team.record}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          {Math.abs(team.rank - 4)} {team.rank - 4 > 0 ? 'GB' : 'GA'}
                        </div>
                        <div className="text-xs text-muted-foreground">{team.streak}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}