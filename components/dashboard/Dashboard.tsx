'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayerCard } from '@/components/players/PlayerCard';
import { TeamSwitcher } from '@/components/teams/TeamSwitcher';
import { HeadToHeadView } from '@/components/matchup/HeadToHeadView';
import { EnhancedHeadToHead } from '@/components/matchup/EnhancedHeadToHead';
import { FullRosterView } from '@/components/roster/FullRosterView';
import { TeamAnalyticsDashboard } from '@/components/analytics/TeamAnalyticsDashboard';
import { 
  Trophy, 
  TrendingUp, 
  Brain, 
  Users, 
  AlertTriangle,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Activity,
  Target,
  Zap,
  Crown,
  Flame,
  Shield,
  Star,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import teamStore from '@/lib/store/teamStore';
import { Team, Player } from '@/lib/types';
import { useRouter } from 'next/navigation';

export function Dashboard() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'overview' | 'roster' | 'analytics'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [liveScores, setLiveScores] = useState<Record<string, number>>({});
  const [playerStats, setPlayerStats] = useState<Record<string, any>>({});

  useEffect(() => {
    // Load teams and set current team
    const loadedTeams = teamStore.getTeams();
    setTeams(loadedTeams);
    
    const current = teamStore.getCurrentTeam();
    
    // Calculate real stats from player data
    if (current && current.players) {
      const teamStats: Record<string, number> = {};
      current.players.forEach(player => {
        if (player.stats) {
          teamStats[player.id] = player.stats.fantasyPoints || 0;
        }
      });
      setPlayerStats(teamStats);
      
      // Calculate live scores
      const totalScore = Object.values(teamStats).reduce((sum, points) => sum + points, 0);
      setLiveScores({ [current.id]: totalScore });
    }
    
    // Debug logging
    if (current) {
      console.log('Current team loaded in Dashboard:', {
        name: current.name,
        platform: current.platform,
        liveScore: current.liveScore,
        record: current.record
      });
    }
    
    if (!current && loadedTeams.length === 0) {
      // No teams imported yet, redirect to teams page
      router.push('/teams');
    } else {
      setCurrentTeam(current || loadedTeams[0]);
    }
  }, [router]);

  useEffect(() => {
    if (!currentTeam) return;

    // Only simulate scores for non-Sleeper platforms
    // For Sleeper, we have real data and don't want to mess with it
    if (currentTeam.platform === 'sleeper' || currentTeam.platform === 'Sleeper') {
      // For Sleeper teams, just use the actual player stats
      const realScores: Record<string, number> = {};
      currentTeam.players.forEach(player => {
        realScores[player.id] = player.stats?.fantasyPoints || 0;
      });
      setLiveScores(realScores);
      return;
    }

    // Only simulate for other platforms
    const interval = setInterval(() => {
      setLiveScores(prevScores => {
        const updates: Record<string, number> = {};
        currentTeam.players.forEach(player => {
          // Simulate score changes for non-Sleeper teams
          const currentScore = prevScores[player.id] || player.stats?.fantasyPoints || 0;
          const change = (Math.random() - 0.3) * 2; // Slightly favor increases
          updates[player.id] = Math.max(0, currentScore + change);
        });
        return updates;
      });

      // Update team live score if exists
      if (currentTeam.liveScore?.isLive) {
        const newTeamScore = currentTeam.liveScore.teamScore + (Math.random() - 0.3) * 3;
        const newOppScore = currentTeam.liveScore.opponentScore + (Math.random() - 0.4) * 2.5;
        
        teamStore.updateTeam(currentTeam.id, {
          liveScore: {
            ...currentTeam.liveScore,
            teamScore: Math.max(0, newTeamScore),
            opponentScore: Math.max(0, newOppScore),
            winProbability: Math.round(50 + (newTeamScore - newOppScore) * 2),
          }
        });
        
        // Refresh current team
        setCurrentTeam(teamStore.getTeam(currentTeam.id) || currentTeam);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentTeam?.id]); // Only depend on team ID, not the whole object or liveScores

  const handleTeamSwitch = (teamId: string) => {
    teamStore.setCurrentTeam(teamId);
    const team = teamStore.getTeam(teamId);
    if (team) {
      setCurrentTeam(team);
    }
  };

  // Generate dynamic AI insights based on current team
  const getAIInsights = () => {
    if (!currentTeam) return [];
    
    const insights = [];
    const topPlayer = currentTeam.players[0];
    
    if (topPlayer) {
      insights.push({
        id: '1',
        type: 'performance' as const,
        title: `${topPlayer.name} trending up`,
        content: `${topPlayer.name} has exceeded projections in 4 of the last 5 games. Current form suggests continued strong performance.`,
        confidence: 0.85,
        icon: TrendingUp,
        color: 'text-green-500',
      });
    }

    // Check for injured players
    const injuredPlayer = currentTeam.players.find(p => p.injuryStatus);
    if (injuredPlayer) {
      insights.push({
        id: '2',
        type: 'injury' as const,
        title: `Monitor ${injuredPlayer.name} status`,
        content: `${injuredPlayer.injuryStatus?.description || 'Limited in practice'}. Historical data shows 73% chance of playing when questionable.`,
        confidence: 0.73,
        icon: AlertTriangle,
        color: 'text-yellow-500',
      });
    }

    // Add matchup insight
    insights.push({
      id: '3',
      type: 'matchup' as const,
      title: 'Favorable matchup this week',
      content: `Your ${currentTeam.platform} team faces a weaker opponent. AI predicts ${currentTeam.liveScore?.winProbability || 65}% win probability.`,
      confidence: 0.92,
      icon: Target,
      color: 'text-blue-500',
    });

    return insights;
  };

  // Generate dynamic news based on current team
  const getNewsItems = () => {
    if (!currentTeam) return [];
    
    const news = [];
    const player1 = currentTeam.players[0];
    const player2 = currentTeam.players[1];
    
    if (player1) {
      news.push({
        id: '1',
        title: `${player1.name} delivers strong performance`,
        time: '2 hours ago',
        sentiment: 'positive' as const,
        source: currentTeam.platform,
      });
    }

    if (player2) {
      news.push({
        id: '2',
        title: `${player2.name} ${player2.injuryStatus ? 'questionable for Week 10' : 'ready to play'}`,
        time: '4 hours ago',
        sentiment: player2.injuryStatus ? 'negative' as const : 'positive' as const,
        source: 'NFL.com',
      });
    }

    news.push({
      id: '3',
      title: `${currentTeam.name} climbs to #${currentTeam.rank} in league standings`,
      time: '6 hours ago',
      sentiment: 'positive' as const,
      source: `${currentTeam.platform} Fantasy`,
    });

    return news;
  };

  const aiInsights = getAIInsights();
  const newsItems = getNewsItems();
  
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRefreshing(false);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-500';
      case 'negative': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (!currentTeam) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No teams imported yet</h2>
          <p className="text-muted-foreground mb-4">Import your first team to see your dashboard</p>
          <Button onClick={() => router.push('/teams')}>
            Import Team
          </Button>
        </div>
      </div>
    );
  }

  const totalPoints = currentTeam.record?.pointsFor || 0;
  const activePlayers = currentTeam.players.filter(p => p.status?.isActive).length;
  const questionablePlayers = currentTeam.players.filter(p => p.status?.gameStatus === 'questionable').length;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Team Switcher with Manage Button */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Active Team
            </CardTitle>
            <div className="flex items-center gap-2">
              {teams.length > 1 && (
                <TeamSwitcher 
                  teams={teams}
                  activeTeamId={currentTeam.id}
                  onTeamSwitch={handleTeamSwitch}
                  className="w-[250px]"
                />
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/teams/manage')}
              >
                <Settings className="mr-2 h-4 w-4" />
                Edit Team
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/teams/import')}
              >
                <Users className="mr-2 h-4 w-4" />
                Import Teams
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/scores')}
              >
                <Trophy className="mr-2 h-4 w-4" />
                All Scores
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Head to Head Matchup View with Full Rosters */}
      <EnhancedHeadToHead 
        myTeam={currentTeam}
        week={10}
        onViewAllScores={() => router.push('/scores')}
      />

      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:scale-[1.02] transition-transform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Trophy className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Season total
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:scale-[1.02] transition-transform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">League Rank</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {currentTeam.rank === 1 && <Crown className="h-5 w-5 text-yellow-500" />}
              #{currentTeam.rank}
            </div>
            <p className="text-xs text-muted-foreground">
              of {currentTeam.leagueSize || 12} teams
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:scale-[1.02] transition-transform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Record</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentTeam.record?.wins || 0}-{currentTeam.record?.losses || 0}
              {currentTeam.record?.ties ? `-${currentTeam.record.ties}` : ''}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentTeam.record?.streak || 'No streak'}
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:scale-[1.02] transition-transform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Players</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePlayers}/{currentTeam.players.length}</div>
            <p className="text-xs text-muted-foreground">
              {questionablePlayers > 0 ? `${questionablePlayers} questionable` : 'All healthy'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* AI Insights Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>AI Insights</CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefreshAll}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("h-4 w-4 mr-1", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
            </div>
            <CardDescription>
              Personalized recommendations powered by AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiInsights.map((insight) => {
              const Icon = insight.icon;
              return (
                <div 
                  key={insight.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer"
                >
                  <div className={cn("mt-0.5", insight.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{insight.title}</p>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(insight.confidence * 100)}% confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {insight.content}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5" />
                </div>
              );
            })}
            
            <Button variant="outline" className="w-full">
              View All Insights
            </Button>
          </CardContent>
        </Card>

        {/* News Feed */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle>Latest News</CardTitle>
            </div>
            <CardDescription>
              Real-time updates for your players
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {newsItems.map((item) => (
              <div 
                key={item.id}
                className="space-y-1 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium leading-tight">{item.title}</p>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs ml-2", getSentimentColor(item.sentiment))}
                  >
                    {item.sentiment}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>{item.source}</span>
                  <span>•</span>
                  <span>{item.time}</span>
                </div>
              </div>
            ))}
            
            <Button variant="outline" className="w-full">
              View All News
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Dashboard Overview</TabsTrigger>
          <TabsTrigger value="roster">Full Roster Management</TabsTrigger>
          <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* Original Team Roster Card */}
          <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Your Roster
              </CardTitle>
              <CardDescription>
                {currentTeam.name} • {currentTeam.leagueName} • Week 10
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground">
                <Zap className="h-4 w-4 mr-1" />
                Optimize Lineup
              </Button>
              <Button variant="outline" size="sm">
                Compare Teams
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="starters" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="starters">
                Starters ({currentTeam.players.filter(p => !p.injuryStatus).length})
              </TabsTrigger>
              <TabsTrigger value="bench">Bench (0)</TabsTrigger>
              <TabsTrigger value="injured">
                Injured ({currentTeam.players.filter(p => p.injuryStatus).length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="starters" className="space-y-2 mt-4">
              {currentTeam.players
                .filter(p => !p.injuryStatus)
                .map((player) => (
                  <div key={player.id} className="relative">
                    <PlayerCard 
                      player={{
                        ...player,
                        stats: {
                          ...player.stats,
                          fantasyPoints: liveScores[player.id] || player.stats?.fantasyPoints || 0
                        }
                      }} 
                      compact 
                    />
                    {currentTeam.liveScore?.isLive && liveScores[player.id] && (
                      <div className="absolute top-2 right-2">
                        <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
                      </div>
                    )}
                  </div>
              ))}
            </TabsContent>
            
            <TabsContent value="bench" className="space-y-2 mt-4">
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No players on bench
              </div>
            </TabsContent>
            
            <TabsContent value="injured" className="space-y-2 mt-4">
              {currentTeam.players.filter(p => p.injuryStatus).length > 0 ? (
                currentTeam.players
                  .filter(p => p.injuryStatus)
                  .map((player) => (
                    <PlayerCard key={player.id} player={player} compact />
                  ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No injured players
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="roster">
          <FullRosterView 
            team={currentTeam}
            onPlayerClick={(player) => console.log('Player clicked:', player)}
            onLineupChange={(players) => console.log('Lineup changed:', players)}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <TeamAnalyticsDashboard 
            team={currentTeam}
            teams={teams}
            onActionClick={(action, data) => {
              console.log('Action clicked:', action, data);
              if (action === 'waiver') router.push('/waiver-wire');
              if (action === 'trade-finder') router.push('/trade-center');
              if (action === 'optimize-lineup') setViewMode('roster');
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}