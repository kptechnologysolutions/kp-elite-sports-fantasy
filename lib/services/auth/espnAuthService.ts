import { FantasyTeam, Player } from '@/lib/types/team';

interface ESPNLeague {
  id: string;
  name: string;
  seasonId: number;
  settings: {
    name: string;
    size: number;
    scoringSettings: {
      scoringType: string;
    };
  };
}

interface ESPNTeam {
  id: number;
  abbrev: string;
  name: string;
  logo?: string;
  record: {
    overall: {
      wins: number;
      losses: number;
      ties: number;
      pointsFor: number;
      pointsAgainst: number;
    };
  };
  roster: {
    entries: ESPNRosterEntry[];
  };
}

interface ESPNRosterEntry {
  playerId: number;
  playerPoolEntry: {
    player: {
      id: number;
      fullName: string;
      defaultPositionId: number;
      injured: boolean;
      injuryStatus?: string;
      stats: any[];
    };
  };
  status: string;
}

class ESPNAuthService {
  private baseUrl = 'https://fantasy.espn.com/apis/v3/games/ffl';
  private cookieName = 'espn_s2';
  private swidCookieName = 'SWID';

  /**
   * ESPN uses cookie-based authentication
   * Users need to provide their espn_s2 and SWID cookies
   */
  constructor() {}

  /**
   * Validate ESPN cookies
   */
  validateCookies(espnS2: string, swid: string): boolean {
    if (!espnS2 || !swid) {
      return false;
    }

    // Basic validation - ESPN S2 is typically 200+ characters
    // SWID is a UUID in curly braces
    const swidPattern = /^\{[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}\}$/i;
    
    return espnS2.length > 100 && swidPattern.test(swid);
  }

  /**
   * Build request headers with authentication
   */
  private buildHeaders(espnS2?: string, swid?: string): HeadersInit {
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    if (espnS2 && swid) {
      headers['Cookie'] = `espn_s2=${espnS2}; SWID=${swid}`;
    }

    return headers;
  }

  /**
   * Fetch public league data (no auth required for public leagues)
   */
  async fetchPublicLeague(leagueId: string, seasonId?: number): Promise<ESPNLeague | null> {
    const season = seasonId || new Date().getFullYear();
    const url = `${this.baseUrl}/seasons/${season}/segments/0/leagues/${leagueId}`;

    try {
      const response = await fetch(url, {
        headers: this.buildHeaders(),
        mode: 'cors'
      });

      if (!response.ok) {
        console.error(`ESPN API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return this.parseLeagueData(data);
    } catch (error) {
      console.error('Error fetching ESPN league:', error);
      return null;
    }
  }

  /**
   * Fetch private league data (requires authentication)
   */
  async fetchPrivateLeague(
    leagueId: string, 
    espnS2: string, 
    swid: string,
    seasonId?: number
  ): Promise<ESPNLeague | null> {
    if (!this.validateCookies(espnS2, swid)) {
      throw new Error('Invalid ESPN authentication cookies');
    }

    const season = seasonId || new Date().getFullYear();
    const url = `${this.baseUrl}/seasons/${season}/segments/0/leagues/${leagueId}?view=mTeam&view=mRoster&view=mSettings`;

    try {
      const response = await fetch(url, {
        headers: this.buildHeaders(espnS2, swid),
        credentials: 'include',
        mode: 'cors'
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please check your ESPN cookies.');
        }
        throw new Error(`Failed to fetch league: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseLeagueData(data);
    } catch (error) {
      console.error('Error fetching private ESPN league:', error);
      throw error;
    }
  }

  /**
   * Fetch team roster and details
   */
  async fetchTeamDetails(
    leagueId: string, 
    teamId: string,
    espnS2?: string,
    swid?: string,
    seasonId?: number
  ): Promise<ESPNTeam | null> {
    const season = seasonId || new Date().getFullYear();
    const url = `${this.baseUrl}/seasons/${season}/segments/0/leagues/${leagueId}?view=mTeam&view=mRoster`;

    try {
      const response = await fetch(url, {
        headers: this.buildHeaders(espnS2, swid),
        mode: 'cors'
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const team = data.teams?.find((t: any) => t.id.toString() === teamId);
      
      if (!team) {
        return null;
      }

      return this.parseTeamData(team);
    } catch (error) {
      console.error('Error fetching ESPN team:', error);
      return null;
    }
  }

  /**
   * Parse ESPN league data
   */
  private parseLeagueData(data: any): ESPNLeague {
    return {
      id: data.id,
      name: data.settings?.name || 'ESPN League',
      seasonId: data.seasonId,
      settings: {
        name: data.settings?.name || '',
        size: data.settings?.size || 10,
        scoringSettings: {
          scoringType: this.determineScoringType(data.settings)
        }
      }
    };
  }

  /**
   * Parse ESPN team data
   */
  private parseTeamData(data: any): ESPNTeam {
    return {
      id: data.id,
      abbrev: data.abbrev,
      name: data.name || data.location + ' ' + data.nickname,
      logo: data.logo,
      record: {
        overall: {
          wins: data.record?.overall?.wins || 0,
          losses: data.record?.overall?.losses || 0,
          ties: data.record?.overall?.ties || 0,
          pointsFor: data.record?.overall?.pointsFor || 0,
          pointsAgainst: data.record?.overall?.pointsAgainst || 0
        }
      },
      roster: {
        entries: data.roster?.entries || []
      }
    };
  }

  /**
   * Determine scoring type from settings
   */
  private determineScoringType(settings: any): string {
    if (!settings?.scoringSettings?.scoringItems) {
      return 'Standard';
    }

    // Check for PPR scoring
    const receptionScoring = settings.scoringSettings.scoringItems.find(
      (item: any) => item.statId === 53 // Reception stat ID
    );

    if (receptionScoring) {
      if (receptionScoring.pointsOverrides?.[0]?.points === 1) {
        return 'PPR';
      } else if (receptionScoring.pointsOverrides?.[0]?.points === 0.5) {
        return 'Half-PPR';
      }
    }

    return 'Standard';
  }

  /**
   * Convert ESPN roster to our Player format
   */
  private convertRosterToPlayers(roster: ESPNRosterEntry[]): Player[] {
    return roster.map(entry => {
      const player = entry.playerPoolEntry.player;
      return {
        id: player.id.toString(),
        name: player.fullName,
        position: this.getPositionName(player.defaultPositionId),
        team: '', // Would need additional API call for team
        status: {
          isActive: entry.status === 'ACTIVE',
          isStarter: entry.status === 'ACTIVE',
          gameStatus: player.injuryStatus
        },
        stats: {
          projectedPoints: 0, // Would need to parse from stats
          actualPoints: 0,
          seasonTotal: 0
        }
      };
    });
  }

  /**
   * Get position name from ESPN position ID
   */
  private getPositionName(positionId: number): string {
    const positions: { [key: number]: string } = {
      1: 'QB',
      2: 'RB',
      3: 'WR',
      4: 'TE',
      5: 'K',
      16: 'DEF'
    };
    return positions[positionId] || 'FLEX';
  }

  /**
   * Import ESPN team to our system
   */
  async importTeam(
    leagueId: string,
    teamId?: string,
    espnS2?: string,
    swid?: string
  ): Promise<FantasyTeam | null> {
    try {
      // First try to fetch league data
      let leagueData = await this.fetchPublicLeague(leagueId);
      
      // If public fetch fails and we have auth, try private
      if (!leagueData && espnS2 && swid) {
        leagueData = await this.fetchPrivateLeague(leagueId, espnS2, swid);
      }

      if (!leagueData) {
        throw new Error('Unable to fetch league data. League may be private.');
      }

      // If we have a team ID, fetch team details
      let teamData: ESPNTeam | null = null;
      if (teamId) {
        teamData = await this.fetchTeamDetails(leagueId, teamId, espnS2, swid);
      }

      // Create FantasyTeam object
      const team: FantasyTeam = {
        id: `espn_${leagueId}_${teamId || Date.now()}`,
        name: teamData?.name || 'My ESPN Team',
        platform: 'espn',
        leagueId: leagueId,
        leagueName: leagueData.name,
        leagueSize: leagueData.settings.size,
        scoringType: leagueData.settings.scoringSettings.scoringType as 'PPR' | 'Standard' | 'Half-PPR',
        players: teamData ? this.convertRosterToPlayers(teamData.roster.entries) : [],
        record: teamData ? {
          wins: teamData.record.overall.wins,
          losses: teamData.record.overall.losses,
          ties: teamData.record.overall.ties,
          pointsFor: teamData.record.overall.pointsFor,
          pointsAgainst: teamData.record.overall.pointsAgainst
        } : {
          wins: 0,
          losses: 0,
          ties: 0,
          pointsFor: 0,
          pointsAgainst: 0
        }
      };

      return team;
    } catch (error) {
      console.error('Error importing ESPN team:', error);
      throw error;
    }
  }

  /**
   * Get instructions for ESPN authentication
   */
  getAuthInstructions(): string {
    return `
To import private ESPN leagues:

1. Log in to ESPN Fantasy Football in your browser
2. Open Developer Tools (F12 or right-click → Inspect)
3. Go to Application/Storage → Cookies
4. Find and copy these cookie values:
   - espn_s2: (long string)
   - SWID: {UUID-format-string}
5. Paste them when prompted

For public leagues, just enter the League ID.

Note: ESPN cookies expire after a few hours, so you may need to refresh them periodically.
    `;
  }
}

export const espnAuthService = new ESPNAuthService();