'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTeamStore } from '@/lib/store/teamStore';
import { useWebSocket } from '@/lib/services/websocket';
import { LineupOptimizer } from '@/lib/ai/lineupOptimizer';
import { TradeAnalyzer } from '@/lib/ai/tradeAnalyzer';
import { CommandCenterAllTeams } from './CommandCenterAllTeams';
import { 
  Trophy, Activity, TrendingUp, AlertCircle, Zap, Users, 
  BarChart3, Brain, Mic, Volume2, Bell, Settings, 
  ChevronRight, ArrowUp, ArrowDown, Clock, Target, Grid
} from 'lucide-react';

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
  priority: 'high' | 'medium' | 'low';
}

interface AIInsight {
  id: string;
  type: 'lineup' | 'trade' | 'waiver' | 'injury' | 'matchup';
  title: string;
  description: string;
  action?: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  timestamp: Date;
}

export function CommandCenter() {
  const { teams, currentTeamId } = useTeamStore();
  const currentTeam = teams.find(t => t.id === currentTeamId);
  const { connected, updates, subscribeToTeam } = useWebSocket(currentTeam?.userId);
  
  const [activeView, setActiveView] = useState<'all-teams' | 'overview' | 'ai' | 'live' | 'analytics'>('all-teams');
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(false);

  // Subscribe to team updates
  useEffect(() => {
    if (currentTeam) {
      subscribeToTeam(currentTeam.id);
    }
  }, [currentTeam]);

  // Calculate metrics
  useEffect(() => {
    if (!currentTeam) return;

    const calculateMetrics = () => {
      const winRate = currentTeam.record ? 
        (currentTeam.record.wins / (currentTeam.record.wins + currentTeam.record.losses)) * 100 : 0;

      const projectedScore = currentTeam.liveScore?.projectedScore || 0;
      const actualScore = currentTeam.liveScore?.teamScore || 0;
      const performanceRatio = projectedScore > 0 ? (actualScore / projectedScore) * 100 : 100;

      const playoffOdds = calculatePlayoffOdds(currentTeam);
      const championshipOdds = calculateChampionshipOdds(currentTeam);

      setMetrics([
        {
          title: 'Win Rate',
          value: `${winRate.toFixed(1)}%`,
          change: 5.2,
          trend: 'up',
          icon: Trophy,
          color: 'text-yellow-500',
          priority: 'high',
        },
        {
          title: 'Live Score',
          value: actualScore.toFixed(2),
          change: actualScore - projectedScore,
          trend: actualScore > projectedScore ? 'up' : 'down',
          icon: Activity,
          color: 'text-green-500',
          priority: 'high',
        },
        {
          title: 'Playoff Odds',
          value: `${playoffOdds}%`,
          change: 2.3,
          trend: 'up',
          icon: TrendingUp,
          color: 'text-blue-500',
          priority: 'medium',
        },
        {
          title: 'Championship Odds',
          value: `${championshipOdds}%`,
          change: 0.8,
          trend: 'up',
          icon: Target,
          color: 'text-purple-500',
          priority: 'medium',
        },
        {
          title: 'Team Power',
          value: calculateTeamPower(currentTeam),
          trend: 'neutral',
          icon: Zap,
          color: 'text-orange-500',
          priority: 'low',
        },
        {
          title: 'League Rank',
          value: `#${currentTeam.rank}`,
          change: currentTeam.rank > 1 ? -1 : 0,
          trend: currentTeam.rank > 1 ? 'down' : 'neutral',
          icon: BarChart3,
          color: 'text-indigo-500',
          priority: 'high',
        },
      ]);
    };

    calculateMetrics();
    const interval = setInterval(calculateMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [currentTeam]);

  // Generate AI insights
  useEffect(() => {
    if (!currentTeam) return;

    const generateInsights = async () => {
      const insights: AIInsight[] = [];

      // Check for lineup optimization opportunities
      if (currentTeam.players.some(p => p.status?.gameStatus === 'injured')) {
        insights.push({
          id: '1',
          type: 'lineup',
          title: 'Injured Player Alert',
          description: 'You have injured players in your starting lineup',
          action: 'Optimize Lineup',
          confidence: 95,
          impact: 'high',
          timestamp: new Date(),
        });
      }

      // Check for trade opportunities
      if (currentTeam.record && currentTeam.record.losses > currentTeam.record.wins) {
        insights.push({
          id: '2',
          type: 'trade',
          title: 'Trade Recommendation',
          description: 'Your team could benefit from a strategic trade',
          action: 'View Trade Targets',
          confidence: 78,
          impact: 'medium',
          timestamp: new Date(),
        });
      }

      // Waiver wire opportunities
      insights.push({
        id: '3',
        type: 'waiver',
        title: 'Hot Waiver Pickup',
        description: 'Rising star available on waivers with 85% breakout probability',
        action: 'Add Player',
        confidence: 85,
        impact: 'medium',
        timestamp: new Date(),
      });

      setAIInsights(insights);
    };

    generateInsights();
  }, [currentTeam]);

  // Track live events from WebSocket
  useEffect(() => {
    const recentUpdates = updates.slice(-10).reverse();
    setLiveEvents(recentUpdates);
  }, [updates]);

  const calculatePlayoffOdds = (team: any): number => {
    if (!team.record) return 50;
    const winPct = team.record.wins / (team.record.wins + team.record.losses);
    const remainingGames = 14 - (team.record.wins + team.record.losses);
    const projectedWins = team.record.wins + (remainingGames * winPct);
    return Math.min(95, Math.max(5, projectedWins / 14 * 100 + (team.rank <= 6 ? 20 : -10)));
  };

  const calculateChampionshipOdds = (team: any): number => {
    const playoffOdds = calculatePlayoffOdds(team);
    const powerRating = calculateTeamPower(team);
    return Math.min(40, Math.max(1, (playoffOdds / 100) * (powerRating / 1000) * 15));
  };

  const calculateTeamPower = (team: any): number => {
    let power = 500; // Base power
    if (team.record) {
      power += team.record.wins * 50;
      power -= team.record.losses * 30;
      power += (team.record.pointsFor / Math.max(1, team.record.wins + team.record.losses)) * 2;
    }
    return Math.round(power);
  };

  const handleVoiceCommand = () => {
    setVoiceEnabled(!voiceEnabled);
    // Voice command implementation would go here
  };

  const handleAutoOptimize = () => {
    setAutoOptimize(!autoOptimize);
    // Auto-optimization logic would go here
  };

  if (!currentTeam) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-400">No team selected. Import a team to get started.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 
                       bg-clip-text text-transparent">
              HalGrid Command Center
            </h1>
            <p className="text-gray-400 mt-1">
              {currentTeam.name} • {currentTeam.leagueName}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full 
                          ${connected ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} 
                            ${connected ? 'animate-pulse' : ''}`} />
              <span className={`text-sm ${connected ? 'text-green-500' : 'text-red-500'}`}>
                {connected ? 'Live' : 'Offline'}
              </span>
            </div>

            {/* Voice Control */}
            <button
              onClick={handleVoiceCommand}
              className={`p-2 rounded-lg transition-all ${
                voiceEnabled 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              title="Voice Commands"
            >
              {voiceEnabled ? <Volume2 size={20} /> : <Mic size={20} />}
            </button>

            {/* Auto-Optimize */}
            <button
              onClick={handleAutoOptimize}
              className={`p-2 rounded-lg transition-all ${
                autoOptimize 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              title="Auto-Optimize"
            >
              <Brain size={20} />
            </button>

            {/* Notifications */}
            <button className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:bg-gray-700 
                             transition-all relative">
              <Bell size={20} />
              {liveEvents.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full 
                               animate-pulse" />
              )}
            </button>

            {/* Settings */}
            <button className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:bg-gray-700 
                             transition-all">
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2">
          {['all-teams', 'overview', 'ai', 'live', 'analytics'].map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view as any)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                activeView === view
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {view === 'all-teams' ? 'All Teams' : view === 'ai' ? 'AI Insights' : view}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeView === 'all-teams' && (
          <motion.div
            key="all-teams"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <CommandCenterAllTeams />
          </motion.div>
        )}
        
        {activeView === 'overview' && currentTeam && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.map((metric, index) => (
                <motion.div
                  key={metric.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-6 
                           hover:border-gray-700 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-gray-800 ${metric.color}`}>
                      <metric.icon size={24} />
                    </div>
                    {metric.priority === 'high' && (
                      <span className="px-2 py-1 text-xs font-medium bg-red-500/20 
                                   text-red-400 rounded-full">
                        Priority
                      </span>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-gray-400 text-sm mb-1">{metric.title}</p>
                    <p className="text-3xl font-bold text-white mb-2">{metric.value}</p>
                    
                    {metric.change !== undefined && (
                      <div className="flex items-center gap-1">
                        {metric.trend === 'up' ? (
                          <ArrowUp size={16} className="text-green-500" />
                        ) : metric.trend === 'down' ? (
                          <ArrowDown size={16} className="text-red-500" />
                        ) : null}
                        <span className={`text-sm ${
                          metric.trend === 'up' ? 'text-green-500' : 
                          metric.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                        }`}>
                          {metric.trend !== 'neutral' && (
                            metric.change > 0 ? '+' : ''
                          )}
                          {metric.change.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 
                                 rounded-lg text-white font-medium hover:from-blue-600 
                                 hover:to-blue-700 transition-all">
                  Optimize Lineup
                </button>
                <button className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 
                                 rounded-lg text-white font-medium hover:from-purple-600 
                                 hover:to-purple-700 transition-all">
                  Analyze Trades
                </button>
                <button className="p-4 bg-gradient-to-r from-green-500 to-green-600 
                                 rounded-lg text-white font-medium hover:from-green-600 
                                 hover:to-green-700 transition-all">
                  Waiver Wire
                </button>
                <button className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 
                                 rounded-lg text-white font-medium hover:from-orange-600 
                                 hover:to-orange-700 transition-all">
                  Get AI Advice
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeView === 'ai' && (
          <motion.div
            key="ai"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">AI Insights</h3>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg 
                                 hover:bg-blue-600 transition-all">
                  Generate New Insights
                </button>
              </div>

              <div className="space-y-4">
                {aiInsights.map((insight, index) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 
                             transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            insight.impact === 'high' 
                              ? 'bg-red-500/20 text-red-400'
                              : insight.impact === 'medium'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-green-500/20 text-green-400'
                          }`}>
                            {insight.impact} impact
                          </span>
                          <span className="text-xs text-gray-500">
                            {insight.confidence}% confidence
                          </span>
                        </div>
                        
                        <h4 className="font-semibold text-white mb-1">
                          {insight.title}
                        </h4>
                        <p className="text-gray-400 text-sm mb-3">
                          {insight.description}
                        </p>
                        
                        {insight.action && (
                          <button className="flex items-center gap-2 px-3 py-1.5 
                                         bg-blue-500/20 text-blue-400 rounded-lg 
                                         hover:bg-blue-500/30 transition-all text-sm">
                            {insight.action}
                            <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500 ml-4">
                        <Clock size={14} className="inline mr-1" />
                        {new Date(insight.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeView === 'live' && (
          <motion.div
            key="live"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Live Events</h3>
              
              {liveEvents.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No live events at the moment. Events will appear here as they happen.
                </p>
              ) : (
                <div className="space-y-2">
                  {liveEvents.map((event, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 bg-gray-800 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${
                          event.priority === 'urgent' ? 'bg-red-500' :
                          event.priority === 'high' ? 'bg-yellow-500' :
                          event.priority === 'medium' ? 'bg-blue-500' :
                          'bg-green-500'
                        }`} />
                        <div>
                          <p className="text-white text-sm">
                            {event.data?.description || 'Live update'}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      {event.data?.points && (
                        <span className="text-green-400 font-semibold">
                          +{event.data.points}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeView === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Advanced Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-gray-400 text-sm mb-2">Win Probability Trend</h4>
                  <div className="h-48 bg-gray-800 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Chart visualization would go here</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-gray-400 text-sm mb-2">Points Distribution</h4>
                  <div className="h-48 bg-gray-800 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Chart visualization would go here</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}