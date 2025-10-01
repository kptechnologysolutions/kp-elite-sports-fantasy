'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trophy, TrendingUp, TrendingDown, Target, AlertTriangle,
  Calendar, Users, Zap, Shield, Flame, Snowflake, Activity, Swords
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useSleeperStore from '@/lib/store/useSleeperStore';

export function CompetitiveMetrics() {
  const {
    myRoster,
    rosters,
    currentLeague,
    currentWeek,
    leagueUsers,
    players,
    getPlayer,
    seasonMatchups
  } = useSleeperStore();
  
  if (!myRoster || !currentLeague) return null;
  
  // Calculate standings
  const sortedRosters = [...rosters].sort((a, b) => {
    const aWins = a.settings?.wins || 0;
    const aLosses = a.settings?.losses || 0;
    const bWins = b.settings?.wins || 0;
    const bLosses = b.settings?.losses || 0;
    
    const aWinPct = aWins / Math.max(aWins + aLosses, 1);
    const bWinPct = bWins / Math.max(bWins + bLosses, 1);
    
    if (aWinPct !== bWinPct) return bWinPct - aWinPct;
    return (b.settings?.fpts || 0) - (a.settings?.fpts || 0);
  });
  
  const myRank = sortedRosters.findIndex(r => r.roster_id === myRoster.roster_id) + 1;
  const firstPlace = sortedRosters[0];
  const playoffLine = Math.ceil(rosters.length * 0.5); // Top 50% make playoffs
  
  // Calculate games behind first place
  const myWins = myRoster.settings?.wins || 0;
  const myLosses = myRoster.settings?.losses || 0;
  const firstWins = firstPlace?.settings?.wins || 0;
  const firstLosses = firstPlace?.settings?.losses || 0;
  const gamesBehindFirst = ((firstWins - firstLosses) - (myWins - myLosses)) / 2;
  
  // Calculate playoff picture
  const gamesOutOfPlayoffs = myRank > playoffLine 
    ? ((sortedRosters[playoffLine - 1]?.settings?.wins || 0) - myWins)
    : 0;
  
  // Calculate win percentage and trend
  const totalGames = myWins + myLosses + (myRoster.settings?.ties || 0);
  const winPercentage = totalGames > 0 ? (myWins / totalGames) * 100 : 0;
  
  // Get recent form from actual matchup history
  const recentForm: string[] = [];
  
  if (seasonMatchups && seasonMatchups.size > 0) {
    // Get last 3 weeks of matchups
    const weeksToCheck = Math.min(3, currentWeek - 1);
    
    for (let week = currentWeek - weeksToCheck; week < currentWeek; week++) {
      const weekMatchups = seasonMatchups.get(week);
      if (weekMatchups) {
        const myMatchup = weekMatchups.find(m => m.roster_id === myRoster.roster_id);
        const oppMatchup = weekMatchups.find(m => 
          m.matchup_id === myMatchup?.matchup_id && 
          m.roster_id !== myMatchup?.roster_id
        );
        
        if (myMatchup && oppMatchup) {
          recentForm.push(myMatchup.points > oppMatchup.points ? 'W' : 'L');
        }
      }
    }
  } else {
    // Fallback: infer from record if no matchup history
    if (myLosses === 0 && myWins > 0) {
      for (let i = 0; i < Math.min(myWins, 3); i++) {
        recentForm.push('W');
      }
    } else if (myWins === 0 && myLosses > 0) {
      for (let i = 0; i < Math.min(myLosses, 3); i++) {
        recentForm.push('L');
      }
    }
  }
  
  const recentWins = recentForm.filter(r => r === 'W').length;
  const isHot = recentWins >= 2;
  const isCold = recentWins <= 1;
  
  // Calculate strength of schedule (remaining games)
  const remainingWeeks = 14 - currentWeek; // Regular season ends week 14
  const avgOppWinPct = 0.52; // Mock - would calculate from actual schedule
  const sosRating = avgOppWinPct > 0.55 ? 'hard' : avgOppWinPct < 0.45 ? 'easy' : 'medium';
  
  // Points metrics
  const avgPointsFor = (myRoster.settings?.fpts || 0) / Math.max(totalGames, 1);
  const avgPointsAgainst = (myRoster.settings?.fpts_against || 0) / Math.max(totalGames, 1);
  const pointsDifferential = avgPointsFor - avgPointsAgainst;
  
  // League averages
  const leagueAvgPoints = rosters.reduce((sum, r) => 
    sum + (r.settings?.fpts || 0), 0) / rosters.length / Math.max(totalGames, 1);
  
  // Bye week analysis
  const byeWeeks = new Map<number, string[]>();
  myRoster.players.forEach(playerId => {
    const player = getPlayer(playerId);
    if (player?.team) {
      // Mock bye weeks - would fetch from API
      const teamByes: { [key: string]: number } = {
        'KC': 6, 'BUF': 7, 'SF': 9, 'DAL': 7, 'PHI': 10,
        'MIA': 6, 'GB': 6, 'MIN': 13, 'DET': 9, 'CHI': 7
      };
      const bye = teamByes[player.team];
      if (bye) {
        if (!byeWeeks.has(bye)) byeWeeks.set(bye, []);
        byeWeeks.get(bye)!.push(`${player.first_name} ${player.last_name}`);
      }
    }
  });
  
  const upcomingByes = Array.from(byeWeeks.entries())
    .filter(([week]) => week >= currentWeek && week <= currentWeek + 2)
    .sort(([a], [b]) => a - b);
  
  // Upcoming opponent analysis (mock data)
  const nextOpponent = sortedRosters[5]; // Mock - would get from schedule
  const nextOppRank = 6;
  const nextOppWinPct = 0.58;
  
  // Helper functions for color coding
  const getRecordColor = (winPct: number) => {
    if (winPct >= 0.7) return 'text-green-500';
    if (winPct >= 0.5) return 'text-yellow-500';
    if (winPct >= 0.3) return 'text-orange-500';
    return 'text-red-500';
  };
  
  const getMetricColor = (value: number, good: number, bad: number, inverse = false) => {
    if (inverse) {
      if (value <= good) return 'text-green-500';
      if (value <= bad) return 'text-yellow-500';
      return 'text-red-500';
    } else {
      if (value >= good) return 'text-green-500';
      if (value >= bad) return 'text-yellow-500';
      return 'text-red-500';
    }
  };
  
  const getStandingsColor = (gamesBehind: number) => {
    if (gamesBehind <= 0) return 'text-green-500 bg-green-500/10';
    if (gamesBehind <= 2) return 'text-yellow-500 bg-yellow-500/10';
    if (gamesBehind <= 4) return 'text-orange-500 bg-orange-500/10';
    return 'text-red-500 bg-red-500/10';
  };
  
  const getPlayoffColor = (gamesOut: number, inPlayoffs: boolean) => {
    if (inPlayoffs) return 'text-green-500 bg-green-500/10';
    if (gamesOut <= 1) return 'text-yellow-500 bg-yellow-500/10';
    if (gamesOut <= 2) return 'text-orange-500 bg-orange-500/10';
    return 'text-red-500 bg-red-500/10';
  };

  return (
    <div className="space-y-4">
      {/* Primary Competitive Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Record with color */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              Record
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", getRecordColor(winPercentage / 100))}>
              {myWins}-{myLosses}
              {(myRoster.settings?.ties || 0) > 0 && `-${myRoster.settings.ties}`}
            </div>
            <div className="text-xs text-muted-foreground">
              {winPercentage.toFixed(0)}% Win Rate
            </div>
          </CardContent>
        </Card>
        
        {/* Games Behind First */}
        <Card className={cn(getStandingsColor(gamesBehindFirst))}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              {gamesBehindFirst <= 0 ? <Trophy className="h-3 w-3" /> : <Target className="h-3 w-3" />}
              vs 1st Place
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {gamesBehindFirst <= 0 ? (
                <span className="flex items-center gap-1">
                  Leader! <Trophy className="h-4 w-4 text-yellow-500" />
                </span>
              ) : (
                `-${gamesBehindFirst.toFixed(1)} GB`
              )}
            </div>
            <div className="text-xs opacity-75">
              Rank #{myRank} of {rosters.length}
            </div>
          </CardContent>
        </Card>
        
        {/* Playoff Picture */}
        <Card className={cn(getPlayoffColor(gamesOutOfPlayoffs, myRank <= playoffLine))}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Playoff Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myRank <= playoffLine ? (
                <span className="flex items-center gap-1">
                  IN <Shield className="h-4 w-4" />
                </span>
              ) : (
                `-${gamesOutOfPlayoffs} GB`
              )}
            </div>
            <div className="text-xs opacity-75">
              Top {playoffLine} qualify
            </div>
          </CardContent>
        </Card>
        
        {/* Points For with color */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Points For
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              getMetricColor(avgPointsFor, leagueAvgPoints * 1.1, leagueAvgPoints * 0.9)
            )}>
              {avgPointsFor.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">
              {avgPointsFor > leagueAvgPoints ? '+' : ''}{(avgPointsFor - leagueAvgPoints).toFixed(1)} vs avg
            </div>
          </CardContent>
        </Card>
        
        {/* Hot/Cold Streak */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1">
              {isHot && <Flame className="h-5 w-5 text-orange-500" />}
              {isCold && <Snowflake className="h-5 w-5 text-blue-500" />}
              <span className="text-2xl font-bold">
                {recentForm.join('-')}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Last 3 weeks
            </div>
          </CardContent>
        </Card>
        
        {/* Strength of Schedule */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              SOS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              sosRating === 'easy' ? 'text-green-500' :
              sosRating === 'medium' ? 'text-yellow-500' :
              'text-red-500'
            )}>
              {sosRating.toUpperCase()}
            </div>
            <div className="text-xs text-muted-foreground">
              {remainingWeeks} games left
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Next Opponent */}
      {nextOpponent && (
        <Card className="bg-gradient-to-r from-primary/5 to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Swords className="h-4 w-4" />
              Next Opponent - Week {currentWeek + 1}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">
                  {leagueUsers.get(nextOpponent.owner_id)?.display_name || 'Opponent'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Rank #{nextOppRank} • {(nextOppWinPct * 100).toFixed(0)}% Win Rate
                </div>
              </div>
              <Badge variant={nextOppWinPct > 0.6 ? "destructive" : "secondary"}>
                {nextOppWinPct > 0.6 ? 'Tough' : nextOppWinPct > 0.4 ? 'Fair' : 'Favorable'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Bye Week Alert */}
      {upcomingByes.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-1">Upcoming Bye Weeks:</div>
            {upcomingByes.map(([week, players]) => (
              <div key={week} className="text-sm">
                Week {week}: {players.slice(0, 3).join(', ')}
                {players.length > 3 && ` +${players.length - 3} more`}
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Season Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Season Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={(currentWeek / 14) * 100} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Week {currentWeek}</span>
            <span>{14 - currentWeek} weeks until playoffs</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}