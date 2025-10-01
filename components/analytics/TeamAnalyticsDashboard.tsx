'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  TrendingUp, TrendingDown, Trophy, Target, Shield, AlertTriangle, 
  Activity, Zap, Calendar, Clock, Users, ChevronRight, Brain,
  BarChart3, PieChart, LineChart, Sparkles, Calculator
} from 'lucide-react';
import { Team, Player } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, LineChart as RechartsLineChart, Line, 
  PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface TeamAnalyticsDashboardProps {
  team: Team;
  teams?: Team[]; // All teams for multi-league view
  onActionClick?: (action: string, data?: any) => void;
}

// Analytics categories
const ANALYTICS_CATEGORIES = {
  performance: {
    label: 'Performance',
    icon: TrendingUp,
    metrics: ['points', 'consistency', 'efficiency', 'trend']
  },
  roster: {
    label: 'Roster Quality',
    icon: Users,
    metrics: ['depth', 'injuries', 'byes', 'balance']
  },
  schedule: {
    label: 'Schedule',
    icon: Calendar,
    metrics: ['difficulty', 'remaining', 'playoffs', 'matchups']
  },
  predictions: {
    label: 'AI Predictions',
    icon: Brain,
    metrics: ['playoffs', 'championship', 'weekly', 'season']
  }
};

export function TeamAnalyticsDashboard({ team, teams, onActionClick }: TeamAnalyticsDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState('performance');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'season'>('season');
  const [comparisonMode, setComparisonMode] = useState(false);

  // Calculate team analytics
  const teamAnalytics = useMemo(() => {
    const totalPoints = team.players.reduce((sum, p) => sum + (p.stats?.fantasyPoints || 0), 0);
    const avgPoints = totalPoints / Math.max(team.players.length, 1);
    const projectedPoints = team.players.reduce((sum, p) => sum + (p.stats?.projectedPoints || 0), 0);
    
    // Position distribution
    const positionCounts = team.players.reduce((acc, p) => {
      acc[p.position] = (acc[p.position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Injury analysis
    const injuredPlayers = team.players.filter(p => 
      p.injuryStatus || ['questionable', 'doubtful', 'out'].includes(p.status?.gameStatus || '')
    );

    // Weekly performance (mock data for demo)
    const weeklyData = Array.from({ length: 10 }, (_, i) => ({
      week: i + 1,
      actual: Math.round(90 + Math.random() * 60),
      projected: Math.round(100 + Math.random() * 40),
      leagueAvg: Math.round(95 + Math.random() * 30)
    }));

    // Position strength scores
    const positionStrength = {
      QB: Math.round(75 + Math.random() * 25),
      RB: Math.round(65 + Math.random() * 35),
      WR: Math.round(70 + Math.random() * 30),
      TE: Math.round(60 + Math.random() * 40),
      K: Math.round(80 + Math.random() * 20),
      DST: Math.round(70 + Math.random() * 30)
    };

    // Schedule difficulty (remaining games)
    const remainingSchedule = Array.from({ length: 7 }, (_, i) => ({
      week: 11 + i,
      opponent: `Team ${Math.floor(Math.random() * 12) + 1}`,
      difficulty: Math.random(),
      projectedScore: Math.round(95 + Math.random() * 50)
    }));

    // Playoff probability calculation
    const wins = team.record?.wins || 0;
    const losses = team.record?.losses || 0;
    const totalGames = wins + losses;
    const winRate = totalGames > 0 ? wins / totalGames : 0.5;
    const remainingGames = 17 - totalGames;
    const projectedWins = wins + (winRate * remainingGames);
    const playoffProbability = Math.min(95, Math.max(5, projectedWins / 17 * 150));

    return {
      overview: {
        totalPoints,
        avgPoints,
        projectedPoints,
        pointsDiff: projectedPoints - totalPoints,
        ranking: team.rank || 1,
        winRate,
        playoffProbability,
        championshipOdds: Math.max(5, playoffProbability * 0.3)
      },
      positions: {
        distribution: positionCounts,
        strength: positionStrength,
        weakest: Object.entries(positionStrength).sort((a, b) => a[1] - b[1])[0],
        strongest: Object.entries(positionStrength).sort((a, b) => b[1] - a[1])[0]
      },
      injuries: {
        count: injuredPlayers.length,
        players: injuredPlayers,
        impact: injuredPlayers.reduce((sum, p) => sum + (p.stats?.projectedPoints || 0), 0)
      },
      weekly: weeklyData,
      schedule: {
        remaining: remainingSchedule,
        avgDifficulty: remainingSchedule.reduce((sum, g) => sum + g.difficulty, 0) / remainingSchedule.length,
        easiestWeek: remainingSchedule.sort((a, b) => a.difficulty - b.difficulty)[0],
        hardestWeek: remainingSchedule.sort((a, b) => b.difficulty - a.difficulty)[0]
      }
    };
  }, [team]);

  // Chart colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Header with Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>League Rank</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">#{teamAnalytics.overview.ranking}</span>
              <Badge variant={teamAnalytics.overview.ranking <= 4 ? "default" : "secondary"}>
                {teamAnalytics.overview.ranking <= 4 ? 'Playoff' : 'Fighting'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Playoff Probability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold">
                {teamAnalytics.overview.playoffProbability.toFixed(0)}%
              </div>
              <Progress 
                value={teamAnalytics.overview.playoffProbability} 
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Points Per Game</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {teamAnalytics.overview.avgPoints.toFixed(1)}
              </span>
              <span className={cn(
                "text-sm",
                teamAnalytics.overview.pointsDiff > 0 ? "text-green-600" : "text-red-600"
              )}>
                {teamAnalytics.overview.pointsDiff > 0 ? '+' : ''}
                {teamAnalytics.overview.pointsDiff.toFixed(1)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Championship Odds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="text-3xl font-bold">
                {teamAnalytics.overview.championshipOdds.toFixed(0)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            {Object.entries(ANALYTICS_CATEGORIES).map(([key, cat]) => {
              const Icon = cat.icon;
              return (
                <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{cat.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">Last 4 Weeks</SelectItem>
              <SelectItem value="season">Full Season</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Performance Analytics */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Performance Trend</CardTitle>
                <CardDescription>Points scored vs projections</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsLineChart data={teamAnalytics.weekly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#3b82f6" 
                      name="Actual"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="projected" 
                      stroke="#10b981" 
                      name="Projected"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="leagueAvg" 
                      stroke="#f59e0b" 
                      name="League Avg"
                      strokeWidth={1}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Position Strength */}
            <Card>
              <CardHeader>
                <CardTitle>Position Strength Analysis</CardTitle>
                <CardDescription>Relative strength by position</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={Object.entries(teamAnalytics.positions.strength).map(([pos, score]) => ({
                    position: pos,
                    score,
                    league: 75 // League average baseline
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="position" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="score" fill="#3b82f6" name="Your Team" />
                    <Bar dataKey="league" fill="#e5e7eb" name="League Avg" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                <strong>Trending Up:</strong> Your team has scored above projections in 3 of the last 4 weeks
              </AlertDescription>
            </Alert>

            <Alert>
              <Target className="h-4 w-4" />
              <AlertDescription>
                <strong>Target Area:</strong> {teamAnalytics.positions.weakest[0]} is your weakest position at {teamAnalytics.positions.weakest[1]}% strength
              </AlertDescription>
            </Alert>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Strength:</strong> {teamAnalytics.positions.strongest[0]} leads at {teamAnalytics.positions.strongest[1]}% strength
              </AlertDescription>
            </Alert>
          </div>
        </TabsContent>

        {/* Roster Analytics */}
        <TabsContent value="roster" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Position Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Roster Composition</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <Pie
                      data={Object.entries(teamAnalytics.positions.distribution).map(([pos, count], idx) => ({
                        name: pos,
                        value: count
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(teamAnalytics.positions.distribution).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Injury Report */}
            <Card>
              <CardHeader>
                <CardTitle>Injury Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Injured Players</span>
                    <Badge variant={teamAnalytics.injuries.count > 2 ? "destructive" : "secondary"}>
                      {teamAnalytics.injuries.count}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Points at Risk</span>
                    <span className="font-bold">{teamAnalytics.injuries.impact.toFixed(1)}</span>
                  </div>
                  <div className="space-y-2">
                    {teamAnalytics.injuries.players.slice(0, 3).map(player => (
                      <div key={player.id} className="flex items-center justify-between text-sm">
                        <span>{player.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {player.injuryStatus?.type || player.status?.gameStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  {teamAnalytics.injuries.count > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => onActionClick?.('waiver', { injured: true })}
                    >
                      Find Replacements
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bye Week Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Bye Week Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-2">
                    {[11, 12, 13, 14].map(week => {
                      const byePlayers = Math.floor(Math.random() * 4);
                      return (
                        <div key={week} className="flex items-center justify-between">
                          <span className="text-sm">Week {week}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={byePlayers > 2 ? "destructive" : "secondary"}>
                              {byePlayers} on bye
                            </Badge>
                            <Progress value={100 - (byePlayers * 25)} className="w-20" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Week 13 has heavy byes. Consider picking up coverage now.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Schedule Analytics */}
        <TabsContent value="schedule" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Remaining Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Remaining Schedule Difficulty</CardTitle>
                <CardDescription>
                  Average difficulty: {(teamAnalytics.schedule.avgDifficulty * 100).toFixed(0)}%
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {teamAnalytics.schedule.remaining.map(game => (
                    <div key={game.week} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">W{game.week}</Badge>
                        <span className="font-medium">{game.opponent}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={game.difficulty * 100} 
                          className={cn(
                            "w-20",
                            game.difficulty < 0.4 ? "[&>div]:bg-green-500" :
                            game.difficulty < 0.7 ? "[&>div]:bg-yellow-500" :
                            "[&>div]:bg-red-500"
                          )}
                        />
                        <span className="text-sm text-muted-foreground">
                          {game.projectedScore}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Playoff Path */}
            <Card>
              <CardHeader>
                <CardTitle>Playoff Path Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Current Projection</span>
                      <Badge>{Math.round(teamAnalytics.overview.projectedWins)}-{17 - Math.round(teamAnalytics.overview.projectedWins)}</Badge>
                    </div>
                    <Progress value={teamAnalytics.overview.playoffProbability} />
                    <p className="text-xs text-muted-foreground mt-2">
                      Need {Math.max(0, 9 - team.record?.wins || 0)} more wins for playoff lock
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Key Matchups</h4>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>vs 2nd Place (Week 13)</span>
                        <Badge variant="destructive">Must Win</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>vs 8th Place (Week 15)</span>
                        <Badge variant="secondary">Important</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>vs 12th Place (Week 16)</span>
                        <Badge variant="outline">Expected Win</Badge>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <Trophy className="h-4 w-4" />
                    <AlertDescription>
                      Win next 2 games to increase playoff odds to 85%
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Predictions */}
        <TabsContent value="predictions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Weekly Prediction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  This Week's Prediction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold">118.5</div>
                    <div className="text-sm text-muted-foreground">Projected Points</div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Win Probability</span>
                    <span className="font-bold text-green-600">67%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Confidence</span>
                    <Progress value={82} className="w-24" />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => onActionClick?.('optimize-lineup')}
                  >
                    Optimize Lineup
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Season Outlook */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Season Outlook
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Final Record</span>
                      <Badge variant="outline">10-7</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Playoff Seed</span>
                      <Badge variant="outline">#4</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Championship</span>
                      <Badge variant="outline">18%</Badge>
                    </div>
                  </div>
                  <Alert>
                    <AlertDescription className="text-xs">
                      AI suggests targeting RB depth for playoff run
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            {/* Trade Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Trade Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm font-medium mb-1">Sell High</div>
                    <div className="text-xs text-muted-foreground">
                      CeeDee Lamb - Peak value, tough schedule ahead
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm font-medium mb-1">Buy Low</div>
                    <div className="text-xs text-muted-foreground">
                      Breece Hall - Easy schedule, undervalued
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => onActionClick?.('trade-finder')}
                  >
                    Find Trades
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights Summary */}
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Insights</CardTitle>
              <CardDescription>Personalized recommendations based on your team analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Immediate:</strong> Pick up Kenneth Walker from waivers
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    <strong>This Week:</strong> Start Rachaad White over Zeke
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Trade Target:</strong> Package for elite TE upgrade
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Hold:</strong> Don't panic-drop Diontae Johnson
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}