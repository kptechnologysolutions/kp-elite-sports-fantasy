// ESPN Fantasy API Integration
// ESPN uses their own authentication system with cookies

const ESPN_BASE_URL = 'https://fantasy.espn.com/apis/v3/games/ffl';
const ESPN_AUTH_URL = 'https://registerdisney.go.com/jgc/v8/client/ESPN-ONESITE.WEB-PROD/api-key';

export interface ESPNUser {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ESPNLeague {
  id: number;
  name: string;
  seasonId: number;
  size: number;
  scoringPeriodId: number;
  currentMatchupPeriod: number;
  settings: {
    name: string;
    scoringType: string;
    playoffTeamCount: number;
    regularSeasonMatchupPeriodCount: number;
  };
}

export interface ESPNTeam {
  id: number;
  location: string;
  nickname: string;
  abbrev: string;
  owners: string[];
  playoffSeed: number;
  points: number;
  pointsAgainst: number;
  record: {
    overall: {
      wins: number;
      losses: number;
      ties: number;
    };
    home: {
      wins: number;
      losses: number;
    };
    away: {
      wins: number;
      losses: number;
    };
  };
  rankCalculatedFinal: number;
  roster: {
    entries: ESPNRosterEntry[];
  };
}

export interface ESPNRosterEntry {
  playerId: number;
  playerPoolEntry: {
    player: ESPNPlayer;
  };
  lineupSlotId: number;
  acquisitionType: string;
  pendingTransactionIds: any[];
  status: string;
}

export interface ESPNPlayer {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  jersey: string;
  proTeamId: number;
  defaultPositionId: number;
  eligibleSlots: number[];
  stats: ESPNPlayerStats[];
  injured: boolean;
  injuryStatus: string;
  ownership: {
    percentOwned: number;
    percentStarted: number;
  };
}

export interface ESPNPlayerStats {
  id: string;
  proTeamId: number;
  scoringPeriodId: number;
  seasonId: number;
  statSourceId: number;
  statSplitTypeId: number;
  appliedTotal: number;
  stats: Record<string, number>;
}

export interface ESPNMatchup {
  matchupPeriodId: number;
  home: {
    teamId: number;
    totalPoints: number;
    totalProjectedPoints: number;
    rosterForCurrentScoringPeriod: {
      entries: ESPNRosterEntry[];
    };
  };
  away: {
    teamId: number;
    totalPoints: number;
    totalProjectedPoints: number;
    rosterForCurrentScoringPeriod: {
      entries: ESPNRosterEntry[];
    };
  };
  winner: 'HOME' | 'AWAY' | 'UNDECIDED';
  playoffTierType: string;
}

class ESPNFantasyAPI {
  private espnS2Cookie: string | null = null;
  private swid: string | null = null;
  private year: number = new Date().getFullYear();

  // Position mapping
  private readonly POSITION_MAP: Record<number, string> = {
    0: 'QB',
    2: 'RB',
    4: 'WR',
    6: 'TE',
    16: 'D/ST',
    17: 'K',
    20: 'BENCH',
    21: 'IR',
    23: 'FLEX',
  };

  constructor() {
    // ESPN cookies would be obtained through authentication
    this.espnS2Cookie = null;
    this.swid = null;
  }

  // Authentication
  async authenticate(username: string, password: string): Promise<boolean> {
    try {
      // Get API key first
      const apiKeyResponse = await fetch(ESPN_AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const apiKeyData = await apiKeyResponse.json();
      const apiKey = apiKeyData['api-key'];

      // Login
      const loginResponse = await fetch('https://registerdisney.go.com/jgc/v8/client/ESPN-ONESITE.WEB-PROD/guest/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `APIKEY ${apiKey}`,
        },
        body: JSON.stringify({
          loginValue: username,
          password: password,
        }),
      });

      if (!loginResponse.ok) {
        throw new Error('Authentication failed');
      }

      const loginData = await loginResponse.json();
      
      // Extract cookies
      this.espnS2Cookie = loginData.data.s2;
      this.swid = loginData.data.profile.swid;

      return true;
    } catch (error) {
      console.error('ESPN authentication error:', error);
      return false;
    }
  }

  // Set cookies manually (for server-side or when cookies are already obtained)
  setCookies(espnS2: string, swid: string) {
    this.espnS2Cookie = espnS2;
    this.swid = swid;
  }

  // Make authenticated request
  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const url = new URL(`${ESPN_BASE_URL}${endpoint}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    if (this.espnS2Cookie && this.swid) {
      headers['Cookie'] = `espn_s2=${this.espnS2Cookie}; SWID=${this.swid}`;
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Get user info
  async getCurrentUser(): Promise<ESPNUser | null> {
    if (!this.swid) return null;
    
    // ESPN user info would typically come from the authentication response
    return {
      id: this.swid,
      displayName: 'ESPN User',
      firstName: '',
      lastName: '',
      email: '',
    };
  }

  // Get user's leagues
  async getUserLeagues(year: number = this.year): Promise<ESPNLeague[]> {
    const data = await this.makeRequest('/seasons/2025', {
      view: 'mTeam',
      view: 'mRoster',
    });

    return data.map((league: any) => ({
      id: league.id,
      name: league.settings.name,
      seasonId: league.seasonId,
      size: league.settings.size,
      scoringPeriodId: league.scoringPeriodId,
      currentMatchupPeriod: league.currentMatchupPeriod,
      settings: {
        name: league.settings.name,
        scoringType: league.settings.scoringSettings?.scoringType || 'STANDARD',
        playoffTeamCount: league.settings.playoffTeamCount,
        regularSeasonMatchupPeriodCount: league.settings.scheduleSettings.matchupPeriodCount,
      },
    }));
  }

  // Get league details
  async getLeague(leagueId: number, year: number = this.year): Promise<ESPNLeague> {
    const data = await this.makeRequest(`/seasons/${year}/segments/0/leagues/${leagueId}`, {
      view: 'mSettings',
    });

    return {
      id: data.id,
      name: data.settings.name,
      seasonId: data.seasonId,
      size: data.settings.size,
      scoringPeriodId: data.scoringPeriodId,
      currentMatchupPeriod: data.currentMatchupPeriod,
      settings: {
        name: data.settings.name,
        scoringType: data.settings.scoringSettings?.scoringType || 'STANDARD',
        playoffTeamCount: data.settings.playoffTeamCount,
        regularSeasonMatchupPeriodCount: data.settings.scheduleSettings.matchupPeriodCount,
      },
    };
  }

  // Get team details
  async getTeam(leagueId: number, teamId: number, year: number = this.year): Promise<ESPNTeam> {
    const data = await this.makeRequest(`/seasons/${year}/segments/0/leagues/${leagueId}`, {
      view: 'mTeam',
      view: 'mRoster',
      teamId: teamId,
    });

    const team = data.teams.find((t: any) => t.id === teamId);
    
    return this.parseTeam(team);
  }

  // Get all teams in league
  async getLeagueTeams(leagueId: number, year: number = this.year): Promise<ESPNTeam[]> {
    const data = await this.makeRequest(`/seasons/${year}/segments/0/leagues/${leagueId}`, {
      view: 'mTeam',
      view: 'mRoster',
    });

    return data.teams.map((team: any) => this.parseTeam(team));
  }

  // Get matchups
  async getMatchups(leagueId: number, week?: number, year: number = this.year): Promise<ESPNMatchup[]> {
    const params: any = {
      view: 'mMatchup',
      view: 'mMatchupScore',
    };

    if (week) {
      params.scoringPeriodId = week;
    }

    const data = await this.makeRequest(`/seasons/${year}/segments/0/leagues/${leagueId}`, params);

    return data.schedule
      .filter((matchup: any) => !week || matchup.matchupPeriodId === week)
      .map((matchup: any) => ({
        matchupPeriodId: matchup.matchupPeriodId,
        home: {
          teamId: matchup.home.teamId,
          totalPoints: matchup.home.totalPoints,
          totalProjectedPoints: matchup.home.totalProjectedPoints || 0,
          rosterForCurrentScoringPeriod: matchup.home.rosterForCurrentScoringPeriod,
        },
        away: matchup.away ? {
          teamId: matchup.away.teamId,
          totalPoints: matchup.away.totalPoints,
          totalProjectedPoints: matchup.away.totalProjectedPoints || 0,
          rosterForCurrentScoringPeriod: matchup.away.rosterForCurrentScoringPeriod,
        } : null,
        winner: matchup.winner,
        playoffTierType: matchup.playoffTierType,
      }));
  }

  // Get player details
  async getPlayer(playerId: number, year: number = this.year): Promise<ESPNPlayer | null> {
    const data = await this.makeRequest(`/seasons/${year}/players/${playerId}`, {
      view: 'players',
    });

    if (!data || !data.player) return null;

    return this.parsePlayer(data.player);
  }

  // Helper methods
  private parseTeam(teamData: any): ESPNTeam {
    return {
      id: teamData.id,
      location: teamData.location,
      nickname: teamData.nickname,
      abbrev: teamData.abbrev,
      owners: teamData.owners || [],
      playoffSeed: teamData.playoffSeed || 0,
      points: teamData.points || 0,
      pointsAgainst: teamData.pointsAgainst || 0,
      record: {
        overall: teamData.record.overall,
        home: teamData.record.home,
        away: teamData.record.away,
      },
      rankCalculatedFinal: teamData.rankCalculatedFinal || 0,
      roster: {
        entries: teamData.roster?.entries?.map((entry: any) => ({
          playerId: entry.playerId,
          playerPoolEntry: entry.playerPoolEntry,
          lineupSlotId: entry.lineupSlotId,
          acquisitionType: entry.acquisitionType,
          pendingTransactionIds: entry.pendingTransactionIds || [],
          status: entry.status || 'NORMAL',
        })) || [],
      },
    };
  }

  private parsePlayer(playerData: any): ESPNPlayer {
    return {
      id: playerData.id,
      firstName: playerData.firstName,
      lastName: playerData.lastName,
      fullName: playerData.fullName,
      jersey: playerData.jersey || '',
      proTeamId: playerData.proTeamId,
      defaultPositionId: playerData.defaultPositionId,
      eligibleSlots: playerData.eligibleSlots || [],
      stats: playerData.stats || [],
      injured: playerData.injured || false,
      injuryStatus: playerData.injuryStatus || '',
      ownership: {
        percentOwned: playerData.ownership?.percentOwned || 0,
        percentStarted: playerData.ownership?.percentStarted || 0,
      },
    };
  }

  // Import all teams for a user
  async importUserTeams(espnS2: string, swid: string): Promise<any[]> {
    this.setCookies(espnS2, swid);
    
    const leagues = await this.getUserLeagues();
    const teams = [];

    for (const league of leagues) {
      const leagueTeams = await this.getLeagueTeams(league.id);
      
      // Find user's team (would need to match by owner ID)
      // For now, we'll assume the first team with matching SWID
      const userTeam = leagueTeams.find(team => 
        team.owners.includes(swid.replace('{', '').replace('}', ''))
      );

      if (userTeam) {
        // Get current matchup
        const matchups = await this.getMatchups(league.id, league.currentMatchupPeriod);
        const userMatchup = matchups.find(m => 
          m.home.teamId === userTeam.id || m.away?.teamId === userTeam.id
        );

        teams.push({
          platform: 'ESPN',
          league,
          team: userTeam,
          matchup: userMatchup,
        });
      }
    }

    return teams;
  }
}

// Export singleton instance
export const espnAPI = new ESPNFantasyAPI();