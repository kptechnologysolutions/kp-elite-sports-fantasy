// Yahoo Fantasy Football API Service
export interface YahooAuth {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface YahooLeague {
  league_key: string;
  league_id: string;
  name: string;
  season: string;
  game_code: string;
  num_teams: number;
  current_week: number;
  start_week: number;
  end_week: number;
  is_finished: boolean;
  url: string;
  logo_url?: string;
  settings: {
    playoff_start_week: number;
    num_playoff_teams: number;
    scoring_type: string;
    uses_playoff: boolean;
  };
}

export interface YahooTeam {
  team_key: string;
  team_id: string;
  name: string;
  url: string;
  logo_url?: string;
  managers: Array<{
    manager_id: string;
    nickname: string;
    guid: string;
  }>;
  standings: {
    rank: number;
    outcome_totals: {
      wins: number;
      losses: number;
      ties: number;
      percentage: number;
    };
    points_for: number;
    points_against: number;
  };
  roster: {
    players: YahooPlayer[];
  };
}

export interface YahooPlayer {
  player_key: string;
  player_id: string;
  name: {
    full: string;
    first: string;
    last: string;
    ascii_first: string;
    ascii_last: string;
  };
  status: string;
  position_type: string;
  primary_position: string;
  eligible_positions: string[];
  selected_position: {
    position: string;
    is_flex: boolean;
  };
  stats: { [key: string]: number };
  points: number;
  projected_points: number;
  is_injured: boolean;
  injury_note?: string;
  editorial_team_abbr: string;
  editorial_team_full_name: string;
  bye_weeks: number[];
}

export interface YahooMatchup {
  week: number;
  teams: Array<{
    team_key: string;
    points: number;
    projected_points: number;
    is_winner: boolean;
  }>;
  is_playoffs: boolean;
  is_consolation: boolean;
  status: 'postevent' | 'midevent' | 'preevent';
}

class YahooService {
  private baseUrl = 'https://fantasysports.yahooapis.com/fantasy/v2';
  private auth: YahooAuth | null = null;
  
  /**
   * Set authentication token
   */
  setAuth(auth: YahooAuth): void {
    this.auth = auth;
  }
  
  /**
   * Make authenticated request to Yahoo API
   */
  private async makeRequest(endpoint: string): Promise<any> {
    if (!this.auth) {
      throw new Error('Yahoo authentication required. Please provide access token.');
    }
    
    // Check if token is expired
    if (this.auth.expiresAt && Date.now() > this.auth.expiresAt) {
      if (this.auth.refreshToken) {
        await this.refreshAccessToken();
      } else {
        throw new Error('Yahoo access token expired. Please re-authenticate.');
      }
    }
    
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.auth.accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    
    try {
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Yahoo authentication failed. Please re-authenticate.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. Please check league permissions.');
        }
        throw new Error(`Yahoo API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Yahoo API returns data nested in fantasy_content
      return data.fantasy_content || data;
    } catch (error) {
      console.error('Yahoo API request failed:', error);
      throw error;
    }
  }
  
  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.auth?.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const clientId = process.env.NEXT_PUBLIC_YAHOO_CLIENT_ID;
    const clientSecret = process.env.YAHOO_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('Yahoo OAuth credentials not configured');
    }
    
    const response = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.auth.refreshToken
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to refresh Yahoo access token');
    }
    
    const tokenData = await response.json();
    
    this.auth = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || this.auth.refreshToken,
      expiresAt: Date.now() + (tokenData.expires_in * 1000)
    };
  }
  
  /**
   * Get user's leagues
   */
  async getUserLeagues(gameKey: string = 'nfl'): Promise<YahooLeague[]> {
    const endpoint = `/users;use_login=1/games;game_keys=${gameKey}/leagues`;
    const data = await this.makeRequest(endpoint);
    
    const leagues = data.users?.[0]?.user?.[1]?.games?.[0]?.game?.[1]?.leagues || [];
    
    return leagues.map((leagueData: any) => {
      const league = Array.isArray(leagueData.league) ? leagueData.league[0] : leagueData.league;
      
      return {
        league_key: league.league_key,
        league_id: league.league_id,
        name: league.name,
        season: league.season,
        game_code: league.game_code,
        num_teams: parseInt(league.num_teams),
        current_week: parseInt(league.current_week),
        start_week: parseInt(league.start_week),
        end_week: parseInt(league.end_week),
        is_finished: league.is_finished === '1',
        url: league.url,
        logo_url: league.logo_url,
        settings: {
          playoff_start_week: parseInt(league.settings?.[0]?.playoff_start_week || '0'),
          num_playoff_teams: parseInt(league.settings?.[0]?.num_playoff_teams || '0'),
          scoring_type: league.settings?.[0]?.scoring_type || 'head',
          uses_playoff: league.settings?.[0]?.uses_playoff === '1'
        }
      };
    });
  }
  
  /**
   * Get league information
   */
  async getLeague(leagueKey: string): Promise<YahooLeague> {
    const endpoint = `/league/${leagueKey}`;
    const data = await this.makeRequest(endpoint);
    
    const league = data.league?.[0] || data.league;
    
    return {
      league_key: league.league_key,
      league_id: league.league_id,
      name: league.name,
      season: league.season,
      game_code: league.game_code,
      num_teams: parseInt(league.num_teams),
      current_week: parseInt(league.current_week),
      start_week: parseInt(league.start_week),
      end_week: parseInt(league.end_week),
      is_finished: league.is_finished === '1',
      url: league.url,
      logo_url: league.logo_url,
      settings: {
        playoff_start_week: parseInt(league.settings?.[0]?.playoff_start_week || '0'),
        num_playoff_teams: parseInt(league.settings?.[0]?.num_playoff_teams || '0'),
        scoring_type: league.settings?.[0]?.scoring_type || 'head',
        uses_playoff: league.settings?.[0]?.uses_playoff === '1'
      }
    };
  }
  
  /**
   * Get all teams in a league
   */
  async getTeams(leagueKey: string): Promise<YahooTeam[]> {
    const endpoint = `/league/${leagueKey}/teams`;
    const data = await this.makeRequest(endpoint);
    
    const teams = data.league?.[1]?.teams || [];
    
    return teams.map((teamData: any) => {
      const team = teamData.team?.[0] || teamData.team;
      const standings = teamData.team?.[1]?.team_standings || {};
      
      return {
        team_key: team.team_key,
        team_id: team.team_id,
        name: team.name,
        url: team.url,
        logo_url: team.team_logo?.url,
        managers: (team.managers || []).map((manager: any) => ({
          manager_id: manager.manager?.manager_id,
          nickname: manager.manager?.nickname,
          guid: manager.manager?.guid
        })),
        standings: {
          rank: parseInt(standings.rank || '0'),
          outcome_totals: {
            wins: parseInt(standings.outcome_totals?.wins || '0'),
            losses: parseInt(standings.outcome_totals?.losses || '0'),
            ties: parseInt(standings.outcome_totals?.ties || '0'),
            percentage: parseFloat(standings.outcome_totals?.percentage || '0')
          },
          points_for: parseFloat(standings.points_for || '0'),
          points_against: parseFloat(standings.points_against || '0')
        },
        roster: {
          players: [] // Will be populated by separate call
        }
      };
    });
  }
  
  /**
   * Get team roster
   */
  async getTeamRoster(teamKey: string): Promise<YahooPlayer[]> {
    const endpoint = `/team/${teamKey}/roster`;
    const data = await this.makeRequest(endpoint);
    
    const roster = data.team?.[1]?.roster?.[0]?.players || [];
    
    return roster.map((playerData: any) => this.parsePlayer(playerData.player));
  }
  
  /**
   * Get user's team in a specific league
   */
  async getUserTeam(leagueKey: string): Promise<YahooTeam | null> {
    const endpoint = `/users;use_login=1/games;game_keys=nfl/teams`;
    const data = await this.makeRequest(endpoint);
    
    const allTeams = data.users?.[0]?.user?.[1]?.games?.[0]?.game?.[1]?.teams || [];
    
    const userTeam = allTeams.find((teamData: any) => {
      const team = teamData.team?.[0] || teamData.team;
      return team.team_key.includes(leagueKey);
    });
    
    if (!userTeam) return null;
    
    const team = userTeam.team?.[0] || userTeam.team;
    const standings = userTeam.team?.[1]?.team_standings || {};
    
    return {
      team_key: team.team_key,
      team_id: team.team_id,
      name: team.name,
      url: team.url,
      logo_url: team.team_logo?.url,
      managers: (team.managers || []).map((manager: any) => ({
        manager_id: manager.manager?.manager_id,
        nickname: manager.manager?.nickname,
        guid: manager.manager?.guid
      })),
      standings: {
        rank: parseInt(standings.rank || '0'),
        outcome_totals: {
          wins: parseInt(standings.outcome_totals?.wins || '0'),
          losses: parseInt(standings.outcome_totals?.losses || '0'),
          ties: parseInt(standings.outcome_totals?.ties || '0'),
          percentage: parseFloat(standings.outcome_totals?.percentage || '0')
        },
        points_for: parseFloat(standings.points_for || '0'),
        points_against: parseFloat(standings.points_against || '0')
      },
      roster: {
        players: await this.getTeamRoster(team.team_key)
      }
    };
  }
  
  /**
   * Get matchups for a specific week
   */
  async getMatchups(leagueKey: string, week: number): Promise<YahooMatchup[]> {
    const endpoint = `/league/${leagueKey}/scoreboard;week=${week}`;
    const data = await this.makeRequest(endpoint);
    
    const matchups = data.league?.[1]?.scoreboard?.[0]?.matchups || [];
    
    return matchups.map((matchupData: any) => {
      const matchup = matchupData.matchup;
      const teams = matchup?.[0]?.teams || [];
      
      return {
        week,
        teams: teams.map((teamData: any) => {
          const team = teamData.team?.[0] || teamData.team;
          const stats = teamData.team?.[1]?.team_stats || {};
          
          return {
            team_key: team.team_key,
            points: parseFloat(stats.team_points?.total || '0'),
            projected_points: parseFloat(stats.team_projected_points?.total || '0'),
            is_winner: matchup?.[0]?.is_tied === '0' && 
                      matchup?.[0]?.winner_team_key === team.team_key
          };
        }),
        is_playoffs: matchup?.[0]?.is_playoffs === '1',
        is_consolation: matchup?.[0]?.is_consolation === '1',
        status: matchup?.[0]?.status || 'preevent'
      };
    });
  }
  
  /**
   * Parse player data
   */
  private parsePlayer(playerData: any): YahooPlayer {
    const player = Array.isArray(playerData) ? playerData[0] : playerData;
    const stats = Array.isArray(playerData) ? playerData[1]?.player_stats : playerData.player_stats;
    const points = Array.isArray(playerData) ? playerData[1]?.player_points : playerData.player_points;
    
    return {
      player_key: player.player_key,
      player_id: player.player_id,
      name: {
        full: player.name?.full || '',
        first: player.name?.first || '',
        last: player.name?.last || '',
        ascii_first: player.name?.ascii_first || '',
        ascii_last: player.name?.ascii_last || ''
      },
      status: player.status || 'Active',
      position_type: player.position_type || '',
      primary_position: player.primary_position || '',
      eligible_positions: player.eligible_positions || [],
      selected_position: {
        position: player.selected_position?.position || '',
        is_flex: player.selected_position?.is_flex === '1'
      },
      stats: this.parseStats(stats),
      points: parseFloat(points?.total || '0'),
      projected_points: parseFloat(stats?.projected_points || '0'),
      is_injured: player.status_full === 'Injured',
      injury_note: player.injury_note,
      editorial_team_abbr: player.editorial_team_abbr || '',
      editorial_team_full_name: player.editorial_team_full_name || '',
      bye_weeks: player.bye_weeks?.week ? [parseInt(player.bye_weeks.week)] : []
    };
  }
  
  /**
   * Parse player stats
   */
  private parseStats(stats: any): { [key: string]: number } {
    if (!stats?.stats) return {};
    
    const parsedStats: { [key: string]: number } = {};
    
    stats.stats.forEach((stat: any) => {
      if (stat.stat) {
        parsedStats[stat.stat.stat_id] = parseFloat(stat.stat.value || '0');
      }
    });
    
    return parsedStats;
  }
  
  /**
   * Get OAuth authorization URL
   */
  getAuthUrl(redirectUri: string): string {
    const clientId = process.env.NEXT_PUBLIC_YAHOO_CLIENT_ID;
    if (!clientId) {
      throw new Error('Yahoo Client ID not configured');
    }
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'fspt-r'
    });
    
    return `https://api.login.yahoo.com/oauth2/request_auth?${params.toString()}`;
  }
  
  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<YahooAuth> {
    const clientId = process.env.NEXT_PUBLIC_YAHOO_CLIENT_ID;
    const clientSecret = process.env.YAHOO_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('Yahoo OAuth credentials not configured');
    }
    
    const response = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to exchange authorization code for token');
    }
    
    const tokenData = await response.json();
    
    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + (tokenData.expires_in * 1000)
    };
  }
  
  /**
   * Validate current authentication
   */
  async validateAuth(): Promise<boolean> {
    try {
      await this.getUserLeagues();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const yahooService = new YahooService();