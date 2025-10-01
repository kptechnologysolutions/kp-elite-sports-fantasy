import { SleeperPlayer, SleeperRoster, SleeperTransaction } from './sleeperService';
import { analyticsService, PlayerAnalytics } from './analyticsService';

export interface WaiverRecommendation {
  player: SleeperPlayer;
  analytics: PlayerAnalytics;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  dropCandidate?: SleeperPlayer;
  positionNeed: boolean;
  trending: 'rising' | 'falling' | 'steady';
  addPercentage: number;
  targetBid?: number;
}

class WaiverService {
  // Analyze recent transactions to identify trending players
  analyzeTrendingPlayers(
    transactions: SleeperTransaction[],
    players: Map<string, SleeperPlayer>
  ): Map<string, { adds: number; drops: number }> {
    const trends = new Map<string, { adds: number; drops: number }>();
    
    transactions.forEach(transaction => {
      // Count adds
      Object.keys(transaction.adds || {}).forEach(playerId => {
        const current = trends.get(playerId) || { adds: 0, drops: 0 };
        current.adds++;
        trends.set(playerId, current);
      });
      
      // Count drops
      Object.keys(transaction.drops || {}).forEach(playerId => {
        const current = trends.get(playerId) || { adds: 0, drops: 0 };
        current.drops++;
        trends.set(playerId, current);
      });
    });
    
    return trends;
  }
  
  // Get position needs based on roster composition
  getPositionNeeds(
    roster: SleeperRoster,
    players: Map<string, SleeperPlayer>,
    leagueSettings: { roster_positions: string[] }
  ): string[] {
    const positionCounts: { [key: string]: number } = {};
    const needs: string[] = [];
    
    // Count current positions
    roster.players.forEach(playerId => {
      const player = players.get(playerId);
      if (player) {
        positionCounts[player.position] = (positionCounts[player.position] || 0) + 1;
      }
    });
    
    // Recommended roster construction
    const recommended = {
      QB: 2,
      RB: 5,
      WR: 5,
      TE: 2,
      K: 1,
      DEF: 1
    };
    
    // Check for needs
    Object.entries(recommended).forEach(([pos, count]) => {
      if ((positionCounts[pos] || 0) < count) {
        needs.push(pos);
      }
    });
    
    return needs;
  }
  
  // Find the weakest players on roster (drop candidates)
  getDropCandidates(
    roster: SleeperRoster,
    players: Map<string, SleeperPlayer>,
    playerAnalytics: Map<string, PlayerAnalytics>,
    count = 3
  ): SleeperPlayer[] {
    const candidates: { player: SleeperPlayer; score: number }[] = [];
    
    roster.players.forEach(playerId => {
      const player = players.get(playerId);
      const analytics = playerAnalytics.get(playerId);
      
      if (player && analytics) {
        // Don't suggest dropping starters unless they're really bad
        const isStarter = roster.starters.includes(playerId);
        let score = analytics.performance.performanceRating;
        
        // Penalize starters less
        if (isStarter) {
          score += 30;
        }
        
        // Factor in injuries
        if (player.injury_status === 'IR' || player.injury_status === 'Out') {
          score -= 20;
        }
        
        // Factor in trend
        if (analytics.isCold) {
          score -= 10;
        }
        
        candidates.push({ player, score });
      }
    });
    
    // Sort by score (lower = worse) and return worst players
    return candidates
      .sort((a, b) => a.score - b.score)
      .slice(0, count)
      .map(c => c.player);
  }
  
  // Generate waiver wire recommendations
  getWaiverRecommendations(
    availablePlayers: SleeperPlayer[],
    myRoster: SleeperRoster,
    allPlayers: Map<string, SleeperPlayer>,
    transactions: SleeperTransaction[],
    leagueSettings: { roster_positions: string[]; waiver_type?: string }
  ): WaiverRecommendation[] {
    const recommendations: WaiverRecommendation[] = [];
    const positionNeeds = this.getPositionNeeds(myRoster, allPlayers, leagueSettings);
    const trendingPlayers = this.analyzeTrendingPlayers(transactions, allPlayers);
    
    // Mock analytics for available players (would be real data in production)
    const playerAnalyticsMap = new Map<string, PlayerAnalytics>();
    availablePlayers.forEach(player => {
      const mockScores = Array.from({ length: 10 }, () => Math.random() * 20 + 5);
      const analytics = analyticsService.getPlayerAnalytics(
        player,
        mockScores,
        mockScores[mockScores.length - 1]
      );
      playerAnalyticsMap.set(player.player_id, analytics);
    });
    
    const dropCandidates = this.getDropCandidates(
      myRoster,
      allPlayers,
      playerAnalyticsMap,
      5
    );
    
    // Analyze each available player
    availablePlayers.forEach(player => {
      const analytics = playerAnalyticsMap.get(player.player_id);
      if (!analytics) return;
      
      const trends = trendingPlayers.get(player.player_id) || { adds: 0, drops: 0 };
      const trending = trends.adds > trends.drops ? 'rising' : 
                      trends.drops > trends.adds ? 'falling' : 'steady';
      
      // Calculate add percentage (mock data)
      const addPercentage = Math.min(
        100,
        trends.adds * 5 + (analytics.isHot ? 20 : 0)
      );
      
      // Determine if this fills a position need
      const positionNeed = positionNeeds.includes(player.position);
      
      // Calculate priority based on multiple factors
      let priority: 'high' | 'medium' | 'low' = 'low';
      const reasons: string[] = [];
      
      if (analytics.isHot && positionNeed) {
        priority = 'high';
        reasons.push(`🔥 Hot player filling ${player.position} need`);
      } else if (analytics.isHot || (positionNeed && analytics.performance.performanceRating > 60)) {
        priority = 'medium';
        if (analytics.isHot) reasons.push('🔥 Player is hot');
        if (positionNeed) reasons.push(`📊 Fills ${player.position} need`);
      }
      
      if (trending === 'rising') {
        if (priority === 'low') priority = 'medium';
        reasons.push('📈 Trending up in adds');
      }
      
      if (analytics.shouldBuy) {
        reasons.push('💰 Buy low opportunity');
      }
      
      if (analytics.performance.seasonAverage > 10 && priority === 'low') {
        priority = 'medium';
        reasons.push(`⭐ Solid contributor (${analytics.performance.seasonAverage.toFixed(1)} ppg)`);
      }
      
      // Only recommend if there's a valid reason
      if (reasons.length > 0) {
        recommendations.push({
          player,
          analytics,
          reason: reasons.join(' | '),
          priority,
          dropCandidate: dropCandidates[Math.floor(Math.random() * dropCandidates.length)],
          positionNeed,
          trending: trending as 'rising' | 'falling' | 'steady',
          addPercentage,
          targetBid: leagueSettings.waiver_type === 'faab' ? 
            Math.floor(analytics.performance.seasonAverage * 2) : undefined
        });
      }
    });
    
    // Sort by priority and performance
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.analytics.performance.performanceRating - a.analytics.performance.performanceRating;
    });
  }
  
  // Get trade suggestions based on roster needs
  getTradeSuggestions(
    myRoster: SleeperRoster,
    otherRosters: SleeperRoster[],
    players: Map<string, SleeperPlayer>,
    playerAnalytics: Map<string, PlayerAnalytics>
  ): Array<{
    give: SleeperPlayer[];
    receive: SleeperPlayer[];
    targetRoster: SleeperRoster;
    reason: string;
    fairness: number; // 0-100, 50 is perfectly fair
  }> {
    const suggestions = [];
    const myNeeds = this.getPositionNeeds(myRoster, players, { roster_positions: [] });
    
    // Find players we can trade away (strong at position)
    const positionStrengths: { [key: string]: SleeperPlayer[] } = {};
    myRoster.players.forEach(playerId => {
      const player = players.get(playerId);
      if (player) {
        if (!positionStrengths[player.position]) {
          positionStrengths[player.position] = [];
        }
        positionStrengths[player.position].push(player);
      }
    });
    
    // Identify surplus positions (where we have more than needed)
    const surplusPositions = Object.entries(positionStrengths)
      .filter(([pos, players]) => {
        const recommended = { QB: 2, RB: 5, WR: 5, TE: 2 };
        return players.length > (recommended[pos as keyof typeof recommended] || 1);
      })
      .map(([pos]) => pos);
    
    // Mock trade suggestion (would be more sophisticated in production)
    if (surplusPositions.length > 0 && myNeeds.length > 0) {
      // This is simplified - real implementation would analyze all rosters
      // and find mutually beneficial trades
    }
    
    return suggestions;
  }
}

export const waiverService = new WaiverService();