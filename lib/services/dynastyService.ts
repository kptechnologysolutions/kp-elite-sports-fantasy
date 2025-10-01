// Dynasty League Service for keeper management, player values, and rookies
import { SleeperPlayer } from './sleeperService';

export interface DynastyPlayerValue {
  playerId: string;
  playerName: string;
  position: string;
  team: string | null;
  age: number | null;
  dynastyValue: number; // 1-100 scale
  oneQBValue: number;
  superflexValue: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  keeperValue: 'elite' | 'high' | 'medium' | 'low' | 'cut';
  injuryRisk: 'low' | 'medium' | 'high';
  breakoutCandidate: boolean;
  veteranDecline: boolean;
}

export interface RookieProfile {
  playerId: string;
  playerName: string;
  position: string;
  college: string;
  draftCapital: number; // NFL draft position
  situation: 'excellent' | 'good' | 'average' | 'poor';
  projectedValue: number;
  redshirtCandidate: boolean;
  immediateImpact: boolean;
}

export interface DynastyRoster {
  rosterId: number;
  playerValues: DynastyPlayerValue[];
  totalValue: number;
  averageAge: number;
  contendingWindow: 'now' | 'next-year' | 'rebuilding';
  keeperRecommendations: string[];
  tradeTargets: string[];
  sellCandidates: string[];
}

// Dynasty trade analysis interface
export interface DynastyTrade {
  team1Assets: string[];
  team2Assets: string[];
  team1Value: number;
  team2Value: number;
  fairness: 'heavily-favors-1' | 'favors-1' | 'fair' | 'favors-2' | 'heavily-favors-2';
  contendingImpact: string;
  rebuildingImpact: string;
}

class DynastyService {
  private dynastyValues: Map<string, DynastyPlayerValue> = new Map();
  private rookieProfiles: Map<string, RookieProfile> = new Map();
  
  /**
   * Initialize dynasty player values (would normally come from API)
   */
  async initializeDynastyValues(players: Map<string, SleeperPlayer>): Promise<void> {
    // Mock dynasty values based on position and age
    players.forEach((player, playerId) => {
      if (player.position && ['QB', 'RB', 'WR', 'TE'].includes(player.position)) {
        const dynastyValue = this.calculateDynastyValue(player);
        this.dynastyValues.set(playerId, dynastyValue);
      }
    });
  }
  
  /**
   * Calculate dynasty value for a player
   */
  private calculateDynastyValue(player: SleeperPlayer): DynastyPlayerValue {
    const age = player.age || 25;
    const position = player.position;
    
    // Base values by position and age
    let baseValue = 50;
    
    // Position adjustments
    if (position === 'QB') {
      baseValue = age < 24 ? 75 : age < 30 ? 65 : 40;
    } else if (position === 'RB') {
      baseValue = age < 24 ? 70 : age < 27 ? 60 : age < 30 ? 35 : 20;
    } else if (position === 'WR') {
      baseValue = age < 25 ? 65 : age < 30 ? 55 : age < 33 ? 40 : 25;
    } else if (position === 'TE') {
      baseValue = age < 26 ? 60 : age < 31 ? 50 : 30;
    }
    
    // Add randomness for realism
    const variance = Math.random() * 30 - 15; // -15 to +15
    const dynastyValue = Math.max(1, Math.min(100, baseValue + variance));
    
    // Determine trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let trendPercent = 0;
    
    if (age < 24) {
      trend = Math.random() > 0.3 ? 'up' : 'stable';
      trendPercent = Math.random() * 15;
    } else if (age > 29) {
      trend = Math.random() > 0.4 ? 'down' : 'stable';
      trendPercent = -(Math.random() * 12);
    }
    
    // Keeper value
    let keeperValue: DynastyPlayerValue['keeperValue'] = 'medium';
    if (dynastyValue > 80) keeperValue = 'elite';
    else if (dynastyValue > 65) keeperValue = 'high';
    else if (dynastyValue < 30) keeperValue = 'cut';
    else if (dynastyValue < 45) keeperValue = 'low';
    
    return {
      playerId: player.player_id,
      playerName: player.full_name,
      position: player.position,
      team: player.team,
      age: player.age,
      dynastyValue: Math.round(dynastyValue),
      oneQBValue: Math.round(dynastyValue * 0.9), // Slightly lower for 1QB
      superflexValue: Math.round(dynastyValue * (position === 'QB' ? 1.2 : 1.0)),
      trend,
      trendPercent: Math.round(trendPercent),
      keeperValue,
      injuryRisk: this.calculateInjuryRisk(player),
      breakoutCandidate: age < 25 && dynastyValue > 40 && dynastyValue < 70,
      veteranDecline: age > 30 && trend === 'down'
    };
  }
  
  /**
   * Calculate injury risk
   */
  private calculateInjuryRisk(player: SleeperPlayer): DynastyPlayerValue['injuryRisk'] {
    const age = player.age || 25;
    const position = player.position;
    
    // RBs have higher injury risk, older players too
    if (position === 'RB' && age > 27) return 'high';
    if (age > 32) return 'high';
    if (position === 'RB' || age > 29) return 'medium';
    
    return 'low';
  }
  
  /**
   * Analyze dynasty roster
   */
  analyzeDynastyRoster(
    playerIds: string[],
    rosterId: number
  ): DynastyRoster {
    const playerValues = playerIds
      .map(id => this.dynastyValues.get(id))
      .filter(Boolean) as DynastyPlayerValue[];
    
    const totalValue = playerValues.reduce((sum, p) => sum + p.dynastyValue, 0);
    const averageAge = playerValues.reduce((sum, p) => sum + (p.age || 25), 0) / playerValues.length;
    
    // Determine contending window
    let contendingWindow: DynastyRoster['contendingWindow'] = 'rebuilding';
    if (totalValue > 800 && averageAge < 28) {
      contendingWindow = 'now';
    } else if (totalValue > 600 && averageAge < 30) {
      contendingWindow = 'next-year';
    }
    
    return {
      rosterId,
      playerValues,
      totalValue,
      averageAge: Math.round(averageAge * 10) / 10,
      contendingWindow,
      keeperRecommendations: this.getKeeperRecommendations(playerValues),
      tradeTargets: this.getTradeTargets(playerValues, contendingWindow),
      sellCandidates: this.getSellCandidates(playerValues, contendingWindow)
    };
  }
  
  /**
   * Get keeper recommendations
   */
  private getKeeperRecommendations(players: DynastyPlayerValue[]): string[] {
    return players
      .filter(p => p.keeperValue === 'elite' || p.keeperValue === 'high')
      .sort((a, b) => b.dynastyValue - a.dynastyValue)
      .slice(0, 8)
      .map(p => `${p.playerName} (${p.dynastyValue} pts)`);
  }
  
  /**
   * Get trade targets based on contending window
   */
  private getTradeTargets(
    players: DynastyPlayerValue[],
    window: DynastyRoster['contendingWindow']
  ): string[] {
    if (window === 'now') {
      return [
        'Target proven veterans for championship push',
        'Look for WRs in good situations',
        'Acquire reliable TEs',
        'Don\'t overpay for rookies'
      ];
    } else if (window === 'next-year') {
      return [
        'Target young players with upside',
        'Acquire draft picks',
        'Look for breakout candidates',
        'Avoid aging veterans'
      ];
    } else {
      return [
        'Trade veterans for picks',
        'Target rookie draft picks',
        'Acquire young players with potential',
        'Sell aging assets while they have value'
      ];
    }
  }
  
  /**
   * Get sell candidates
   */
  private getSellCandidates(
    players: DynastyPlayerValue[],
    window: DynastyRoster['contendingWindow']
  ): string[] {
    if (window === 'rebuilding') {
      return players
        .filter(p => p.age && p.age > 28 && p.dynastyValue > 50)
        .sort((a, b) => (b.age || 0) - (a.age || 0))
        .slice(0, 5)
        .map(p => `${p.playerName} (Age ${p.age}, ${p.dynastyValue} pts)`);
    }
    
    return players
      .filter(p => p.veteranDecline || (p.age && p.age > 32))
      .map(p => `${p.playerName} (${p.trend === 'down' ? 'Declining' : 'Old'})`);
  }
  
  /**
   * Evaluate dynasty trade
   */
  evaluateDynastyTrade(
    team1Assets: string[],
    team2Assets: string[],
    team1Window: DynastyRoster['contendingWindow'],
    team2Window: DynastyRoster['contendingWindow']
  ): DynastyTrade {
    const team1Value = team1Assets.reduce((sum, playerId) => {
      const player = this.dynastyValues.get(playerId);
      return sum + (player?.dynastyValue || 0);
    }, 0);
    
    const team2Value = team2Assets.reduce((sum, playerId) => {
      const player = this.dynastyValues.get(playerId);
      return sum + (player?.dynastyValue || 0);
    }, 0);
    
    const valueDiff = Math.abs(team1Value - team2Value);
    const avgValue = (team1Value + team2Value) / 2;
    const diffPercent = valueDiff / avgValue;
    
    let fairness: DynastyTrade['fairness'] = 'fair';
    if (diffPercent > 0.3) {
      fairness = team1Value > team2Value ? 'heavily-favors-1' : 'heavily-favors-2';
    } else if (diffPercent > 0.15) {
      fairness = team1Value > team2Value ? 'favors-1' : 'favors-2';
    }
    
    return {
      team1Assets,
      team2Assets,
      team1Value,
      team2Value,
      fairness,
      contendingImpact: this.getTradeImpact(team1Assets, 'now'),
      rebuildingImpact: this.getTradeImpact(team1Assets, 'rebuilding')
    };
  }
  
  /**
   * Get trade impact description
   */
  private getTradeImpact(assets: string[], window: DynastyRoster['contendingWindow']): string {
    const players = assets.map(id => this.dynastyValues.get(id)).filter(Boolean);
    const avgAge = players.reduce((sum, p) => sum + (p!.age || 25), 0) / players.length;
    const totalValue = players.reduce((sum, p) => sum + p!.dynastyValue, 0);
    
    if (window === 'now') {
      if (avgAge > 28) return 'Good for immediate impact';
      return 'Mixed value for contending';
    } else {
      if (avgAge < 26) return 'Excellent for rebuilding';
      return 'Limited long-term value';
    }
  }
  
  /**
   * Get dynasty player value
   */
  getDynastyValue(playerId: string): DynastyPlayerValue | undefined {
    return this.dynastyValues.get(playerId);
  }
  
  /**
   * Get all dynasty values
   */
  getAllDynastyValues(): Map<string, DynastyPlayerValue> {
    return this.dynastyValues;
  }
  
  /**
   * Generate rookie draft rankings
   */
  generateRookieRankings(year: string = '2025'): RookieProfile[] {
    // Mock rookie data - in real app, this would come from API
    const mockRookies: RookieProfile[] = [
      {
        playerId: 'rookie_2025_001',
        playerName: 'Caleb Williams',
        position: 'QB',
        college: 'USC',
        draftCapital: 1,
        situation: 'good',
        projectedValue: 85,
        redshirtCandidate: false,
        immediateImpact: true
      },
      {
        playerId: 'rookie_2025_002',
        playerName: 'Rome Odunze',
        position: 'WR',
        college: 'Washington',
        draftCapital: 9,
        situation: 'excellent',
        projectedValue: 75,
        redshirtCandidate: false,
        immediateImpact: true
      }
      // Add more rookies...
    ];
    
    return mockRookies.sort((a, b) => b.projectedValue - a.projectedValue);
  }
}

export const dynastyService = new DynastyService();