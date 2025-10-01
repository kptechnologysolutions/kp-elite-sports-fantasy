// ESPN Fantasy Football API Service
export interface ESPNAuth {
  espn_s2: string;
  SWID: string;
}

export interface ESPNLeague {
  id: number;
  name: string;
  season: number;
  size: number;
  scoringPeriodId: number;
  status: {
    currentMatchupPeriod: number;
    finalScoringPeriod: number;
    isActive: boolean;
  };
  settings: {
    playoffTeamCount: number;
    rosterSize: number;
    scoringSettings: { [key: string]: number };
  };
}

export interface ESPNTeam {
  id: number;
  name: string;
  abbrev: string;
  logoUrl?: string;
  owners: string[];
  record: {
    overall: {
      wins: number;
      losses: number;
      ties: number;
      percentage: number;
    };
  };
  points: {
    for: number;
    against: number;
  };
  roster: {
    entries: ESPNPlayer[];
  };
  currentProjectedTotal: number;
  currentPointsTotal: number;
}

export interface ESPNPlayer {
  playerId: number;
  playerName: string;
  position: string;
  team: string;
  lineupSlotId: number;
  points: number;
  projectedPoints: number;
  stats: { [key: string]: number };
  injured: boolean;
  injuryStatus?: string;
}

export interface ESPNMatchup {
  id: number;
  matchupPeriodId: number;
  home: {
    teamId: number;
    totalPoints: number;
    totalProjectedPoints: number;
  };
  away: {
    teamId: number;
    totalPoints: number;
    totalProjectedPoints: number;
  };
  winner?: 'home' | 'away' | 'tie';
}

class ESPNService {
  private baseUrl = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl';
  private auth: ESPNAuth | null = null;
  
  /**
   * Set authentication credentials
   */
  setAuth(auth: ESPNAuth): void {
    this.auth = auth;
  }
  
  /**
   * Make authenticated request to ESPN API
   */
  private async makeRequest(url: string): Promise<any> {
    if (!this.auth) {
      throw new Error('ESPN authentication required. Please provide espn_s2 and SWID cookies.');
    }
    
    const headers: Record<string, string> = {
      'Cookie': `espn_s2=${this.auth.espn_s2}; SWID=${this.auth.SWID}`,
      'Accept': 'application/json',
      'X-Fantasy-Filter': JSON.stringify({
        teams: {
          filterStats: {
            filterStatsForExternalIds: {
              value: [2024, 2025]
            }
          },
          filterSlotCategoryIds: {
            value: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 23, 24]
          }
        },
        players: {
          filterSlotIds: {
            value: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 23, 24]
          },
          filterStatsForExternalIds: {
            value: [2024, 2025]
          }
        }
      })
    };
    
    try {
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('ESPN authentication failed. Please check your espn_s2 and SWID cookies.');
        }
        throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('ESPN API request failed:', error);
      throw error;
    }
  }
  
  /**
   * Get league information
   */
  async getLeague(leagueId: number, seasonId: number = 2025): Promise<ESPNLeague> {
    const url = `${this.baseUrl}/seasons/${seasonId}/segments/0/leagues/${leagueId}`;
    const data = await this.makeRequest(url);
    
    return {
      id: data.id,
      name: data.settings.name,
      season: data.seasonId,
      size: data.settings.size,
      scoringPeriodId: data.scoringPeriodId,
      status: {
        currentMatchupPeriod: data.status.currentMatchupPeriod,
        finalScoringPeriod: data.status.finalScoringPeriod,
        isActive: data.status.isActive
      },
      settings: {
        playoffTeamCount: data.settings.playoffTeamCount,
        rosterSize: data.settings.rosterSettings.lineupSlotCounts,
        scoringSettings: data.settings.scoringSettings
      }
    };
  }
  
  /**
   * Get all teams in the league
   */
  async getTeams(leagueId: number, seasonId: number = 2025): Promise<ESPNTeam[]> {
    const url = `${this.baseUrl}/seasons/${seasonId}/segments/0/leagues/${leagueId}?view=mTeam&view=mRoster`;
    const data = await this.makeRequest(url);
    
    return data.teams.map((team: any) => ({
      id: team.id,
      name: team.name || `Team ${team.id}`,
      abbrev: team.abbrev,
      logoUrl: team.logo,
      owners: team.owners || [],
      record: {
        overall: {
          wins: team.record?.overall?.wins || 0,
          losses: team.record?.overall?.losses || 0,
          ties: team.record?.overall?.ties || 0,
          percentage: team.record?.overall?.percentage || 0
        }
      },
      points: {
        for: team.record?.overall?.pointsFor || 0,
        against: team.record?.overall?.pointsAgainst || 0
      },
      roster: {
        entries: this.parseRosterEntries(team.roster?.entries || [])
      },
      currentProjectedTotal: team.currentProjectedTotal || 0,
      currentPointsTotal: team.currentPointsTotal || 0
    }));
  }
  
  /**
   * Get specific team information
   */
  async getTeam(leagueId: number, teamId: number, seasonId: number = 2025): Promise<ESPNTeam> {
    const teams = await this.getTeams(leagueId, seasonId);
    const team = teams.find(t => t.id === teamId);
    
    if (!team) {
      throw new Error(`Team ${teamId} not found in league ${leagueId}`);
    }
    
    return team;
  }
  
  /**
   * Get matchups for a specific week
   */
  async getMatchups(leagueId: number, week: number, seasonId: number = 2025): Promise<ESPNMatchup[]> {
    const url = `${this.baseUrl}/seasons/${seasonId}/segments/0/leagues/${leagueId}?view=mMatchup&scoringPeriodId=${week}`;
    const data = await this.makeRequest(url);
    
    return (data.schedule || [])
      .filter((matchup: any) => matchup.matchupPeriodId === week)
      .map((matchup: any) => ({
        id: matchup.id,
        matchupPeriodId: matchup.matchupPeriodId,
        home: {
          teamId: matchup.home?.teamId,
          totalPoints: matchup.home?.totalPoints || 0,
          totalProjectedPoints: matchup.home?.totalProjectedPoints || 0
        },
        away: {
          teamId: matchup.away?.teamId,
          totalPoints: matchup.away?.totalPoints || 0,
          totalProjectedPoints: matchup.away?.totalProjectedPoints || 0
        },
        winner: this.determineWinner(matchup)
      }));
  }
  
  /**
   * Get player information
   */
  async getPlayers(leagueId: number, seasonId: number = 2025): Promise<Map<number, ESPNPlayer>> {
    const url = `${this.baseUrl}/seasons/${seasonId}/segments/0/leagues/${leagueId}?view=kona_player_info`;
    const data = await this.makeRequest(url);
    
    const playersMap = new Map<number, ESPNPlayer>();
    
    if (data.players) {
      data.players.forEach((playerData: any) => {
        const player = this.parsePlayer(playerData);
        playersMap.set(player.playerId, player);
      });
    }
    
    return playersMap;
  }
  
  /**
   * Get current user's teams across all leagues
   */
  async getUserTeams(seasonId: number = 2025): Promise<Array<{ leagueId: number; teamId: number; leagueName: string }>> {
    // This would require additional ESPN endpoints that might not be publicly available
    // For now, return empty array and require manual league/team specification
    console.warn('getUserTeams not implemented - ESPN API limitations');
    return [];
  }
  
  /**
   * Parse roster entries
   */
  private parseRosterEntries(entries: any[]): ESPNPlayer[] {
    return entries.map(entry => this.parsePlayer(entry));
  }
  
  /**
   * Parse player data
   */
  private parsePlayer(playerData: any): ESPNPlayer {
    const player = playerData.playerPoolEntry?.player || playerData.player || playerData;
    const stats = playerData.playerPoolEntry?.player?.stats || playerData.stats || [];
    
    // Get current week stats
    const currentStats = stats.find((s: any) => s.scoringPeriodId === player.defaultPositionId) || {};
    const appliedStats = currentStats.appliedStats || {};
    
    return {
      playerId: player.id,
      playerName: player.fullName || `${player.firstName} ${player.lastName}`,
      position: this.mapPosition(player.defaultPositionId),
      team: this.mapTeam(player.proTeamId),
      lineupSlotId: playerData.lineupSlotId || 0,
      points: appliedStats.totalPoints || 0,
      projectedPoints: currentStats.projectedStats?.totalPoints || 0,
      stats: appliedStats,
      injured: player.injured || false,
      injuryStatus: player.injuryStatus
    };
  }
  
  /**
   * Map ESPN position IDs to position names
   */
  private mapPosition(positionId: number): string {
    const positions: { [key: number]: string } = {
      1: 'QB',
      2: 'RB',
      3: 'WR',
      4: 'TE',
      5: 'K',
      16: 'DST'
    };
    
    return positions[positionId] || 'UNKNOWN';
  }
  
  /**
   * Map ESPN team IDs to team abbreviations
   */
  private mapTeam(teamId: number): string {
    const teams: { [key: number]: string } = {
      1: 'ATL', 2: 'BUF', 3: 'CHI', 4: 'CIN', 5: 'CLE', 6: 'DAL', 7: 'DEN', 8: 'DET',
      9: 'GB', 10: 'TEN', 11: 'IND', 12: 'KC', 13: 'LV', 14: 'LAR', 15: 'MIA', 16: 'MIN',
      17: 'NE', 18: 'NO', 19: 'NYG', 20: 'NYJ', 21: 'PHI', 22: 'ARI', 23: 'PIT', 24: 'LAC',
      25: 'SF', 26: 'SEA', 27: 'TB', 28: 'WSH', 29: 'CAR', 30: 'JAX', 33: 'BAL', 34: 'HOU'
    };
    
    return teams[teamId] || 'FA';
  }
  
  /**
   * Determine matchup winner
   */
  private determineWinner(matchup: any): 'home' | 'away' | 'tie' | undefined {
    if (!matchup.home || !matchup.away) return undefined;
    
    const homePoints = matchup.home.totalPoints || 0;
    const awayPoints = matchup.away.totalPoints || 0;
    
    if (homePoints > awayPoints) return 'home';
    if (awayPoints > homePoints) return 'away';
    if (homePoints === awayPoints && homePoints > 0) return 'tie';
    
    return undefined;
  }
  
  /**
   * Validate authentication
   */
  async validateAuth(leagueId: number, seasonId: number = 2025): Promise<boolean> {
    try {
      await this.getLeague(leagueId, seasonId);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get authentication instructions
   */
  getAuthInstructions(): string[] {
    return [
      '1. Log in to ESPN Fantasy Football in your browser',
      '2. Open Developer Tools (F12)',
      '3. Go to Application → Cookies → https://fantasy.espn.com',
      '4. Copy the values for "espn_s2" and "SWID" cookies',
      '5. Paste them in the ESPN authentication form'
    ];
  }
}

export const espnService = new ESPNService();