import { SleeperPlayer, SleeperMatchup } from './sleeperService';

export interface PlayerPerformance {
  playerId: string;
  weeklyScores: number[];
  seasonAverage: number;
  last3WeeksAverage: number;
  trend: 'hot' | 'cold' | 'steady';
  projectedPoints?: number;
  actualPoints: number;
  performanceRating: number; // 0-100
  recommendations: string[];
}

export interface PlayerAnalytics {
  player: SleeperPlayer;
  performance: PlayerPerformance;
  isHot: boolean;
  isCold: boolean;
  isBoomBust: boolean;
  shouldStart: boolean;
  shouldSell: boolean;
  shouldBuy: boolean;
}

class AnalyticsService {
  // Calculate performance trend based on recent games
  calculateTrend(weeklyScores: number[]): 'hot' | 'cold' | 'steady' {
    if (weeklyScores.length < 3) return 'steady';
    
    const recent = weeklyScores.slice(-3);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const seasonAvg = weeklyScores.reduce((a, b) => a + b, 0) / weeklyScores.length;
    
    const percentDiff = ((recentAvg - seasonAvg) / seasonAvg) * 100;
    
    if (percentDiff > 20) return 'hot';
    if (percentDiff < -20) return 'cold';
    return 'steady';
  }
  
  // Calculate performance rating (0-100)
  calculatePerformanceRating(
    actualPoints: number,
    projectedPoints: number,
    positionRank: number,
    consistency: number
  ): number {
    let rating = 50;
    
    // Points vs projection (30% weight)
    if (projectedPoints > 0) {
      const projectionScore = (actualPoints / projectedPoints) * 30;
      rating += Math.min(projectionScore - 30, 15); // Cap at +15
    }
    
    // Position rank (30% weight)
    const rankScore = Math.max(0, 30 - positionRank);
    rating += rankScore;
    
    // Consistency (20% weight)
    rating += consistency * 20;
    
    return Math.min(100, Math.max(0, rating));
  }
  
  // Get player recommendations
  getRecommendations(analytics: PlayerAnalytics): string[] {
    const recs: string[] = [];
    
    if (analytics.isHot) {
      recs.push('🔥 Hot streak - Start with confidence');
    }
    
    if (analytics.isCold) {
      recs.push('❄️ Cold streak - Consider benching');
    }
    
    if (analytics.isBoomBust) {
      recs.push('💥 Boom/bust player - High risk, high reward');
    }
    
    if (analytics.shouldSell) {
      recs.push('📈 Sell high candidate');
    }
    
    if (analytics.shouldBuy) {
      recs.push('📉 Buy low opportunity');
    }
    
    if (analytics.player.injury_status) {
      recs.push(`⚠️ Injury concern: ${analytics.player.injury_status}`);
    }
    
    return recs;
  }
  
  // Analyze matchup history for all players
  analyzeMatchupHistory(
    matchups: SleeperMatchup[],
    rosterId: number
  ): Map<string, number[]> {
    const playerScores = new Map<string, number[]>();
    
    matchups
      .filter(m => m.roster_id === rosterId)
      .forEach(matchup => {
        Object.entries(matchup.players_points || {}).forEach(([playerId, points]) => {
          if (!playerScores.has(playerId)) {
            playerScores.set(playerId, []);
          }
          playerScores.get(playerId)!.push(points);
        });
      });
    
    return playerScores;
  }
  
  // Get comprehensive player analytics
  getPlayerAnalytics(
    player: SleeperPlayer,
    weeklyScores: number[],
    currentWeekPoints: number,
    projectedPoints?: number
  ): PlayerAnalytics {
    const seasonAverage = weeklyScores.length > 0
      ? weeklyScores.reduce((a, b) => a + b, 0) / weeklyScores.length
      : 0;
    
    const last3Weeks = weeklyScores.slice(-3);
    const last3WeeksAverage = last3Weeks.length > 0
      ? last3Weeks.reduce((a, b) => a + b, 0) / last3Weeks.length
      : 0;
    
    const trend = this.calculateTrend(weeklyScores);
    
    // Calculate consistency (standard deviation)
    const variance = weeklyScores.reduce((acc, score) => {
      return acc + Math.pow(score - seasonAverage, 2);
    }, 0) / weeklyScores.length;
    const stdDev = Math.sqrt(variance);
    const consistency = seasonAverage > 0 ? 1 - (stdDev / seasonAverage) : 0;
    
    const performanceRating = this.calculatePerformanceRating(
      currentWeekPoints,
      projectedPoints || 0,
      0, // Position rank would come from API
      consistency
    );
    
    const performance: PlayerPerformance = {
      playerId: player.player_id,
      weeklyScores,
      seasonAverage,
      last3WeeksAverage,
      trend,
      projectedPoints,
      actualPoints: currentWeekPoints,
      performanceRating,
      recommendations: []
    };
    
    const analytics: PlayerAnalytics = {
      player,
      performance,
      isHot: trend === 'hot',
      isCold: trend === 'cold',
      isBoomBust: stdDev > seasonAverage * 0.5,
      shouldStart: performanceRating > 60 && !player.injury_status,
      shouldSell: trend === 'hot' && performanceRating > 80,
      shouldBuy: trend === 'cold' && seasonAverage > 10
    };
    
    analytics.performance.recommendations = this.getRecommendations(analytics);
    
    return analytics;
  }
  
  // Get lineup recommendations
  getLineupRecommendations(
    starters: PlayerAnalytics[],
    bench: PlayerAnalytics[]
  ): { swaps: Array<{ bench: string; starter: string; reason: string }> } {
    const swaps: Array<{ bench: string; starter: string; reason: string }> = [];
    
    // Find underperforming starters
    const coldStarters = starters.filter(s => s.isCold && s.performance.performanceRating < 50);
    
    // Find hot bench players
    const hotBench = bench.filter(b => b.isHot && b.performance.performanceRating > 60);
    
    coldStarters.forEach(starter => {
      const replacement = hotBench.find(b => 
        b.player.position === starter.player.position ||
        (starter.player.position === 'FLEX' && ['RB', 'WR', 'TE'].includes(b.player.position))
      );
      
      if (replacement) {
        swaps.push({
          bench: replacement.player.player_id,
          starter: starter.player.player_id,
          reason: `${replacement.player.first_name} ${replacement.player.last_name} is hot (${replacement.performance.last3WeeksAverage.toFixed(1)} ppg) while ${starter.player.first_name} ${starter.player.last_name} is cold (${starter.performance.last3WeeksAverage.toFixed(1)} ppg)`
        });
      }
    });
    
    return { swaps };
  }
  
  // Calculate position scarcity value
  getPositionScarcity(position: string, availablePlayers: SleeperPlayer[]): number {
    const positionCounts = {
      QB: 32,
      RB: 60,
      WR: 90,
      TE: 32,
      K: 32,
      DEF: 32
    };
    
    const startable = positionCounts[position as keyof typeof positionCounts] || 30;
    const available = availablePlayers.filter(p => p.position === position).length;
    
    return Math.max(0, 1 - (available / startable));
  }
}

export const analyticsService = new AnalyticsService();