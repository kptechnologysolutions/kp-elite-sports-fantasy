// Team-specific personalized recommendations service
// Analyzes YOUR actual roster composition and provides customized advice

import { 
  SleeperRoster, 
  SleeperPlayer, 
  SleeperLeague, 
  SleeperMatchup 
} from './sleeperService';

export interface RosterAnalysis {
  positionDepth: Map<string, PlayerRankingAnalysis[]>;
  weakestPositions: string[];
  strongestPositions: string[];
  byeWeekVulnerabilities: Map<number, string[]>;
  averageAge: number;
  experienceLevel: 'rookie' | 'veteran' | 'mixed';
  rosterConstruction: 'balanced' | 'top_heavy' | 'deep';
}

export interface PlayerRankingAnalysis {
  player: SleeperPlayer;
  positionRank: number; // Within your roster at this position
  startingProbability: number; // 0-1 chance of being in optimal lineup
  weeklyFloor: number;
  weeklyCeiling: number;
  consistency: number; // 0-1 how consistent week to week
  upside: 'high' | 'medium' | 'low';
  role: 'starter' | 'flex_candidate' | 'handcuff' | 'deep_bench';
}

export interface PersonalizedStartSitRecommendation {
  player: SleeperPlayer;
  recommendation: 'must_start' | 'strong_start' | 'flex_play' | 'sit' | 'avoid';
  confidence: number; // 0-100
  reasoning: string[];
  detailedInsights: {
    matchupAnalysis: string;
    weatherImpact?: string;
    injuryContext?: string;
    recentPerformance: string;
    opposingDefenseRank: number;
    projectedTargetsOrCarries: number;
    gameScript: 'positive' | 'neutral' | 'negative';
    sleepRisk: 'low' | 'medium' | 'high';
    ceilingPlay: boolean;
    floorPlay: boolean;
  };
  alternativeOptions: SleeperPlayer[];
  positionContext: {
    yourDepthAtPosition: number;
    betterOptionsOnBench: boolean;
    isYourBestOption: boolean;
    positionStrength: 'elite' | 'strong' | 'average' | 'weak' | 'dire';
    needsUpgrade: boolean;
  };
}

export interface PersonalizedWaiverTarget {
  player: SleeperPlayer;
  priority: 'critical_need' | 'upgrade' | 'depth' | 'lottery_ticket' | 'ignore';
  reasoning: string[];
  detailedAnalysis: {
    whyAvailable: string;
    opportunityContext: string;
    rosterFit: string;
    timelineToImpact: string;
    competitionLevel: 'low' | 'medium' | 'high';
    injuryUpside: boolean;
    scheduleStrength: number; // 1-10
    marketTrend: 'rising' | 'stable' | 'falling';
  };
  expectedImpact: 'immediate_starter' | 'flex_upgrade' | 'depth_piece' | 'future_value';
  bidRecommendation: {
    faabPercent: number;
    waiverPriority: 'use_high' | 'use_medium' | 'use_low' | 'skip';
  };
  replacesWho: SleeperPlayer | null;
  fillsNeed: {
    position: string;
    needLevel: 'critical' | 'moderate' | 'nice_to_have';
    currentGap: string;
  };
}

export class TeamPersonalizedService {
  
  // Analyze your entire roster composition
  analyzeRosterComposition(
    myRoster: SleeperRoster, 
    players: Map<string, SleeperPlayer>,
    league: SleeperLeague,
    recentMatchups: SleeperMatchup[]
  ): RosterAnalysis {
    const rosterPlayers = myRoster.players
      .map(id => players.get(id))
      .filter(Boolean) as SleeperPlayer[];

    // Group by position and rank within each position
    const positionDepth = new Map<string, PlayerRankingAnalysis[]>();
    
    // Analyze each position group
    const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
    
    for (const position of positions) {
      const positionPlayers = rosterPlayers.filter(p => 
        p.position === position || p.fantasy_positions?.includes(position)
      );

      const rankings = positionPlayers.map((player, index) => 
        this.analyzePlayerRole(player, index, positionPlayers, recentMatchups)
      );

      // Sort by overall value/startability
      rankings.sort((a, b) => b.startingProbability - a.startingProbability);
      
      positionDepth.set(position, rankings);
    }

    // Identify strengths and weaknesses
    const positionStrengths = this.calculatePositionStrengths(positionDepth, league);
    
    return {
      positionDepth,
      weakestPositions: positionStrengths.weakest,
      strongestPositions: positionStrengths.strongest,
      byeWeekVulnerabilities: this.analyzeByeWeeks(rosterPlayers),
      averageAge: this.calculateAverageAge(rosterPlayers),
      experienceLevel: this.determineExperienceLevel(rosterPlayers),
      rosterConstruction: this.analyzeRosterConstruction(positionDepth)
    };
  }

  // Generate personalized start/sit recommendations
  generateStartSitRecommendations(
    myRoster: SleeperRoster,
    players: Map<string, SleeperPlayer>,
    league: SleeperLeague,
    currentWeek: number,
    rosterAnalysis: RosterAnalysis
  ): PersonalizedStartSitRecommendation[] {
    const recommendations: PersonalizedStartSitRecommendation[] = [];
    
    // Get roster positions that need to be filled
    const requiredPositions = league.roster_positions;
    
    // For each rostered player, determine their start/sit status
    for (const playerId of myRoster.players) {
      const player = players.get(playerId);
      if (!player) continue;

      const positionGroup = rosterAnalysis.positionDepth.get(player.position) || [];
      const playerRanking = positionGroup.find(p => p.player.player_id === playerId);
      
      if (!playerRanking) continue;

      const recommendation = this.generatePlayerRecommendation(
        player,
        playerRanking,
        positionGroup,
        requiredPositions,
        currentWeek
      );

      recommendations.push(recommendation);
    }

    return recommendations.sort((a, b) => {
      // Sort by position importance, then by confidence
      const positionOrder = { QB: 1, RB: 2, WR: 3, TE: 4, K: 5, DEF: 6 };
      const aPos = positionOrder[a.player.position as keyof typeof positionOrder] || 7;
      const bPos = positionOrder[b.player.position as keyof typeof positionOrder] || 7;
      
      if (aPos !== bPos) return aPos - bPos;
      return b.confidence - a.confidence;
    });
  }

  // Generate personalized waiver wire targets
  generateWaiverTargets(
    availablePlayers: SleeperPlayer[],
    myRoster: SleeperRoster,
    players: Map<string, SleeperPlayer>,
    rosterAnalysis: RosterAnalysis,
    league: SleeperLeague
  ): PersonalizedWaiverTarget[] {
    const targets: PersonalizedWaiverTarget[] = [];
    
    // Focus on players that address your specific roster weaknesses
    for (const player of availablePlayers) {
      if (!player.position || !['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].includes(player.position)) {
        continue;
      }

      const target = this.evaluateWaiverTarget(
        player,
        rosterAnalysis,
        myRoster,
        players,
        league
      );

      if (target.priority !== 'ignore') {
        targets.push(target);
      }
    }

    // Sort by priority and expected impact
    return targets.sort((a, b) => {
      const priorityOrder = { 
        critical_need: 5, 
        upgrade: 4, 
        depth: 3, 
        lottery_ticket: 2, 
        ignore: 1 
      };
      
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      
      // Secondary sort by FAAB recommendation
      return b.bidRecommendation.faabPercent - a.bidRecommendation.faabPercent;
    });
  }

  private analyzePlayerRole(
    player: SleeperPlayer,
    positionIndex: number,
    positionGroup: SleeperPlayer[],
    recentMatchups: SleeperMatchup[]
  ): PlayerRankingAnalysis {
    // Calculate recent performance metrics
    const recentPoints = this.getRecentPerformance(player, recentMatchups);
    
    // Determine role based on depth chart position and recent performance
    let role: PlayerRankingAnalysis['role'] = 'deep_bench';
    let startingProbability = 0;
    
    if (positionIndex === 0) {
      role = 'starter';
      startingProbability = 0.9;
    } else if (positionIndex === 1 && ['RB', 'WR'].includes(player.position)) {
      role = positionGroup.length <= 3 ? 'starter' : 'flex_candidate';
      startingProbability = 0.7;
    } else if (positionIndex <= 2 && player.position === 'RB') {
      role = 'flex_candidate';
      startingProbability = 0.4;
    } else if (positionIndex <= 3 && player.position === 'WR') {
      role = 'flex_candidate';
      startingProbability = 0.3;
    }

    // Adjust for injury status
    if (player.injury_status === 'Out' || player.injury_status === 'IR') {
      startingProbability = 0;
      role = 'deep_bench';
    } else if (player.injury_status === 'Questionable') {
      startingProbability *= 0.7;
    }

    return {
      player,
      positionRank: positionIndex + 1,
      startingProbability,
      weeklyFloor: recentPoints.floor,
      weeklyCeiling: recentPoints.ceiling,
      consistency: recentPoints.consistency,
      upside: this.calculateUpside(player, recentPoints),
      role
    };
  }

  private generatePlayerRecommendation(
    player: SleeperPlayer,
    playerRanking: PlayerRankingAnalysis,
    positionGroup: PlayerRankingAnalysis[],
    requiredPositions: string[],
    currentWeek: number
  ): PersonalizedStartSitRecommendation {
    const reasoning: string[] = [];
    let recommendation: PersonalizedStartSitRecommendation['recommendation'] = 'sit';
    let confidence = 50;

    // Analyze position in your depth chart
    const positionRank = playerRanking.positionRank;
    const isTopOption = positionRank === 1;
    const hasBackup = positionGroup.length > 1;

    // Determine recommendation based on YOUR team context
    if (isTopOption && player.position === 'QB') {
      recommendation = 'must_start';
      confidence = 95;
      reasoning.push(`Your #${positionRank} QB - must start`);
    } else if (isTopOption && ['K', 'DEF'].includes(player.position)) {
      recommendation = 'must_start';
      confidence = 90;
      reasoning.push(`Your only viable ${player.position}`);
    } else if (positionRank <= 2 && ['RB', 'WR'].includes(player.position)) {
      if (positionRank === 1) {
        recommendation = 'strong_start';
        confidence = 85;
        reasoning.push(`Your #${positionRank} ${player.position} - top option`);
      } else {
        recommendation = 'strong_start';
        confidence = 75;
        reasoning.push(`Your #${positionRank} ${player.position} - likely starter`);
      }
    } else if (positionRank <= 3 && ['RB', 'WR'].includes(player.position)) {
      recommendation = 'flex_play';
      confidence = 60;
      reasoning.push(`Flex consideration - your #${positionRank} ${player.position}`);
    } else if (player.position === 'TE' && positionRank === 1) {
      recommendation = 'strong_start';
      confidence = 80;
      reasoning.push(`Your top TE option`);
    }

    // Adjust for injury concerns
    if (player.injury_status === 'Questionable') {
      confidence -= 15;
      reasoning.push('Questionable injury status - monitor closely');
    } else if (player.injury_status === 'Doubtful') {
      recommendation = 'avoid';
      confidence = 20;
      reasoning.push('Doubtful to play');
    }

    // Add depth context
    if (!hasBackup && recommendation === 'sit') {
      reasoning.push(`Limited depth at ${player.position} - consider starting`);
      confidence += 10;
    }

    return {
      player,
      recommendation,
      confidence: Math.min(100, Math.max(0, confidence)),
      reasoning,
      alternativeOptions: this.findAlternatives(player, positionGroup),
      positionContext: {
        yourDepthAtPosition: positionGroup.length,
        betterOptionsOnBench: positionGroup.some(p => 
          p.positionRank < positionRank && p.startingProbability > playerRanking.startingProbability
        ),
        isYourBestOption: positionRank === 1
      }
    };
  }

  private evaluateWaiverTarget(
    player: SleeperPlayer,
    rosterAnalysis: RosterAnalysis,
    myRoster: SleeperRoster,
    players: Map<string, SleeperPlayer>,
    league: SleeperLeague
  ): PersonalizedWaiverTarget {
    const positionGroup = rosterAnalysis.positionDepth.get(player.position) || [];
    const isWeakPosition = rosterAnalysis.weakestPositions.includes(player.position);
    const positionDepth = positionGroup.length;
    
    let priority: PersonalizedWaiverTarget['priority'] = 'ignore';
    let expectedImpact: PersonalizedWaiverTarget['expectedImpact'] = 'depth_piece';
    let faabPercent = 0;
    const reasoning: string[] = [];

    // Critical need assessment - YOUR roster specific
    if (positionDepth === 0) {
      priority = 'critical_need';
      expectedImpact = 'immediate_starter';
      faabPercent = 25;
      reasoning.push(`You have NO ${player.position} on roster`);
    } else if (positionDepth === 1 && ['RB', 'WR'].includes(player.position)) {
      priority = 'critical_need';
      expectedImpact = 'immediate_starter';
      faabPercent = 20;
      reasoning.push(`You only have 1 ${player.position} - need depth`);
    } else if (isWeakPosition && positionDepth <= 2) {
      priority = 'upgrade';
      expectedImpact = 'flex_upgrade';
      faabPercent = 15;
      reasoning.push(`Weak position for your team - could upgrade`);
    } else if (positionDepth < 3 && ['RB', 'WR'].includes(player.position)) {
      priority = 'depth';
      expectedImpact = 'depth_piece';
      faabPercent = 8;
      reasoning.push(`Good depth addition at ${player.position}`);
    } else if (this.hasBreakoutPotential(player)) {
      priority = 'lottery_ticket';
      expectedImpact = 'future_value';
      faabPercent = 5;
      reasoning.push('High upside player worth stashing');
    }

    // Find who this player would replace
    let replacesWho: SleeperPlayer | null = null;
    if (positionGroup.length > 0) {
      const worstAtPosition = positionGroup[positionGroup.length - 1];
      if (worstAtPosition && this.isUpgrade(player, worstAtPosition.player)) {
        replacesWho = worstAtPosition.player;
        reasoning.push(`Upgrade over ${replacesWho.full_name}`);
        faabPercent += 3;
      }
    }

    return {
      player,
      priority,
      reasoning,
      expectedImpact,
      bidRecommendation: {
        faabPercent: Math.min(30, faabPercent),
        waiverPriority: faabPercent > 15 ? 'use_high' : 
                       faabPercent > 8 ? 'use_medium' : 
                       faabPercent > 3 ? 'use_low' : 'skip'
      },
      replacesWho,
      fillsNeed: {
        position: player.position,
        needLevel: priority === 'critical_need' ? 'critical' :
                  priority === 'upgrade' ? 'moderate' : 'nice_to_have',
        currentGap: this.describePositionNeed(player.position, positionGroup)
      }
    };
  }

  // Helper methods
  private calculatePositionStrengths(
    positionDepth: Map<string, PlayerRankingAnalysis[]>,
    league: SleeperLeague
  ) {
    const positionScores = new Map<string, number>();
    
    for (const [position, players] of positionDepth) {
      let score = 0;
      players.forEach((p, index) => {
        // Score based on starting probability and position in depth chart
        score += p.startingProbability * (players.length - index);
      });
      positionScores.set(position, score);
    }

    const sortedPositions = Array.from(positionScores.entries())
      .sort((a, b) => b[1] - a[1]);

    return {
      strongest: sortedPositions.slice(0, 2).map(([pos]) => pos),
      weakest: sortedPositions.slice(-2).map(([pos]) => pos)
    };
  }

  private analyzeByeWeeks(players: SleeperPlayer[]): Map<number, string[]> {
    // Implementation would check actual bye weeks from player data
    // For now, return empty map
    return new Map();
  }

  private calculateAverageAge(players: SleeperPlayer[]): number {
    const ages = players.map(p => p.age).filter(Boolean) as number[];
    return ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;
  }

  private determineExperienceLevel(players: SleeperPlayer[]): RosterAnalysis['experienceLevel'] {
    const experiences = players.map(p => p.years_exp).filter(exp => exp !== null) as number[];
    const avgExp = experiences.length > 0 ? experiences.reduce((a, b) => a + b, 0) / experiences.length : 0;
    
    if (avgExp < 2) return 'rookie';
    if (avgExp > 6) return 'veteran';
    return 'mixed';
  }

  private analyzeRosterConstruction(
    positionDepth: Map<string, PlayerRankingAnalysis[]>
  ): RosterAnalysis['rosterConstruction'] {
    // Analyze if you have a few stars or balanced depth
    let topTierPlayers = 0;
    let totalPlayers = 0;

    for (const players of positionDepth.values()) {
      players.forEach(p => {
        totalPlayers++;
        if (p.startingProbability > 0.7) topTierPlayers++;
      });
    }

    const ratio = topTierPlayers / totalPlayers;
    if (ratio > 0.4) return 'top_heavy';
    if (ratio < 0.2) return 'deep';
    return 'balanced';
  }

  private getRecentPerformance(player: SleeperPlayer, matchups: SleeperMatchup[]) {
    // Get player's recent points from matchups
    const playerPoints: number[] = [];
    
    matchups.forEach(matchup => {
      const points = matchup.players_points[player.player_id];
      if (points !== undefined) playerPoints.push(points);
    });

    if (playerPoints.length === 0) {
      return { floor: 0, ceiling: 0, consistency: 0 };
    }

    const avg = playerPoints.reduce((a, b) => a + b, 0) / playerPoints.length;
    const min = Math.min(...playerPoints);
    const max = Math.max(...playerPoints);
    
    // Calculate consistency (1 - coefficient of variation)
    const variance = playerPoints.reduce((sum, points) => sum + Math.pow(points - avg, 2), 0) / playerPoints.length;
    const stdDev = Math.sqrt(variance);
    const consistency = avg > 0 ? Math.max(0, 1 - (stdDev / avg)) : 0;

    return { floor: min, ceiling: max, consistency };
  }

  private calculateUpside(player: SleeperPlayer, recentPoints: any): PlayerRankingAnalysis['upside'] {
    if (recentPoints.ceiling > 20) return 'high';
    if (recentPoints.ceiling > 12) return 'medium';
    return 'low';
  }

  private findAlternatives(player: SleeperPlayer, positionGroup: PlayerRankingAnalysis[]): SleeperPlayer[] {
    return positionGroup
      .filter(p => p.player.player_id !== player.player_id)
      .slice(0, 2)
      .map(p => p.player);
  }

  private hasBreakoutPotential(player: SleeperPlayer): boolean {
    // Young player with opportunity
    return (player.age || 0) < 25 && 
           (player.years_exp || 0) < 3 && 
           ['RB', 'WR'].includes(player.position);
  }

  private isUpgrade(newPlayer: SleeperPlayer, currentPlayer: SleeperPlayer): boolean {
    // Simple heuristic - younger or higher draft position
    const newAge = newPlayer.age || 30;
    const currentAge = currentPlayer.age || 30;
    
    return newAge < currentAge || 
           (newPlayer.depth_chart_order || 99) < (currentPlayer.depth_chart_order || 99);
  }

  private describePositionNeed(position: string, positionGroup: PlayerRankingAnalysis[]): string {
    if (positionGroup.length === 0) return `No ${position} on roster`;
    if (positionGroup.length === 1) return `Only 1 ${position} - need backup`;
    if (positionGroup.length === 2) return `Limited depth at ${position}`;
    return `Decent depth at ${position}`;
  }
}

export const teamPersonalizedService = new TeamPersonalizedService();