'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { useTeamStore } from '@/lib/store/teamStore';
import { tradeAnalyzer, TradeProposal, TradeAnalysis } from '@/lib/ai/tradeAnalyzer';
import { Player } from '@/lib/types';
import { 
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Brain,
  Target,
  ArrowUpDown,
  Plus,
  Minus,
  CheckCircle,
  XCircle,
  Info,
  Search,
  Sparkles,
  Trophy,
  Shield,
  Zap,
  ChevronRight,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mockTradePlayers: Player[] = [
  {
    id: 't1',
    name: 'Justin Jefferson',
    position: 'WR',
    team: 'MIN',
    jerseyNumber: 18,
    status: { isActive: true, gameStatus: 'healthy', lastUpdated: new Date() },
    stats: { 
      season: 2024, 
      week: 10, 
      fantasyPoints: 22.5, 
      projectedPoints: 18.0,
      receptions: 8,
      receivingYards: 125,
      receivingTDs: 1
    }
  },
  {
    id: 't2',
    name: 'Derrick Henry',
    position: 'RB',
    team: 'BAL',
    jerseyNumber: 22,
    status: { isActive: true, gameStatus: 'healthy', lastUpdated: new Date() },
    stats: { 
      season: 2024, 
      week: 10, 
      fantasyPoints: 19.8, 
      projectedPoints: 16.5,
      rushingYards: 98,
      rushingTDs: 2,
      receptions: 2,
      receivingYards: 18
    }
  },
  {
    id: 't3',
    name: 'Mark Andrews',
    position: 'TE',
    team: 'BAL',
    jerseyNumber: 89,
    status: { isActive: true, gameStatus: 'healthy', lastUpdated: new Date() },
    stats: { 
      season: 2024, 
      week: 10, 
      fantasyPoints: 14.2, 
      projectedPoints: 11.0,
      receptions: 6,
      receivingYards: 82,
      receivingTDs: 0
    }
  }
];

interface ActiveTrade {
  id: string;
  partnerTeam: string;
  sendingPlayers: Player[];
  receivingPlayers: Player[];
  analysis?: TradeAnalysis;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  expiresIn: string;
}

const mockActiveTrades: ActiveTrade[] = [
  {
    id: '1',
    partnerTeam: 'Team Destroyer',
    sendingPlayers: [mockTradePlayers[0]],
    receivingPlayers: [mockTradePlayers[1], mockTradePlayers[2]],
    status: 'pending',
    expiresIn: '24h'
  }
];

export default function TradeCenterPage() {
  const { currentTeam } = useTeamStore();
  const [selectedTab, setSelectedTab] = useState('analyzer');
  const [sendingPlayers, setSendingPlayers] = useState<Player[]>([]);
  const [receivingPlayers, setReceivingPlayers] = useState<Player[]>([]);
  const [analysis, setAnalysis] = useState<TradeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>(mockActiveTrades);

  const analyzeTrade = async () => {
    if (sendingPlayers.length === 0 || receivingPlayers.length === 0) return;
    
    setIsAnalyzing(true);
    const proposal: TradeProposal = {
      sendingPlayers,
      receivingPlayers,
      partnerTeam: undefined
    };

    try {
      const result = await tradeAnalyzer.analyzeTrade(
        proposal,
        currentTeam!,
        {
          leagueSize: 12,
          scoringType: 'PPR',
          tradeDeadline: new Date('2024-11-30'),
          currentWeek: 10,
          playoffWeeks: [15, 16, 17]
        }
      );
      setAnalysis(result);
    } catch (error) {
      console.error('Error analyzing trade:', error);
    }
    
    setIsAnalyzing(false);
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'ACCEPT': return 'text-green-500';
      case 'REJECT': return 'text-red-500';
      case 'COUNTER': return 'text-yellow-500';
      case 'CONSIDER': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'ACCEPT': return CheckCircle;
      case 'REJECT': return XCircle;
      case 'COUNTER': return ArrowUpDown;
      case 'CONSIDER': return Info;
      default: return AlertTriangle;
    }
  };

  return (
    <main className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Trade Center</h1>
        </div>
        <p className="text-muted-foreground">
          AI-powered trade analysis and management
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trades</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTrades.length}</div>
            <p className="text-xs text-muted-foreground">Pending decisions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trade Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+4.5</div>
            <p className="text-xs text-muted-foreground">Avg points gained</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">72%</div>
            <p className="text-xs text-muted-foreground">Win rate after trades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trade Grade</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">A-</div>
            <p className="text-xs text-muted-foreground">Season performance</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analyzer">Trade Analyzer</TabsTrigger>
          <TabsTrigger value="active">Active Trades</TabsTrigger>
          <TabsTrigger value="finder">Trade Finder</TabsTrigger>
          <TabsTrigger value="history">Trade History</TabsTrigger>
        </TabsList>

        {/* Trade Analyzer Tab */}
        <TabsContent value="analyzer" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Your Players */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Minus className="h-5 w-5 text-red-500" />
                  Players You\'re Sending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sendingPlayers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Plus className="h-8 w-8 mx-auto mb-2" />
                      <p>Add players to trade away</p>
                    </div>
                  ) : (
                    sendingPlayers.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">{player.position}</Badge>
                            <span className="text-sm text-muted-foreground">{player.team}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{player.stats?.fantasyPoints?.toFixed(1)} pts</p>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => setSendingPlayers(sendingPlayers.filter(p => p.id !== player.id))}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => setSendingPlayers([...sendingPlayers, mockTradePlayers[0]])}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Player
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Receiving Players */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-green-500" />
                  Players You\'re Receiving
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {receivingPlayers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Plus className="h-8 w-8 mx-auto mb-2" />
                      <p>Add players to receive</p>
                    </div>
                  ) : (
                    receivingPlayers.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">{player.position}</Badge>
                            <span className="text-sm text-muted-foreground">{player.team}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{player.stats?.fantasyPoints?.toFixed(1)} pts</p>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => setReceivingPlayers(receivingPlayers.filter(p => p.id !== player.id))}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => setReceivingPlayers([...receivingPlayers, mockTradePlayers[1]])}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Player
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analyze Button */}
          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={analyzeTrade}
              disabled={sendingPlayers.length === 0 || receivingPlayers.length === 0 || isAnalyzing}
              className="min-w-[200px]"
            >
              {isAnalyzing ? (
                <>
                  <Brain className="mr-2 h-5 w-5 animate-pulse" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-5 w-5" />
                  Analyze Trade
                </>
              )}
            </Button>
          </div>

          {/* Analysis Results */}
          {analysis && (
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    AI Trade Analysis
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = getRecommendationIcon(analysis.recommendation);
                      return (
                        <Badge className={cn("text-lg px-3 py-1", getRecommendationColor(analysis.recommendation))}>
                          <Icon className="mr-2 h-5 w-5" />
                          {analysis.recommendation}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Fairness Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Trade Fairness</span>
                    <span className="text-sm font-bold">
                      {analysis.fairnessScore > 0 ? '+' : ''}{analysis.fairnessScore.toFixed(0)}
                    </span>
                  </div>
                  <Progress 
                    value={50 + (analysis.fairnessScore / 2)} 
                    className="h-3"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Bad for you</span>
                    <span>Fair</span>
                    <span>Good for you</span>
                  </div>
                </div>

                {/* Impact Metrics */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <p className="text-2xl font-bold">
                      {analysis.immediateImpact.pointsDifferential > 0 ? '+' : ''}
                      {analysis.immediateImpact.pointsDifferential.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">Weekly Points Change</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <p className="text-2xl font-bold">
                      {analysis.seasonImpact.playoffProbability > 0 ? '+' : ''}
                      {analysis.seasonImpact.playoffProbability.toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Playoff Odds Change</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <p className="text-2xl font-bold">
                      {(analysis.confidence * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">AI Confidence</p>
                  </div>
                </div>

                {/* Reasoning */}
                <div className="space-y-3">
                  {analysis.reasoning.pros.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2 flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4 text-green-500" />
                        Pros
                      </p>
                      <ul className="space-y-1">
                        {analysis.reasoning.pros.map((pro, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5" />
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {analysis.reasoning.cons.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2 flex items-center gap-2">
                        <ThumbsDown className="h-4 w-4 text-red-500" />
                        Cons
                      </p>
                      <ul className="space-y-1">
                        {analysis.reasoning.cons.map((con, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <XCircle className="h-3 w-3 text-red-500 mt-0.5" />
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Depth Impact */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Roster Impact:</strong> {analysis.immediateImpact.depthImpact}
                  </AlertDescription>
                </Alert>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button className="flex-1" variant={analysis.recommendation === 'ACCEPT' ? 'default' : 'outline'}>
                    Accept Trade
                  </Button>
                  <Button className="flex-1" variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Negotiate
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Active Trades Tab */}
        <TabsContent value="active" className="space-y-4">
          {activeTrades.map((trade) => (
            <Card key={trade.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Trade with {trade.partnerTeam}</CardTitle>
                    <CardDescription>
                      Expires in {trade.expiresIn}
                    </CardDescription>
                  </div>
                  <Badge variant={trade.status === 'pending' ? 'default' : 'secondary'}>
                    {trade.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium mb-2">You Send:</p>
                    {trade.sendingPlayers.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-2 rounded bg-muted">
                        <span>{player.name}</span>
                        <Badge variant="secondary">{player.position}</Badge>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">You Receive:</p>
                    {trade.receivingPlayers.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-2 rounded bg-muted">
                        <span>{player.name}</span>
                        <Badge variant="secondary">{player.position}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button className="flex-1">Accept</Button>
                  <Button className="flex-1" variant="outline">Counter</Button>
                  <Button className="flex-1" variant="destructive">Reject</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Trade Finder Tab */}
        <TabsContent value="finder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Trade Suggestions</CardTitle>
              <CardDescription>
                Players other teams might trade based on their needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search for players..." />
                </div>
                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertDescription>
                    Based on your roster needs, consider targeting <strong>RB</strong> and <strong>TE</strong> positions
                  </AlertDescription>
                </Alert>
                <div className="text-center py-8 text-muted-foreground">
                  [Trade suggestions will appear here]
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trade History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trade History</CardTitle>
              <CardDescription>Your completed trades this season</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                No completed trades yet this season
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}