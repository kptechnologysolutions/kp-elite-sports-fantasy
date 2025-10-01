'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ModernNav } from '@/components/layout/ModernNav';
import { 
  Search, TrendingUp, TrendingDown, Users, Filter,
  Plus, Minus, Star, AlertCircle, Activity, Target,
  ChevronDown, ChevronUp
} from 'lucide-react';
import useSleeperStore from '@/lib/store/useSleeperStore';
import { cn } from '@/lib/utils';
import { SleeperPlayer } from '@/lib/services/sleeperService';

type PositionFilter = 'ALL' | 'QB' | 'RB' | 'WR' | 'TE' | 'FLEX' | 'K' | 'DEF' | 'IDP';
type AvailabilityFilter = 'ALL' | 'AVAILABLE' | 'ROSTERED' | 'MY_TEAM';

export default function SleeperStatsCenter() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<PositionFilter>('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('ALL');
  const [sortBy, setSortBy] = useState<'points' | 'trend' | 'ownership'>('points');
  const [weekRange, setWeekRange] = useState<'season' | 'last3' | 'last5'>('season');
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());
  
  const {
    user,
    currentLeague,
    myRoster,
    rosters,
    players,
    currentMatchups,
    currentWeek,
    seasonMatchups,
    getPlayer,
    fetchPlayers,
    isLoading
  } = useSleeperStore();
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);
  
  // Fetch players if needed
  useEffect(() => {
    if (players.size === 0) {
      fetchPlayers();
    }
  }, []);
  
  // Get all rostered players across the league
  const rosteredPlayerIds = new Set<string>();
  rosters.forEach(roster => {
    roster.players.forEach(playerId => rosteredPlayerIds.add(playerId));
  });
  
  // Get my team's players
  const myPlayerIds = new Set(myRoster?.players || []);
  
  // Calculate player stats from actual matchup data
  const getPlayerStats = (player: SleeperPlayer) => {
    const isRostered = rosteredPlayerIds.has(player.player_id);
    const isMyPlayer = myPlayerIds.has(player.player_id);
    
    // Get current week points from any roster that has this player
    let currentPoints = 0;
    const currentMatchup = currentMatchups.find(m => 
      m.players?.includes(player.player_id)
    );
    if (currentMatchup) {
      currentPoints = currentMatchup.players_points?.[player.player_id] || 0;
    }
    
    // Calculate season average from all weeks
    let totalPoints = 0;
    let gamesPlayed = 0;
    const weeklyPoints: number[] = [];
    
    if (seasonMatchups && seasonMatchups.size > 0) {
      // Go through each week's matchups
      for (let week = 1; week < currentWeek; week++) {
        const weekMatchups = seasonMatchups.get(week);
        if (weekMatchups) {
          const matchupWithPlayer = weekMatchups.find(m => 
            m.players?.includes(player.player_id)
          );
          if (matchupWithPlayer) {
            const weekPoints = matchupWithPlayer.players_points?.[player.player_id];
            if (weekPoints !== undefined) {
              totalPoints += weekPoints;
              gamesPlayed++;
              weeklyPoints.push(weekPoints);
            }
          }
        }
      }
    }
    
    const seasonAvg = gamesPlayed > 0 ? totalPoints / gamesPlayed : 0;
    
    // Calculate last 3 weeks average
    const last3Weeks = weeklyPoints.slice(-3);
    const last3Avg = last3Weeks.length > 0 
      ? last3Weeks.reduce((a, b) => a + b, 0) / last3Weeks.length 
      : 0;
    
    // Calculate trend based on recent performance vs season average
    let trend: 'up' | 'down' | 'steady' = 'steady';
    if (last3Weeks.length >= 2) {
      const recentTrend = last3Weeks[last3Weeks.length - 1] - last3Weeks[0];
      if (recentTrend > seasonAvg * 0.2) trend = 'up';
      else if (recentTrend < -seasonAvg * 0.2) trend = 'down';
    }
    
    // Calculate ownership percentage (what % of rosters have this player)
    const totalRosters = rosters.length;
    const rostersWithPlayer = rosters.filter(r => 
      r.players.includes(player.player_id)
    ).length;
    const ownership = totalRosters > 0 
      ? ((rostersWithPlayer / totalRosters) * 100).toFixed(1)
      : '0';
    
    return {
      currentPoints,
      seasonAvg,
      last3Avg,
      trend,
      ownership,
      isRostered,
      isMyPlayer,
      projectedPoints: last3Avg > 0 ? last3Avg : seasonAvg,
      gamesPlayed,
      weeklyPoints
    };
  };
  
  // Filter and sort players
  const filteredPlayers = Array.from(players.values())
    .filter(player => {
      // Position filter
      if (positionFilter !== 'ALL') {
        if (positionFilter === 'FLEX') {
          if (!['RB', 'WR', 'TE'].includes(player.position)) return false;
        } else if (positionFilter === 'IDP') {
          if (!['LB', 'DL', 'DB', 'IDP'].includes(player.position)) return false;
        } else {
          if (player.position !== positionFilter) return false;
        }
      }
      
      // Availability filter
      const isRostered = rosteredPlayerIds.has(player.player_id);
      const isMyPlayer = myPlayerIds.has(player.player_id);
      
      if (availabilityFilter === 'AVAILABLE' && isRostered) return false;
      if (availabilityFilter === 'ROSTERED' && !isRostered) return false;
      if (availabilityFilter === 'MY_TEAM' && !isMyPlayer) return false;
      
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const fullName = `${player.first_name} ${player.last_name}`.toLowerCase();
        const team = (player.team || '').toLowerCase();
        
        if (!fullName.includes(query) && !team.includes(query)) {
          return false;
        }
      }
      
      // Only show active players
      if (!player.team && player.position !== 'DEF') return false;
      
      return true;
    })
    .map(player => ({
      ...player,
      stats: getPlayerStats(player)
    }))
    .sort((a, b) => {
      if (sortBy === 'points') {
        return b.stats.seasonAvg - a.stats.seasonAvg;
      } else if (sortBy === 'trend') {
        const trendValue = (p: any) => 
          p.stats.trend === 'up' ? 2 : p.stats.trend === 'steady' ? 1 : 0;
        return trendValue(b) - trendValue(a);
      } else {
        return parseFloat(b.stats.ownership) - parseFloat(a.stats.ownership);
      }
    })
    .slice(0, 100); // Limit to top 100 for performance
  
  const togglePlayerExpand = (playerId: string) => {
    const newExpanded = new Set(expandedPlayers);
    if (newExpanded.has(playerId)) {
      newExpanded.delete(playerId);
    } else {
      newExpanded.add(playerId);
    }
    setExpandedPlayers(newExpanded);
  };

  const PlayerRow = ({ player, stats }: any) => {
    const isExpanded = expandedPlayers.has(player.player_id);
    
    return (
      <div className={cn(
        "rounded-lg border transition-all",
        stats.isMyPlayer && "bg-primary/5 border-primary/20"
      )}>
        <div className="flex items-center justify-between p-3 hover:bg-muted/50">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex flex-col items-center">
              <Badge variant={stats.isMyPlayer ? "default" : "outline"}>
                {player.position}
              </Badge>
              {stats.trend === 'up' && (
                <TrendingUp className="h-3 w-3 text-green-500 mt-1" />
              )}
              {stats.trend === 'down' && (
                <TrendingDown className="h-3 w-3 text-red-500 mt-1" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {player.first_name} {player.last_name}
                </span>
                {stats.isMyPlayer && (
                  <Badge variant="secondary" className="text-xs">My Team</Badge>
                )}
                {stats.isRostered && !stats.isMyPlayer && (
                  <Badge variant="outline" className="text-xs">Rostered</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{player.team || 'FA'}</span>
                {player.injury_status && (
                  <>
                    <span>•</span>
                    <span className="text-orange-500">{player.injury_status}</span>
                  </>
                )}
                <span>•</span>
                <span>{stats.ownership}% rostered</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className={cn(
                "text-sm font-bold",
                stats.currentPoints > stats.seasonAvg * 1.2 && "text-green-500",
                stats.currentPoints < stats.seasonAvg * 0.8 && stats.currentPoints > 0 && "text-red-500"
              )}>
                {stats.currentPoints.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">Week {currentWeek}</div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-bold">{stats.seasonAvg.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">
                Avg ({stats.gamesPlayed}g)
              </div>
            </div>
            
            <div className="text-right">
              <div className={cn(
                "text-sm font-bold",
                stats.last3Avg > stats.seasonAvg * 1.1 && "text-green-500",
                stats.last3Avg < stats.seasonAvg * 0.9 && stats.last3Avg > 0 && "text-orange-500"
              )}>
                {stats.last3Avg.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">L3</div>
            </div>
            
            {stats.gamesPlayed > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => togglePlayerExpand(player.player_id)}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
            
            {!stats.isRostered && (
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            )}
            {stats.isMyPlayer && (
              <Button variant="ghost" size="sm">
                <Minus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Weekly Performance Breakdown */}
        {isExpanded && stats.weeklyPoints && stats.weeklyPoints.length > 0 && (
          <div className="px-3 pb-3">
            <div className="bg-muted/30 rounded p-3">
              <div className="text-sm font-medium mb-2">Weekly Performance</div>
              <div className="grid grid-cols-6 md:grid-cols-9 gap-2">
                {stats.weeklyPoints.map((points: number, idx: number) => {
                  const week = idx + 1;
                  const isGoodWeek = points > stats.seasonAvg * 1.2;
                  const isBadWeek = points < stats.seasonAvg * 0.7;
                  
                  return (
                    <div key={week} className="text-center">
                      <div className="text-xs text-muted-foreground">W{week}</div>
                      <div className={cn(
                        "text-sm font-bold",
                        isGoodWeek && "text-green-500",
                        isBadWeek && "text-red-500"
                      )}>
                        {points.toFixed(1)}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Performance Summary */}
              <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">High: </span>
                  <span className="font-medium text-green-500">
                    {Math.max(...stats.weeklyPoints).toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Low: </span>
                  <span className="font-medium text-red-500">
                    {Math.min(...stats.weeklyPoints).toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Consistency: </span>
                  <span className="font-medium">
                    {(() => {
                      const std = Math.sqrt(
                        stats.weeklyPoints.reduce((sum: number, p: number) => 
                          sum + Math.pow(p - stats.seasonAvg, 2), 0
                        ) / stats.weeklyPoints.length
                      );
                      const cv = (std / stats.seasonAvg) * 100;
                      return cv < 30 ? 'High' : cv < 50 ? 'Med' : 'Low';
                    })()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  if (!user) return null;
  
  return (
    <div className="min-h-screen bg-background">
      <ModernNav />
      
      <main className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Player Stats Center</h1>
          <p className="text-muted-foreground">
            {currentLeague?.name || 'All Players'} • Week {currentWeek}
          </p>
        </div>
        
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <Select value={positionFilter} onValueChange={(v) => setPositionFilter(v as PositionFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Positions</SelectItem>
                  <SelectItem value="QB">QB</SelectItem>
                  <SelectItem value="RB">RB</SelectItem>
                  <SelectItem value="WR">WR</SelectItem>
                  <SelectItem value="TE">TE</SelectItem>
                  <SelectItem value="FLEX">FLEX (RB/WR/TE)</SelectItem>
                  <SelectItem value="K">K</SelectItem>
                  <SelectItem value="DEF">DEF</SelectItem>
                  <SelectItem value="IDP">IDP</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={availabilityFilter} onValueChange={(v) => setAvailabilityFilter(v as AvailabilityFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Players</SelectItem>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="ROSTERED">Rostered</SelectItem>
                  <SelectItem value="MY_TEAM">My Team</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">Points (Avg)</SelectItem>
                  <SelectItem value="trend">Trend</SelectItem>
                  <SelectItem value="ownership">Ownership %</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={weekRange} onValueChange={(v) => setWeekRange(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Week range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="season">Season</SelectItem>
                  <SelectItem value="last3">Last 3 Weeks</SelectItem>
                  <SelectItem value="last5">Last 5 Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {/* Position Needs Analysis */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">QB Depth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {myRoster?.players.filter(p => getPlayer(p)?.position === 'QB').length || 0}
              </div>
              <div className="text-xs text-muted-foreground">
                Recommended: 2-3
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">RB Depth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {myRoster?.players.filter(p => getPlayer(p)?.position === 'RB').length || 0}
              </div>
              <div className="text-xs text-muted-foreground">
                Recommended: 5-6
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">WR Depth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {myRoster?.players.filter(p => getPlayer(p)?.position === 'WR').length || 0}
              </div>
              <div className="text-xs text-muted-foreground">
                Recommended: 5-6
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">TE Depth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {myRoster?.players.filter(p => getPlayer(p)?.position === 'TE').length || 0}
              </div>
              <div className="text-xs text-muted-foreground">
                Recommended: 2-3
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Players List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Players</CardTitle>
                <CardDescription>
                  Showing {filteredPlayers.length} players
                </CardDescription>
              </div>
              <Badge variant="outline">
                <Activity className="h-3 w-3 mr-1" />
                Live Stats
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading players...
              </div>
            ) : filteredPlayers.length > 0 ? (
              <div className="space-y-2">
                {filteredPlayers.map(player => (
                  <PlayerRow key={player.player_id} player={player} stats={player.stats} />
                ))}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No players found matching your filters.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}