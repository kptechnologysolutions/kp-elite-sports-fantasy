'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Crown, 
  Users, 
  Calendar,
  Star,
  AlertTriangle,
  Target,
  Zap,
  Activity
} from 'lucide-react';
import { 
  dynastyService, 
  DynastyRoster, 
  DynastyPlayerValue,
  RookieProfile 
} from '@/lib/services/dynastyService';
import useSleeperStore from '@/lib/store/useSleeperStore';
import { cn } from '@/lib/utils';

export function DynastyDashboard() {
  const [dynastyRoster, setDynastyRoster] = useState<DynastyRoster | null>(null);
  const [rookieRankings, setRookieRankings] = useState<RookieProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    currentLeague,
    myRoster,
    players,
    rosters,
    leagueUsers
  } = useSleeperStore();
  
  useEffect(() => {
    if (myRoster && players.size > 0) {
      analyzeDynastyTeam();
    }
  }, [myRoster, players]);
  
  const analyzeDynastyTeam = async () => {
    if (!myRoster) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Initialize dynasty values
      await dynastyService.initializeDynastyValues(players);
      
      // Analyze roster
      const analysis = dynastyService.analyzeDynastyRoster(
        myRoster.players,
        myRoster.roster_id
      );
      
      setDynastyRoster(analysis);
      
      // Get rookie rankings
      const rookies = dynastyService.generateRookieRankings();
      setRookieRankings(rookies);
      
    } catch (err: any) {
      setError(err.message || 'Failed to analyze dynasty team');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getContendingWindowColor = (window: DynastyRoster['contendingWindow']) => {
    switch (window) {
      case 'now': return 'text-green-600';
      case 'next-year': return 'text-yellow-600';
      case 'rebuilding': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };
  
  const getContendingWindowIcon = (window: DynastyRoster['contendingWindow']) => {
    switch (window) {
      case 'now': return Crown;
      case 'next-year': return Target;
      case 'rebuilding': return Activity;
      default: return Users;
    }
  };
  
  const getTrendIcon = (trend: DynastyPlayerValue['trend']) => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Activity;
    }
  };
  
  const getTrendColor = (trend: DynastyPlayerValue['trend']) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  const getKeeperValueColor = (value: DynastyPlayerValue['keeperValue']) => {
    switch (value) {
      case 'elite': return 'bg-purple-100 text-purple-800';
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-orange-100 text-orange-800';
      case 'cut': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (!currentLeague) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Please select a league to view dynasty analysis
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <Activity className="h-8 w-8 mx-auto animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Analyzing dynasty team...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  if (!dynastyRoster) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            No dynasty analysis available
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const WindowIcon = getContendingWindowIcon(dynastyRoster.contendingWindow);
  
  return (
    <div className="space-y-6">
      {/* Dynasty Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5" />
              Dynasty Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dynastyRoster.totalValue}</div>
            <div className="text-sm text-muted-foreground">Total Points</div>
            <Progress value={(dynastyRoster.totalValue / 1200) * 100} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Average Age
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dynastyRoster.averageAge}</div>
            <div className="text-sm text-muted-foreground">Years</div>
            <div className="mt-2">
              <Badge variant={dynastyRoster.averageAge < 26 ? 'default' : 
                           dynastyRoster.averageAge < 29 ? 'secondary' : 'destructive'}>
                {dynastyRoster.averageAge < 26 ? 'Young' : 
                 dynastyRoster.averageAge < 29 ? 'Prime' : 'Aging'}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <WindowIcon className={cn("h-5 w-5", getContendingWindowColor(dynastyRoster.contendingWindow))} />
              Window
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-lg font-bold capitalize", getContendingWindowColor(dynastyRoster.contendingWindow))}>
              {dynastyRoster.contendingWindow === 'now' ? 'Contending Now' :
               dynastyRoster.contendingWindow === 'next-year' ? 'Next Year' : 'Rebuilding'}
            </div>
            <div className="text-sm text-muted-foreground">
              {dynastyRoster.contendingWindow === 'now' ? 'Championship window open' :
               dynastyRoster.contendingWindow === 'next-year' ? 'Building toward contention' : 
               'Focus on future assets'}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Dynasty Tabs */}
      <Tabs defaultValue="roster" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="roster">Roster Analysis</TabsTrigger>
          <TabsTrigger value="keepers">Keepers</TabsTrigger>
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
          <TabsTrigger value="rookies">Rookies</TabsTrigger>
        </TabsList>
        
        <TabsContent value="roster" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Player Dynasty Values</CardTitle>
              <CardDescription>
                Dynasty values based on age, position, and long-term outlook
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dynastyRoster.playerValues
                  .sort((a, b) => b.dynastyValue - a.dynastyValue)
                  .slice(0, 15)
                  .map((player) => {
                    const TrendIcon = getTrendIcon(player.trend);
                    
                    return (
                      <div key={player.playerId} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium">{player.playerName}</div>
                            <div className="text-sm text-muted-foreground">
                              {player.position} • {player.team} • Age {player.age}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-bold">{player.dynastyValue}</div>
                            <div className="text-xs text-muted-foreground">Dynasty Pts</div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <TrendIcon className={cn("h-4 w-4", getTrendColor(player.trend))} />
                            {player.breakoutCandidate && (
                              <Badge variant="outline" className="text-xs">
                                <Zap className="h-3 w-3 mr-1" />
                                Breakout
                              </Badge>
                            )}
                            {player.veteranDecline && (
                              <Badge variant="destructive" className="text-xs">
                                Decline
                              </Badge>
                            )}
                          </div>
                          
                          <Badge className={cn("text-xs", getKeeperValueColor(player.keeperValue))}>
                            {player.keeperValue}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="keepers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Keeper Recommendations</CardTitle>
              <CardDescription>
                Suggested players to keep for dynasty league
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dynastyRoster.keeperRecommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded bg-green-50">
                    <Star className="h-4 w-4 text-green-600" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="strategy" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Trade Targets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dynastyRoster.tradeTargets.map((target, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-green-600">•</span>
                      <span className="text-sm">{target}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Sell Candidates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dynastyRoster.sellCandidates.length > 0 ? (
                    dynastyRoster.sellCandidates.map((candidate, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-red-600">•</span>
                        <span className="text-sm">{candidate}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No immediate sell candidates</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="rookies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>2025 Rookie Rankings</CardTitle>
              <CardDescription>
                Dynasty values for incoming rookie class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rookieRankings.slice(0, 10).map((rookie, idx) => (
                  <div key={rookie.playerId} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-medium">{rookie.playerName}</div>
                        <div className="text-sm text-muted-foreground">
                          {rookie.position} • {rookie.college} • Pick #{rookie.draftCapital}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold">{rookie.projectedValue}</div>
                        <div className="text-xs text-muted-foreground">Projected</div>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        {rookie.immediateImpact && (
                          <Badge variant="default" className="text-xs">
                            Immediate Impact
                          </Badge>
                        )}
                        <Badge 
                          variant={rookie.situation === 'excellent' ? 'default' : 
                                  rookie.situation === 'good' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {rookie.situation} situation
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}