// Advanced Team-Specific Strategy Engine
// Takes team customization even further beyond basic roster analysis

import { 
  SleeperRoster, 
  SleeperPlayer, 
  SleeperLeague, 
  SleeperMatchup 
} from './sleeperService';
import { 
  PersonalizedStartSitRecommendation,
  PersonalizedWaiverTarget,
  RosterAnalysis
} from './teamPersonalizedService';

export interface WeeklyStrategy {
  gameScript: 'safe_floor' | 'high_ceiling' | 'balanced' | 'hail_mary';
  reasoning: string[];
  recommendedRiskLevel: 'conservative' | 'moderate' | 'aggressive' | 'desperate';
  targetScore: number;
  opponentAnalysis: {
    projectedScore: number;
    strengths: string[];
    weaknesses: string[];
    expectedGameflow: string;
  };
}

export interface TeamSituationContext {
  recordSituation: 'desperate' | 'fighting' | 'competitive' | 'comfortable' | 'locked';
  playoffImplications: {
    currentPlayoffChance: number;
    mustWinWeeks: number[];
    canAffordLoss: boolean;
    tiebreakersNeeded: 'points' | 'wins' | 'head_to_head';
  };
  leaguePosition: {
    standing: number;
    pointsRank: number;
    strengthOfSchedule: 'easy' | 'moderate' | 'difficult';
    remainingOpponents: string[];
  };
  rosterMaturity: {
    phase: 'building' | 'competing' | 'peak' | 'decline';
    timeline: 'win_now' | 'next_year' | 'multi_year';
    keyDecisions: string[];
  };
}

export interface ContextualRecommendation extends PersonalizedStartSitRecommendation {
  situationalFactors: {
    weeklyStrategy: WeeklyStrategy['gameScript'];
    leagueContext: string[];
    alternativeIfInjured: SleeperPlayer | null;
    riskAssessment: 'low' | 'medium' | 'high';
  };
}

export interface ContextualWaiverTarget extends PersonalizedWaiverTarget {
  strategicValue: {
    immediateNeed: number; // 0-10 scale
    futureValue: number; // 0-10 scale
    opportunityCost: string;
    competitionLevel: 'low' | 'medium' | 'high' | 'bidding_war';
    timingSuggestion: 'claim_now' | 'wait_and_see' | 'speculative_add';
  };
}

export class AdvancedTeamStrategy {
  
  // Analyze your specific team situation beyond just roster
  analyzeTeamSituation(
    myRoster: SleeperRoster,
    allRosters: SleeperRoster[],
    league: SleeperLeague,
    currentWeek: number,
    seasonMatchups: Map<number, SleeperMatchup[]>
  ): TeamSituationContext {
    
    const myRecord = {
      wins: myRoster.settings?.wins || 0,
      losses: myRoster.settings?.losses || 0,
      ties: myRoster.settings?.ties || 0
    };
    
    const totalGames = myRecord.wins + myRecord.losses + myRecord.ties;
    const winPct = totalGames > 0 ? myRecord.wins / totalGames : 0;
    
    // Determine record situation
    let recordSituation: TeamSituationContext['recordSituation'] = 'competitive';
    if (winPct < 0.25) recordSituation = 'desperate';
    else if (winPct < 0.45) recordSituation = 'fighting';
    else if (winPct > 0.75) recordSituation = 'comfortable';
    else if (winPct > 0.9) recordSituation = 'locked';
    
    // Calculate standings
    const sortedRosters = [...allRosters].sort((a, b) => {
      const aWinPct = (a.settings?.wins || 0) / Math.max((a.settings?.wins || 0) + (a.settings?.losses || 0), 1);
      const bWinPct = (b.settings?.wins || 0) / Math.max((b.settings?.wins || 0) + (b.settings?.losses || 0), 1);
      if (aWinPct !== bWinPct) return bWinPct - aWinPct;
      return (b.settings?.fpts || 0) - (a.settings?.fpts || 0);
    });
    
    const myStanding = sortedRosters.findIndex(r => r.roster_id === myRoster.roster_id) + 1;
    const playoffSpots = league.settings?.playoff_week_start ? Math.ceil(league.total_rosters / 2) : 6;
    
    // Points ranking
    const pointsSorted = [...allRosters].sort((a, b) => (b.settings?.fpts || 0) - (a.settings?.fpts || 0));
    const pointsRank = pointsSorted.findIndex(r => r.roster_id === myRoster.roster_id) + 1;
    
    // Playoff implications
    const weeksRemaining = 17 - currentWeek; // Rough estimate
    const playoffChance = this.calculatePlayoffChance(myStanding, myRecord, weeksRemaining, playoffSpots);
    
    return {
      recordSituation,
      playoffImplications: {
        currentPlayoffChance: playoffChance,
        mustWinWeeks: this.calculateMustWinWeeks(myRecord, weeksRemaining, playoffChance),
        canAffordLoss: playoffChance > 80 || myStanding <= 2,
        tiebreakersNeeded: pointsRank > myStanding ? 'points' : 'wins'
      },
      leaguePosition: {
        standing: myStanding,
        pointsRank,
        strengthOfSchedule: 'moderate', // Would need more data to calculate
        remainingOpponents: [] // Would need schedule data
      },
      rosterMaturity: this.analyzeRosterMaturity(myRoster, seasonMatchups)
    };
  }

  // Generate weekly strategy based on YOUR specific situation
  generateWeeklyStrategy(
    myMatchup: SleeperMatchup,
    opponentMatchup: SleeperMatchup,
    teamSituation: TeamSituationContext,
    myRoster: SleeperRoster,
    opponentRoster: SleeperRoster
  ): WeeklyStrategy {
    
    const projectedDiff = myMatchup.points - opponentMatchup.points;
    const myAvgPoints = (myRoster.settings?.fpts || 0) / Math.max((myRoster.settings?.wins || 0) + (myRoster.settings?.losses || 0), 1);
    const oppAvgPoints = (opponentRoster.settings?.fpts || 0) / Math.max((opponentRoster.settings?.wins || 0) + (opponentRoster.settings?.losses || 0), 1);
    
    let gameScript: WeeklyStrategy['gameScript'] = 'balanced';
    let riskLevel: WeeklyStrategy['recommendedRiskLevel'] = 'moderate';
    const reasoning: string[] = [];
    
    // Determine strategy based on YOUR situation
    if (teamSituation.recordSituation === 'desperate') {
      gameScript = 'hail_mary';
      riskLevel = 'desperate';
      reasoning.push('Desperate for wins - take maximum risks');
      reasoning.push('Play highest ceiling players regardless of floor');
    } else if (teamSituation.playoffImplications.mustWinWeeks.length > 0) {
      gameScript = 'high_ceiling';
      riskLevel = 'aggressive';
      reasoning.push('Must-win situation - prioritize upside');
    } else if (teamSituation.playoffImplications.canAffordLoss) {
      gameScript = 'safe_floor';
      riskLevel = 'conservative';
      reasoning.push('Comfortable position - avoid unnecessary risks');
    }
    
    // Adjust based on projected matchup
    if (oppAvgPoints > myAvgPoints + 15) {
      gameScript = 'high_ceiling';
      riskLevel = 'aggressive';
      reasoning.push('Facing strong opponent - need big performances');
    } else if (myAvgPoints > oppAvgPoints + 15) {
      gameScript = 'safe_floor';
      reasoning.push('Favored to win - play it safe');
    }
    
    return {
      gameScript,
      reasoning,
      recommendedRiskLevel: riskLevel,
      targetScore: oppAvgPoints + 10, // Beat opponent average + buffer
      opponentAnalysis: {
        projectedScore: oppAvgPoints,
        strengths: this.analyzeOpponentStrengths(opponentRoster),
        weaknesses: this.analyzeOpponentWeaknesses(opponentRoster),
        expectedGameflow: projectedDiff > 10 ? 'blowout' : projectedDiff > 5 ? 'competitive' : 'close'
      }
    };
  }

  // Enhanced start/sit with team situation context
  enhanceStartSitWithContext(
    baseRecommendations: PersonalizedStartSitRecommendation[],
    weeklyStrategy: WeeklyStrategy,
    teamSituation: TeamSituationContext,
    myRoster: SleeperRoster,
    players: Map<string, SleeperPlayer>
  ): ContextualRecommendation[] {
    
    return baseRecommendations.map(rec => {
      const contextualFactors: ContextualRecommendation['situationalFactors'] = {
        weeklyStrategy: weeklyStrategy.gameScript,
        leagueContext: [],
        alternativeIfInjured: this.findAlternative(rec.player, myRoster, players),
        riskAssessment: 'medium'
      };

      // Adjust recommendation based on strategy
      if (weeklyStrategy.gameScript === 'hail_mary' && rec.player.position !== 'K' && rec.player.position !== 'DEF') {
        // In desperate situations, prioritize ceiling over floor
        const hasHighCeiling = this.hasHighCeiling(rec.player);
        if (hasHighCeiling && rec.recommendation === 'sit') {
          rec.recommendation = 'flex_play';
          rec.confidence += 15;
          contextualFactors.leagueContext.push('Desperate situation - taking ceiling risk');
          contextualFactors.riskAssessment = 'high';
        }
      } else if (weeklyStrategy.gameScript === 'safe_floor') {
        // In safe situations, prioritize consistency
        const isConsistent = this.isConsistentPlayer(rec.player);
        if (isConsistent && rec.recommendation === 'flex_play') {
          rec.recommendation = 'strong_start';
          rec.confidence += 10;
          contextualFactors.leagueContext.push('Safe situation - prioritizing floor');
          contextualFactors.riskAssessment = 'low';
        }
      }

      // Add playoff context
      if (teamSituation.playoffImplications.tiebreakersNeeded === 'points') {
        contextualFactors.leagueContext.push('Points matter for tiebreakers - avoid duds');
      }

      return {
        ...rec,
        situationalFactors: contextualFactors
      };
    });
  }

  // Enhanced waiver targets with strategic context
  enhanceWaiverTargetsWithContext(
    baseTargets: PersonalizedWaiverTarget[],
    teamSituation: TeamSituationContext,
    weeklyStrategy: WeeklyStrategy,
    league: SleeperLeague
  ): ContextualWaiverTarget[] {
    
    return baseTargets.map(target => {
      const strategicValue: ContextualWaiverTarget['strategicValue'] = {
        immediateNeed: 5,
        futureValue: 5,
        opportunityCost: 'Low',
        competitionLevel: 'medium',
        timingSuggestion: 'claim_now'
      };

      // Adjust based on team situation
      if (teamSituation.recordSituation === 'desperate') {
        // Desperate teams need immediate help
        if (target.expectedImpact === 'immediate_starter') {
          strategicValue.immediateNeed = 10;
          strategicValue.futureValue = 3;
          strategicValue.timingSuggestion = 'claim_now';
          target.bidRecommendation.faabPercent += 10;
        }
      } else if (teamSituation.recordSituation === 'comfortable') {
        // Comfortable teams can focus on future value
        if (target.expectedImpact === 'future_value') {
          strategicValue.immediateNeed = 2;
          strategicValue.futureValue = 9;
          strategicValue.timingSuggestion = 'speculative_add';
        }
      }

      // Adjust for playoff implications
      if (teamSituation.playoffImplications.currentPlayoffChance < 30) {
        // Low playoff chance - need immediate impact
        strategicValue.immediateNeed += 3;
        target.reasoning.push('Low playoff odds - need immediate impact');
      } else if (teamSituation.playoffImplications.currentPlayoffChance > 80) {
        // High playoff chance - can think ahead
        strategicValue.futureValue += 2;
        target.reasoning.push('Strong playoff position - can add depth/upside');
      }

      // League size considerations
      if (league.total_rosters >= 12) {
        strategicValue.competitionLevel = 'high';
        target.bidRecommendation.faabPercent += 3;
        target.reasoning.push('Deep league - quality additions are rare');
      }

      return {
        ...target,
        strategicValue
      };
    });
  }

  // Helper methods
  private calculatePlayoffChance(standing: number, record: any, weeksRemaining: number, playoffSpots: number): number {
    const currentWinPct = record.wins / Math.max(record.wins + record.losses, 1);
    const spotsFromPlayoffs = Math.max(0, standing - playoffSpots);
    
    // Simple heuristic - would need more sophisticated calculation in practice
    if (standing <= playoffSpots) return Math.min(95, 70 + currentWinPct * 25);
    if (spotsFromPlayoffs <= 2 && currentWinPct > 0.4) return Math.max(20, 60 - spotsFromPlayoffs * 15);
    return Math.max(5, 40 - spotsFromPlayoffs * 10);
  }

  private calculateMustWinWeeks(record: any, weeksRemaining: number, playoffChance: number): number[] {
    if (playoffChance < 30) {
      // Need to win most remaining games
      return Array.from({length: Math.min(weeksRemaining, 4)}, (_, i) => i + 1);
    }
    return [];
  }

  private analyzeRosterMaturity(roster: SleeperRoster, seasonMatchups: Map<number, SleeperMatchup[]>): TeamSituationContext['rosterMaturity'] {
    // Simple heuristic based on performance consistency
    const avgPoints = (roster.settings?.fpts || 0) / Math.max((roster.settings?.wins || 0) + (roster.settings?.losses || 0), 1);
    
    if (avgPoints > 130) return { phase: 'peak', timeline: 'win_now', keyDecisions: ['Maximize current talent'] };
    if (avgPoints > 110) return { phase: 'competing', timeline: 'win_now', keyDecisions: ['Add missing pieces'] };
    if (avgPoints > 90) return { phase: 'building', timeline: 'next_year', keyDecisions: ['Develop young talent'] };
    return { phase: 'decline', timeline: 'multi_year', keyDecisions: ['Consider rebuild'] };
  }

  private analyzeOpponentStrengths(opponentRoster: SleeperRoster): string[] {
    const avgPoints = (opponentRoster.settings?.fpts || 0) / Math.max((opponentRoster.settings?.wins || 0) + (opponentRoster.settings?.losses || 0), 1);
    const strengths: string[] = [];
    
    if (avgPoints > 120) strengths.push('High-scoring offense');
    if ((opponentRoster.settings?.wins || 0) > (opponentRoster.settings?.losses || 0)) strengths.push('Good game management');
    
    return strengths;
  }

  private analyzeOpponentWeaknesses(opponentRoster: SleeperRoster): string[] {
    const avgPoints = (opponentRoster.settings?.fpts || 0) / Math.max((opponentRoster.settings?.wins || 0) + (opponentRoster.settings?.losses || 0), 1);
    const weaknesses: string[] = [];
    
    if (avgPoints < 100) weaknesses.push('Low-scoring lineup');
    if ((opponentRoster.settings?.losses || 0) > (opponentRoster.settings?.wins || 0)) weaknesses.push('Inconsistent performance');
    
    return weaknesses;
  }

  private findAlternative(player: SleeperPlayer, roster: SleeperRoster, players: Map<string, SleeperPlayer>): SleeperPlayer | null {
    // Find backup at same position
    const alternatives = roster.players
      .map(id => players.get(id))
      .filter(p => p && p.position === player.position && p.player_id !== player.player_id);
    
    return alternatives[0] || null;
  }

  private hasHighCeiling(player: SleeperPlayer): boolean {
    // Simple heuristic - would use actual performance data
    return ['WR', 'RB'].includes(player.position) && (player.years_exp || 0) < 5;
  }

  private isConsistentPlayer(player: SleeperPlayer): boolean {
    // Simple heuristic - would use actual variance data
    return ['QB', 'TE'].includes(player.position) || (player.years_exp || 0) > 5;
  }
}

export const advancedTeamStrategy = new AdvancedTeamStrategy();