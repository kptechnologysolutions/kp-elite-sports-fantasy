'use client';

import { useState } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useTeamStore } from '@/lib/store/teamStore';
import { 
  ArrowLeftRight, Plus, Minus, CheckCircle, XCircle,
  TrendingUp, TrendingDown, AlertTriangle, Clock,
  ThumbsUp, ThumbsDown, Send
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Trade {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  from: string;
  to: string;
  giving: any[];
  receiving: any[];
  proposedAt: Date;
  message?: string;
}

export default function TradesPage() {
  const { teams, currentTeam: currentTeamId } = useTeamStore();
  const currentTeam = teams.find(t => t.id === currentTeamId);
  const [selectedGiving, setSelectedGiving] = useState<string[]>([]);
  const [selectedReceiving, setSelectedReceiving] = useState<string[]>([]);
  const [tradePartner, setTradePartner] = useState<string>('');

  // Mock trades for demo
  const mockTrades: Trade[] = [
    {
      id: '1',
      status: 'pending',
      from: 'You',
      to: 'Team Alpha',
      giving: [{ name: 'CeeDee Lamb', position: 'WR' }],
      receiving: [{ name: 'Derrick Henry', position: 'RB' }],
      proposedAt: new Date(),
    },
    {
      id: '2',
      status: 'accepted',
      from: 'Team Beta',
      to: 'You',
      giving: [{ name: 'Travis Kelce', position: 'TE' }],
      receiving: [{ name: 'Mark Andrews', position: 'TE' }, { name: 'Mike Evans', position: 'WR' }],
      proposedAt: new Date(Date.now() - 86400000),
    }
  ];

  const analyzeTradeValue = () => {
    const givingValue = selectedGiving.length * 15; // Mock calculation
    const receivingValue = selectedReceiving.length * 18;
    const difference = receivingValue - givingValue;
    
    return {
      givingValue,
      receivingValue,
      difference,
      recommendation: difference > 0 ? 'Good Trade' : difference < -5 ? 'Bad Trade' : 'Fair Trade',
      color: difference > 0 ? 'text-green-600' : difference < -5 ? 'text-red-600' : 'text-yellow-600'
    };
  };

  const analysis = analyzeTradeValue();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Trade Center</h1>
            <p className="text-muted-foreground">
              Propose and manage trades with league members
            </p>
          </div>
        </div>

        <Tabs defaultValue="propose" className="space-y-4">
          <TabsList>
            <TabsTrigger value="propose">Propose Trade</TabsTrigger>
            <TabsTrigger value="pending">
              Pending Trades
              <Badge variant="destructive" className="ml-2">2</Badge>
            </TabsTrigger>
            <TabsTrigger value="history">Trade History</TabsTrigger>
          </TabsList>

          {/* Propose Trade Tab */}
          <TabsContent value="propose" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Your Players */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">You Give</CardTitle>
                  <CardDescription>Select players to trade away</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {currentTeam?.players.slice(0, 6).map(player => (
                    <div
                      key={player.id}
                      onClick={() => {
                        if (selectedGiving.includes(player.id)) {
                          setSelectedGiving(selectedGiving.filter(id => id !== player.id));
                        } else {
                          setSelectedGiving([...selectedGiving, player.id]);
                        }
                      }}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                        selectedGiving.includes(player.id) && "bg-red-50 border-red-300 dark:bg-red-950"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{player.position}</Badge>
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {player.team} • {player.stats?.fantasyPoints?.toFixed(1)} pts
                          </div>
                        </div>
                      </div>
                      {selectedGiving.includes(player.id) && (
                        <Minus className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Their Players */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">You Receive</CardTitle>
                  <CardDescription>Select players you want</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* Mock available players */}
                  {[
                    { id: 't1', name: 'Justin Jefferson', position: 'WR', team: 'MIN', points: 24.5 },
                    { id: 't2', name: 'Austin Ekeler', position: 'RB', team: 'LAC', points: 18.2 },
                    { id: 't3', name: 'George Kittle', position: 'TE', team: 'SF', points: 14.8 },
                    { id: 't4', name: 'Keenan Allen', position: 'WR', team: 'LAC', points: 16.3 },
                  ].map(player => (
                    <div
                      key={player.id}
                      onClick={() => {
                        if (selectedReceiving.includes(player.id)) {
                          setSelectedReceiving(selectedReceiving.filter(id => id !== player.id));
                        } else {
                          setSelectedReceiving([...selectedReceiving, player.id]);
                        }
                      }}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                        selectedReceiving.includes(player.id) && "bg-green-50 border-green-300 dark:bg-green-950"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{player.position}</Badge>
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {player.team} • {player.points} pts
                          </div>
                        </div>
                      </div>
                      {selectedReceiving.includes(player.id) && (
                        <Plus className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Trade Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Trade Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Trade Value Difference</p>
                    <p className={cn("text-2xl font-bold", analysis.color)}>
                      {analysis.difference > 0 ? '+' : ''}{analysis.difference.toFixed(1)}
                    </p>
                  </div>
                  <Badge className={cn("text-lg px-4 py-2", analysis.color)}>
                    {analysis.recommendation}
                  </Badge>
                </div>
                
                <Progress 
                  value={(analysis.receivingValue / (analysis.givingValue + analysis.receivingValue)) * 100} 
                  className="h-3"
                />
                
                <div className="flex justify-between text-sm">
                  <span>Giving: {analysis.givingValue.toFixed(1)} pts</span>
                  <span>Receiving: {analysis.receivingValue.toFixed(1)} pts</span>
                </div>

                <Button 
                  className="w-full" 
                  disabled={selectedGiving.length === 0 || selectedReceiving.length === 0}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Trade Proposal
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Trades Tab */}
          <TabsContent value="pending" className="space-y-4">
            {mockTrades.filter(t => t.status === 'pending').map(trade => (
              <Card key={trade.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {trade.from} → {trade.to}
                      </CardTitle>
                      <CardDescription>
                        Proposed {new Date(trade.proposedAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Giving</p>
                      {trade.giving.map((p, i) => (
                        <Badge key={i} variant="outline" className="mr-2">
                          {p.name} ({p.position})
                        </Badge>
                      ))}
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Receiving</p>
                      {trade.receiving.map((p, i) => (
                        <Badge key={i} variant="outline" className="mr-2">
                          {p.name} ({p.position})
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {trade.from === 'You' ? (
                    <Button variant="destructive" className="w-full">
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Trade
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button className="flex-1">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button variant="destructive" className="flex-1">
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Trade History Tab */}
          <TabsContent value="history" className="space-y-4">
            {mockTrades.filter(t => t.status !== 'pending').map(trade => (
              <Card key={trade.id} className="opacity-75">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {trade.from} → {trade.to}
                      </CardTitle>
                      <CardDescription>
                        {new Date(trade.proposedAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant={trade.status === 'accepted' ? 'default' : 'destructive'}>
                      {trade.status === 'accepted' ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {trade.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium mb-1">Gave</p>
                      {trade.giving.map((p, i) => (
                        <span key={i} className="text-muted-foreground">
                          {p.name} ({p.position}){i < trade.giving.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                    <div>
                      <p className="font-medium mb-1">Received</p>
                      {trade.receiving.map((p, i) => (
                        <span key={i} className="text-muted-foreground">
                          {p.name} ({p.position}){i < trade.receiving.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}