'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTeamStore } from '@/lib/store/teamStore';
import { 
  BarChart3, TrendingUp, TrendingDown, Target, Trophy,
  Users, Activity, PieChart, ArrowUp, ArrowDown, Zap
} from 'lucide-react';

interface Stat {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
}

export function AnalyticsDashboard() {
  const { currentTeam } = useTeamStore();
  const [timeframe, setTimeframe] = useState<'week' | 'season'>('week');
  const [stats, setStats] = useState<Stat[]>([]);

  useEffect(() => {
    if (currentTeam) {
      generateStats();
    }
  }, [currentTeam, timeframe]);

  const generateStats = () => {
    const newStats: Stat[] = [
      {
        label: 'Points Per Game',
        value: '112.5',
        change: 5.2,
        trend: 'up',
      },
      {
        label: 'Win Rate',
        value: '66.7%',
        change: 8.3,
        trend: 'up',
      },
      {
        label: 'League Rank',
        value: '#3',
        change: -2,
        trend: 'up',
      },
      {
        label: 'Playoff Probability',
        value: '78%',
        change: 12,
        trend: 'up',
      },
      {
        label: 'Optimal Lineup %',
        value: '82%',
        change: -3,
        trend: 'down',
      },
      {
        label: 'Trade Success Rate',
        value: '75%',
        change: 0,
        trend: 'neutral',
      },
    ];
    
    setStats(newStats);
  };

  if (!currentTeam) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <BarChart3 className="w-16 h-16 text-gray-600 mb-4" />
        <p className="text-gray-400 text-lg">No team selected</p>
        <p className="text-gray-500 text-sm mt-2">Import a team to view analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Deep insights into your team performance
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setTimeframe('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              timeframe === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeframe('season')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              timeframe === 'season'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
            }`}
          >
            Season
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6"
          >
            <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              {stat.change !== undefined && (
                <div className={`flex items-center gap-1 text-sm ${
                  stat.trend === 'up' ? 'text-green-500' : 
                  stat.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {stat.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : 
                   stat.trend === 'down' ? <ArrowDown className="w-4 h-4" /> : null}
                  {stat.change > 0 ? '+' : ''}{stat.change}%
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Performance Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Performance Trend</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <p>Chart visualization would go here</p>
        </div>
      </div>

      {/* Position Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Position Performance</h3>
          <div className="space-y-3">
            {['QB', 'RB', 'WR', 'TE'].map(position => (
              <div key={position} className="flex items-center justify-between">
                <span className="text-gray-400">{position}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-800 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${60 + Math.random() * 40}%` }}
                    />
                  </div>
                  <span className="text-white text-sm font-medium">
                    {(80 + Math.random() * 20).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Matchup Difficulty</h3>
          <div className="space-y-3">
            {['Week 5', 'Week 6', 'Week 7', 'Week 8'].map((week, index) => (
              <div key={week} className="flex items-center justify-between">
                <span className="text-gray-400">{week}</span>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  index === 0 ? 'bg-green-500/20 text-green-400' :
                  index === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                  index === 2 ? 'bg-red-500/20 text-red-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {index === 0 ? 'Easy' : 
                   index === 1 ? 'Medium' : 
                   index === 2 ? 'Hard' : 'Easy'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Championship Trajectory</h3>
          <Trophy className="w-8 h-8 text-yellow-500" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-gray-400 text-sm">Current Path</p>
            <p className="text-2xl font-bold text-green-400">Optimal</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Power Ranking</p>
            <p className="text-2xl font-bold text-white">#2</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Championship Odds</p>
            <p className="text-2xl font-bold text-yellow-400">23%</p>
          </div>
        </div>
      </div>
    </div>
  );
}