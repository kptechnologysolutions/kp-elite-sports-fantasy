'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/layout/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTeamStore } from '@/lib/store/teamStore';
import { 
  Users, Plus, Minus, ArrowUpDown, CheckCircle, 
  AlertTriangle, Clock, TrendingUp, TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RosterPage() {
  const router = useRouter();
  const { teams, currentTeam: currentTeamId } = useTeamStore();
  const currentTeam = teams.find(t => t.id === currentTeamId);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  if (!currentTeam) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto p-6">
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Team Selected</h3>
              <p className="text-muted-foreground mb-4">Import a team to manage your roster</p>
              <Button onClick={() => router.push('/teams')}>Import Team</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const starters = currentTeam.players.slice(0, 9);
  const bench = currentTeam.players.slice(9);

  const handleSwapPlayer = (playerId: string) => {
    // In real app, this would update the database
    console.log('Swapping player:', playerId);
  };

  const handleDropPlayer = (playerId: string) => {
    // In real app, this would remove player from roster
    console.log('Dropping player:', playerId);
  };

  const PlayerRow = ({ player, isBench = false }: any) => {
    const isSelected = selectedPlayers.includes(player.id);
    
    return (
      <div 
        className={cn(
          "flex items-center justify-between p-3 rounded-lg border transition-all",
          isSelected && "ring-2 ring-primary",
          isBench && "opacity-75"
        )}
      >
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedPlayers([...selectedPlayers, player.id]);
              } else {
                setSelectedPlayers(selectedPlayers.filter(id => id !== player.id));
              }
            }}
            className="h-4 w-4"
          />
          
          <Badge variant="outline">{player.position}</Badge>
          
          <div>
            <div className="font-medium">{player.name}</div>
            <div className="text-sm text-muted-foreground">
              {player.team} • Week {player.stats?.week || 10}: {player.stats?.fantasyPoints?.toFixed(1) || '0.0'} pts
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {player.injuryStatus && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {player.injuryStatus.type}
            </Badge>
          )}
          
          <div className="text-right">
            <div className="font-bold">{player.stats?.projectedPoints?.toFixed(1) || '0.0'}</div>
            <div className="text-xs text-muted-foreground">projected</div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSwapPlayer(player.id)}
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Roster Manager</h1>
            <p className="text-muted-foreground">
              {currentTeam.name} • {currentTeam.leagueName}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => router.push('/waiver-wire')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Players
            </Button>
            <Button 
              variant="destructive"
              disabled={selectedPlayers.length === 0}
              onClick={() => {
                selectedPlayers.forEach(id => handleDropPlayer(id));
                setSelectedPlayers([]);
              }}
            >
              <Minus className="h-4 w-4 mr-2" />
              Drop Selected
            </Button>
          </div>
        </div>

        {/* Roster Tabs */}
        <Tabs defaultValue="lineup" className="space-y-4">
          <TabsList>
            <TabsTrigger value="lineup">Starting Lineup</TabsTrigger>
            <TabsTrigger value="bench">Bench</TabsTrigger>
            <TabsTrigger value="all">Full Roster</TabsTrigger>
          </TabsList>

          <TabsContent value="lineup">
            <Card>
              <CardHeader>
                <CardTitle>Starting Lineup</CardTitle>
                <CardDescription>
                  Your active players for this week
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {starters.map(player => (
                  <PlayerRow key={player.id} player={player} />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bench">
            <Card>
              <CardHeader>
                <CardTitle>Bench Players</CardTitle>
                <CardDescription>
                  Players not in your starting lineup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {bench.length > 0 ? (
                  bench.map(player => (
                    <PlayerRow key={player.id} player={player} isBench />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No bench players
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Full Roster</CardTitle>
                <CardDescription>
                  All {currentTeam.players.length} players on your team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {currentTeam.players.map(player => (
                  <PlayerRow 
                    key={player.id} 
                    player={player} 
                    isBench={!starters.includes(player)}
                  />
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Lineup Optimizer</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                Optimize Lineup
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Waiver Wire</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push('/waiver-wire')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Browse Available
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Trade Players</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push('/trades')}
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Propose Trade
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}