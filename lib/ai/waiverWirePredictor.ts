// AI-powered waiver wire predictor
import OpenAI from 'openai';
import { Player } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

export interface WaiverWirePrediction {
  player: Player;
  pickupPriority: 'must-add' | 'high' | 'medium' | 'low' | 'avoid';
  confidenceScore: number; // 0-100
  projectedValue: number;
  reasoning: string[];
  relatedNews: string[];
  seasonProjection: {
    remainingGames: number;
    projectedPointsPerGame: number;
    totalProjectedPoints: number;
    playoffScheduleStrength: number;
  };
  competitiveAnalysis: {
    percentOwned: number;
    percentStarted: number;
    waiverClaimProjection: number; // Projected FAAB % or waiver priority needed
    expectedCompetition: 'high' | 'medium' | 'low';
  };
  comparisonPlayers: Array<{
    name: string;
    position: string;
    team: string;
    percentOwned: number;
    avgPoints: number;
  }>;
}

export interface WaiverWireSettings {
  leagueSize: number;
  scoringType: 'PPR' | 'Half-PPR' | 'Standard';
  rosterNeeds: string[]; // Positions needed
  faabBudgetRemaining?: number;
  waiverPriority?: number;
  playoffBound: boolean;
  weeklyMatchupImportance: 'must-win' | 'important' | 'normal';
}

export class WaiverWirePredictor {
  // Analyze trending players based on recent performance and news
  async analyzeTrendingPlayers(
    availablePlayers: Player[],
    settings: WaiverWireSettings
  ): Promise<WaiverWirePrediction[]> {
    try {
      // Sort players by recent performance uptick
      const trendingPlayers = this.identifyTrendingPlayers(availablePlayers);
      
      // Get AI predictions for top trending players
      const predictions: WaiverWirePrediction[] = [];
      
      for (const player of trendingPlayers.slice(0, 10)) {
        const prediction = await this.predictPlayerValue(player, settings);
        predictions.push(prediction);
      }
      
      // Sort by pickup priority and confidence
      return predictions.sort((a, b) => {
        const priorityOrder = { 'must-add': 5, 'high': 4, 'medium': 3, 'low': 2, 'avoid': 1 };
        const aPriority = priorityOrder[a.pickupPriority];
        const bPriority = priorityOrder[b.pickupPriority];
        
        if (aPriority !== bPriority) return bPriority - aPriority;
        return b.confidenceScore - a.confidenceScore;
      });
    } catch (error) {
      console.error('Error analyzing trending players:', error);
      return [];
    }
  }

  // Identify trending players based on recent stats
  private identifyTrendingPlayers(players: Player[]): Player[] {
    return players
      .filter(p => {
        // Filter for relevant positions and unowned players
        const relevantPosition = ['QB', 'RB', 'WR', 'TE'].includes(p.position);
        const recentPoints = p.stats?.fantasyPoints || 0;
        return relevantPosition && recentPoints > 0;
      })
      .sort((a, b) => {
        // Sort by recent fantasy points and trend
        const aPoints = a.stats?.fantasyPoints || 0;
        const bPoints = b.stats?.fantasyPoints || 0;
        return bPoints - aPoints;
      });
  }

  // Get AI prediction for a specific player
  private async predictPlayerValue(
    player: Player,
    settings: WaiverWireSettings
  ): Promise<WaiverWirePrediction> {
    try {
      const prompt = this.buildPredictionPrompt(player, settings);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert fantasy football analyst specializing in waiver wire predictions. 
                     Analyze players based on recent performance, opportunity, matchups, and team situations.
                     Provide actionable insights for fantasy managers.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800,
      });

      const analysis = completion.choices[0].message.content || '';
      return this.parsePredictionResponse(player, analysis, settings);
    } catch (error) {
      console.error('Error getting AI prediction:', error);
      return this.getDefaultPrediction(player);
    }
  }

  private buildPredictionPrompt(player: Player, settings: WaiverWireSettings): string {
    return `Analyze this player for waiver wire pickup in a ${settings.leagueSize}-team ${settings.scoringType} league:

Player: ${player.name}
Position: ${player.position}
Team: ${player.team}
Recent Points: ${player.stats?.fantasyPoints || 0}
Projected Points: ${player.stats?.projectedPoints || 0}
Status: ${player.status?.gameStatus || 'healthy'}

Roster Needs: ${settings.rosterNeeds.join(', ')}
Playoff Bound: ${settings.playoffBound ? 'Yes' : 'No'}
Match Importance: ${settings.weeklyMatchupImportance}
${settings.faabBudgetRemaining ? `FAAB Remaining: $${settings.faabBudgetRemaining}` : ''}

Provide:
1. Pickup priority (must-add/high/medium/low/avoid)
2. Confidence score (0-100)
3. 3-4 key reasons for the recommendation
4. Season-long outlook
5. FAAB bid recommendation (if applicable)
6. Similar players for comparison

Format as JSON.`;
  }

  private parsePredictionResponse(
    player: Player,
    aiResponse: string,
    settings: WaiverWireSettings
  ): WaiverWirePrediction {
    try {
      // Try to parse AI response as JSON
      const parsed = JSON.parse(aiResponse);
      
      return {
        player,
        pickupPriority: parsed.priority || 'medium',
        confidenceScore: parsed.confidence || 50,
        projectedValue: parsed.projectedValue || player.stats?.projectedPoints || 0,
        reasoning: parsed.reasoning || ['Recent performance trending upward'],
        relatedNews: parsed.news || [],
        seasonProjection: {
          remainingGames: parsed.remainingGames || 13,
          projectedPointsPerGame: parsed.ppg || 10,
          totalProjectedPoints: parsed.totalPoints || 130,
          playoffScheduleStrength: parsed.playoffSOS || 5,
        },
        competitiveAnalysis: {
          percentOwned: parsed.percentOwned || 15,
          percentStarted: parsed.percentStarted || 5,
          waiverClaimProjection: parsed.faabBid || 10,
          expectedCompetition: parsed.competition || 'medium',
        },
        comparisonPlayers: parsed.comparisons || [],
      };
    } catch (error) {
      // Fallback parsing if not valid JSON
      return this.getDefaultPrediction(player);
    }
  }

  private getDefaultPrediction(player: Player): WaiverWirePrediction {
    const recentPoints = player.stats?.fantasyPoints || 0;
    const projectedPoints = player.stats?.projectedPoints || 0;
    
    // Simple heuristic-based priority
    let priority: WaiverWirePrediction['pickupPriority'] = 'medium';
    let confidence = 50;
    
    if (recentPoints > 20) {
      priority = 'high';
      confidence = 70;
    } else if (recentPoints > 15) {
      priority = 'medium';
      confidence = 60;
    } else if (recentPoints < 5) {
      priority = 'low';
      confidence = 30;
    }
    
    return {
      player,
      pickupPriority: priority,
      confidenceScore: confidence,
      projectedValue: projectedPoints || recentPoints * 0.8,
      reasoning: [
        `Recent ${recentPoints} point performance`,
        `${player.position} with potential upside`,
        'Available in most leagues'
      ],
      relatedNews: [],
      seasonProjection: {
        remainingGames: 13,
        projectedPointsPerGame: recentPoints * 0.8,
        totalProjectedPoints: recentPoints * 0.8 * 13,
        playoffScheduleStrength: 5,
      },
      competitiveAnalysis: {
        percentOwned: 20,
        percentStarted: 10,
        waiverClaimProjection: Math.min(15, Math.floor(recentPoints / 2)),
        expectedCompetition: recentPoints > 15 ? 'high' : 'medium',
      },
      comparisonPlayers: [],
    };
  }

  // Get breakout candidates based on opportunity changes
  async findBreakoutCandidates(
    availablePlayers: Player[],
    leagueNews: string[]
  ): Promise<Player[]> {
    // Analyze news for opportunity changes (injuries, trades, etc.)
    const opportunityPlayers = availablePlayers.filter(player => {
      // Check if player's team situation has improved
      const hasOpportunity = leagueNews.some(news => 
        news.toLowerCase().includes(player.name.toLowerCase()) ||
        news.toLowerCase().includes(player.team.toLowerCase())
      );
      
      // Check for backup RBs/WRs who might get more touches
      const isBackup = player.stats?.fantasyPoints && player.stats.fantasyPoints < 10;
      const goodPosition = ['RB', 'WR'].includes(player.position);
      
      return hasOpportunity || (isBackup && goodPosition);
    });
    
    return opportunityPlayers.slice(0, 5);
  }

  // Calculate FAAB bid recommendation
  calculateFAABBid(
    prediction: WaiverWirePrediction,
    settings: WaiverWireSettings
  ): number {
    const budget = settings.faabBudgetRemaining || 100;
    const weeksRemaining = 17 - (prediction.player.stats?.week || 4);
    
    // Base bid on priority and remaining budget
    const priorityMultipliers = {
      'must-add': 0.4,
      'high': 0.25,
      'medium': 0.15,
      'low': 0.05,
      'avoid': 0
    };
    
    const baseBid = budget * priorityMultipliers[prediction.pickupPriority];
    
    // Adjust for confidence and weeks remaining
    const confidenceAdjustment = prediction.confidenceScore / 100;
    const urgencyAdjustment = settings.weeklyMatchupImportance === 'must-win' ? 1.5 : 1;
    
    const finalBid = Math.floor(baseBid * confidenceAdjustment * urgencyAdjustment);
    
    return Math.min(finalBid, budget);
  }
}

export const waiverWirePredictor = new WaiverWirePredictor();