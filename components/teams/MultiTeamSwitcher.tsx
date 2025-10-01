'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ChevronDown, Trophy, TrendingUp, TrendingDown, 
  AlertTriangle, Star, Users, Activity 
} from 'lucide-react';
import useSleeperStore from '@/lib/store/useSleeperStore';
import { cn } from '@/lib/utils';

export function MultiTeamSwitcher() {
  const {
    user,
    leagues,
    currentLeague,
    myRoster,
    rosters,
    selectLeague,
    isLoading
  } = useSleeperStore();
  
  // Calculate team stats for each league
  const getLeagueStats = (leagueId: string) => {
    const league = leagues.find(l => l.league_id === leagueId);
    if (!league || leagueId !== currentLeague?.league_id) {
      // Return placeholder data for other leagues (would fetch in production)
      return {
        record: '0-0',
        rank: '-',
        points: 0,
        trend: 'steady' as const
      };
    }
    
    // Get actual stats for current league
    const myTeamRoster = myRoster;
    if (!myTeamRoster) {
      return {
        record: '0-0',
        rank: '-',
        points: 0,
        trend: 'steady' as const
      };
    }
    
    const wins = myTeamRoster.settings?.wins || 0;
    const losses = myTeamRoster.settings?.losses || 0;
    const ties = myTeamRoster.settings?.ties || 0;
    const points = myTeamRoster.settings?.fpts || 0;
    
    // Calculate rank
    const sortedRosters = [...rosters].sort((a, b) => {
      const aWinPct = (a.settings?.wins || 0) / Math.max((a.settings?.wins || 0) + (a.settings?.losses || 0), 1);
      const bWinPct = (b.settings?.wins || 0) / Math.max((b.settings?.wins || 0) + (b.settings?.losses || 0), 1);
      if (aWinPct !== bWinPct) return bWinPct - aWinPct;
      return (b.settings?.fpts || 0) - (a.settings?.fpts || 0);
    });
    
    const rank = sortedRosters.findIndex(r => r.roster_id === myTeamRoster.roster_id) + 1;
    
    // Simple trend calculation (would be more sophisticated in production)
    const winPct = wins / Math.max(wins + losses, 1);
    const trend = winPct > 0.6 ? 'up' : winPct < 0.4 ? 'down' : 'steady';
    
    return {
      record: ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`,
      rank: `${rank}/${rosters.length}`,
      points,
      trend
    };
  };
  
  const currentStats = currentLeague ? getLeagueStats(currentLeague.league_id) : null;
  
  return (
    <div className="w-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between"
            disabled={isLoading}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>
                  {currentLeague?.name?.slice(0, 2).toUpperCase() || 'FF'}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="font-medium">{currentLeague?.name || 'Select Team'}</div>
                {currentStats && (
                  <div className="text-xs text-muted-foreground">
                    {currentStats.record} • Rank {currentStats.rank}
                  </div>
                )}
              </div>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-96 z-50 mt-2 bg-gradient-to-br from-background via-background/95 to-background/90 backdrop-blur-xl border border-border/50 shadow-2xl" align="start">
          <DropdownMenuLabel className="px-4 py-3 bg-gradient-to-r from-primary/10 to-purple-500/10 border-b border-border/30">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-semibold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                My Teams ({leagues.length})
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {leagues.map(league => {
              const stats = getLeagueStats(league.league_id);
              const isActive = league.league_id === currentLeague?.league_id;
              
              return (
                <DropdownMenuItem
                  key={league.league_id}
                  onClick={() => selectLeague(league.league_id)}
                  className={cn(
                    "cursor-pointer p-4 m-1 rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-primary/10 hover:to-purple-500/10 hover:shadow-md",
                    isActive && "bg-gradient-to-r from-primary/15 to-purple-500/15 border border-primary/20 shadow-sm"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 shadow-md">
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-foreground font-bold">
                          {league.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground truncate">{league.name}</span>
                          {isActive && (
                            <Badge variant="secondary" className="text-xs bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-700 border-green-500/30">
                              Active
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium">{stats.record}</span>
                          <span className="text-border">•</span>
                          <span>Rank {stats.rank}</span>
                          <span className="text-border">•</span>
                          <span className="font-medium">{stats.points.toFixed(0)} pts</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {stats.trend === 'up' && (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      )}
                      {stats.trend === 'down' && (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      {stats.trend === 'steady' && (
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="my-2" />
          <DropdownMenuItem className="text-xs text-muted-foreground p-3 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg m-1">
            <div className="flex items-center gap-2">
              <Trophy className="h-3 w-3 text-yellow-500" />
              <span className="font-medium">Season {leagues[0]?.season || new Date().getFullYear()}</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function MultiTeamOverview() {
  const { leagues, selectLeague, isLoading } = useSleeperStore();
  
  // Mock aggregated stats (would calculate from actual data in production)
  const totalWins = leagues.reduce((sum, _) => sum + Math.floor(Math.random() * 10), 0);
  const totalLosses = leagues.reduce((sum, _) => sum + Math.floor(Math.random() * 10), 0);
  const avgRank = Math.floor(Math.random() * 5) + 1;
  const totalPoints = leagues.reduce((sum, _) => sum + Math.random() * 1000 + 500, 0);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Multi-Team Overview</CardTitle>
            <CardDescription>
              Managing {leagues.length} teams this season
            </CardDescription>
          </div>
          <Badge variant="outline">
            <Activity className="h-3 w-3 mr-1" />
            All Teams
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Aggregate Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <div className="text-2xl font-bold">{totalWins}-{totalLosses}</div>
            <div className="text-xs text-muted-foreground">Combined Record</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{avgRank}</div>
            <div className="text-xs text-muted-foreground">Avg Rank</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{totalPoints.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">Total Points</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{leagues.length}</div>
            <div className="text-xs text-muted-foreground">Active Leagues</div>
          </div>
        </div>
        
        {/* Team Cards */}
        <div className="space-y-3">
          {leagues.map(league => {
            // Mock data for each team (would be real in production)
            const wins = Math.floor(Math.random() * 10);
            const losses = Math.floor(Math.random() * 10);
            const rank = Math.floor(Math.random() * 10) + 1;
            const points = (Math.random() * 1000 + 500).toFixed(1);
            const needsAttention = Math.random() > 0.7;
            
            return (
              <div
                key={league.league_id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50",
                  needsAttention && "border-orange-500/50 bg-orange-500/5"
                )}
                onClick={() => !isLoading && selectLeague(league.league_id)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {league.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{league.name}</span>
                      {needsAttention && (
                        <Badge variant="outline" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Needs Attention
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {wins}-{losses} • Rank {rank}/12 • {points} pts
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  View →
                </Button>
              </div>
            );
          })}
        </div>
        
        {/* Action Items */}
        <div className="mt-6 pt-6 border-t">
          <div className="text-sm font-medium mb-3">Action Items</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>3 teams have players on bye this week</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span>2 teams have injured starters</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>5 waiver wire opportunities detected</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}