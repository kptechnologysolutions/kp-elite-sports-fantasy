'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ModernNav } from '@/components/layout/ModernNav';
import { 
  Trophy, TrendingUp, TrendingDown, Clock, CheckCircle2,
  Activity, Flame, Shield
} from 'lucide-react';
import useSleeperStore from '@/lib/store/useSleeperStore';
import { cn } from '@/lib/utils';

export default function MatchupsPage() {
  const router = useRouter();
  const [currentWeek, setCurrentWeek] = useState(1);
  
  const {
    user,
    currentLeague,
    rosters,
    currentMatchups,
    myRoster,
    leagueUsers,
    players,
    getPlayer,
    fetchMatchups
  } = useSleeperStore();
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);
  
  // Fetch matchups when league changes
  useEffect(() => {
    if (currentLeague) {
      fetchMatchups();
    }
  }, [currentLeague]);
  
  // Group matchups by matchup_id
  const matchupPairs: { [key: number]: any[] } = {};
  currentMatchups.forEach(matchup => {
    if (!matchupPairs[matchup.matchup_id]) {
      matchupPairs[matchup.matchup_id] = [];
    }
    matchupPairs[matchup.matchup_id].push(matchup);
  });
  
  // Find my matchup
  const myMatchup = currentMatchups.find(m => m.roster_id === myRoster?.roster_id);
  const myOpponent = currentMatchups.find(m => 
    m.matchup_id === myMatchup?.matchup_id && 
    m.roster_id !== myMatchup?.roster_id
  );
  
  const MatchupCard = ({ team1, team2, isMyMatchup = false }: any) => {
    const roster1 = rosters.find(r => r.roster_id === team1.roster_id);
    const roster2 = rosters.find(r => r.roster_id === team2.roster_id);
    
    const total = team1.points + team2.points || 1;
    const team1Percentage = (team1.points / total) * 100;
    
    return (
      <Card className={cn(
        "transition-all",
        isMyMatchup && "ring-2 ring-primary"
      )}>
        <CardHeader className="pb-3">
          {isMyMatchup && (
            <Badge className="w-fit mb-2" variant="default">
              <Trophy className="h-3 w-3 mr-1" />
              Your Matchup
            </Badge>
          )}
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Matchup {team1.matchup_id}</CardTitle>
            <Badge variant="secondary">
              <Activity className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Team 1 */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">
                  Roster {team1.roster_id}
                  {team1.roster_id === myRoster?.roster_id && (
                    <Badge className="ml-2" variant="outline">You</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {roster1?.settings?.wins || 0}-{roster1?.settings?.losses || 0}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{team1.points.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">points</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <Progress value={team1Percentage} className="h-2" />
            
            {/* Team 2 */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">
                  Roster {team2.roster_id}
                  {team2.roster_id === myRoster?.roster_id && (
                    <Badge className="ml-2" variant="outline">You</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {roster2?.settings?.wins || 0}-{roster2?.settings?.losses || 0}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{team2.points.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">points</div>
              </div>
            </div>
            
            {/* Winner indicator */}
            {team1.points !== team2.points && (
              <div className="flex items-center justify-center pt-2 border-t">
                {team1.points > team2.points ? (
                  <Badge variant="default">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Roster {team1.roster_id} winning by {(team1.points - team2.points).toFixed(1)}
                  </Badge>
                ) : (
                  <Badge variant="default">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Roster {team2.roster_id} winning by {(team2.points - team1.points).toFixed(1)}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  if (!user) return null;
  
  return (
    <div className="min-h-screen bg-background">
      <ModernNav />
      
      <main className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Week {currentWeek} Matchups</h1>
          <p className="text-muted-foreground">
            {currentLeague?.name || 'Select a league'}
          </p>
        </div>
        
        {/* My Matchup Highlight */}
        {myMatchup && myOpponent && (
          <div className="mb-6">
            <MatchupCard 
              team1={myMatchup} 
              team2={myOpponent} 
              isMyMatchup={true}
            />
          </div>
        )}
        
        {/* All Matchups */}
        <div>
          <h2 className="text-xl font-semibold mb-4">All Matchups</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(matchupPairs).map((pair, idx) => {
              if (pair.length !== 2) return null;
              
              // Skip my matchup since it's shown above
              if (myMatchup && pair.some(m => m.roster_id === myMatchup.roster_id)) {
                return null;
              }
              
              return (
                <MatchupCard
                  key={idx}
                  team1={pair[0]}
                  team2={pair[1]}
                />
              );
            })}
          </div>
        </div>
        
        {/* Highest Scoring */}
        {currentMatchups.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Week Leaders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Highest Score */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="text-sm text-muted-foreground">Highest Score</div>
                  <div className="text-2xl font-bold">
                    {Math.max(...currentMatchups.map(m => m.points)).toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Roster {currentMatchups.find(m => m.points === Math.max(...currentMatchups.map(m => m.points)))?.roster_id}
                  </div>
                </div>
                
                {/* Lowest Score */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingDown className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="text-sm text-muted-foreground">Lowest Score</div>
                  <div className="text-2xl font-bold">
                    {Math.min(...currentMatchups.filter(m => m.points > 0).map(m => m.points)).toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Roster {currentMatchups.find(m => m.points === Math.min(...currentMatchups.filter(m => m.points > 0).map(m => m.points)))?.roster_id}
                  </div>
                </div>
                
                {/* Average Score */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Activity className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="text-sm text-muted-foreground">Average Score</div>
                  <div className="text-2xl font-bold">
                    {(currentMatchups.reduce((sum, m) => sum + m.points, 0) / currentMatchups.length).toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    League average
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}