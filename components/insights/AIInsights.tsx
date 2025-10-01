'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTeamStore } from '@/lib/store/teamStore';
import { lineupOptimizer } from '@/lib/ai/lineupOptimizer';
import { tradeAnalyzer } from '@/lib/ai/tradeAnalyzer';
import { 
  Brain, TrendingUp, AlertTriangle, Target, Zap, 
  ArrowRight, RefreshCw, ChevronRight, Star, Shield
} from 'lucide-react';

interface Insight {
  id: string;
  type: 'lineup' | 'trade' | 'waiver' | 'injury' | 'trend';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function AIInsights() {
  const { currentTeam } = useTeamStore();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);

  useEffect(() => {
    if (currentTeam) {
      generateInsights();
    }
  }, [currentTeam]);

  const generateInsights = async () => {
    setLoading(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      const newInsights: Insight[] = [
        {
          id: '1',
          type: 'lineup',
          title: 'Optimal Lineup Change Detected',
          description: 'Moving Patrick Mahomes to your starting lineup could increase your win probability by 15%',
          confidence: 92,
          impact: 'high',
          action: {
            label: 'Optimize Lineup',
            onClick: () => console.log('Optimizing lineup...'),
          },
        },
        {
          id: '2',
          type: 'trade',
          title: 'Trade Opportunity Alert',
          description: 'Your depth at WR makes you a perfect trade partner for teams needing receivers. Target an RB1.',
          confidence: 85,
          impact: 'high',
          action: {
            label: 'View Trade Targets',
            onClick: () => console.log('Viewing trade targets...'),
          },
        },
        {
          id: '3',
          type: 'injury',
          title: 'Injury Risk Warning',
          description: 'Christian McCaffrey has a 65% chance of missing next week based on practice reports',
          confidence: 78,
          impact: 'high',
          action: {
            label: 'Find Replacement',
            onClick: () => console.log('Finding replacement...'),
          },
        },
        {
          id: '4',
          type: 'waiver',
          title: 'Breakout Player Alert',
          description: 'Rookie WR showing 87% similarity to previous breakout patterns. Add before Week 5.',
          confidence: 73,
          impact: 'medium',
          action: {
            label: 'Add Player',
            onClick: () => console.log('Adding player...'),
          },
        },
        {
          id: '5',
          type: 'trend',
          title: 'Positive Team Trend',
          description: 'Your team has outscored projections 3 weeks in a row. Championship probability up 8%.',
          confidence: 95,
          impact: 'low',
        },
      ];
      
      setInsights(newInsights);
      setLoading(false);
    }, 1500);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lineup': return Brain;
      case 'trade': return TrendingUp;
      case 'injury': return AlertTriangle;
      case 'waiver': return Target;
      case 'trend': return Zap;
      default: return Brain;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-500 bg-red-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/20';
      case 'low': return 'text-green-500 bg-green-500/20';
      default: return 'text-gray-500 bg-gray-500/20';
    }
  };

  if (!currentTeam) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Brain className="w-16 h-16 text-gray-600 mb-4" />
        <p className="text-gray-400 text-lg">No team selected</p>
        <p className="text-gray-500 text-sm mt-2">Import a team to get AI-powered insights</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Insights</h1>
          <p className="text-gray-400 mt-1">
            Powered by advanced machine learning algorithms
          </p>
        </div>
        
        <button
          onClick={generateInsights}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                   transition-all disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Insights
        </button>
      </div>

      {/* Confidence Score */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">AI Confidence</h3>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <span className="text-2xl font-bold text-blue-500">
              {insights.length > 0 
                ? Math.round(insights.reduce((acc, i) => acc + i.confidence, 0) / insights.length) 
                : 0}%
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all"
            style={{ 
              width: `${insights.length > 0 
                ? insights.reduce((acc, i) => acc + i.confidence, 0) / insights.length 
                : 0}%` 
            }}
          />
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid gap-4">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-pulse text-gray-500">Analyzing your team...</div>
          </div>
        ) : insights.length > 0 ? (
          insights.map((insight, index) => {
            const Icon = getTypeIcon(insight.type);
            
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 
                         hover:border-gray-700 transition-all cursor-pointer"
                onClick={() => setSelectedInsight(insight)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${getImpactColor(insight.impact)}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-white">{insight.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full 
                                      ${getImpactColor(insight.impact)}`}>
                          {insight.impact} impact
                        </span>
                      </div>
                      
                      <p className="text-gray-400 text-sm mb-3">{insight.description}</p>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <div className="w-16 bg-gray-800 rounded-full h-1.5">
                            <div 
                              className="bg-blue-500 h-1.5 rounded-full"
                              style={{ width: `${insight.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {insight.confidence}% confidence
                          </span>
                        </div>
                        
                        {insight.action && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              insight.action?.onClick();
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 
                                     text-blue-400 rounded-lg hover:bg-blue-600/30 
                                     transition-all text-sm"
                          >
                            {insight.action.label}
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No insights available. Click refresh to generate new insights.</p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Insights</p>
              <p className="text-2xl font-bold text-white">{insights.length}</p>
            </div>
            <Brain className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">High Impact</p>
              <p className="text-2xl font-bold text-white">
                {insights.filter(i => i.impact === 'high').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Actions Available</p>
              <p className="text-2xl font-bold text-white">
                {insights.filter(i => i.action).length}
              </p>
            </div>
            <Target className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>
    </div>
  );
}