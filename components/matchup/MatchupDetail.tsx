'use client';

import React, { useState, useEffect } from 'react';
import { useTeamStore } from '@/lib/store/teamStore';
import { realtimeSyncService } from '@/lib/services/realtimeSync';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, TrendingUp, TrendingDown, Activity, Clock, Star,
  ArrowLeft, Zap, Shield, Heart, AlertCircle, ChevronRight,
  Users, BarChart3, Target, Eye, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchupDetailProps {
  teamId: string;
}

interface PlayerMatchupData {
  id: string;
  name: string;
  position: string;
  team: string;
  opponent: string;
  gameTime: string;
  gameStatus: 'not_started' | 'in_progress' | 'completed';
  quarter?: string;
  timeRemaining?: string;
  fantasyPoints: number;
  projectedPoints: number;
  percentStarted: number;
  weatherImpact?: string;
  injuryStatus?: string;
  isStarter: boolean;
  slotPosition: string;
  stats?: {
    passingYards?: number;
    passingTDs?: number;
    rushingYards?: number;
    rushingTDs?: number;
    receivingYards?: number;
    receptions?: number;
    receivingTDs?: number;
    fieldGoalsMade?: number;
    defensiveTDs?: number;
    sacks?: number;
    interceptions?: number;
  };
}

export function MatchupDetail({ teamId }: MatchupDetailProps) {
  const { teams } = useTeamStore();
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [matchupData, setMatchupData] = useState<any>(null);
  const [playerDetails, setPlayerDetails] = useState<PlayerMatchupData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerMatchupData | null>(null);
  const [viewMode, setViewMode] = useState<'roster' | 'bench' | 'comparison'>('roster');

  useEffect(() => {
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setSelectedTeam(team);
      loadMatchupData(team);
    }
  }, [teams, teamId]);

  const loadMatchupData = async (team: any) => {
    setIsLoading(true);
    
    // Get live matchup data from the team
    const matchup = team.liveScore;
    const players = team.players || [];
    
    // Build detailed player data
    const detailedPlayers: PlayerMatchupData[] = players.map((player: any) => {
      const isLive = player.status?.gameStatus === 'in_progress' || player.status?.isActive;
      const gameTime = getGameTime(player.team);
      
      return {
        id: player.id,
        name: player.name,
        position: player.position,
        team: player.team,
        opponent: getOpponent(player.team),
        gameTime,
        gameStatus: player.status?.gameStatus || 'not_started',
        quarter: player.status?.quarter,
        timeRemaining: player.status?.timeRemaining,
        fantasyPoints: player.stats?.fantasyPoints || 0,
        projectedPoints: player.projectedPoints || getPositionProjection(player.position),
        percentStarted: 95, // Most players are must-starts
        weatherImpact: getWeatherImpact(player.team),
        injuryStatus: player.injuryStatus?.type,
        isStarter: player.status?.isActive || false,
        slotPosition: getSlotPosition(player.position),
        stats: player.stats || {}
      };
    });
    
    // Sort by position order
    const positionOrder = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
    detailedPlayers.sort((a, b) => {
      const aIndex = positionOrder.indexOf(a.position) || 99;
      const bIndex = positionOrder.indexOf(b.position) || 99;
      return aIndex - bIndex;
    });
    
    setPlayerDetails(detailedPlayers);
    setMatchupData({
      ...matchup,
      totalProjected: detailedPlayers.reduce((sum, p) => sum + p.projectedPoints, 0),
      playersActive: detailedPlayers.filter(p => p.gameStatus === 'in_progress').length,
      playersCompleted: detailedPlayers.filter(p => p.gameStatus === 'completed').length,
      playersPending: detailedPlayers.filter(p => p.gameStatus === 'not_started').length,
    });
    
    setIsLoading(false);
  };

  const getGameTime = (team: string): string => {
    // Simulate game times based on team
    const gameTimes: { [key: string]: string } = {
      'BUF': '1:00 PM ET', 'MIA': '1:00 PM ET', 'NE': '1:00 PM ET', 'NYJ': '1:00 PM ET',
      'BAL': '1:00 PM ET', 'CIN': '1:00 PM ET', 'CLE': '1:00 PM ET', 'PIT': '1:00 PM ET',
      'HOU': '1:00 PM ET', 'IND': '1:00 PM ET', 'JAX': '1:00 PM ET', 'TEN': '1:00 PM ET',
      'MIN': '1:00 PM ET', 'GB': '1:00 PM ET', 'CHI': '1:00 PM ET', 'DET': '1:00 PM ET',
      'DEN': '4:25 PM ET', 'KC': '4:25 PM ET', 'LV': '4:25 PM ET', 'LAC': '4:25 PM ET',
      'DAL': '4:25 PM ET', 'NYG': '4:25 PM ET', 'PHI': '4:25 PM ET', 'WAS': '4:25 PM ET',
      'SF': '4:25 PM ET', 'SEA': '4:25 PM ET', 'LAR': '4:25 PM ET', 'ARI': '4:25 PM ET',
      'TB': '8:20 PM ET', 'NO': '8:20 PM ET', 'ATL': '8:20 PM ET', 'CAR': '8:20 PM ET'
    };
    return gameTimes[team] || '1:00 PM ET';
  };

  const getOpponent = (team: string): string => {
    // Simulate opponents for Week 4
    const opponents: { [key: string]: string } = {
      'BUF': '@BAL', 'MIA': 'TEN', 'NE': '@SF', 'NYJ': 'DEN',
      'BAL': 'BUF', 'CIN': '@CAR', 'CLE': '@LV', 'PIT': 'IND',
      'HOU': '@JAX', 'IND': '@PIT', 'JAX': 'HOU', 'TEN': '@MIA',
      'MIN': 'GB', 'GB': '@MIN', 'CHI': 'LAR', 'DET': '@SEA',
      'DEN': '@NYJ', 'KC': 'LAC', 'LV': 'CLE', 'LAC': '@KC',
      'DAL': '@NYG', 'NYG': 'DAL', 'PHI': 'TB', 'WAS': 'ARI',
      'SF': 'NE', 'SEA': 'DET', 'LAR': '@CHI', 'ARI': '@WAS',
      'TB': '@PHI', 'NO': '@ATL', 'ATL': 'NO', 'CAR': 'CIN'
    };
    return opponents[team] || 'BYE';
  };

  const getWeatherImpact = (team: string): string | undefined => {
    // Simulate weather for outdoor stadiums
    const outdoorTeams = ['BUF', 'GB', 'CHI', 'NYJ', 'NE', 'CLE', 'PIT', 'CIN', 'DEN', 'KC'];
    if (outdoorTeams.includes(team)) {
      const conditions = ['Clear', 'Light Rain', 'Windy', 'Cold'];
      return conditions[Math.floor(Math.random() * conditions.length)];
    }
    return undefined;
  };

  const getPositionProjection = (position?: string): number => {
    const projections: { [key: string]: number } = {
      'QB': 18.5, 'RB': 10.2, 'WR': 8.5, 'TE': 6.5, 'K': 7.0, 'DEF': 6.0
    };
    return projections[position || ''] || 5;
  };

  const getSlotPosition = (position?: string): string => {
    const slots: { [key: string]: string } = {
      'QB': 'QB', 'RB': 'RB/WR/TE', 'WR': 'WR/TE', 'TE': 'TE', 'K': 'K', 'DEF': 'DEF'
    };
    return slots[position || ''] || 'FLEX';
  };

  const getScoreColor = (score: number, oppScore: number): string => {
    if (score > oppScore + 10) return 'text-green-500';
    if (score > oppScore) return 'text-green-400';
    if (score < oppScore - 10) return 'text-red-500';
    if (score < oppScore) return 'text-red-400';
    return 'text-yellow-500';
  };

  const getPlayerStatusIcon = (player: PlayerMatchupData) => {
    if (player.gameStatus === 'in_progress') return <Activity className="w-4 h-4 text-green-500 animate-pulse" />;
    if (player.gameStatus === 'completed') return <Shield className="w-4 h-4 text-gray-400" />;
    if (player.injuryStatus) return <AlertCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-blue-500" />;
  };

  if (isLoading || !selectedTeam || !matchupData) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <Activity className="w-12 h-12 text-gray-500 animate-spin mx-auto" />
          <p className="text-gray-500">Loading matchup data...</p>
        </div>
      </div>
    );
  }

  const winProbability = matchupData.teamScore > matchupData.opponentScore ? 
    Math.min(95, 50 + (matchupData.teamScore - matchupData.opponentScore) * 2) :
    Math.max(5, 50 - (matchupData.opponentScore - matchupData.teamScore) * 2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Command Center
          </Button>
          
          <div className="flex items-center gap-4">
            <Badge variant="default">Week {matchupData.week || 4}</Badge>
            {matchupData.isLive && (
              <Badge variant="destructive" className="animate-pulse">
                <Activity className="w-3 h-3 mr-1" />
                LIVE
              </Badge>
            )}
          </div>
        </div>

        {/* Score Display */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">{selectedTeam.name}</h2>
            <p className={cn(
              "text-5xl font-bold",
              getScoreColor(matchupData.teamScore || 0, matchupData.opponentScore || 0)
            )}>
              {(matchupData.teamScore || 0).toFixed(1)}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Projected: {matchupData.totalProjected.toFixed(1)}
            </p>
          </div>

          <div className="text-center">
            <p className="text-gray-400 mb-2">VS</p>
            <div className="relative">
              <div className="w-24 h-24 mx-auto rounded-full border-4 border-gray-700 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {winProbability}%
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Win Probability</p>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-400 mb-2">
              {matchupData.opponentName || 'Opponent'}
            </h2>
            <p className="text-5xl font-bold text-gray-400">
              {(matchupData.opponentScore || 0).toFixed(1)}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Projected: {(matchupData.opponentScore * 1.1).toFixed(1)}
            </p>
          </div>
        </div>

        {/* Game Status Bar */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Playing Now</p>
              <p className="text-2xl font-bold text-green-500">{matchupData.playersActive}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Completed</p>
              <p className="text-2xl font-bold text-gray-400">{matchupData.playersCompleted}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Yet to Play</p>
              <p className="text-2xl font-bold text-blue-500">{matchupData.playersPending}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 p-1 bg-gray-900 rounded-lg w-fit">
        {['roster', 'bench', 'comparison'].map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode as any)}
            className={cn(
              "px-4 py-2 rounded text-sm capitalize transition-all",
              viewMode === mode 
                ? "bg-blue-600 text-white" 
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            )}
          >
            {mode === 'comparison' ? 'Head to Head' : mode}
          </button>
        ))}
      </div>

      {/* Player List */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{viewMode === 'roster' ? 'Starting Lineup' : viewMode === 'bench' ? 'Bench Players' : 'Head to Head Comparison'}</span>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Activity className="w-4 h-4 text-green-500" />
              <span>Live</span>
              <Clock className="w-4 h-4 text-blue-500 ml-2" />
              <span>Upcoming</span>
              <Shield className="w-4 h-4 text-gray-400 ml-2" />
              <span>Final</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-800">
            {playerDetails
              .filter(p => viewMode === 'bench' ? !p.isStarter : viewMode === 'roster' ? p.isStarter : true)
              .map((player) => (
              <div
                key={player.id}
                className="p-4 hover:bg-gray-800/50 transition-all cursor-pointer"
                onClick={() => setSelectedPlayer(player)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getPlayerStatusIcon(player)}
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{player.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {player.position}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {player.team}
                        </Badge>
                        {player.injuryStatus && (
                          <Badge variant="destructive" className="text-xs">
                            {player.injuryStatus}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-xs text-gray-400">
                          {player.opponent} • {player.gameTime}
                        </p>
                        {player.gameStatus === 'in_progress' && player.quarter && (
                          <Badge variant="default" className="text-xs animate-pulse">
                            {player.quarter} {player.timeRemaining && `- ${player.timeRemaining}`}
                          </Badge>
                        )}
                        {player.weatherImpact && (
                          <span className="text-xs text-yellow-500">
                            {player.weatherImpact}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Live Stats */}
                    {player.gameStatus === 'in_progress' && (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-500">
                          {player.fantasyPoints.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-400">
                          Proj: {player.projectedPoints.toFixed(1)}
                        </p>
                      </div>
                    )}
                    
                    {/* Projected Stats */}
                    {player.gameStatus === 'not_started' && (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-500">
                          {player.projectedPoints.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-400">
                          Projected
                        </p>
                      </div>
                    )}
                    
                    {/* Final Stats */}
                    {player.gameStatus === 'completed' && (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-400">
                          {player.fantasyPoints.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-400">
                          Final
                        </p>
                      </div>
                    )}

                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  </div>
                </div>

                {/* Detailed Stats Row */}
                {player.gameStatus === 'in_progress' && player.stats && (
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <div className="flex gap-4 text-xs text-gray-400">
                      {player.position === 'QB' && (
                        <>
                          {player.stats.passingYards && (
                            <span>{player.stats.passingYards} Pass Yds</span>
                          )}
                          {player.stats.passingTDs && (
                            <span>{player.stats.passingTDs} Pass TD</span>
                          )}
                          {player.stats.rushingYards && (
                            <span>{player.stats.rushingYards} Rush Yds</span>
                          )}
                        </>
                      )}
                      {(player.position === 'RB' || player.position === 'WR' || player.position === 'TE') && (
                        <>
                          {player.stats.rushingYards && (
                            <span>{player.stats.rushingYards} Rush Yds</span>
                          )}
                          {player.stats.receptions && (
                            <span>{player.stats.receptions} Rec</span>
                          )}
                          {player.stats.receivingYards && (
                            <span>{player.stats.receivingYards} Rec Yds</span>
                          )}
                          {(player.stats.rushingTDs || 0) + (player.stats.receivingTDs || 0) > 0 && (
                            <span className="text-green-500 font-medium">
                              {(player.stats.rushingTDs || 0) + (player.stats.receivingTDs || 0)} TD
                            </span>
                          )}
                        </>
                      )}
                      {player.position === 'K' && (
                        <>
                          {player.stats.fieldGoalsMade && (
                            <span>{player.stats.fieldGoalsMade} FG</span>
                          )}
                        </>
                      )}
                      {player.position === 'DEF' && (
                        <>
                          {player.stats.sacks && (
                            <span>{player.stats.sacks} Sacks</span>
                          )}
                          {player.stats.interceptions && (
                            <span>{player.stats.interceptions} INT</span>
                          )}
                          {player.stats.defensiveTDs && (
                            <span className="text-green-500">{player.stats.defensiveTDs} TD</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Progress Bar for Live Games */}
                {player.gameStatus === 'in_progress' && (
                  <div className="mt-2">
                    <Progress
                      value={(player.fantasyPoints / player.projectedPoints) * 100}
                      className="h-1"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedPlayer.name} - Detailed Stats</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPlayer(null)}
              >
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Position</p>
                <p className="font-medium">{selectedPlayer.position}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Team</p>
                <p className="font-medium">{selectedPlayer.team}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Opponent</p>
                <p className="font-medium">{selectedPlayer.opponent}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Game Time</p>
                <p className="font-medium">{selectedPlayer.gameTime}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Fantasy Points</p>
                <p className="text-2xl font-bold text-green-500">
                  {selectedPlayer.fantasyPoints.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Projected</p>
                <p className="text-2xl font-bold text-blue-500">
                  {selectedPlayer.projectedPoints.toFixed(1)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-400 mb-1">Start %</p>
                <div className="flex items-center gap-2">
                  <Progress value={selectedPlayer.percentStarted} className="flex-1" />
                  <span className="text-sm">{selectedPlayer.percentStarted}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}