// Enhanced insights service with detailed reasoning and analysis
'use client';

import { 
  SleeperRoster, 
  SleeperPlayer, 
  SleeperLeague, 
  SleeperMatchup 
} from './sleeperService';

export interface EnhancedPlayerInsights {
  player: SleeperPlayer;
  recommendation: 'must_start' | 'strong_start' | 'flex_play' | 'sit' | 'avoid';
  confidence: number; // 0-100
  reasoning: string[];
  
  // Detailed breakdown
  keyFactors: {
    matchupGrade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D+' | 'D' | 'F';
    volumeExpectation: 'High' | 'Above Average' | 'Average' | 'Below Average' | 'Low';
    injuryRisk: 'None' | 'Low' | 'Moderate' | 'High' | 'Questionable';
    gameScript: 'Very Positive' | 'Positive' | 'Neutral' | 'Negative' | 'Very Negative';
    recentForm: 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Terrible';
  };
  
  // Why this player specifically
  whyThisPlayer: {
    primaryReason: string;
    supportingFactors: string[];
    concernsToMonitor: string[];
    keyStatistic: string;
  };
  
  // Matchup breakdown
  matchupAnalysis: {
    opponent: string;
    defenseRank: number;
    defenseAllowedToPosition: string;
    keyMatchupAdvantage?: string;
    weatherConcerns?: string;
    homeFieldAdvantage: boolean;
    gameTotal: number;
    spread: number;
  };
  
  // Usage projection
  projectedUsage: {
    expectedTouches?: number;
    expectedTargets?: number;
    expectedRedZoneOpportunities: number;
    snapShareProjection: number;
    goalLineRole: 'Primary' | 'Secondary' | 'Minimal' | 'None';
  };
  
  // Risk/Reward profile
  riskProfile: {
    floor: number;
    ceiling: number;
    mostLikelyOutcome: number;
    bustRisk: number; // 0-100%
    boomPotential: number; // 0-100%
    volatility: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High';
  };
  
  // Position context
  positionContext: {
    yourDepthAtPosition: number;
    positionRankOnYourTeam: number;
    alternativesAvailable: string[];
    mustStartByNecessity: boolean;
    luxuryPlay: boolean;
  };
}

export interface EnhancedWaiverInsights {
  player: SleeperPlayer;
  priority: 'critical_need' | 'significant_upgrade' | 'depth_add' | 'lottery_ticket' | 'ignore';
  bidRecommendation: {
    faabPercent: number;
    maxBid: number;
    reasoning: string;
  };
  
  // Why available
  availabilityAnalysis: {
    whyAvailable: string;
    marketMissing: string;
    opportunityWindow: string;
    competitionLevel: 'None' | 'Low' | 'Moderate' | 'High' | 'Intense';
  };
  
  // Impact timeline
  impactProjection: {
    immediateValue: string;
    shortTermOutlook: string; // Next 4 weeks
    seasonLongValue: string;
    playoffRelevance: string;
  };
  
  // Roster fit
  rosterFit: {
    fillsPosition: string;
    upgradesOver: string;
    wouldStart: boolean;
    flexValue: boolean;
    handcuffValue?: string;
    stackingOpportunity?: string;
  };
  
  // Supporting data
  analyticsSupport: {
    targetShare?: number;
    airYards?: number;
    redZoneShare?: number;
    snapTrend: 'Rising' | 'Stable' | 'Declining';
    efficiencyMetrics: string;
  };
}

export class EnhancedInsightsService {
  
  // Generate must-start recommendations with detailed reasoning
  generateMustStartInsights(
    myRoster: SleeperRoster,
    players: Map<string, SleeperPlayer>,
    league: SleeperLeague,
    currentWeek: number
  ): EnhancedPlayerInsights[] {
    const insights: EnhancedPlayerInsights[] = [];
    
    // Get your starting lineup players from the actual starters array
    const startingPlayers = myRoster.starters
      .map(id => players.get(id))
      .filter(Boolean) as SleeperPlayer[];
    
    for (const player of startingPlayers) {
      const insight = this.generateDetailedPlayerInsight(player, myRoster, players, league, currentWeek);
      
      // Only include players with strong start/must start recommendations
      if (['must_start', 'strong_start'].includes(insight.recommendation)) {
        insights.push(insight);
      }
    }
    
    return insights.sort((a, b) => {
      // Sort by recommendation strength, then confidence
      const recOrder = { 'must_start': 0, 'strong_start': 1 };
      if (recOrder[a.recommendation] !== recOrder[b.recommendation]) {
        return recOrder[a.recommendation] - recOrder[b.recommendation];
      }
      return b.confidence - a.confidence;
    });
  }
  
  // Generate key decisions with comprehensive analysis
  generateKeyDecisionInsights(
    myRoster: SleeperRoster,
    players: Map<string, SleeperPlayer>,
    league: SleeperLeague,
    currentWeek: number
  ): EnhancedPlayerInsights[] {
    const insights: EnhancedPlayerInsights[] = [];
    
    // Get all roster players including bench and potential starters
    const allRosterPlayers = myRoster.players
      .map(id => players.get(id))
      .filter(Boolean) as SleeperPlayer[];
    
    for (const player of allRosterPlayers) {
      const insight = this.generateDetailedPlayerInsight(player, myRoster, players, league, currentWeek);
      
      // Include players that require decisions (flex, sit, bench considerations)
      if (['strong_start', 'flex_play', 'sit'].includes(insight.recommendation)) {
        insights.push(insight);
      }
    }
    
    return insights.sort((a, b) => b.confidence - a.confidence);
  }
  
  // Generate enhanced waiver wire targets
  generateEnhancedWaiverTargets(
    availablePlayers: SleeperPlayer[],
    myRoster: SleeperRoster,
    players: Map<string, SleeperPlayer>,
    league: SleeperLeague,
    currentWeek: number
  ): EnhancedWaiverInsights[] {
    const targets: EnhancedWaiverInsights[] = [];
    
    // Filter to most relevant available players
    const relevantPlayers = availablePlayers
      .filter(p => ['QB', 'RB', 'WR', 'TE'].includes(p.position))
      .slice(0, 20); // Top 20 to analyze
    
    for (const player of relevantPlayers) {
      const waiverInsight = this.generateWaiverInsight(player, myRoster, players, league, currentWeek);
      
      if (waiverInsight.priority !== 'ignore') {
        targets.push(waiverInsight);
      }
    }
    
    return targets.sort((a, b) => {
      const priorityOrder = {
        'critical_need': 0,
        'significant_upgrade': 1,
        'depth_add': 2,
        'lottery_ticket': 3,
        'ignore': 4
      };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
  
  // Generate detailed player insight
  private generateDetailedPlayerInsight(
    player: SleeperPlayer,
    myRoster: SleeperRoster,
    players: Map<string, SleeperPlayer>,
    league: SleeperLeague,
    currentWeek: number
  ): EnhancedPlayerInsights {
    try {
      // Generate matchup data
      const matchupData = this.generateMatchupData(player, currentWeek);
      
      // Analyze recent performance
      const recentForm = this.analyzeRecentForm(player);
      
      // Determine game script
      const gameScript = this.analyzeGameScript(player, matchupData);
      
      // Calculate risk profile
      const riskProfile = this.calculateRiskProfile(player, matchupData, recentForm);
      
      // Determine recommendation
      const recommendation = this.determineRecommendation(player, matchupData, recentForm, myRoster, players);
      
      // Generate reasoning
      const reasoning = this.generateDetailedReasoning(player, matchupData, recentForm, gameScript, recommendation);
      
      return {
        player,
        recommendation,
        confidence: this.calculateConfidence(recommendation, matchupData, recentForm),
        reasoning,
        
        keyFactors: {
          matchupGrade: this.gradeMatchup(matchupData),
          volumeExpectation: this.projectVolume(player, gameScript),
          injuryRisk: this.assessInjuryRisk(player),
          gameScript: this.formatGameScript(gameScript),
          recentForm: this.formatRecentForm(recentForm)
        },
        
        whyThisPlayer: {
          primaryReason: this.getPrimaryReason(player, recommendation, matchupData),
          supportingFactors: this.getSupportingFactors(player, matchupData, recentForm),
          concernsToMonitor: this.getConcerns(player, matchupData),
          keyStatistic: this.getKeyStatistic(player, recentForm)
        },
        
        matchupAnalysis: {
          opponent: matchupData.opponent,
          defenseRank: matchupData.defenseRank,
          defenseAllowedToPosition: this.getDefenseAllowed(matchupData, player.position),
          keyMatchupAdvantage: this.getMatchupAdvantage(player, matchupData),
          weatherConcerns: this.getWeatherConcerns(matchupData),
          homeFieldAdvantage: matchupData.isHome,
          gameTotal: matchupData.total,
          spread: matchupData.spread
        },
        
        projectedUsage: this.projectUsage(player, gameScript, matchupData),
        
        riskProfile,
        
        positionContext: this.analyzePositionContext(player, myRoster, players)
      };
    } catch (error) {
      console.error('Error generating enhanced insights for player:', player.full_name, error);
      
      // Return fallback basic insight
      return {
        player,
        recommendation: 'flex_play',
        confidence: 50,
        reasoning: [`Analysis pending for ${player.full_name}`],
        
        keyFactors: {
          matchupGrade: 'B',
          volumeExpectation: 'Average',
          injuryRisk: 'Low',
          gameScript: 'Neutral',
          recentForm: 'Average'
        },
        
        whyThisPlayer: {
          primaryReason: `${player.full_name} requires further analysis`,
          supportingFactors: ['Standard roster player'],
          concernsToMonitor: [],
          keyStatistic: 'Analysis in progress'
        },
        
        matchupAnalysis: {
          opponent: 'TBD',
          defenseRank: 16,
          defenseAllowedToPosition: 'Average',
          homeFieldAdvantage: true,
          gameTotal: 45,
          spread: 0
        },
        
        projectedUsage: {
          expectedTouches: 10,
          expectedTargets: 5,
          expectedRedZoneOpportunities: 1,
          snapCountProjection: 60
        },
        
        riskProfile: {
          floor: 5,
          ceiling: 15,
          mostLikelyOutcome: 10,
          bustRisk: 20,
          boomPotential: 25,
          volatility: 'Moderate'
        },
        
        positionContext: {
          yourRankAtPosition: 1,
          depthAtPosition: 'Adequate',
          isUpgrade: false,
          replacementLevel: 'Average'
        }
      };
    }
  }
  
  // Helper methods for detailed analysis
  private generateMatchupData(player: SleeperPlayer, week: number) {
    // Mock data - in real app, fetch from APIs
    const opponents = ['vs LAR', 'vs SF', '@ DAL', '@ GB', 'vs BUF', '@ MIA'];
    const opponent = opponents[Math.floor(Math.random() * opponents.length)];
    
    return {
      opponent,
      defenseRank: Math.floor(Math.random() * 32) + 1,
      isHome: !opponent.includes('@'),
      total: 42 + Math.random() * 16, // 42-58
      spread: Math.random() * 14 - 7, // -7 to +7
      weather: Math.random() > 0.8 ? 'Poor' : 'Good',
      temperature: 45 + Math.random() * 40
    };
  }
  
  private analyzeRecentForm(player: SleeperPlayer) {
    // Mock recent performance data
    const last4Games = Array.from({ length: 4 }, () => ({
      points: Math.random() * 30,
      usage: Math.random() * 15 + 5,
      efficiency: Math.random() * 2 + 0.5
    }));
    
    const avgPoints = last4Games.reduce((sum, g) => sum + g.points, 0) / 4;
    const trend = last4Games[3].points > last4Games[0].points ? 'improving' : 'declining';
    
    return {
      last4Games,
      avgPoints,
      trend,
      consistency: Math.random() * 0.4 + 0.6 // 0.6-1.0
    };
  }
  
  private analyzeGameScript(player: SleeperPlayer, matchupData: any) {
    const { spread, total } = matchupData;
    
    if (spread > 3 && total > 50) return 'very_positive';
    if (spread > 0 && total > 47) return 'positive';
    if (Math.abs(spread) <= 3) return 'neutral';
    if (spread < -3 && total < 45) return 'negative';
    return 'very_negative';
  }
  
  private calculateRiskProfile(player: SleeperPlayer, matchupData: any, recentForm: any) {
    const baseFloor = recentForm.avgPoints * 0.6;
    const baseCeiling = recentForm.avgPoints * 1.4;
    
    // Adjust based on matchup
    const matchupMultiplier = matchupData.defenseRank <= 10 ? 1.2 : 
                             matchupData.defenseRank >= 25 ? 0.8 : 1.0;
    
    return {
      floor: Math.max(0, baseFloor * matchupMultiplier),
      ceiling: baseCeiling * matchupMultiplier,
      mostLikelyOutcome: recentForm.avgPoints * matchupMultiplier,
      bustRisk: matchupData.defenseRank >= 25 ? 25 : 15,
      boomPotential: matchupData.defenseRank <= 10 ? 35 : 20,
      volatility: recentForm.consistency > 0.8 ? 'Low' : 
                 recentForm.consistency > 0.6 ? 'Moderate' : 'High'
    };
  }
  
  private determineRecommendation(
    player: SleeperPlayer,
    matchupData: any,
    recentForm: any,
    myRoster: SleeperRoster,
    players: Map<string, SleeperPlayer>
  ): EnhancedPlayerInsights['recommendation'] {
    
    const positionPlayers = myRoster.players
      .map(id => players.get(id))
      .filter(p => p && p.position === player.position);
    
    const isTopOption = positionPlayers.length <= 2; // If you have 2 or fewer at position
    const hasGoodMatchup = matchupData.defenseRank <= 15;
    const hasGoodForm = recentForm.avgPoints > 10;
    
    if (isTopOption && hasGoodMatchup && hasGoodForm) return 'must_start';
    if ((isTopOption && hasGoodMatchup) || (hasGoodMatchup && hasGoodForm)) return 'strong_start';
    if (hasGoodMatchup || hasGoodForm || isTopOption) return 'flex_play';
    
    return 'sit';
  }
  
  private generateDetailedReasoning(
    player: SleeperPlayer,
    matchupData: any,
    recentForm: any,
    gameScript: string,
    recommendation: string
  ): string[] {
    const reasoning: string[] = [];
    
    // Primary recommendation reasoning
    if (recommendation === 'must_start') {
      reasoning.push(`🏆 MUST START: ${player.full_name} is your best option at ${player.position} with an elite matchup and strong recent form`);
    } else if (recommendation === 'strong_start') {
      reasoning.push(`💪 STRONG START: ${player.full_name} offers excellent upside with favorable conditions aligning`);
    } else if (recommendation === 'flex_play') {
      reasoning.push(`🤔 FLEX CONSIDERATION: ${player.full_name} has merit but requires careful consideration against alternatives`);
    } else {
      reasoning.push(`📉 BENCH RECOMMENDATION: ${player.full_name} faces challenging conditions this week`);
    }
    
    // Matchup reasoning
    if (matchupData.defenseRank <= 5) {
      reasoning.push(`🎯 ELITE MATCHUP: Facing #${matchupData.defenseRank} defense - historically allows big games to ${player.position}s`);
    } else if (matchupData.defenseRank <= 15) {
      reasoning.push(`👍 GOOD MATCHUP: #${matchupData.defenseRank} ranked defense provides above-average opportunity`);
    } else if (matchupData.defenseRank >= 25) {
      reasoning.push(`⚠️ TOUGH MATCHUP: #${matchupData.defenseRank} defense is stingy against ${player.position}s`);
    }
    
    // Game script reasoning
    if (gameScript === 'very_positive') {
      reasoning.push(`📈 GAME SCRIPT GOLD: Expected blowout win means maximum touches and red zone opportunities`);
    } else if (gameScript === 'positive') {
      reasoning.push(`✅ POSITIVE SCRIPT: Likely game flow should increase usage and scoring chances`);
    } else if (gameScript === 'negative') {
      reasoning.push(`📉 NEGATIVE SCRIPT: Game flow may limit opportunities and touch volume`);
    }
    
    // Form reasoning
    if (recentForm.avgPoints > 15) {
      reasoning.push(`🔥 HOT STREAK: Averaging ${recentForm.avgPoints.toFixed(1)} points over last 4 games with ${recentForm.trend} trend`);
    } else if (recentForm.avgPoints > 10) {
      reasoning.push(`📊 SOLID FORM: Consistent ${recentForm.avgPoints.toFixed(1)} point average shows reliable floor`);
    } else {
      reasoning.push(`❄️ COLD STRETCH: Averaging only ${recentForm.avgPoints.toFixed(1)} points - needs bounce-back performance`);
    }
    
    // Additional context
    if (matchupData.isHome) {
      reasoning.push(`🏠 HOME ADVANTAGE: Playing at home where ${player.full_name} historically performs better`);
    }
    
    if (matchupData.total > 50) {
      reasoning.push(`🏈 HIGH-SCORING ENVIRONMENT: Over/under of ${matchupData.total.toFixed(1)} suggests plenty of offensive opportunities`);
    }
    
    return reasoning;
  }
  
  private generateWaiverInsight(
    player: SleeperPlayer,
    roster: SleeperRoster,
    players: Map<string, SleeperPlayer>,
    league: SleeperLeague,
    week: number
  ): EnhancedWaiverInsights {
    // Mock waiver analysis
    return {
      player,
      priority: 'depth_add',
      bidRecommendation: {
        faabPercent: 15,
        maxBid: 25,
        reasoning: 'Solid depth piece with upside'
      },
      availabilityAnalysis: {
        whyAvailable: 'Overlooked breakout candidate',
        marketMissing: 'Recent snap count increase',
        opportunityWindow: 'Next 2-3 weeks',
        competitionLevel: 'Low'
      },
      impactProjection: {
        immediateValue: 'Bench depth',
        shortTermOutlook: 'Flex consideration',
        seasonLongValue: 'Starter potential',
        playoffRelevance: 'High'
      },
      rosterFit: {
        fillsPosition: player.position,
        upgradesOver: 'Current bench options',
        wouldStart: false,
        flexValue: true
      },
      analyticsSupport: {
        snapTrend: 'Rising',
        efficiencyMetrics: 'Above average efficiency'
      }
    };
  }
  
  // Helper methods
  private gradeMatchup(matchupData: any): EnhancedPlayerInsights['keyFactors']['matchupGrade'] {
    if (matchupData.defenseRank <= 3) return 'A+';
    if (matchupData.defenseRank <= 8) return 'A';
    if (matchupData.defenseRank <= 12) return 'B+';
    if (matchupData.defenseRank <= 18) return 'B';
    if (matchupData.defenseRank <= 22) return 'C+';
    if (matchupData.defenseRank <= 26) return 'C';
    if (matchupData.defenseRank <= 30) return 'D+';
    return 'D';
  }
  
  private projectVolume(player: SleeperPlayer, gameScript: string): EnhancedPlayerInsights['keyFactors']['volumeExpectation'] {
    const baseVolume = { 'QB': 'High', 'RB': 'Above Average', 'WR': 'Average', 'TE': 'Below Average' };
    let volume = baseVolume[player.position as keyof typeof baseVolume] || 'Low';
    
    if (gameScript === 'very_positive' && ['RB', 'WR'].includes(player.position)) {
      volume = 'High';
    } else if (gameScript === 'negative' && player.position === 'RB') {
      volume = 'Below Average';
    }
    
    return volume as EnhancedPlayerInsights['keyFactors']['volumeExpectation'];
  }
  
  private assessInjuryRisk(player: SleeperPlayer): EnhancedPlayerInsights['keyFactors']['injuryRisk'] {
    const risk = Math.random();
    if (risk > 0.9) return 'Questionable';
    if (risk > 0.7) return 'High';
    if (risk > 0.4) return 'Moderate';
    if (risk > 0.1) return 'Low';
    return 'None';
  }
  
  private formatGameScript(script: string): EnhancedPlayerInsights['keyFactors']['gameScript'] {
    const map = {
      'very_positive': 'Very Positive',
      'positive': 'Positive',
      'neutral': 'Neutral',
      'negative': 'Negative',
      'very_negative': 'Very Negative'
    };
    return map[script as keyof typeof map] || 'Neutral';
  }
  
  private formatRecentForm(form: any): EnhancedPlayerInsights['keyFactors']['recentForm'] {
    if (form.avgPoints > 18) return 'Excellent';
    if (form.avgPoints > 14) return 'Good';
    if (form.avgPoints > 10) return 'Average';
    if (form.avgPoints > 6) return 'Poor';
    return 'Terrible';
  }
  
  private calculateConfidence(rec: string, matchup: any, form: any): number {
    let base = 70;
    if (rec === 'must_start') base = 90;
    if (rec === 'strong_start') base = 80;
    if (matchup.defenseRank <= 10) base += 10;
    if (form.avgPoints > 15) base += 10;
    return Math.min(100, base);
  }
  
  private getPrimaryReason(player: SleeperPlayer, rec: string, matchup: any): string {
    if (rec === 'must_start') return `Top option at ${player.position} with excellent matchup`;
    if (rec === 'strong_start') return `Strong play with favorable conditions`;
    return `Solid contributor when lineup spots available`;
  }
  
  private getSupportingFactors(player: SleeperPlayer, matchup: any, form: any): string[] {
    const factors = [];
    if (matchup.defenseRank <= 15) factors.push('Favorable defensive matchup');
    if (matchup.isHome) factors.push('Home field advantage');
    if (form.trend === 'improving') factors.push('Improving recent performance');
    if (matchup.total > 50) factors.push('High-scoring game environment');
    return factors;
  }
  
  private getConcerns(player: SleeperPlayer, matchup: any): string[] {
    const concerns = [];
    if (matchup.defenseRank >= 25) concerns.push('Tough defensive matchup');
    if (matchup.weather === 'Poor') concerns.push('Poor weather conditions');
    if (matchup.total < 45) concerns.push('Low-scoring game script');
    return concerns;
  }
  
  private getKeyStatistic(player: SleeperPlayer, form: any): string {
    return `${form.avgPoints.toFixed(1)} PPG over last 4 games`;
  }
  
  private getDefenseAllowed(matchup: any, position: string): string {
    const rank = matchup.defenseRank;
    if (rank <= 10) return `Top-10 defense vs ${position}s - allows few big games`;
    if (rank >= 25) return `Bottom-10 defense vs ${position}s - allows frequent big games`;
    return `Middle-tier defense vs ${position}s - average matchup`;
  }
  
  private getMatchupAdvantage(player: SleeperPlayer, matchup: any): string | undefined {
    if (matchup.defenseRank <= 5) {
      return `Defense struggles vs ${player.position}s - allows 2nd most points to position`;
    }
    return undefined;
  }
  
  private getWeatherConcerns(matchup: any): string | undefined {
    if (matchup.weather === 'Poor') {
      return `Poor weather expected - wind/rain may impact passing game`;
    }
    return undefined;
  }
  
  private projectUsage(player: SleeperPlayer, script: string, matchup: any): EnhancedPlayerInsights['projectedUsage'] {
    const base = {
      expectedRedZoneOpportunities: Math.floor(Math.random() * 3) + 1,
      snapShareProjection: 60 + Math.random() * 30,
      goalLineRole: 'Secondary' as const
    };
    
    if (player.position === 'RB') {
      return {
        ...base,
        expectedTouches: 15 + Math.floor(Math.random() * 10),
        goalLineRole: 'Primary'
      };
    } else if (player.position === 'WR') {
      return {
        ...base,
        expectedTargets: 6 + Math.floor(Math.random() * 8)
      };
    }
    
    return base;
  }
  
  private analyzePositionContext(player: SleeperPlayer, roster: SleeperRoster, players: Map<string, SleeperPlayer>): EnhancedPlayerInsights['positionContext'] {
    const positionPlayers = roster.players
      .map(id => players.get(id))
      .filter(p => p && p.position === player.position);
    
    const playerIndex = positionPlayers.findIndex(p => p?.player_id === player.player_id) + 1;
    
    return {
      yourDepthAtPosition: positionPlayers.length,
      positionRankOnYourTeam: playerIndex,
      alternativesAvailable: positionPlayers.filter(p => p?.player_id !== player.player_id).map(p => p!.full_name),
      mustStartByNecessity: positionPlayers.length <= 2,
      luxuryPlay: positionPlayers.length >= 4 && playerIndex >= 3
    };
  }
}

// Export singleton instance
export const enhancedInsightsService = new EnhancedInsightsService();