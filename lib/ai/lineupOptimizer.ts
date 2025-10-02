// AI-Powered Lineup Optimizer
// Uses OpenAI GPT-4 and custom ML models for lineup recommendations

import OpenAI from 'openai';
import { Player, Team } from '@/lib/types';
import { scoringService, ScoringSettings } from '@/lib/services/scoringService';
import { SleeperLeague } from '@/lib/services/sleeperService';

// Initialize OpenAI (API key would come from environment variables)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true // For demo purposes only
});

export interface LineupRecommendation {
  starters: Player[];
  bench: Player[];
  flex: Player[];
  reasoning: string;
  confidence: number;
  keyInsights: string[];
  riskFactors: string[];
  upside: string[];
}

export interface PlayerAnalysis {
  player: Player;
  startSitRecommendation: 'START' | 'SIT' | 'FLEX';
  confidence: number;
  projectedPoints: number;
  ceiling: number;
  floor: number;
  factors: {
    matchup: number; // -1 to 1 (bad to good)
    recentForm: number; // -1 to 1
    weather: number; // -1 to 1
    injury: number; // -1 to 1
    usage: number; // 0 to 1 (usage rate)
  };
  aiInsight: string;
}

export interface MatchupAdvantage {
  player: Player;
  opponent: string;
  advantage: number; // -10 to 10
  keyFactors: string[];
}

class LineupOptimizer {
  private weatherCache: Map<string, any> = new Map();
  private injuryCache: Map<string, any> = new Map();
  private vegasCache: Map<string, any> = new Map();

  // Main optimization function
  async optimizeLineup(
    team: Team,
    week: number,
    settings: {
      scoringType?: 'PPR' | 'STANDARD' | 'HALF_PPR';
      riskTolerance: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
      stackPlayers?: boolean;
      avoidPlayers?: string[];
      league?: SleeperLeague; // For league-specific scoring
    }
  ): Promise<LineupRecommendation> {
    try {
      // Analyze each player
      const playerAnalyses = await Promise.all(
        team.players.map(player => this.analyzePlayer(player, week, settings))
      );

      // Sort by recommendation confidence and projected points
      playerAnalyses.sort((a, b) => {
        if (a.startSitRecommendation === 'START' && b.startSitRecommendation !== 'START') return -1;
        if (b.startSitRecommendation === 'START' && a.startSitRecommendation !== 'START') return 1;
        return b.projectedPoints - a.projectedPoints;
      });

      // Build optimal lineup based on positions
      const lineup = this.buildOptimalLineup(playerAnalyses, settings);

      // Get AI insights
      const aiInsights = await this.getAIInsights(lineup, playerAnalyses, week);

      return {
        ...lineup,
        reasoning: aiInsights.reasoning,
        confidence: this.calculateConfidence(playerAnalyses),
        keyInsights: aiInsights.keyInsights,
        riskFactors: aiInsights.riskFactors,
        upside: aiInsights.upside,
      };
    } catch (error) {
      console.error('Lineup optimization failed:', error);
      throw error;
    }
  }

  // Analyze individual player
  async analyzePlayer(
    player: Player,
    week: number,
    settings: any
  ): Promise<PlayerAnalysis> {
    // Get various data points
    const [matchupData, weatherData, vegasData] = await Promise.all([
      this.getMatchupData(player, week),
      this.getWeatherData(player.team, week),
      this.getVegasData(player.team, week),
    ]);

    // Calculate factors
    const factors = {
      matchup: this.calculateMatchupAdvantage(player, matchupData),
      recentForm: this.calculateRecentForm(player),
      weather: this.calculateWeatherImpact(player, weatherData),
      injury: this.calculateInjuryImpact(player),
      usage: this.calculateUsageRate(player),
    };

    // Calculate projections
    const baseProjection = player.stats?.projectedPoints || 0;
    const adjustedProjection = this.adjustProjection(baseProjection, factors, settings);
    
    // Determine recommendation
    const recommendation = this.determineRecommendation(
      adjustedProjection,
      factors,
      player.position
    );

    // Get AI insight for this specific player
    const aiInsight = await this.getPlayerInsight(player, factors, adjustedProjection);

    return {
      player,
      startSitRecommendation: recommendation,
      confidence: this.calculatePlayerConfidence(factors),
      projectedPoints: adjustedProjection.projected,
      ceiling: adjustedProjection.ceiling,
      floor: adjustedProjection.floor,
      factors,
      aiInsight,
    };
  }

  // Get matchup data from defensive rankings
  private async getMatchupData(player: Player, week: number): Promise<any> {
    // In production, this would fetch real defensive rankings
    // For demo, return mock data
    return {
      defenseRank: Math.floor(Math.random() * 32) + 1,
      pointsAllowed: Math.random() * 20 + 10,
      yardsAllowed: Math.random() * 300 + 200,
    };
  }

  // Get weather data
  private async getWeatherData(team: string, week: number): Promise<any> {
    const cached = this.weatherCache.get(`${team}-${week}`);
    if (cached) return cached;

    // In production, fetch from weather API
    const weatherData = {
      temperature: Math.random() * 40 + 30,
      windSpeed: Math.random() * 20,
      precipitation: Math.random() * 100,
      dome: Math.random() > 0.7,
    };

    this.weatherCache.set(`${team}-${week}`, weatherData);
    return weatherData;
  }

  // Get Vegas betting data
  private async getVegasData(team: string, week: number): Promise<any> {
    const cached = this.vegasCache.get(`${team}-${week}`);
    if (cached) return cached;

    // In production, fetch from odds API
    const vegasData = {
      teamTotal: Math.random() * 15 + 20,
      gameTotal: Math.random() * 20 + 40,
      spread: (Math.random() - 0.5) * 14,
      overUnder: Math.random() * 10 + 45,
    };

    this.vegasCache.set(`${team}-${week}`, vegasData);
    return vegasData;
  }

  // Calculate matchup advantage
  private calculateMatchupAdvantage(player: Player, matchupData: any): number {
    // Lower defense rank = better matchup
    const rankFactor = (32 - matchupData.defenseRank) / 32;
    const pointsFactor = matchupData.pointsAllowed / 30;
    
    return (rankFactor + pointsFactor) / 2 * 2 - 1; // Scale to -1 to 1
  }

  // Calculate recent form
  private calculateRecentForm(player: Player): number {
    // In production, analyze last 3 games
    // For demo, return random value
    return Math.random() * 2 - 1;
  }

  // Calculate weather impact
  private calculateWeatherImpact(player: Player, weatherData: any): number {
    if (weatherData.dome) return 0; // No weather impact in dome

    let impact = 0;
    
    // Wind affects passing game
    if (['QB', 'WR', 'TE'].includes(player.position)) {
      impact -= weatherData.windSpeed / 40; // Max -0.5 for 20mph wind
    }
    
    // Rain affects everyone
    impact -= weatherData.precipitation / 200; // Max -0.5 for heavy rain
    
    // Cold affects everyone slightly
    if (weatherData.temperature < 32) {
      impact -= 0.1;
    }
    
    return Math.max(-1, Math.min(1, impact));
  }

  // Calculate injury impact
  private calculateInjuryImpact(player: Player): number {
    if (!player.injuryStatus) return 0;
    
    const severity = player.injuryStatus.severity;
    switch (severity) {
      case 'out': return -1;
      case 'doubtful': return -0.8;
      case 'questionable': return -0.3;
      case 'probable': return -0.1;
      default: return 0;
    }
  }

  // Calculate usage rate
  private calculateUsageRate(player: Player): number {
    // In production, analyze snap counts and target share
    // For demo, return based on position
    const usage = {
      'QB': 0.95,
      'RB': Math.random() * 0.4 + 0.5,
      'WR': Math.random() * 0.3 + 0.4,
      'TE': Math.random() * 0.3 + 0.3,
      'K': 0.95,
      'DEF': 0.95,
    };
    
    return usage[player.position] || 0.5;
  }

  // Adjust projection based on factors
  private adjustProjection(
    base: number,
    factors: any,
    settings: any
  ): { projected: number; ceiling: number; floor: number } {
    let adjustment = 1;
    
    // Apply factor weights
    adjustment += factors.matchup * 0.25;
    adjustment += factors.recentForm * 0.20;
    adjustment += factors.weather * 0.15;
    adjustment += factors.injury * 0.30;
    adjustment += factors.usage * 0.10;
    
    const projected = base * adjustment;
    
    // Calculate ceiling and floor based on risk tolerance
    const variance = settings.riskTolerance === 'AGGRESSIVE' ? 0.4 : 
                     settings.riskTolerance === 'CONSERVATIVE' ? 0.2 : 0.3;
    
    return {
      projected: Math.max(0, projected),
      ceiling: projected * (1 + variance),
      floor: Math.max(0, projected * (1 - variance)),
    };
  }

  // Determine start/sit recommendation
  private determineRecommendation(
    projection: any,
    factors: any,
    position: string
  ): 'START' | 'SIT' | 'FLEX' {
    const score = projection.projected;
    
    // Position-specific thresholds
    const thresholds = {
      'QB': { start: 18, flex: 15 },
      'RB': { start: 12, flex: 8 },
      'WR': { start: 12, flex: 8 },
      'TE': { start: 10, flex: 7 },
      'K': { start: 8, flex: 6 },
      'DEF': { start: 8, flex: 6 },
    };
    
    const threshold = thresholds[position] || { start: 10, flex: 7 };
    
    // Adjust for injury
    const injuryAdjusted = score * (1 + factors.injury);
    
    if (injuryAdjusted >= threshold.start) return 'START';
    if (injuryAdjusted >= threshold.flex) return 'FLEX';
    return 'SIT';
  }

  // Build optimal lineup
  private buildOptimalLineup(
    analyses: PlayerAnalysis[],
    settings: any
  ): { starters: Player[]; bench: Player[]; flex: Player[] } {
    const starters: Player[] = [];
    const flex: Player[] = [];
    const bench: Player[] = [];
    
    // Position requirements (standard lineup)
    const requirements = {
      'QB': 1,
      'RB': 2,
      'WR': 2,
      'TE': 1,
      'FLEX': 1, // RB/WR/TE
      'K': 1,
      'DEF': 1,
    };
    
    // Fill required positions first
    for (const [position, count] of Object.entries(requirements)) {
      if (position === 'FLEX') continue; // Handle flex last
      
      const eligible = analyses.filter(a => 
        a.player.position === position && 
        !starters.includes(a.player)
      );
      
      const selected = eligible
        .sort((a, b) => b.projectedPoints - a.projectedPoints)
        .slice(0, count)
        .map(a => a.player);
      
      starters.push(...selected);
    }
    
    // Fill flex position
    const flexEligible = analyses.filter(a => 
      ['RB', 'WR', 'TE'].includes(a.player.position) && 
      !starters.includes(a.player)
    );
    
    if (flexEligible.length > 0) {
      const flexPlayer = flexEligible
        .sort((a, b) => b.projectedPoints - a.projectedPoints)[0];
      flex.push(flexPlayer.player);
    }
    
    // Everyone else goes to bench
    analyses.forEach(a => {
      if (!starters.includes(a.player) && !flex.includes(a.player)) {
        bench.push(a.player);
      }
    });
    
    return { starters, bench, flex };
  }

  // Get AI insights using OpenAI
  private async getAIInsights(
    lineup: any,
    analyses: PlayerAnalysis[],
    week: number
  ): Promise<any> {
    try {
      const prompt = this.buildAIPrompt(lineup, analyses, week);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert fantasy football analyst with deep knowledge of NFL statistics, matchups, and strategy. Provide concise, actionable insights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const response = completion.choices[0].message.content || '';
      return this.parseAIResponse(response);
    } catch (error) {
      console.error('OpenAI API error:', error);
      // Return default insights if AI fails
      return {
        reasoning: "Lineup optimized based on matchups and projections.",
        keyInsights: [
          "Strong matchups for key players",
          "Weather conditions favorable",
          "High-scoring game environment expected"
        ],
        riskFactors: [
          "Monitor injury reports before kickoff",
          "Check for late scratches"
        ],
        upside: [
          "Multiple players in high-total games",
          "Favorable game scripts expected"
        ]
      };
    }
  }

  // Build prompt for OpenAI
  private buildAIPrompt(lineup: any, analyses: PlayerAnalysis[], week: number): string {
    const starters = lineup.starters.map((p: Player) => `${p.name} (${p.position})`).join(', ');
    const flex = lineup.flex.map((p: Player) => `${p.name} (${p.position})`).join(', ');
    
    return `Analyze this Week ${week} fantasy football lineup:
    
    Starters: ${starters}
    Flex: ${flex}
    
    Key factors:
    - Top performer projections and matchups
    - Injury concerns
    - Weather impacts
    - Vegas game totals
    
    Provide:
    1. Brief reasoning for this lineup (2 sentences)
    2. 3 key insights
    3. 2 risk factors to monitor
    4. 2 upside scenarios`;
  }

  // Parse AI response
  private parseAIResponse(response: string): any {
    // Simple parsing - in production would use more sophisticated NLP
    const lines = response.split('\n').filter(line => line.trim());
    
    return {
      reasoning: lines[0] || "Optimal lineup based on projections.",
      keyInsights: lines.slice(1, 4).map(l => l.replace(/^[\d\-\*\s]+/, '')),
      riskFactors: lines.slice(4, 6).map(l => l.replace(/^[\d\-\*\s]+/, '')),
      upside: lines.slice(6, 8).map(l => l.replace(/^[\d\-\*\s]+/, '')),
    };
  }

  // Get player-specific insight
  private async getPlayerInsight(
    player: Player,
    factors: any,
    projection: any
  ): Promise<string> {
    const factorDescriptions = [];
    
    if (factors.matchup > 0.5) factorDescriptions.push('great matchup');
    if (factors.matchup < -0.5) factorDescriptions.push('tough matchup');
    if (factors.recentForm > 0.5) factorDescriptions.push('hot streak');
    if (factors.recentForm < -0.5) factorDescriptions.push('struggling recently');
    if (factors.weather < -0.3) factorDescriptions.push('weather concerns');
    if (factors.injury < -0.2) factorDescriptions.push('injury risk');
    if (factors.usage > 0.7) factorDescriptions.push('high usage');
    
    const description = factorDescriptions.length > 0 ? 
      factorDescriptions.join(', ') : 'stable floor';
    
    return `${player.name}: ${projection.projected.toFixed(1)} pts projected (${description}). ` +
           `Floor: ${projection.floor.toFixed(1)}, Ceiling: ${projection.ceiling.toFixed(1)}`;
  }

  // Calculate overall confidence
  private calculateConfidence(analyses: PlayerAnalysis[]): number {
    const confidences = analyses
      .filter(a => a.startSitRecommendation === 'START')
      .map(a => a.confidence);
    
    if (confidences.length === 0) return 0.5;
    
    return confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
  }

  // Calculate player confidence
  private calculatePlayerConfidence(factors: any): number {
    // Weight factors by importance
    const weights = {
      matchup: 0.3,
      recentForm: 0.2,
      weather: 0.1,
      injury: 0.3,
      usage: 0.1,
    };
    
    let confidence = 0.5; // Base confidence
    
    for (const [factor, weight] of Object.entries(weights)) {
      const value = factors[factor];
      // Convert factor (-1 to 1) to confidence contribution
      confidence += value * weight * 0.5;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }
}

// Export singleton instance
export const lineupOptimizer = new LineupOptimizer();