'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { PlayerCard } from '@/components/players/PlayerCard';
import { EnhancedPlayerCard } from '@/components/players/EnhancedPlayerCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, TrendingUp, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Player } from '@/lib/types';
import { useTeamStore } from '@/lib/store/teamStore';

// Mock data for demonstration (fallback if no teams imported)
const mockPlayers: Player[] = [
  {
    id: '1',
    name: 'Patrick Mahomes',
    position: 'QB',
    team: 'KC',
    jerseyNumber: 15,
    status: { isActive: true, gameStatus: 'playing', lastUpdated: new Date() },
    stats: { 
      season: 2024, 
      week: 10, 
      fantasyPoints: 28.5, 
      projectedPoints: 26.0,
      passingYards: 321,
      passingTDs: 3
    },
  },
  {
    id: '2',
    name: 'Christian McCaffrey',
    position: 'RB',
    team: 'SF',
    jerseyNumber: 23,
    status: { isActive: true, gameStatus: 'questionable', lastUpdated: new Date() },
    stats: { 
      season: 2024, 
      week: 10, 
      fantasyPoints: 22.3, 
      projectedPoints: 24.0,
      rushingYards: 95,
      rushingTDs: 1,
      receptions: 6,
      receivingYards: 42
    },
    injuryStatus: {
      type: 'Ankle Sprain',
      description: 'Limited in practice',
      severity: 'minor',
      practiceStatus: 'limited'
    }
  },
  {
    id: '3',
    name: 'Tyreek Hill',
    position: 'WR',
    team: 'MIA',
    jerseyNumber: 10,
    status: { isActive: true, gameStatus: 'playing', lastUpdated: new Date() },
    stats: { 
      season: 2024, 
      week: 10, 
      fantasyPoints: 18.7, 
      projectedPoints: 17.5,
      receptions: 8,
      receivingYards: 112,
      receivingTDs: 1
    },
  },
  {
    id: '4',
    name: 'Travis Kelce',
    position: 'TE',
    team: 'KC',
    jerseyNumber: 87,
    status: { isActive: true, gameStatus: 'playing', lastUpdated: new Date() },
    stats: { 
      season: 2024, 
      week: 10, 
      fantasyPoints: 15.2, 
      projectedPoints: 14.0,
      receptions: 7,
      receivingYards: 82,
      receivingTDs: 1
    },
  },
  {
    id: '5',
    name: 'Justin Jefferson',
    position: 'WR',
    team: 'MIN',
    jerseyNumber: 18,
    status: { isActive: true, gameStatus: 'playing', lastUpdated: new Date() },
    stats: { 
      season: 2024, 
      week: 10, 
      fantasyPoints: 21.3, 
      projectedPoints: 19.5,
      receptions: 9,
      receivingYards: 143,
      receivingTDs: 1
    },
  },
  {
    id: '6',
    name: 'Josh Allen',
    position: 'QB',
    team: 'BUF',
    jerseyNumber: 17,
    status: { isActive: true, gameStatus: 'playing', lastUpdated: new Date() },
    stats: { 
      season: 2024, 
      week: 10, 
      fantasyPoints: 31.2, 
      projectedPoints: 27.5,
      passingYards: 287,
      passingTDs: 2,
      rushingYards: 54,
      rushingTDs: 1
    },
  },
];

const positionFilters = ['All', 'QB', 'RB', 'WR', 'TE', 'K', 'DEF'];

export default function PlayersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('All');
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const { teams, currentTeam } = useTeamStore();
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  
  useEffect(() => {
    // Get all unique players from all teams
    const playersMap = new Map<string, Player>();
    
    teams.forEach(team => {
      if (team.players && Array.isArray(team.players)) {
        team.players.forEach(player => {
          // Use player ID as key to avoid duplicates
          if (!playersMap.has(player.id)) {
            playersMap.set(player.id, player);
          }
        });
      }
    });
    
    const uniquePlayers = Array.from(playersMap.values());
    
    // If no imported players, use mock data
    const players = uniquePlayers.length > 0 ? uniquePlayers : mockPlayers;
    setAllPlayers(players);
    setFilteredPlayers(players);
  }, [teams]);

  const handleSearch = () => {
    let filtered = allPlayers;
    
    if (searchQuery) {
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.team.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedPosition !== 'All') {
      filtered = filtered.filter(player => player.position === selectedPosition);
    }
    
    setFilteredPlayers(filtered);
  };

  const handlePositionFilter = (position: string) => {
    setSelectedPosition(position);
    let filtered = allPlayers;
    
    if (searchQuery) {
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.team.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (position !== 'All') {
      filtered = filtered.filter(player => player.position === position);
    }
    
    setFilteredPlayers(filtered);
  };

  return (
    <>
      <Navigation />
      <main className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Player Search</h1>
          <p className="text-muted-foreground">
            Search and analyze NFL players with AI-powered insights
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Find Players</CardTitle>
            <CardDescription>
              Search by name or team, filter by position
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search players or teams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch}>
                  Search
                </Button>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {positionFilters.map((position) => (
                  <Badge
                    key={position}
                    variant={selectedPosition === position ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handlePositionFilter(position)}
                  >
                    {position}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {(() => {
                const topPlayer = [...allPlayers]
                  .sort((a, b) => (b.stats?.fantasyPoints || 0) - (a.stats?.fantasyPoints || 0))[0];
                return topPlayer ? (
                  <>
                    <div className="text-2xl font-bold">{topPlayer.name}</div>
                    <p className="text-xs text-muted-foreground">
                      {topPlayer.stats?.fantasyPoints?.toFixed(1) || 0} pts this week
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">-</div>
                    <p className="text-xs text-muted-foreground">No data</p>
                  </>
                );
              })()}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Players</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allPlayers.length}</div>
              <p className="text-xs text-muted-foreground">
                From {teams.length} team{teams.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Players</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {allPlayers.filter(p => p.status?.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently starting
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Player Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlayers.map((player) => (
            <EnhancedPlayerCard
              key={player.id}
              player={player}
              isStarter={player.status?.isActive || false}
              showDetails={true}
            />
          ))}
        </div>
        
        {filteredPlayers.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">No players found matching your criteria</p>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}