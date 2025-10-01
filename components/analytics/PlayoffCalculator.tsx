'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Trophy, 
  Target, 
  Calculator,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { 
  playoffCalculatorService, 
  PlayoffProbability, 
  PlayoffSimulation,
  SimulationResult 
} from '@/lib/services/playoffCalculator';
import useSleeperStore from '@/lib/store/useSleeperStore';
import { cn } from '@/lib/utils';

export function PlayoffCalculator() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const {
    currentLeague,
    rosters,
    leagueUsers,
    myRoster,
    currentWeek
  } = useSleeperStore();
  
  // Get display name for a roster
  const getRosterName = (rosterId: number) => {
    const roster = rosters.find(r => r.roster_id === rosterId);
    if (!roster) return `Team ${rosterId}`;
    
    const owner = roster.owner_id ? leagueUsers.get(roster.owner_id) : undefined;
    return owner?.team_name || owner?.display_name || `Team ${rosterId}`;
  };
  
  const calculateProbabilities = async () => {
    if (!currentLeague || rosters.length === 0) {
      setError('League data not available');
      return;
    }
    
    setIsCalculating(true);
    setError(null);
    
    try {
      // Convert rosters to simulation format
      const teams: PlayoffSimulation[] = rosters.map(roster => ({
        teamId: roster.roster_id,
        wins: roster.settings?.wins || 0,
        losses: roster.settings?.losses || 0,
        ties: roster.settings?.ties || 0,
        pointsFor: roster.settings?.fpts || 0,
        pointsAgainst: roster.settings?.fpts_against || 0,
        remainingSchedule: generateRemainingSchedule(roster.roster_id, rosters.length, currentWeek)
      }));
      
      const leagueSettings = {
        playoffTeams: currentLeague.settings?.playoff_teams || 6,
        regularSeasonWeeks: currentLeague.settings?.playoff_week_start ? 
          currentLeague.settings.playoff_week_start - 1 : 14,
        currentWeek: currentWeek
      };
      
      const simulationResults = await playoffCalculatorService.calculatePlayoffProbabilities(
        teams,
        leagueSettings
      );
      
      // Add team names to results
      const enhancedResults = {
        ...simulationResults,
        probabilities: simulationResults.probabilities.map(prob => ({
          ...prob,
          teamName: getRosterName(prob.teamId)
        }))
      };
      
      setResults(enhancedResults);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate playoff probabilities');
    } finally {
      setIsCalculating(false);
    }
  };
  
  // Generate a simplified remaining schedule (round-robin style)
  const generateRemainingSchedule = (teamId: number, totalTeams: number, currentWeek: number): number[] => {
    const schedule: number[] = [];
    const playoffWeekStart = currentLeague?.settings?.playoff_week_start || 15;
    const remainingWeeks = playoffWeekStart - currentWeek;
    
    // Simple round-robin schedule generation
    const otherTeams = rosters
      .map(r => r.roster_id)
      .filter(id => id !== teamId);
    
    for (let week = 0; week < remainingWeeks; week++) {
      const opponentIndex = week % otherTeams.length;
      schedule.push(otherTeams[opponentIndex]);
    }
    
    return schedule;
  };
  
  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-green-600';
    if (probability >= 60) return 'text-yellow-600';
    if (probability >= 40) return 'text-orange-600';
    return 'text-red-600';
  };
  
  const getProbabilityBadge = (probability: number) => {
    if (probability >= 90) return { variant: 'default' as const, text: 'Lock' };
    if (probability >= 70) return { variant: 'secondary' as const, text: 'Likely' };
    if (probability >= 30) return { variant: 'outline' as const, text: 'Possible' };
    return { variant: 'destructive' as const, text: 'Unlikely' };
  };
  
  if (!currentLeague) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Please select a league to view playoff probabilities
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Playoff Calculator
            </CardTitle>
            <CardDescription>
              Monte Carlo simulation of remaining season scenarios
            </CardDescription>
          </div>
          <Button
            onClick={calculateProbabilities}
            disabled={isCalculating}
            variant="outline"
          >
            {isCalculating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                Calculate
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!results && !isCalculating && (
          <div className="text-center py-8">
            <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Click "Calculate" to simulate playoff scenarios
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Uses 10,000 Monte Carlo simulations
            </p>
          </div>
        )}
        
        {isCalculating && (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 mx-auto animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">
              Running {playoffCalculatorService['SIMULATIONS'] || 10000} simulations...
            </p>
          </div>
        )}
        
        {results && (
          <Tabs defaultValue="probabilities" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="probabilities">Playoff Odds</TabsTrigger>
              <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
            </TabsList>
            
            <TabsContent value="probabilities" className="space-y-4">
              <div className="grid gap-3">
                {results.probabilities
                  .sort((a, b) => b.playoffProbability - a.playoffProbability)
                  .map((team) => {
                    const badge = getProbabilityBadge(team.playoffProbability);
                    const isMyTeam = team.teamId === myRoster?.roster_id;
                    
                    return (
                      <div
                        key={team.teamId}
                        className={cn(
                          "p-4 rounded-lg border transition-all",
                          isMyTeam && "bg-primary/5 border-primary/20"
                        )}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{team.teamName}</span>
                            {isMyTeam && (
                              <Badge variant="secondary" className="text-xs">You</Badge>
                            )}
                          </div>
                          <Badge variant={badge.variant}>{badge.text}</Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Playoff Probability</span>
                            <span className={cn("font-bold", getProbabilityColor(team.playoffProbability))}>
                              {team.playoffProbability.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={team.playoffProbability} className="h-2" />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                          <div>
                            <div className="text-muted-foreground">Current</div>
                            <div className="font-medium">{team.currentRecord}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Projected</div>
                            <div className="font-medium">
                              {team.projectedWins.toFixed(1)}-{team.projectedLosses.toFixed(1)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Championship</div>
                            <div className="font-medium">
                              {team.championshipProbability.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </TabsContent>
            
            <TabsContent value="scenarios" className="space-y-4">
              {results.probabilities
                .filter(team => team.teamId === myRoster?.roster_id)
                .map((team) => (
                  <div key={team.teamId} className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Clinch Scenarios
                      </h4>
                      {team.clinchScenarios.length > 0 ? (
                        <ul className="space-y-1 text-sm text-green-700">
                          {team.clinchScenarios.map((scenario, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span>•</span>
                              <span>{scenario}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-green-700">
                          No guaranteed clinch scenarios available
                        </p>
                      )}
                    </div>
                    
                    {team.eliminationScenarios.length > 0 && (
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                          <XCircle className="h-4 w-4" />
                          Elimination Scenarios
                        </h4>
                        <ul className="space-y-1 text-sm text-red-700">
                          {team.eliminationScenarios.map((scenario, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span>•</span>
                              <span>{scenario}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              
              <div className="text-center text-sm text-muted-foreground">
                <p>Simulations based on {results.totalSimulations.toLocaleString()} scenarios</p>
                <p>Calculations include strength of schedule and historical performance</p>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}