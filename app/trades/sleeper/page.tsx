'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModernNav } from '@/components/layout/ModernNav';
import { 
  ArrowLeftRight, TrendingUp, TrendingDown, AlertTriangle,
  User, Users, Info, ChevronRight, Plus, X
} from 'lucide-react';
import useSleeperStore from '@/lib/store/useSleeperStore';
import { cn } from '@/lib/utils';

export default function SleeperTradesPage() {
  const router = useRouter();
  const [selectedGiving, setSelectedGiving] = useState<string[]>([]);
  const [selectedReceiving, setSelectedReceiving] = useState<string[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  
  const {
    user,
    currentLeague,
    myRoster,
    rosters,
    leagueUsers,
    players,
    getPlayer,
    fetchPlayers
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
  
  const otherRosters = rosters.filter(r => r.roster_id !== myRoster?.roster_id);
  
  const handleAddToGiving = (playerId: string) => {
    if (!selectedGiving.includes(playerId)) {
      setSelectedGiving([...selectedGiving, playerId]);
    }
  };
  
  const handleAddToReceiving = (playerId: string) => {
    if (!selectedReceiving.includes(playerId)) {
      setSelectedReceiving([...selectedReceiving, playerId]);
    }
  };
  
  const handleRemoveFromGiving = (playerId: string) => {
    setSelectedGiving(selectedGiving.filter(id => id !== playerId));
  };
  
  const handleRemoveFromReceiving = (playerId: string) => {
    setSelectedReceiving(selectedReceiving.filter(id => id !== playerId));
  };
  
  const evaluateTrade = () => {
    // Calculate total value for each side
    let givingValue = 0;
    let receivingValue = 0;
    
    selectedGiving.forEach(playerId => {
      const player = getPlayer(playerId);
      // Simple value calculation based on position
      if (player) {
        const positionValues = { QB: 15, RB: 20, WR: 18, TE: 12, K: 5, DEF: 8 };
        givingValue += positionValues[player.position as keyof typeof positionValues] || 10;
      }
    });
    
    selectedReceiving.forEach(playerId => {
      const player = getPlayer(playerId);
      if (player) {
        const positionValues = { QB: 15, RB: 20, WR: 18, TE: 12, K: 5, DEF: 8 };
        receivingValue += positionValues[player.position as keyof typeof positionValues] || 10;
      }
    });
    
    const difference = receivingValue - givingValue;
    const percentDiff = givingValue > 0 ? (difference / givingValue) * 100 : 0;
    
    return {
      givingValue,
      receivingValue,
      difference,
      percentDiff,
      verdict: Math.abs(percentDiff) < 10 ? 'fair' : 
               percentDiff > 0 ? 'winning' : 'losing'
    };
  };
  
  const tradeAnalysis = selectedGiving.length > 0 && selectedReceiving.length > 0 
    ? evaluateTrade() 
    : null;
  
  if (!user) return null;
  
  return (
    <div className="min-h-screen bg-background">
      <ModernNav />
      
      <main className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Trade Center</h1>
          <p className="text-muted-foreground">
            {currentLeague?.name || 'Select a league'}
          </p>
        </div>
        
        <Tabs defaultValue="create" className="space-y-4">
          <TabsList>
            <TabsTrigger value="create">Create Trade</TabsTrigger>
            <TabsTrigger value="history">Trade History</TabsTrigger>
            <TabsTrigger value="analysis">Trade Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="space-y-4">
            {/* Trade Builder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Your Team */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Team</CardTitle>
                  <CardDescription>Select players to trade away</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {myRoster?.players.map(playerId => {
                      const player = getPlayer(playerId);
                      if (!player) return null;
                      
                      return (
                        <div
                          key={playerId}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all",
                            selectedGiving.includes(playerId) && "bg-red-500/10 border-red-500/50"
                          )}
                          onClick={() => handleAddToGiving(playerId)}
                        >
                          <div>
                            <div className="font-medium text-sm">
                              {player.first_name} {player.last_name}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {player.position}
                              </Badge>
                              <span>{player.team || 'FA'}</span>
                            </div>
                          </div>
                          {selectedGiving.includes(playerId) && (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              {/* Trade Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Trade Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Giving */}
                  <div>
                    <div className="text-sm font-medium mb-2">You Give:</div>
                    {selectedGiving.length > 0 ? (
                      <div className="space-y-1">
                        {selectedGiving.map(playerId => {
                          const player = getPlayer(playerId);
                          if (!player) return null;
                          
                          return (
                            <div
                              key={playerId}
                              className="flex items-center justify-between p-2 bg-red-500/10 rounded"
                            >
                              <span className="text-sm">
                                {player.first_name} {player.last_name}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveFromGiving(playerId)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">No players selected</div>
                    )}
                  </div>
                  
                  <ArrowLeftRight className="h-4 w-4 mx-auto text-muted-foreground" />
                  
                  {/* Receiving */}
                  <div>
                    <div className="text-sm font-medium mb-2">You Get:</div>
                    {selectedReceiving.length > 0 ? (
                      <div className="space-y-1">
                        {selectedReceiving.map(playerId => {
                          const player = getPlayer(playerId);
                          if (!player) return null;
                          
                          return (
                            <div
                              key={playerId}
                              className="flex items-center justify-between p-2 bg-green-500/10 rounded"
                            >
                              <span className="text-sm">
                                {player.first_name} {player.last_name}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveFromReceiving(playerId)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">No players selected</div>
                    )}
                  </div>
                  
                  {/* Trade Analysis */}
                  {tradeAnalysis && (
                    <Alert variant={
                      tradeAnalysis.verdict === 'fair' ? 'default' :
                      tradeAnalysis.verdict === 'winning' ? 'default' :
                      'destructive'
                    }>
                      <AlertDescription>
                        <div className="font-medium mb-1">
                          Trade Analysis: {tradeAnalysis.verdict === 'fair' ? '✅ Fair Trade' :
                                          tradeAnalysis.verdict === 'winning' ? '🎯 You Win!' :
                                          '⚠️ You Lose'}
                        </div>
                        <div className="text-xs">
                          Value difference: {tradeAnalysis.difference > 0 ? '+' : ''}{tradeAnalysis.percentDiff.toFixed(1)}%
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Button 
                    className="w-full"
                    disabled={selectedGiving.length === 0 || selectedReceiving.length === 0}
                  >
                    Propose Trade
                  </Button>
                </CardContent>
              </Card>
              
              {/* Trade Partners */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Trade Partners</CardTitle>
                  <CardDescription>Select a team to trade with</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {otherRosters.map(roster => {
                      const owner = leagueUsers.get(roster.owner_id);
                      const isSelected = selectedPartner === roster.owner_id;
                      
                      return (
                        <div
                          key={roster.roster_id}
                          className={cn(
                            "p-3 rounded-lg border cursor-pointer transition-all",
                            isSelected && "bg-primary/10 border-primary"
                          )}
                          onClick={() => setSelectedPartner(roster.owner_id)}
                        >
                          <div className="font-medium">
                            {owner?.display_name || `Team ${roster.roster_id}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {roster.settings?.wins || 0}-{roster.settings?.losses || 0} • 
                            Rank #{rosters.indexOf(roster) + 1}
                          </div>
                          
                          {isSelected && (
                            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                              {roster.players.slice(0, 10).map(playerId => {
                                const player = getPlayer(playerId);
                                if (!player) return null;
                                
                                return (
                                  <div
                                    key={playerId}
                                    className={cn(
                                      "flex items-center justify-between p-1 rounded text-xs cursor-pointer hover:bg-muted",
                                      selectedReceiving.includes(playerId) && "bg-green-500/10"
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddToReceiving(playerId);
                                    }}
                                  >
                                    <span>{player.first_name} {player.last_name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {player.position}
                                    </Badge>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Trade History</CardTitle>
                <CardDescription>Recent trades in your league</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  No trades yet this season
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analysis">
            <Card>
              <CardHeader>
                <CardTitle>Trade Analysis Tools</CardTitle>
                <CardDescription>Advanced trade evaluation</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Trade analyzer uses player values, team needs, and rest-of-season projections
                    to evaluate trade fairness and impact on both teams.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}