'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTeamStore } from '@/lib/store/teamStore';
import { realtimeSyncService } from '@/lib/services/realtimeSync';
import { 
  Brain, Mic, Zap, Trophy, TrendingUp, Users, Bell, 
  ChevronRight, Activity, Target, Shield, Sparkles,
  RefreshCw, ArrowUp, Command, BarChart3, Wifi
} from 'lucide-react';

export function EnhancedDashboard() {
  const router = useRouter();
  const { currentTeam, teams } = useTeamStore();
  const [aiInsight, setAiInsight] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    isRunning: boolean;
    lastSync: Date | null;
    isGameDay: boolean;
  }>({ isRunning: false, lastSync: null, isGameDay: false });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Subscribe to real-time sync updates
    const unsubscribe = realtimeSyncService.subscribe((data) => {
      console.log('Real-time sync update:', data);
      setSyncStatus({
        isRunning: true,
        lastSync: data.lastSync,
        isGameDay: data.isGameDay,
      });
      setIsSyncing(false);
    });

    // Get initial sync status
    const status = realtimeSyncService.getSyncStatus();
    setSyncStatus({
      isRunning: status.isRunning,
      lastSync: status.lastSync,
      isGameDay: status.isGameDay,
    });

    // Start syncing if not already running
    if (!status.isRunning && teams.length > 0) {
      realtimeSyncService.startSync({
        intervalMs: status.isGameDay ? 30000 : 300000,
        enableNotifications: true,
        syncPlayers: true,
        syncScores: true,
        syncInjuries: true
      });
    }

    return () => {
      unsubscribe();
    };
  }, [teams]);

  useEffect(() => {
    // Generate a random AI insight every 10 seconds
    const insights = [
      "Patrick Mahomes has a 92% chance of exceeding projections this week",
      "Your RB2 position is underperforming - consider a trade",
      "Weather conditions favor running games in 3 of your matchups",
      "Injury alert: Monitor Christian McCaffrey's practice status",
      "Your team's playoff probability increased 8% this week",
    ];
    
    const interval = setInterval(() => {
      setAiInsight(insights[Math.floor(Math.random() * insights.length)]);
    }, 10000);
    
    setAiInsight(insights[0]);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await realtimeSyncService.forceSync();
    setTimeout(() => setIsSyncing(false), 1000);
  };

  const features = [
    {
      title: 'Command Center',
      description: 'AI-powered control hub with real-time insights',
      icon: Command,
      color: 'from-purple-500 to-pink-600',
      action: () => router.push('/command-center'),
      badge: 'NEW',
    },
    {
      title: 'AI Lineup Optimizer',
      description: 'GPT-4 powered lineup recommendations',
      icon: Brain,
      color: 'from-blue-500 to-cyan-600',
      action: () => router.push('/insights'),
      badge: 'AI',
    },
    {
      title: 'Voice Commands',
      description: 'Control everything with natural language',
      icon: Mic,
      color: 'from-green-500 to-emerald-600',
      action: () => setIsListening(!isListening),
      badge: 'BETA',
    },
    {
      title: 'Trade Analyzer',
      description: 'ML-based trade fairness & impact prediction',
      icon: TrendingUp,
      color: 'from-orange-500 to-red-600',
      action: () => router.push('/teams'),
      badge: 'HOT',
    },
    {
      title: 'Live Updates',
      description: 'Real-time scores and notifications',
      icon: Activity,
      color: 'from-yellow-500 to-orange-600',
      action: () => router.push('/game-center'),
    },
    {
      title: 'Analytics Hub',
      description: 'Advanced performance metrics',
      icon: BarChart3,
      color: 'from-indigo-500 to-purple-600',
      action: () => router.push('/analytics'),
    },
  ];

  const quickStats = [
    { label: 'Win Rate', value: '67%', trend: '+5%', positive: true },
    { label: 'League Rank', value: '#3', trend: '↑2', positive: true },
    { label: 'Playoff Odds', value: '78%', trend: '+12%', positive: true },
    { label: 'AI Confidence', value: '94%', trend: 'High', positive: true },
  ];

  if (!currentTeam && teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-5xl">H</span>
          </div>
          <h2 className="text-3xl font-bold text-white">Welcome to HalGrid</h2>
          <p className="text-gray-400 max-w-md">
            Hal's personal fantasy command center. Import your teams to dominate every league.
          </p>
          <button
            onClick={() => router.push('/teams')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white 
                     rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 
                     transition-all transform hover:scale-105"
          >
            Import Your Teams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Real-time Sync Status Bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg ${syncStatus.isRunning ? 'bg-green-900/30' : 'bg-gray-800'}`}>
            <Wifi className={`w-5 h-5 ${syncStatus.isRunning ? 'text-green-500' : 'text-gray-500'} ${isSyncing ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <p className="text-sm text-gray-400">
              {syncStatus.isGameDay ? '🏈 Game Day Mode' : 'Standard Mode'} • 
              {syncStatus.isRunning ? ' Live Sync Active' : ' Sync Paused'}
            </p>
            <p className="text-xs text-gray-500">
              {syncStatus.lastSync 
                ? `Last updated: ${new Date(syncStatus.lastSync).toLocaleTimeString()}`
                : 'No sync data yet'}
            </p>
          </div>
        </div>
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                   transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {/* AI Insight Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-900/50 via-purple-900/50 to-pink-900/50 
                   rounded-xl p-6 border border-purple-500/30"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <Brain className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">AI Insight</p>
              <p className="text-lg text-white font-medium">{aiInsight}</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg 
                           hover:bg-purple-700 transition-all flex items-center gap-2">
            View Details
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4"
          >
            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <span className={`text-sm ${
                stat.positive ? 'text-green-500' : 'text-red-500'
              }`}>
                {stat.trend}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            onClick={feature.action}
            className="relative cursor-pointer"
          >
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 
                         hover:border-gray-700 transition-all group">
              {feature.badge && (
                <span className="absolute -top-2 -right-2 px-2 py-1 bg-gradient-to-r 
                               from-blue-500 to-purple-600 text-white text-xs 
                               font-bold rounded-full">
                  {feature.badge}
                </span>
              )}
              
              <div className={`w-14 h-14 rounded-lg bg-gradient-to-r ${feature.color} 
                            p-3 mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-full h-full text-white" />
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                {feature.description}
              </p>
              
              <div className="flex items-center text-blue-400 group-hover:text-blue-300">
                <span className="text-sm font-medium">Get Started</span>
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 
                                      transition-transform" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Voice Command Indicator */}
      {isListening && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-green-500 to-emerald-600 
                     text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3"
        >
          <div className="animate-pulse">
            <Mic className="w-5 h-5" />
          </div>
          <span className="font-medium">Listening...</span>
        </motion.div>
      )}

      {/* Team Performance Card */}
      {currentTeam && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">{currentTeam.name}</h3>
              <p className="text-gray-400">{currentTeam.leagueName}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  Live Score
                  {syncStatus.isRunning && syncStatus.isGameDay && (
                    <span className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  )}
                </p>
                <p className="text-2xl font-bold text-white">
                  {currentTeam.liveScore?.teamScore.toFixed(1) || '0.0'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Opponent</p>
                <p className="text-2xl font-bold text-gray-400">
                  {currentTeam.liveScore?.opponentScore.toFixed(1) || '0.0'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <span className="text-gray-400">AI Protection Active</span>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg 
                             hover:bg-blue-700 transition-all">
              View Full Team
            </button>
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="text-center py-8">
        <p className="text-gray-400 mb-4">
          Experience the future of fantasy football with AI-powered insights
        </p>
        <button
          onClick={() => router.push('/command-center')}
          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white 
                   rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 
                   transition-all transform hover:scale-105 shadow-xl"
        >
          <Sparkles className="inline w-5 h-5 mr-2" />
          Launch Command Center
        </button>
      </div>
    </div>
  );
}