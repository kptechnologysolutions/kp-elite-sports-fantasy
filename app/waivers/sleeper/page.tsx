'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ModernNav } from '@/components/layout/ModernNav';
import { 
  TrendingUp, AlertTriangle, Target, Plus, Minus, 
  ArrowRight, Info, DollarSign, Flame, Activity
} from 'lucide-react';
import useSleeperStore from '@/lib/store/useSleeperStore';
import { waiverService, WaiverRecommendation } from '@/lib/services/waiverService';
import { cn } from '@/lib/utils';

export default function WaiverWirePage() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<WaiverRecommendation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const {
    user,
    currentLeague,
    myRoster,
    rosters,
    players,
    currentWeek,
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
  
  // Analyze waiver wire when data is ready
  useEffect(() => {
    if (currentLeague && myRoster && players.size > 0 && rosters.length > 0) {
      analyzeWaiverWire();
    }
  }, [currentLeague, myRoster, players, rosters]);
  
  const analyzeWaiverWire = async () => {
    setIsAnalyzing(true);
    
    // Get all rostered players
    const rosteredPlayerIds = new Set<string>();
    rosters.forEach(roster => {
      roster.players.forEach(playerId => rosteredPlayerIds.add(playerId));
    });
    
    // Get available players (not rostered, has a team, fantasy relevant)
    const availablePlayers = Array.from(players.values()).filter(player => {
      return !rosteredPlayerIds.has(player.player_id) &&
             player.team &&
             ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].includes(player.position);
    });
    
    // Mock transactions (in production, fetch from API)
    const mockTransactions = [];
    
    // Get recommendations
    const recs = waiverService.getWaiverRecommendations(
      availablePlayers.slice(0, 100), // Limit for performance
      myRoster,
      players,
      mockTransactions,
      currentLeague
    );
    
    setRecommendations(recs.slice(0, 20)); // Top 20 recommendations
    setIsAnalyzing(false);
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getTrendingIcon = (trending: string) => {
    switch (trending) {
      case 'rising': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'falling': return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
      default: return <Activity className="h-3 w-3 text-gray-500" />;
    }
  };
  
  if (!user) return null;
  
  return (
    <div className="min-h-screen bg-background">
      <ModernNav />
      
      <main className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Waiver Wire</h1>
            <p className="text-muted-foreground">
              {currentLeague?.name} • Week {currentWeek}
            </p>
          </div>
          
          <Button 
            onClick={analyzeWaiverWire}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
          </Button>
        </div>
        
        {/* Position Needs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Position Needs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {['QB', 'RB', 'WR', 'TE'].map(pos => {
                const count = myRoster?.players.filter(p => 
                  getPlayer(p)?.position === pos
                ).length || 0;
                
                const recommended = { QB: 2, RB: 5, WR: 5, TE: 2 };
                const need = count < recommended[pos as keyof typeof recommended];
                
                return (
                  <div key={pos} className="flex items-center gap-2">
                    <Badge variant={need ? "destructive" : "secondary"}>
                      {pos}: {count}
                    </Badge>
                    {need && (
                      <span className="text-xs text-muted-foreground">
                        (Need {recommended[pos as keyof typeof recommended] - count} more)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* Recommendations */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Waiver Wire Recommendations
          </h2>
          
          {isAnalyzing ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Analyzing available players...</p>
              </CardContent>
            </Card>
          ) : recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((rec, idx) => (
                <Card key={rec.player.player_id} className={cn(
                  "transition-all hover:shadow-lg",
                  rec.priority === 'high' && "border-red-500/50"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      {/* Player Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getPriorityColor(rec.priority)}>
                            #{idx + 1} • {rec.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {rec.player.position}
                          </Badge>
                          {rec.positionNeed && (
                            <Badge variant="secondary">
                              Position Need
                            </Badge>
                          )}
                          {getTrendingIcon(rec.trending)}
                        </div>
                        
                        <div className="mb-2">
                          <div className="font-semibold text-lg">
                            {rec.player.first_name} {rec.player.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {rec.player.team || 'FA'}
                            {rec.player.injury_status && (
                              <Badge variant="destructive" className="ml-2 text-xs">
                                {rec.player.injury_status}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-sm mb-2">{rec.reason}</div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            Season: {rec.analytics.performance.seasonAverage.toFixed(1)} ppg
                          </span>
                          <span>
                            L3: {rec.analytics.performance.last3WeeksAverage.toFixed(1)} ppg
                          </span>
                          <span>
                            {rec.addPercentage}% rostered
                          </span>
                          {rec.targetBid && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {rec.targetBid} FAAB
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Drop Suggestion */}
                      {rec.dropCandidate && (
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground mb-1">Suggested Drop:</div>
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium text-sm">
                                {rec.dropCandidate.first_name} {rec.dropCandidate.last_name}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {rec.dropCandidate.position}
                              </Badge>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      )}
                      
                      {/* Action */}
                      <div>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                    
                    {rec.analytics.isHot && (
                      <Alert className="mt-3">
                        <Flame className="h-4 w-4" />
                        <AlertDescription>
                          This player is on a hot streak! Recent performance significantly above season average.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No recommendations available. All good players might be rostered.
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Info */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Recommendations are based on recent performance trends, position needs, 
            and league activity. Higher priority players should be targeted first.
          </AlertDescription>
        </Alert>
      </main>
    </div>
  );
}