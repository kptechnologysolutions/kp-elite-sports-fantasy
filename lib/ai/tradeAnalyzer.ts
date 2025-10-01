// Trade Analyzer with ML Predictions
// Analyzes trades using multiple factors and predicts impact on team performance

import { Player, Team } from '@/lib/types';

export interface TradeProposal {
  sendingPlayers: Player[];
  receivingPlayers: Player[];
  partnerTeam?: Team;
  notes?: string;
}

export interface TradeAnalysis {
  recommendation: 'ACCEPT' | 'REJECT' | 'COUNTER' | 'CONSIDER';
  fairnessScore: number; // -100 to 100 (negative = bad for you, positive = good for you)
  confidence: number; // 0 to 1
  immediateImpact: {
    pointsDifferential: number; // Expected weekly points change
    positionStrength: Record<string, number>; // Position strength changes
    depthImpact: string; // How it affects roster depth
  };
  seasonImpact: {
    playoffProbability: number; // Change in playoff probability
    championshipProbability: number; // Change in championship probability
    scheduleStrength: number; // Change based on ROS schedule
  };
  reasoning: {
    pros: string[];
    cons: string[];
    keyFactors: string[];
  };
  counterProposal?: TradeProposal;
  similarTrades?: HistoricalTrade[];
}

export interface HistoricalTrade {
  date: Date;
  players: string[];
  outcome: 'WIN' | 'LOSS' | 'NEUTRAL';
  similarity: number; // 0 to 1
}

export interface TradeTarget {
  player: Player;
  targetability: number; // 0 to 1 (how likely owner is to trade)
  fairOffer: Player[]; // What would be fair to offer
  reasoning: string;
}

export interface ValueChart {
  player: Player;
  currentValue: number;
  futureValue: number; // ROS projection
  peakValue: number; // Best possible outcome
  floorValue: number; // Worst case scenario
  trend: 'RISING' | 'FALLING' | 'STABLE';
}

class TradeAnalyzer {
  private playerValues: Map<string, number> = new Map();
  private scheduleStrength: Map<string, number> = new Map();
  private historicalTrades: HistoricalTrade[] = [];

  // Main trade analysis function
  async analyzeTrade(
    proposal: TradeProposal,
    myTeam: Team,
    settings: {
      leagueSize: number;
      scoringType: 'PPR' | 'STANDARD' | 'HALF_PPR';
      tradeDeadline: Date;
      currentWeek: number;
      playoffWeeks: number[];
    }
  ): Promise<TradeAnalysis> {
    // Calculate player values
    const sendingValue = await this.calculateTotalValue(proposal.sendingPlayers, settings);
    const receivingValue = await this.calculateTotalValue(proposal.receivingPlayers, settings);

    // Analyze position impacts
    const positionImpact = this.analyzePositionImpact(
      myTeam,
      proposal.sendingPlayers,
      proposal.receivingPlayers
    );

    // Calculate schedule adjustments
    const scheduleImpact = await this.analyzeScheduleImpact(
      proposal.sendingPlayers,
      proposal.receivingPlayers,
      settings.currentWeek,
      settings.playoffWeeks
    );

    // Predict team performance changes
    const performanceImpact = this.predictPerformanceImpact(
      myTeam,
      proposal,
      positionImpact,
      scheduleImpact
    );

    // Find similar historical trades
    const similarTrades = this.findSimilarTrades(proposal);

    // Generate reasoning
    const reasoning = this.generateReasoning(
      sendingValue,
      receivingValue,
      positionImpact,
      scheduleImpact,
      performanceImpact
    );

    // Calculate fairness score
    const fairnessScore = this.calculateFairnessScore(
      sendingValue,
      receivingValue,
      positionImpact,
      scheduleImpact
    );

    // Determine recommendation
    const recommendation = this.determineRecommendation(
      fairnessScore,
      positionImpact,
      performanceImpact
    );

    // Generate counter proposal if needed
    const counterProposal = recommendation === 'COUNTER' ? 
      await this.generateCounterProposal(proposal, myTeam, fairnessScore) : 
      undefined;

    return {
      recommendation,
      fairnessScore,
      confidence: this.calculateConfidence(similarTrades, reasoning),
      immediateImpact: {
        pointsDifferential: performanceImpact.weeklyPointsChange,
        positionStrength: positionImpact,
        depthImpact: this.assessDepthImpact(myTeam, proposal),
      },
      seasonImpact: {
        playoffProbability: performanceImpact.playoffProbChange,
        championshipProbability: performanceImpact.championshipProbChange,
        scheduleStrength: scheduleImpact.strengthChange,
      },
      reasoning,
      counterProposal,
      similarTrades,
    };
  }

  // Calculate total value of players
  private async calculateTotalValue(
    players: Player[],
    settings: any
  ): Promise<number> {
    let totalValue = 0;

    for (const player of players) {
      const baseValue = await this.getPlayerValue(player, settings);
      const trendAdjustment = this.getTrendAdjustment(player);
      const ageAdjustment = this.getAgeAdjustment(player);
      
      totalValue += baseValue * trendAdjustment * ageAdjustment;
    }

    return totalValue;
  }

  // Get player value from rankings/projections
  private async getPlayerValue(player: Player, settings: any): Promise<number> {
    // Check cache first
    const cached = this.playerValues.get(player.id);
    if (cached) return cached;

    // Calculate value based on position scarcity and production
    const positionMultiplier = this.getPositionMultiplier(player.position);
    const productionValue = player.stats?.fantasyPoints || 0;
    const projectedValue = player.stats?.projectedPoints || 0;
    
    // Weight current production and projections
    const value = (productionValue * 0.4 + projectedValue * 0.6) * positionMultiplier;
    
    // Adjust for scoring type
    const scoringAdjustment = this.getScoringAdjustment(player, settings.scoringType);
    const finalValue = value * scoringAdjustment;

    this.playerValues.set(player.id, finalValue);
    return finalValue;
  }

  // Get position scarcity multiplier
  private getPositionMultiplier(position: string): number {
    const multipliers = {
      'QB': 0.8, // Less valuable in 1QB leagues
      'RB': 1.2, // Most valuable due to scarcity
      'WR': 1.0, // Baseline
      'TE': 1.1, // Valuable due to top-tier scarcity
      'K': 0.3,  // Low value
      'DEF': 0.4, // Low value
    };
    return multipliers[position] || 1.0;
  }

  // Get scoring type adjustment
  private getScoringAdjustment(player: Player, scoringType: string): number {
    if (scoringType === 'PPR') {
      // Boost pass-catchers in PPR
      if (['WR', 'TE'].includes(player.position)) return 1.15;
      if (player.position === 'RB') {
        // Check if pass-catching back (would need reception data)
        return 1.05;
      }
    } else if (scoringType === 'STANDARD') {
      // Boost touchdown-dependent players
      if (player.position === 'RB') return 1.1;
    }
    return 1.0;
  }

  // Get trend adjustment based on recent performance
  private getTrendAdjustment(player: Player): number {
    // In production, analyze last 3-4 games trend
    // For demo, return slight random adjustment
    return 0.9 + Math.random() * 0.2;
  }

  // Get age adjustment for dynasty/keeper leagues
  private getAgeAdjustment(player: Player): number {
    // Younger players more valuable in dynasty
    // For redraft, minimal impact
    return 1.0; // No adjustment for redraft
  }

  // Analyze position impact of trade
  private analyzePositionImpact(
    team: Team,
    sending: Player[],
    receiving: Player[]
  ): Record<string, number> {
    const impact: Record<string, number> = {};
    const positions = ['QB', 'RB', 'WR', 'TE'];

    for (const pos of positions) {
      const currentPlayers = team.players.filter(p => p.position === pos);
      const sendingPlayers = sending.filter(p => p.position === pos);
      const receivingPlayers = receiving.filter(p => p.position === pos);
      
      const before = currentPlayers.length;
      const after = before - sendingPlayers.length + receivingPlayers.length;
      
      // Calculate strength change (simplified)
      const strengthBefore = currentPlayers.reduce((sum, p) => 
        sum + (p.stats?.fantasyPoints || 0), 0
      );
      const strengthChange = 
        receivingPlayers.reduce((sum, p) => sum + (p.stats?.fantasyPoints || 0), 0) -
        sendingPlayers.reduce((sum, p) => sum + (p.stats?.fantasyPoints || 0), 0);
      
      impact[pos] = strengthChange / Math.max(strengthBefore, 1);
    }

    return impact;
  }

  // Analyze schedule impact
  private async analyzeScheduleImpact(
    sending: Player[],
    receiving: Player[],
    currentWeek: number,
    playoffWeeks: number[]
  ): Promise<any> {
    // Calculate remaining season schedule strength
    const sendingSchedule = await this.getScheduleStrength(sending, currentWeek, 17);
    const receivingSchedule = await this.getScheduleStrength(receiving, currentWeek, 17);
    
    // Calculate playoff schedule strength
    const sendingPlayoff = await this.getScheduleStrength(sending, playoffWeeks[0], playoffWeeks[playoffWeeks.length - 1]);
    const receivingPlayoff = await this.getScheduleStrength(receiving, playoffWeeks[0], playoffWeeks[playoffWeeks.length - 1]);

    return {
      strengthChange: receivingSchedule - sendingSchedule,
      playoffStrengthChange: receivingPlayoff - sendingPlayoff,
      weeklyBreakdown: this.getWeeklyScheduleBreakdown(sending, receiving, currentWeek),
    };
  }

  // Get schedule strength for players
  private async getScheduleStrength(
    players: Player[],
    startWeek: number,
    endWeek: number
  ): Promise<number> {
    // In production, would fetch actual defensive matchups
    // For demo, return calculated value
    let totalStrength = 0;
    
    for (const player of players) {
      const teamStrength = this.scheduleStrength.get(player.team) || Math.random();
      totalStrength += teamStrength;
    }
    
    return totalStrength / Math.max(players.length, 1);
  }

  // Get weekly schedule breakdown
  private getWeeklyScheduleBreakdown(
    sending: Player[],
    receiving: Player[],
    startWeek: number
  ): Record<number, number> {
    const breakdown: Record<number, number> = {};
    
    for (let week = startWeek; week <= 17; week++) {
      // Simplified - in production would check actual matchups
      breakdown[week] = Math.random() * 10 - 5; // -5 to +5 points differential
    }
    
    return breakdown;
  }

  // Predict performance impact
  private predictPerformanceImpact(
    team: Team,
    proposal: TradeProposal,
    positionImpact: Record<string, number>,
    scheduleImpact: any
  ): any {
    // Calculate weekly points change
    const weeklyPointsChange = 
      proposal.receivingPlayers.reduce((sum, p) => sum + (p.stats?.projectedPoints || 0), 0) -
      proposal.sendingPlayers.reduce((sum, p) => sum + (p.stats?.projectedPoints || 0), 0);

    // Estimate playoff probability change
    const currentRecord = team.record;
    const projectedWins = this.projectRemainingWins(team, weeklyPointsChange);
    const playoffProbChange = this.calculatePlayoffProbabilityChange(
      currentRecord,
      projectedWins,
      team.leagueSize
    );

    // Estimate championship probability
    const championshipProbChange = playoffProbChange * 0.3 + // Making playoffs
      scheduleImpact.playoffStrengthChange * 0.2 + // Playoff schedule
      Object.values(positionImpact).reduce((sum, val) => sum + val, 0) * 0.1; // Roster strength

    return {
      weeklyPointsChange,
      playoffProbChange,
      championshipProbChange,
      winProjection: projectedWins,
    };
  }

  // Project remaining wins
  private projectRemainingWins(team: Team, pointsChange: number): number {
    const currentWinRate = team.record ? 
      team.record.wins / (team.record.wins + team.record.losses) : 0.5;
    
    // Adjust win rate based on points change
    const adjustedWinRate = currentWinRate + (pointsChange / 100); // Simplified
    const remainingGames = 14 - (team.record?.wins || 0) - (team.record?.losses || 0);
    
    return Math.round(adjustedWinRate * remainingGames);
  }

  // Calculate playoff probability change
  private calculatePlayoffProbabilityChange(
    record: any,
    projectedWins: number,
    leagueSize: number
  ): number {
    const currentWins = record?.wins || 0;
    const totalProjectedWins = currentWins + projectedWins;
    
    // Simplified calculation - typically need 7-8 wins for playoffs
    const playoffThreshold = 7;
    const currentProb = Math.min(1, Math.max(0, currentWins / playoffThreshold));
    const newProb = Math.min(1, Math.max(0, totalProjectedWins / playoffThreshold));
    
    return (newProb - currentProb) * 100;
  }

  // Assess depth impact
  private assessDepthImpact(team: Team, proposal: TradeProposal): string {
    const positionCounts: Record<string, number> = {};
    
    // Count current positions
    team.players.forEach(p => {
      positionCounts[p.position] = (positionCounts[p.position] || 0) + 1;
    });
    
    // Adjust for trade
    proposal.sendingPlayers.forEach(p => {
      positionCounts[p.position]--;
    });
    proposal.receivingPlayers.forEach(p => {
      positionCounts[p.position] = (positionCounts[p.position] || 0) + 1;
    });
    
    // Assess impact
    const thinPositions = Object.entries(positionCounts)
      .filter(([pos, count]) => count < 2 && !['QB', 'K', 'DEF'].includes(pos))
      .map(([pos]) => pos);
    
    if (thinPositions.length > 0) {
      return `Dangerously thin at ${thinPositions.join(', ')}`;
    }
    
    const strongPositions = Object.entries(positionCounts)
      .filter(([pos, count]) => count > 4)
      .map(([pos]) => pos);
    
    if (strongPositions.length > 0) {
      return `Strong depth at ${strongPositions.join(', ')}`;
    }
    
    return 'Maintains reasonable depth';
  }

  // Generate reasoning
  private generateReasoning(
    sendingValue: number,
    receivingValue: number,
    positionImpact: Record<string, number>,
    scheduleImpact: any,
    performanceImpact: any
  ): any {
    const pros: string[] = [];
    const cons: string[] = [];
    const keyFactors: string[] = [];

    // Value analysis
    if (receivingValue > sendingValue * 1.1) {
      pros.push(`Getting ${Math.round((receivingValue/sendingValue - 1) * 100)}% more value`);
    } else if (sendingValue > receivingValue * 1.1) {
      cons.push(`Giving up ${Math.round((sendingValue/receivingValue - 1) * 100)}% more value`);
    } else {
      keyFactors.push('Trade value is relatively fair');
    }

    // Position impact
    const improvements = Object.entries(positionImpact)
      .filter(([_, impact]) => impact > 0.1)
      .map(([pos]) => pos);
    if (improvements.length > 0) {
      pros.push(`Improves ${improvements.join(', ')} position(s)`);
    }

    const weaknesses = Object.entries(positionImpact)
      .filter(([_, impact]) => impact < -0.1)
      .map(([pos]) => pos);
    if (weaknesses.length > 0) {
      cons.push(`Weakens ${weaknesses.join(', ')} position(s)`);
    }

    // Schedule impact
    if (scheduleImpact.playoffStrengthChange > 0.1) {
      pros.push('Better playoff schedule');
    } else if (scheduleImpact.playoffStrengthChange < -0.1) {
      cons.push('Worse playoff schedule');
    }

    // Performance impact
    if (performanceImpact.weeklyPointsChange > 3) {
      pros.push(`+${performanceImpact.weeklyPointsChange.toFixed(1)} projected points per week`);
    } else if (performanceImpact.weeklyPointsChange < -3) {
      cons.push(`${performanceImpact.weeklyPointsChange.toFixed(1)} projected points per week`);
    }

    if (performanceImpact.playoffProbChange > 5) {
      pros.push(`+${performanceImpact.playoffProbChange.toFixed(0)}% playoff probability`);
    } else if (performanceImpact.playoffProbChange < -5) {
      cons.push(`${performanceImpact.playoffProbChange.toFixed(0)}% playoff probability`);
    }

    // Key factors
    if (Math.abs(sendingValue - receivingValue) < sendingValue * 0.1) {
      keyFactors.push('Trade is relatively even in value');
    }
    keyFactors.push(`Impact on depth: ${this.assessDepthImpact}`);

    return { pros, cons, keyFactors };
  }

  // Calculate fairness score
  private calculateFairnessScore(
    sendingValue: number,
    receivingValue: number,
    positionImpact: Record<string, number>,
    scheduleImpact: any
  ): number {
    // Base score from value differential
    const valueDiff = receivingValue - sendingValue;
    const valueScore = (valueDiff / Math.max(sendingValue, receivingValue)) * 50;
    
    // Position impact score
    const positionScore = Object.values(positionImpact)
      .reduce((sum, impact) => sum + impact, 0) * 10;
    
    // Schedule score
    const scheduleScore = scheduleImpact.strengthChange * 5 + 
                         scheduleImpact.playoffStrengthChange * 10;
    
    // Combine scores (capped at -100 to 100)
    const totalScore = valueScore + positionScore + scheduleScore;
    return Math.max(-100, Math.min(100, totalScore));
  }

  // Determine recommendation
  private determineRecommendation(
    fairnessScore: number,
    positionImpact: Record<string, number>,
    performanceImpact: any
  ): 'ACCEPT' | 'REJECT' | 'COUNTER' | 'CONSIDER' {
    // Strong accept
    if (fairnessScore > 30 && performanceImpact.playoffProbChange > 0) {
      return 'ACCEPT';
    }
    
    // Strong reject
    if (fairnessScore < -30 || performanceImpact.playoffProbChange < -10) {
      return 'REJECT';
    }
    
    // Counter if slightly unfair but fixable
    if (fairnessScore < -10 && fairnessScore > -30) {
      return 'COUNTER';
    }
    
    // Consider if close
    return 'CONSIDER';
  }

  // Generate counter proposal
  private async generateCounterProposal(
    original: TradeProposal,
    team: Team,
    fairnessScore: number
  ): Promise<TradeProposal | undefined> {
    // Calculate value deficit
    const valueNeeded = Math.abs(fairnessScore) * 0.5; // Simplified
    
    // Find players to balance the trade
    const additionalPlayers = fairnessScore < 0 ? 
      await this.findPlayersToRequest(original.partnerTeam, valueNeeded) :
      await this.findPlayersToOffer(team, valueNeeded);
    
    if (additionalPlayers.length === 0) return undefined;
    
    return {
      sendingPlayers: fairnessScore < 0 ? 
        original.sendingPlayers : 
        [...original.sendingPlayers, ...additionalPlayers],
      receivingPlayers: fairnessScore < 0 ? 
        [...original.receivingPlayers, ...additionalPlayers] :
        original.receivingPlayers,
      partnerTeam: original.partnerTeam,
      notes: `Counter-proposal to balance trade (original fairness: ${fairnessScore.toFixed(0)})`,
    };
  }

  // Find players to request from partner
  private async findPlayersToRequest(
    partnerTeam: Team | undefined,
    valueNeeded: number
  ): Promise<Player[]> {
    if (!partnerTeam) return [];
    
    // Find bench players close to value needed
    const candidates = partnerTeam.players
      .filter(p => !['QB', 'K', 'DEF'].includes(p.position))
      .sort((a, b) => (a.stats?.fantasyPoints || 0) - (b.stats?.fantasyPoints || 0));
    
    // Find combination close to valueNeeded
    for (const player of candidates) {
      const value = await this.getPlayerValue(player, {});
      if (Math.abs(value - valueNeeded) < valueNeeded * 0.3) {
        return [player];
      }
    }
    
    return [];
  }

  // Find players to offer from own team
  private async findPlayersToOffer(
    team: Team,
    valueNeeded: number
  ): Promise<Player[]> {
    // Find expendable players
    const positionCounts: Record<string, Player[]> = {};
    team.players.forEach(p => {
      if (!positionCounts[p.position]) positionCounts[p.position] = [];
      positionCounts[p.position].push(p);
    });
    
    // Find positions with depth
    const expendable: Player[] = [];
    Object.entries(positionCounts).forEach(([pos, players]) => {
      if (players.length > 3 && !['QB', 'K', 'DEF'].includes(pos)) {
        // Offer worst player at position
        expendable.push(players[players.length - 1]);
      }
    });
    
    // Find combination close to valueNeeded
    for (const player of expendable) {
      const value = await this.getPlayerValue(player, {});
      if (Math.abs(value - valueNeeded) < valueNeeded * 0.3) {
        return [player];
      }
    }
    
    return [];
  }

  // Find similar historical trades
  private findSimilarTrades(proposal: TradeProposal): HistoricalTrade[] {
    // In production, would query database of historical trades
    // For demo, return mock data
    return [
      {
        date: new Date('2024-10-15'),
        players: ['Similar RB for WR trade'],
        outcome: 'WIN',
        similarity: 0.75,
      },
    ];
  }

  // Calculate confidence in analysis
  private calculateConfidence(
    similarTrades: HistoricalTrade[],
    reasoning: any
  ): number {
    let confidence = 0.5; // Base confidence
    
    // More similar trades increase confidence
    if (similarTrades.length > 0) {
      confidence += similarTrades[0].similarity * 0.2;
    }
    
    // Clear pros/cons increase confidence
    const totalReasons = reasoning.pros.length + reasoning.cons.length;
    if (totalReasons > 3) {
      confidence += 0.1;
    }
    
    // Cap at 0.95
    return Math.min(0.95, confidence);
  }

  // Find trade targets in league
  async findTradeTargets(
    myTeam: Team,
    allTeams: Team[],
    targetPosition: string
  ): Promise<TradeTarget[]> {
    const targets: TradeTarget[] = [];
    
    for (const team of allTeams) {
      if (team.id === myTeam.id) continue;
      
      // Find players at target position
      const candidates = team.players.filter(p => p.position === targetPosition);
      
      for (const player of candidates) {
        const targetability = await this.calculateTargetability(player, team);
        const fairOffer = await this.calculateFairOffer(player, myTeam);
        
        if (targetability > 0.3) {
          targets.push({
            player,
            targetability,
            fairOffer,
            reasoning: this.getTargetReasoning(player, team, targetability),
          });
        }
      }
    }
    
    // Sort by targetability and value
    targets.sort((a, b) => {
      const aScore = a.targetability * (a.player.stats?.fantasyPoints || 0);
      const bScore = b.targetability * (b.player.stats?.fantasyPoints || 0);
      return bScore - aScore;
    });
    
    return targets.slice(0, 10); // Top 10 targets
  }

  // Calculate how likely a player is to be traded
  private async calculateTargetability(
    player: Player,
    team: Team
  ): Promise<number> {
    let targetability = 0.5; // Base
    
    // Check if player is likely on bench
    const positionPlayers = team.players.filter(p => p.position === player.position);
    const playerRank = positionPlayers.indexOf(player);
    
    // More likely if not a starter
    if (playerRank > 2) targetability += 0.2;
    
    // More likely if team has depth at position
    if (positionPlayers.length > 4) targetability += 0.15;
    
    // Less likely if team is winning
    if (team.record && team.record.wins > team.record.losses * 1.5) {
      targetability -= 0.1;
    }
    
    // Less likely if player is performing well
    if (player.stats && player.stats.fantasyPoints > player.stats.projectedPoints) {
      targetability -= 0.15;
    }
    
    return Math.max(0, Math.min(1, targetability));
  }

  // Calculate fair offer for a player
  private async calculateFairOffer(
    targetPlayer: Player,
    myTeam: Team
  ): Promise<Player[]> {
    const targetValue = await this.getPlayerValue(targetPlayer, {});
    const offer: Player[] = [];
    let offerValue = 0;
    
    // Sort my players by value
    const myPlayers = [...myTeam.players].sort((a, b) => 
      (b.stats?.fantasyPoints || 0) - (a.stats?.fantasyPoints || 0)
    );
    
    // Find combination that matches value
    for (const player of myPlayers) {
      const playerValue = await this.getPlayerValue(player, {});
      
      if (Math.abs(playerValue - targetValue) < targetValue * 0.2) {
        // Single player trade
        return [player];
      }
      
      if (offerValue < targetValue) {
        offer.push(player);
        offerValue += playerValue;
        
        if (offerValue >= targetValue * 0.9) {
          return offer;
        }
      }
    }
    
    return offer;
  }

  // Get reasoning for targeting a player
  private getTargetReasoning(
    player: Player,
    team: Team,
    targetability: number
  ): string {
    const reasons = [];
    
    if (targetability > 0.7) {
      reasons.push('Owner likely willing to trade');
    }
    if (player.stats && player.stats.fantasyPoints > 15) {
      reasons.push('Strong producer');
    }
    if (team.record && team.record.losses > team.record.wins) {
      reasons.push('Owner may be in sell mode');
    }
    
    const positionPlayers = team.players.filter(p => p.position === player.position);
    if (positionPlayers.length > 3) {
      reasons.push(`Owner has depth at ${player.position}`);
    }
    
    return reasons.join('. ') || 'Potential trade candidate';
  }
}

// Export singleton instance
export const tradeAnalyzer = new TradeAnalyzer();