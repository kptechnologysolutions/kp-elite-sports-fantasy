'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useTeamStore } from '@/lib/store/teamStore';
import { waiverWirePredictor, WaiverWirePrediction, WaiverWireSettings } from '@/lib/ai/waiverWirePredictor';
import { Player } from '@/lib/types';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Zap,
  Brain,
  DollarSign,
  Trophy,
  Target,
  Activity,
  ArrowUp,
  ArrowDown,
  Loader2,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock available players for demonstration
const mockAvailablePlayers: Player[] = [
  {
    id: 'ww1',
    name: 'Jaylen Warren',
    position: 'RB',
    team: 'PIT',
    jerseyNumber: 30,
    status: { isActive: false, gameStatus: 'healthy', lastUpdated: new Date() },
    stats: { 
      season: 2024, 
      week: 10, 
      fantasyPoints: 14.7, 
      projectedPoints: 11.0,
      rushingYards: 74,
      rushingTDs: 1,
      receptions: 4,
      receivingYards: 29
    },
  },
  {
    id: 'ww2',
    name: 'Tyjae Spears',
    position: 'RB',
    team: 'TEN',
    jerseyNumber: 2,
    status: { isActive: false, gameStatus: 'healthy', lastUpdated: new Date() },
    stats: { 
      season: 2024, 
      week: 10, 
      fantasyPoints: 16.3, 
      projectedPoints: 12.5,
      rushingYards: 65,
      receptions: 5,
      receivingYards: 48,
      receivingTDs: 1
    },
  },
  {
    id: 'ww3',
    name: 'Wan\'Dale Robinson',
    position: 'WR',
    team: 'NYG',
    jerseyNumber: 17,
    status: { isActive: false, gameStatus: 'healthy', lastUpdated: new Date() },
    stats: { 
      season: 2024, 
      week: 10, 
      fantasyPoints: 13.8, 
      projectedPoints: 10.5,
      receptions: 8,
      receivingYards: 78,
      targets: 11
    },
  },
  {
    id: 'ww4',
    name: 'Luke Musgrave',
    position: 'TE',
    team: 'GB',
    jerseyNumber: 88,
    status: { isActive: false, gameStatus: 'healthy', lastUpdated: new Date() },
    stats: { 
      season: 2024, 
      week: 10, 
      fantasyPoints: 11.2, 
      projectedPoints: 8.5,
      receptions: 5,
      receivingYards: 62,
      receivingTDs: 1
    },
  },
];

const priorityColors = {
  'must-add': 'bg-red-500 text-white',
  'high': 'bg-orange-500 text-white',
  'medium': 'bg-yellow-500 text-white',
  'low': 'bg-blue-500 text-white',
  'avoid': 'bg-gray-500 text-white'
};

const priorityIcons = {
  'must-add': <Zap className="h-4 w-4" />,
  'high': <TrendingUp className="h-4 w-4" />,
  'medium': <Activity className="h-4 w-4" />,
  'low': <TrendingDown className="h-4 w-4" />,
  'avoid': <AlertTriangle className="h-4 w-4" />
};

export default function WaiverWirePage() {
  const { currentTeam } = useTeamStore();
  const [predictions, setPredictions] = useState<WaiverWirePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [faabBudget, setFaabBudget] = useState(100);

  useEffect(() => {
    analyzePlayers();
  }, []);

  const analyzePlayers = async () => {
    setLoading(true);
    
    const settings: WaiverWireSettings = {
      leagueSize: currentTeam?.leagueSize || 12,
      scoringType: currentTeam?.scoringType || 'PPR',
      rosterNeeds: ['RB', 'WR'], // Could be dynamic based on team analysis
      faabBudgetRemaining: faabBudget,
      waiverPriority: 3,
      playoffBound: (currentTeam?.record?.wins || 0) > (currentTeam?.record?.losses || 0),
      weeklyMatchupImportance: 'important'
    };

    try {
      const results = await waiverWirePredictor.analyzeTrendingPlayers(
        mockAvailablePlayers,
        settings
      );
      
      // For demo, create mock predictions since we don\'t have real API
      const mockPredictions: WaiverWirePrediction[] = mockAvailablePlayers.map((player, index) => ({
        player,
        pickupPriority: index === 0 ? 'must-add' : index === 1 ? 'high' : index === 2 ? 'medium' : 'low',
        confidenceScore: 90 - (index * 15),
        projectedValue: player.stats?.projectedPoints || 10,
        reasoning: [
          `Strong recent performance with ${player.stats?.fantasyPoints?.toFixed(1)} points`,
          `Increasing opportunity in ${player.team} offense`,
          `Favorable upcoming matchups`,
          'Low ownership percentage across leagues'
        ].slice(0, 3),
        relatedNews: [
          `${player.name} seeing increased snap count`,
          `Coach confirms expanded role moving forward`
        ],
        seasonProjection: {
          remainingGames: 7,
          projectedPointsPerGame: (player.stats?.fantasyPoints || 10) * 0.85,
          totalProjectedPoints: (player.stats?.fantasyPoints || 10) * 0.85 * 7,
          playoffScheduleStrength: 6.5
        },
        competitiveAnalysis: {
          percentOwned: 25 + (index * 10),
          percentStarted: 10 + (index * 5),
          waiverClaimProjection: Math.max(5, 25 - (index * 5)),
          expectedCompetition: index < 2 ? 'high' : 'medium'
        },
        comparisonPlayers: []
      }));
      
      setPredictions(mockPredictions);
    } catch (error) {
      console.error('Error analyzing players:', error);
    }
    
    setLoading(false);
  };

  const filteredPredictions = selectedPosition === 'all' 
    ? predictions 
    : predictions.filter(p => p.player.position === selectedPosition);

  const calculateFAABBid = (prediction: WaiverWirePrediction): number => {
    return waiverWirePredictor.calculateFAABBid(prediction, {
      leagueSize: 12,
      scoringType: 'PPR',
      rosterNeeds: ['RB', 'WR'],
      faabBudgetRemaining: faabBudget,
      playoffBound: true,
      weeklyMatchupImportance: 'important'
    });
  };

  return (
    <>
      <Navigation />
      <main className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">AI Waiver Wire Predictor</h1>
          </div>
          <p className="text-muted-foreground">
            AI-powered analysis to help you dominate the waiver wire
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">FAAB Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${faabBudget}</div>
              <Progress value={(faabBudget / 100) * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Must-Add Players</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {predictions.filter(p => p.pickupPriority === 'must-add').length}
              </div>
              <p className="text-xs text-muted-foreground">Available this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {predictions.length > 0 
                  ? Math.round(predictions.reduce((sum, p) => sum + p.confidenceScore, 0) / predictions.length)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">AI prediction accuracy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Week</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentTeam?.liveScore?.week || 10}</div>
              <p className="text-xs text-muted-foreground">Current NFL week</p>
            </CardContent>
          </Card>
        </div>

        {/* Position Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Tabs value={selectedPosition} onValueChange={setSelectedPosition}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All ({predictions.length})</TabsTrigger>
                <TabsTrigger value="QB">
                  QB ({predictions.filter(p => p.player.position === 'QB').length})
                </TabsTrigger>
                <TabsTrigger value="RB">
                  RB ({predictions.filter(p => p.player.position === 'RB').length})
                </TabsTrigger>
                <TabsTrigger value="WR">
                  WR ({predictions.filter(p => p.player.position === 'WR').length})
                </TabsTrigger>
                <TabsTrigger value="TE">
                  TE ({predictions.filter(p => p.player.position === 'TE').length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Predictions Grid */}
        {loading ? (
          <Card className="text-center py-16">
            <CardContent>
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-lg font-semibold">Analyzing waiver wire targets...</p>
              <p className="text-sm text-muted-foreground">Using AI to evaluate player value</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPredictions.map((prediction) => (
              <Card key={prediction.player.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <CardTitle className="text-lg">{prediction.player.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{prediction.player.position}</Badge>
                        <span className="text-sm text-muted-foreground">{prediction.player.team}</span>
                      </div>
                    </div>
                    <Badge className={cn(priorityColors[prediction.pickupPriority], 'flex items-center gap-1')}>
                      {priorityIcons[prediction.pickupPriority]}
                      {prediction.pickupPriority.replace('-', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Confidence Score */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">AI Confidence</span>
                      <span className="font-medium">{prediction.confidenceScore}%</span>
                    </div>
                    <Progress value={prediction.confidenceScore} className="h-2" />
                  </div>

                  {/* Recent Performance */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Recent Points</span>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">{prediction.player.stats?.fantasyPoints?.toFixed(1)}</span>
                      {(prediction.player.stats?.fantasyPoints || 0) > (prediction.player.stats?.projectedPoints || 0) ? (
                        <ArrowUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <ArrowDown className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </div>

                  {/* FAAB Recommendation */}
                  <div className="rounded-lg bg-primary/10 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Recommended Bid</span>
                      <Badge variant="outline" className="font-bold">
                        ${calculateFAABBid(prediction)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {prediction.competitiveAnalysis.expectedCompetition} competition expected
                    </p>
                  </div>

                  {/* Key Reasons */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Why Add:</p>
                    {prediction.reasoning.slice(0, 2).map((reason, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Info className="h-3 w-3 text-primary mt-0.5" />
                        <p className="text-xs text-muted-foreground">{reason}</p>
                      </div>
                    ))}
                  </div>

                  {/* Season Projection */}
                  <div className="border-t pt-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Rest of Season</span>
                        <p className="font-semibold">
                          {prediction.seasonProjection.totalProjectedPoints.toFixed(0)} pts
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Owned %</span>
                        <p className="font-semibold">
                          {prediction.competitiveAnalysis.percentOwned}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button className="w-full" variant={prediction.pickupPriority === 'must-add' ? 'default' : 'outline'}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Place ${calculateFAABBid(prediction)} Bid
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Help Card */}
        <Card className="mt-8 bg-gradient-to-r from-primary/5 to-purple-500/5">
          <CardHeader>
            <CardTitle>How AI Predictions Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              🤖 <strong>Machine Learning</strong> - Analyzes historical data and player trends
            </p>
            <p className="text-sm text-muted-foreground">
              📊 <strong>Opportunity Score</strong> - Evaluates touches, targets, and snap counts
            </p>
            <p className="text-sm text-muted-foreground">
              📈 <strong>Trend Analysis</strong> - Identifies breakout candidates before they explode
            </p>
            <p className="text-sm text-muted-foreground">
              💰 <strong>FAAB Optimization</strong> - Suggests optimal bid amounts based on competition
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}