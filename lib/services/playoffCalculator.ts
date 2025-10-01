// Playoff Probability Calculator Service
export interface PlayoffSimulation {
  teamId: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  remainingSchedule: number[]; // opponent roster IDs
}

export interface PlayoffProbability {
  teamId: number;
  teamName: string;
  currentRecord: string;
  playoffProbability: number;
  championshipProbability: number;
  projectedWins: number;
  projectedLosses: number;
  strengthOfSchedule: number;
  clinchScenarios: string[];
  eliminationScenarios: string[];
}

export interface SimulationResult {
  probabilities: PlayoffProbability[];
  totalSimulations: number;
  avgPlayoffSpots: number;
}

class PlayoffCalculatorService {
  private readonly SIMULATIONS = 10000;
  
  /**
   * Calculate playoff probabilities for all teams in a league
   */
  async calculatePlayoffProbabilities(
    teams: PlayoffSimulation[],
    leagueSettings: {
      playoffTeams: number;
      regularSeasonWeeks: number;
      currentWeek: number;
    }
  ): Promise<SimulationResult> {
    const simulations: PlayoffSimulation[][] = [];
    
    // Run Monte Carlo simulations
    for (let i = 0; i < this.SIMULATIONS; i++) {
      simulations.push(this.simulateRestOfSeason(teams, leagueSettings));
    }
    
    // Calculate probabilities from simulations
    const probabilities = this.calculateProbabilitiesFromSimulations(
      teams,
      simulations,
      leagueSettings.playoffTeams
    );
    
    return {
      probabilities,
      totalSimulations: this.SIMULATIONS,
      avgPlayoffSpots: leagueSettings.playoffTeams
    };
  }
  
  /**
   * Simulate the rest of the season for all teams
   */
  private simulateRestOfSeason(
    teams: PlayoffSimulation[],
    leagueSettings: { regularSeasonWeeks: number; currentWeek: number }
  ): PlayoffSimulation[] {
    const simulatedTeams = teams.map(team => ({ ...team }));
    const remainingWeeks = leagueSettings.regularSeasonWeeks - leagueSettings.currentWeek;
    
    for (let week = 0; week < remainingWeeks; week++) {
      // Simulate each matchup for this week
      const matchups = this.createMatchupsForWeek(simulatedTeams, week);
      
      matchups.forEach(({ team1, team2 }) => {
        const winner = this.simulateGame(team1, team2);
        
        if (winner === team1.teamId) {
          team1.wins++;
          team2.losses++;
        } else if (winner === team2.teamId) {
          team2.wins++;
          team1.losses++;
        } else {
          // Tie
          team1.ties++;
          team2.ties++;
        }
        
        // Add simulated points
        const team1Points = this.generateGameScore(team1);
        const team2Points = this.generateGameScore(team2);
        
        team1.pointsFor += team1Points;
        team1.pointsAgainst += team2Points;
        team2.pointsFor += team2Points;
        team2.pointsAgainst += team1Points;
      });
    }
    
    return simulatedTeams;
  }
  
  /**
   * Create matchups for a given week based on remaining schedules
   */
  private createMatchupsForWeek(
    teams: PlayoffSimulation[],
    weekIndex: number
  ): Array<{ team1: PlayoffSimulation; team2: PlayoffSimulation }> {
    const matchups: Array<{ team1: PlayoffSimulation; team2: PlayoffSimulation }> = [];
    const usedTeams = new Set<number>();
    
    teams.forEach(team => {
      if (usedTeams.has(team.teamId)) return;
      
      const opponentId = team.remainingSchedule[weekIndex];
      const opponent = teams.find(t => t.teamId === opponentId);
      
      if (opponent && !usedTeams.has(opponent.teamId)) {
        matchups.push({ team1: team, team2: opponent });
        usedTeams.add(team.teamId);
        usedTeams.add(opponent.teamId);
      }
    });
    
    return matchups;
  }
  
  /**
   * Simulate a single game between two teams
   */
  private simulateGame(team1: PlayoffSimulation, team2: PlayoffSimulation): number | null {
    // Calculate team strength based on points per game
    const gamesPlayed1 = team1.wins + team1.losses + team1.ties;
    const gamesPlayed2 = team2.wins + team2.losses + team2.ties;
    
    const avgPoints1 = gamesPlayed1 > 0 ? team1.pointsFor / gamesPlayed1 : 100;
    const avgPoints2 = gamesPlayed2 > 0 ? team2.pointsFor / gamesPlayed2 : 100;
    
    // Add some randomness (standard deviation ~20% of average)
    const score1 = this.normalRandom(avgPoints1, avgPoints1 * 0.2);
    const score2 = this.normalRandom(avgPoints2, avgPoints2 * 0.2);
    
    if (Math.abs(score1 - score2) < 1) {
      return null; // Tie
    }
    
    return score1 > score2 ? team1.teamId : team2.teamId;
  }
  
  /**
   * Generate a realistic game score for a team
   */
  private generateGameScore(team: PlayoffSimulation): number {
    const gamesPlayed = team.wins + team.losses + team.ties;
    const avgPoints = gamesPlayed > 0 ? team.pointsFor / gamesPlayed : 100;
    
    return Math.max(50, this.normalRandom(avgPoints, avgPoints * 0.15));
  }
  
  /**
   * Generate a random number from normal distribution
   */
  private normalRandom(mean: number, stdDev: number): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
  }
  
  /**
   * Calculate probabilities from all simulations
   */
  private calculateProbabilitiesFromSimulations(
    originalTeams: PlayoffSimulation[],
    simulations: PlayoffSimulation[][],
    playoffSpots: number
  ): PlayoffProbability[] {
    const teamStats = new Map<number, {
      playoffAppearances: number;
      championships: number;
      totalWins: number;
      totalLosses: number;
    }>();
    
    // Initialize stats
    originalTeams.forEach(team => {
      teamStats.set(team.teamId, {
        playoffAppearances: 0,
        championships: 0,
        totalWins: 0,
        totalLosses: 0
      });
    });
    
    // Process each simulation
    simulations.forEach(simTeams => {
      // Sort by record for playoff seeding
      const sortedTeams = [...simTeams].sort((a, b) => {
        const aWinPct = a.wins / Math.max(a.wins + a.losses + a.ties, 1);
        const bWinPct = b.wins / Math.max(b.wins + b.losses + b.ties, 1);
        
        if (aWinPct !== bWinPct) return bWinPct - aWinPct;
        return b.pointsFor - a.pointsFor; // Tiebreaker
      });
      
      // Award playoff appearances and championships
      sortedTeams.slice(0, playoffSpots).forEach((team, index) => {
        const stats = teamStats.get(team.teamId)!;
        stats.playoffAppearances++;
        
        if (index === 0) { // Top seed has highest championship probability
          stats.championships += 0.3;
        } else if (index < playoffSpots / 2) {
          stats.championships += 0.2;
        } else {
          stats.championships += 0.1;
        }
      });
      
      // Track projected wins/losses
      simTeams.forEach(team => {
        const stats = teamStats.get(team.teamId)!;
        stats.totalWins += team.wins;
        stats.totalLosses += team.losses;
      });
    });
    
    // Convert to probability objects
    return originalTeams.map(team => {
      const stats = teamStats.get(team.teamId)!;
      const gamesPlayed = team.wins + team.losses + team.ties;
      
      return {
        teamId: team.teamId,
        teamName: `Team ${team.teamId}`,
        currentRecord: `${team.wins}-${team.losses}${team.ties > 0 ? `-${team.ties}` : ''}`,
        playoffProbability: (stats.playoffAppearances / this.SIMULATIONS) * 100,
        championshipProbability: (stats.championships / this.SIMULATIONS) * 100,
        projectedWins: stats.totalWins / this.SIMULATIONS,
        projectedLosses: stats.totalLosses / this.SIMULATIONS,
        strengthOfSchedule: this.calculateStrengthOfSchedule(team, originalTeams),
        clinchScenarios: this.getCliinchScenarios(team, originalTeams, playoffSpots),
        eliminationScenarios: this.getEliminationScenarios(team, originalTeams, playoffSpots)
      };
    });
  }
  
  /**
   * Calculate strength of schedule (0-1, higher = harder)
   */
  private calculateStrengthOfSchedule(
    team: PlayoffSimulation,
    allTeams: PlayoffSimulation[]
  ): number {
    if (team.remainingSchedule.length === 0) return 0.5;
    
    let totalOpponentWinPct = 0;
    let validOpponents = 0;
    
    team.remainingSchedule.forEach(opponentId => {
      const opponent = allTeams.find(t => t.teamId === opponentId);
      if (opponent) {
        const gamesPlayed = opponent.wins + opponent.losses + opponent.ties;
        if (gamesPlayed > 0) {
          totalOpponentWinPct += opponent.wins / gamesPlayed;
          validOpponents++;
        }
      }
    });
    
    return validOpponents > 0 ? totalOpponentWinPct / validOpponents : 0.5;
  }
  
  /**
   * Get scenarios where team clinches playoffs
   */
  private getCliinchScenarios(
    team: PlayoffSimulation,
    allTeams: PlayoffSimulation[],
    playoffSpots: number
  ): string[] {
    const scenarios: string[] = [];
    const remainingGames = team.remainingSchedule.length;
    
    if (remainingGames === 0) return scenarios;
    
    // Calculate magic number (wins needed to guarantee playoffs)
    const currentWins = team.wins;
    const maxPossibleWins = currentWins + remainingGames;
    
    // Simple heuristic: if you're in top half and win most games, you're likely in
    const gamesPlayed = team.wins + team.losses + team.ties;
    const currentWinPct = gamesPlayed > 0 ? team.wins / gamesPlayed : 0;
    
    if (currentWinPct > 0.7) {
      scenarios.push(`Win ${Math.ceil(remainingGames * 0.6)} of next ${remainingGames} games`);
    } else if (currentWinPct > 0.5) {
      scenarios.push(`Win ${Math.ceil(remainingGames * 0.8)} of next ${remainingGames} games`);
    } else {
      scenarios.push(`Win all remaining ${remainingGames} games`);
    }
    
    return scenarios;
  }
  
  /**
   * Get scenarios where team is eliminated
   */
  private getEliminationScenarios(
    team: PlayoffSimulation,
    allTeams: PlayoffSimulation[],
    playoffSpots: number
  ): string[] {
    const scenarios: string[] = [];
    const remainingGames = team.remainingSchedule.length;
    
    if (remainingGames === 0) return scenarios;
    
    const gamesPlayed = team.wins + team.losses + team.ties;
    const currentWinPct = gamesPlayed > 0 ? team.wins / gamesPlayed : 0;
    
    if (currentWinPct < 0.3) {
      scenarios.push(`Lose ${Math.ceil(remainingGames * 0.4)} of next ${remainingGames} games`);
    } else if (currentWinPct < 0.5) {
      scenarios.push(`Lose ${Math.ceil(remainingGames * 0.6)} of next ${remainingGames} games`);
    }
    
    return scenarios;
  }
}

export const playoffCalculatorService = new PlayoffCalculatorService();