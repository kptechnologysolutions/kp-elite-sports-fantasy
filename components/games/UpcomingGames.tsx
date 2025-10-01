'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, Shield, Swords, Cloud, Wind, 
  ThermometerSun, AlertTriangle, TrendingUp, TrendingDown,
  Trophy, Users, Flame, Snowflake
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useSleeperStore from '@/lib/store/useSleeperStore';

export function UpcomingGames({ week }: { week?: number }) {
  const { 
    currentMatchups,
    rosters,
    myRoster,
    leagueUsers,
    currentWeek,
    currentLeague,
    fetchMatchups
  } = useSleeperStore();

  const [nextWeekMatchups, setNextWeekMatchups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch next week's matchups when component mounts
  useEffect(() => {
    if (currentLeague && currentWeek) {
      loadNextWeekMatchups();
    }
  }, [currentLeague, currentWeek, week]);

  const loadNextWeekMatchups = async () => {
    setLoading(true);
    try {
      // For next week matchups, we'd need to fetch them from Sleeper
      // For now, use current week matchups as example
      const matchups = currentMatchups;
      
      // Group matchups by matchup_id
      const matchupPairs: { [key: number]: any[] } = {};
      matchups.forEach(matchup => {
        if (!matchupPairs[matchup.matchup_id]) {
          matchupPairs[matchup.matchup_id] = [];
        }
        matchupPairs[matchup.matchup_id].push(matchup);
      });
      
      setNextWeekMatchups(Object.values(matchupPairs));
    } catch (error) {
      console.error('Failed to load matchups:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate matchup difficulty based on opponent strength
  const getMatchupDifficulty = (myRoster: any, opponentRoster: any) => {
    const myWins = myRoster?.settings?.wins || 0;
    const myLosses = myRoster?.settings?.losses || 0;
    const oppWins = opponentRoster?.settings?.wins || 0;
    const oppLosses = opponentRoster?.settings?.losses || 0;
    
    const myWinPct = myWins / Math.max(myWins + myLosses, 1);
    const oppWinPct = oppWins / Math.max(oppWins + oppLosses, 1);
    
    const differential = myWinPct - oppWinPct;
    
    if (differential >= 0.3) return 'easy';
    if (differential >= 0.1) return 'moderate';
    if (differential >= -0.1) return 'tough';
    return 'very-tough';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500 bg-green-500/10';
      case 'moderate': return 'text-yellow-500 bg-yellow-500/10';
      case 'tough': return 'text-orange-500 bg-orange-500/10';
      case 'very-tough': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '😊';
      case 'moderate': return '😐';
      case 'tough': return '😰';
      case 'very-tough': return '😱';
      default: return '🤔';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Easy Matchup';
      case 'moderate': return 'Fair Matchup';
      case 'tough': return 'Tough Matchup';
      case 'very-tough': return 'Very Tough';
      default: return 'Unknown';
    }
  };
  
  // Calculate power ranking
  const getPowerRanking = (roster: any) => {
    const wins = roster?.settings?.wins || 0;
    const losses = roster?.settings?.losses || 0;
    const points = roster?.settings?.fpts || 0;
    const totalGames = wins + losses;
    
    if (totalGames === 0) return 0;
    
    const winPct = wins / totalGames;
    const avgPoints = points / totalGames;
    
    // Combined metric of win % and scoring
    return (winPct * 100 + avgPoints / 10) / 2;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            <CardTitle>League Matchups</CardTitle>
          </div>
          <Badge variant="outline">
            Week {week || currentWeek}
          </Badge>
        </div>
        <CardDescription>
          This week's matchups with difficulty analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          </div>
        ) : nextWeekMatchups.length > 0 ? (
          <div className="space-y-3">
            {nextWeekMatchups.map((matchupPair, idx) => {
              if (!matchupPair || matchupPair.length !== 2) return null;
              
              const [team1Matchup, team2Matchup] = matchupPair;
              const team1Roster = rosters.find(r => r.roster_id === team1Matchup.roster_id);
              const team2Roster = rosters.find(r => r.roster_id === team2Matchup.roster_id);
              
              const team1User = team1Roster?.owner_id ? leagueUsers.get(team1Roster.owner_id) : null;
              const team2User = team2Roster?.owner_id ? leagueUsers.get(team2Roster.owner_id) : null;
              
              const isMyMatchup = team1Roster?.roster_id === myRoster?.roster_id || 
                                  team2Roster?.roster_id === myRoster?.roster_id;
              
              const team1Difficulty = getMatchupDifficulty(team1Roster, team2Roster);
              const team2Difficulty = getMatchupDifficulty(team2Roster, team1Roster);
              
              const team1Power = getPowerRanking(team1Roster);
              const team2Power = getPowerRanking(team2Roster);
              
              return (
                <div
                  key={idx}
                  className={cn(
                    "p-3 rounded-lg border transition-all hover:shadow-md",
                    isMyMatchup ? "border-primary/50 bg-primary/5" : "bg-background"
                  )}
                >
                  {/* Teams and Records */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      {/* Team 1 */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-semibold">
                              {team1User?.display_name || 'Team 1'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {team1Roster?.settings?.wins || 0}-{team1Roster?.settings?.losses || 0}
                              {team1Roster?.roster_id === myRoster?.roster_id && (
                                <Badge variant="secondary" className="ml-2 text-xs">YOU</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          getDifficultyColor(team1Difficulty)
                        )}>
                          <span className="mr-1">{getDifficultyIcon(team1Difficulty)}</span>
                          {getDifficultyText(team1Difficulty)}
                        </div>
                      </div>
                      
                      <div className="text-center text-xs text-muted-foreground my-1">vs</div>
                      
                      {/* Team 2 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-semibold">
                              {team2User?.display_name || 'Team 2'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {team2Roster?.settings?.wins || 0}-{team2Roster?.settings?.losses || 0}
                              {team2Roster?.roster_id === myRoster?.roster_id && (
                                <Badge variant="secondary" className="ml-2 text-xs">YOU</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          getDifficultyColor(team2Difficulty)
                        )}>
                          <span className="mr-1">{getDifficultyIcon(team2Difficulty)}</span>
                          {getDifficultyText(team2Difficulty)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Power Rankings Comparison */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="text-center p-2 bg-secondary/20 rounded">
                      <div className="text-xs text-muted-foreground">Power Rating</div>
                      <div className="font-bold">{team1Power.toFixed(1)}</div>
                    </div>
                    <div className="text-center p-2 bg-secondary/20 rounded">
                      <div className="text-xs text-muted-foreground">Power Rating</div>
                      <div className="font-bold">{team2Power.toFixed(1)}</div>
                    </div>
                  </div>
                  
                  {/* Points Comparison */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium">Avg Points:</span> {((team1Roster?.settings?.fpts || 0) / Math.max((team1Roster?.settings?.wins || 0) + (team1Roster?.settings?.losses || 0), 1)).toFixed(1)}
                    </div>
                    <div>
                      <span className="font-medium">Avg Points:</span> {((team2Roster?.settings?.fpts || 0) / Math.max((team2Roster?.settings?.wins || 0) + (team2Roster?.settings?.losses || 0), 1)).toFixed(1)}
                    </div>
                  </div>
                  
                  {/* My Matchup Alert */}
                  {isMyMatchup && (
                    <Alert className="mt-2" variant={
                      (team1Roster?.roster_id === myRoster?.roster_id && team1Difficulty === 'easy') ||
                      (team2Roster?.roster_id === myRoster?.roster_id && team2Difficulty === 'easy')
                        ? 'default' : 'destructive'
                    }>
                      <AlertTriangle className="h-3 w-3" />
                      <AlertDescription className="text-xs">
                        {team1Roster?.roster_id === myRoster?.roster_id ? (
                          <span>You have a <strong>{team1Difficulty}</strong> matchup against {team2User?.display_name}</span>
                        ) : (
                          <span>You have a <strong>{team2Difficulty}</strong> matchup against {team1User?.display_name}</span>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No matchup data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}