'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTeamStore } from '@/lib/store/teamStore';
import { realtimeSyncService } from '@/lib/services/realtimeSync';
import { newsAggregatorService } from '@/lib/services/newsAggregator';
import { notificationService } from '@/lib/services/notificationService';
import { 
  Trophy, Activity, TrendingUp, AlertCircle, Zap, Users, 
  BarChart3, Brain, Bell, ChevronRight, ArrowUp, ArrowDown, 
  Clock, Target, Wifi, Shield, Star, Newspaper, Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface TeamCard {
  team: any;
  liveScore: number;
  opponentScore: number;
  projectedScore: number;
  playersPlaying: number;
  playersYetToPlay: number;
  topPerformer: { name: string; points: number; } | null;
  winProbability: number;
  rank: number;
}

export function CommandCenterAllTeams() {
  const { teams } = useTeamStore();
  const [syncStatus, setSyncStatus] = useState<any>({ isRunning: false, lastSync: null, isGameDay: false });
  const [teamCards, setTeamCards] = useState<TeamCard[]>([]);
  const [breakingNews, setBreakingNews] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedView, setSelectedView] = useState<'grid' | 'list' | 'focus'>('grid');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribeSync = realtimeSyncService.subscribe((data) => {
      const status = realtimeSyncService.getSyncStatus();
      setSyncStatus({
        isRunning: status.isRunning,
        lastSync: data.lastSync,
        isGameDay: data.isGameDay,
      });
      updateTeamCards();
    });

    const unsubscribeNews = newsAggregatorService.subscribe((news) => {
      const breaking = news.filter(n => n.isBreaking).slice(0, 3);
      setBreakingNews(breaking);
    });

    const unsubscribeNotifications = notificationService.subscribe((notifs) => {
      setNotifications(notifs.filter(n => !n.read).slice(0, 5));
    });

    // Initial data load
    updateTeamCards();
    
    // Start real-time sync if not running
    const status = realtimeSyncService.getSyncStatus();
    if (!status.isRunning && teams.length > 0) {
      realtimeSyncService.startSync();
    }

    return () => {
      unsubscribeSync();
      unsubscribeNews();
      unsubscribeNotifications();
    };
  }, [teams]);

  const updateTeamCards = () => {
    const cards = teams.map((team, index) => {
      // Calculate live statistics for each team
      const liveScore = team.liveScore?.teamScore || 0;
      const opponentScore = team.liveScore?.opponentScore || 0;
      const projectedScore = calculateProjectedScore(team);
      
      const playersPlaying = team.players?.filter((p: any) => {
        // Check both status fields for live games
        return p.status?.gameStatus === 'in_progress' || 
               p.status?.isActive === true ||
               (p.status?.quarter && p.status.quarter !== '');
      }).length || 0;
      
      const playersYetToPlay = team.players?.filter((p: any) => {
        // Count players who haven't played yet
        const hasNotPlayed = p.status?.gameStatus === 'not_started' || 
                            (!p.status?.gameStatus && !p.status?.isActive && !p.stats?.fantasyPoints);
        return hasNotPlayed;
      }).length || 0;
      
      const topPerformer = getTopPerformer(team);
      const winProbability = calculateWinProbability(liveScore, opponentScore, playersYetToPlay);
      
      return {
        team,
        liveScore,
        opponentScore,
        projectedScore,
        playersPlaying,
        playersYetToPlay,
        topPerformer,
        winProbability,
        rank: team.rank || index + 1
      };
    });
    
    // Sort by live score descending
    cards.sort((a, b) => b.liveScore - a.liveScore);
    setTeamCards(cards);
  };

  const calculateProjectedScore = (team: any): number => {
    if (!team.players) return 0;
    return team.players.reduce((total: number, player: any) => {
      const current = player.stats?.fantasyPoints || 0;
      const projected = player.projectedPoints || 0;
      return total + Math.max(current, projected);
    }, 0);
  };

  const getTopPerformer = (team: any): { name: string; points: number; } | null => {
    if (!team.players || team.players.length === 0) return null;
    
    const sorted = [...team.players].sort((a: any, b: any) => 
      (b.stats?.fantasyPoints || 0) - (a.stats?.fantasyPoints || 0)
    );
    
    const top = sorted[0];
    if (top && top.stats?.fantasyPoints > 0) {
      return {
        name: top.name,
        points: top.stats.fantasyPoints
      };
    }
    return null;
  };

  const calculateWinProbability = (teamScore: number, oppScore: number, playersLeft: number): number => {
    const currentDiff = teamScore - oppScore;
    const potentialPoints = playersLeft * 10; // Assume 10 points per player average
    
    if (currentDiff > 30) return 95;
    if (currentDiff > 20) return 85;
    if (currentDiff > 10) return 70;
    if (currentDiff > 0) return 55;
    if (currentDiff > -10) return 45;
    if (currentDiff > -20) return 30;
    return 15;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await realtimeSyncService.forceSync();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getScoreColor = (score: number, oppScore: number) => {
    if (score > oppScore + 10) return 'text-green-500';
    if (score > oppScore) return 'text-green-400';
    if (score < oppScore - 10) return 'text-red-500';
    if (score < oppScore) return 'text-red-400';
    return 'text-yellow-500';
  };

  const getPlatformIcon = (platform: string) => {
    const icons: { [key: string]: string } = {
      'ESPN': '🏈',
      'Yahoo': '🟣', 
      'Sleeper': '😴',
      'NFL': '🏆',
      'CBS': '📺',
      'DraftKings': '👑'
    };
    return icons[platform] || '⚙️';
  };

  if (teams.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <Users className="w-16 h-16 text-gray-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-300">No Teams Found</h2>
          <p className="text-gray-500">Import your fantasy teams to access the command center</p>
          <Button onClick={() => window.location.href = '/teams'}>
            Import Teams
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">HalGrid Mission Control</h1>
            <Badge variant={syncStatus.isGameDay ? "default" : "secondary"}>
              {syncStatus.isGameDay ? '🏈 GAME DAY' : 'OFF DAY'}
            </Badge>
            <div className="flex items-center gap-2">
              <Wifi className={cn("w-4 h-4", syncStatus.isRunning ? "text-green-500" : "text-gray-500")} />
              <span className="text-sm text-gray-400">
                {syncStatus.lastSync 
                  ? `Updated ${typeof window !== 'undefined' ? new Date(syncStatus.lastSync).toLocaleTimeString() : ''}`
                  : 'Syncing...'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="flex gap-1 p-1 bg-gray-800 rounded-lg">
              {['grid', 'list', 'focus'].map((view) => (
                <button
                  key={view}
                  onClick={() => setSelectedView(view as any)}
                  className={cn(
                    "px-3 py-1 rounded text-sm capitalize transition-all",
                    selectedView === view 
                      ? "bg-blue-600 text-white" 
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  {view}
                </button>
              ))}
            </div>
            
            <Button
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <Activity className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              {isRefreshing ? 'Syncing...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </div>

      {/* Breaking News Ticker */}
      {breakingNews.length > 0 && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="animate-pulse">BREAKING</Badge>
            <ScrollArea className="flex-1 h-6">
              <div className="flex gap-6">
                {breakingNews.map((news, i) => (
                  <span key={i} className="text-sm text-white whitespace-nowrap">
                    {news.title}
                  </span>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Teams Grid/List View */}
      {selectedView === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamCards.map((card, index) => (
            <motion.div
              key={card.team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getPlatformIcon(card.team.platform)}</span>
                      <div>
                        <CardTitle className="text-lg">{card.team.name}</CardTitle>
                        <p className="text-xs text-gray-400">{card.team.leagueName}</p>
                      </div>
                    </div>
                    <Badge variant="outline">#{card.rank}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Live Score */}
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Live Score</p>
                      <p className={cn("text-2xl font-bold", getScoreColor(card.liveScore, card.opponentScore))}>
                        {card.liveScore.toFixed(1)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">vs</p>
                      {card.playersPlaying > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-xs text-green-500">LIVE</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Opponent</p>
                      <p className="text-2xl font-bold text-gray-400">
                        {card.opponentScore.toFixed(1)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Win Probability Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Win Probability</span>
                      <span>{card.winProbability}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-500",
                          card.winProbability > 70 ? "bg-green-500" :
                          card.winProbability > 40 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        style={{ width: `${card.winProbability}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Player Status */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-gray-800 rounded p-2">
                      <p className="text-xs text-gray-400">Playing Now</p>
                      <p className="text-lg font-bold text-green-500">{card.playersPlaying}</p>
                    </div>
                    <div className="bg-gray-800 rounded p-2">
                      <p className="text-xs text-gray-400">Yet to Play</p>
                      <p className="text-lg font-bold text-blue-500">{card.playersYetToPlay}</p>
                    </div>
                  </div>
                  
                  {/* Top Performer */}
                  {card.topPerformer && (
                    <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 rounded p-2 border border-yellow-500/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-xs text-gray-300">MVP:</span>
                          <span className="text-xs text-white font-medium">
                            {card.topPerformer.name}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-yellow-500">
                          {card.topPerformer.points.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* View Details Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => window.location.href = `/matchup/${card.team.id}`}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {selectedView === 'list' && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="border-b border-gray-800">
                <tr className="text-left">
                  <th className="p-4 text-sm text-gray-400">Team</th>
                  <th className="p-4 text-sm text-gray-400">Platform</th>
                  <th className="p-4 text-sm text-gray-400">Live Score</th>
                  <th className="p-4 text-sm text-gray-400">Opponent</th>
                  <th className="p-4 text-sm text-gray-400">Status</th>
                  <th className="p-4 text-sm text-gray-400">Win %</th>
                  <th className="p-4 text-sm text-gray-400">Top Player</th>
                </tr>
              </thead>
              <tbody>
                {teamCards.map((card) => (
                  <tr key={card.team.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-white">{card.team.name}</p>
                        <p className="text-xs text-gray-400">{card.team.leagueName}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-2xl">{getPlatformIcon(card.team.platform)}</span>
                    </td>
                    <td className="p-4">
                      <p className={cn("text-xl font-bold", getScoreColor(card.liveScore, card.opponentScore))}>
                        {card.liveScore.toFixed(1)}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-xl font-bold text-gray-400">
                        {card.opponentScore.toFixed(1)}
                      </p>
                    </td>
                    <td className="p-4">
                      {card.playersPlaying > 0 ? (
                        <Badge className="bg-green-600">
                          {card.playersPlaying} LIVE
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {card.playersYetToPlay} Pending
                        </Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full",
                              card.winProbability > 70 ? "bg-green-500" :
                              card.winProbability > 40 ? "bg-yellow-500" : "bg-red-500"
                            )}
                            style={{ width: `${card.winProbability}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-400">{card.winProbability}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {card.topPerformer && (
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-white">
                            {card.topPerformer.name}
                          </span>
                          <Badge variant="outline" className="text-yellow-500">
                            {card.topPerformer.points.toFixed(1)}
                          </Badge>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Focus View - Shows team with most activity */}
      {selectedView === 'focus' && teamCards.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Main focused team */}
            {(() => {
              const focusTeam = teamCards.find(c => c.playersPlaying > 0) || teamCards[0];
              return (
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{getPlatformIcon(focusTeam.team.platform)}</span>
                        <div>
                          <CardTitle className="text-2xl">{focusTeam.team.name}</CardTitle>
                          <p className="text-gray-400">{focusTeam.team.leagueName}</p>
                        </div>
                      </div>
                      <Badge variant="default" className="text-lg px-3 py-1">
                        FOCUS
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-gray-400 mb-2">Live Score</p>
                        <p className={cn("text-5xl font-bold", getScoreColor(focusTeam.liveScore, focusTeam.opponentScore))}>
                          {focusTeam.liveScore.toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-2">Opponent Score</p>
                        <p className="text-5xl font-bold text-gray-400">
                          {focusTeam.opponentScore.toFixed(1)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Live Players List */}
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-green-500" />
                        Players in Action
                      </h3>
                      <div className="space-y-2">
                        {focusTeam.team.players?.filter((p: any) => p.status?.gameStatus === 'in_progress')
                          .slice(0, 5)
                          .map((player: any) => (
                            <div key={player.id} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                              <div>
                                <p className="text-white font-medium">{player.name}</p>
                                <p className="text-xs text-gray-400">{player.position} • {player.team}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-green-500">
                                  {player.stats?.fantasyPoints?.toFixed(1) || '0.0'}
                                </p>
                                <p className="text-xs text-gray-400">points</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </div>
          
          {/* Other teams summary */}
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Other Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {teamCards.slice(1).map((card) => (
                      <div key={card.team.id} className="p-3 bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span>{getPlatformIcon(card.team.platform)}</span>
                            <span className="text-sm font-medium text-white">{card.team.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">#{card.rank}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs text-gray-400">Score</p>
                            <p className={cn("text-lg font-bold", getScoreColor(card.liveScore, card.opponentScore))}>
                              {card.liveScore.toFixed(1)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-400">vs</p>
                            <p className="text-xs text-gray-500">{card.opponentScore.toFixed(1)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Win %</p>
                            <p className="text-lg font-bold text-white">{card.winProbability}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}