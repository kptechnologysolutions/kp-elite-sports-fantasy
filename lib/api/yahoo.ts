// Yahoo Fantasy API Integration
// Yahoo uses OAuth 2.0 and requires app registration

const YAHOO_BASE_URL = 'https://fantasysports.yahooapis.com/fantasy/v2';
const YAHOO_AUTH_URL = 'https://api.login.yahoo.com/oauth2/request_auth';
const YAHOO_TOKEN_URL = 'https://api.login.yahoo.com/oauth2/get_token';

export interface YahooUser {
  guid: string;
  nickname: string;
  email: string;
  profile_image: string;
}

export interface YahooLeague {
  league_key: string;
  league_id: string;
  name: string;
  url: string;
  num_teams: number;
  scoring_type: string;
  current_week: number;
  season: string;
}

export interface YahooTeam {
  team_key: string;
  team_id: string;
  name: string;
  url: string;
  manager_nickname: string;
  number_of_moves: number;
  number_of_trades: number;
  roster: YahooPlayer[];
  matchup?: YahooMatchup;
}

export interface YahooPlayer {
  player_key: string;
  player_id: string;
  name: {
    full: string;
    first: string;
    last: string;
  };
  editorial_team_abbr: string;
  display_position: string;
  position_type: string;
  primary_position: string;
  uniform_number: string;
  player_points: {
    total: number;
    week: number;
  };
  status: string;
  injury_note?: string;
}

export interface YahooMatchup {
  week: number;
  team_points: number;
  opponent_points: number;
  opponent_name: string;
  is_playoffs: boolean;
  is_consolation: boolean;
  winner_team_key?: string;
}

class YahooFantasyAPI {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    // These would come from environment variables
    this.clientId = process.env.NEXT_PUBLIC_YAHOO_CLIENT_ID || '';
    this.clientSecret = process.env.YAHOO_CLIENT_SECRET || '';
  }

  // OAuth 2.0 flow
  getAuthorizationUrl(redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      language: 'en-us',
    });

    return `${YAHOO_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: redirectUri,
      code,
      grant_type: 'authorization_code',
    });

    const response = await fetch(YAHOO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    
    return data;
  }

  async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: 'oob',
      refresh_token: this.refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch(YAHOO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    
    return data.access_token;
  }

  // API Methods
  private async makeRequest(endpoint: string, format: 'json' | 'xml' = 'json') {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const url = `${YAHOO_BASE_URL}${endpoint}?format=${format}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (response.status === 401) {
      // Token expired, try to refresh
      await this.refreshAccessToken();
      // Retry the request
      return this.makeRequest(endpoint, format);
    }

    if (!response.ok) {
      throw new Error(`Yahoo API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getCurrentUser(): Promise<YahooUser> {
    const data = await this.makeRequest('/users;use_login=1');
    return data.fantasy_content.users[0].user[0];
  }

  async getUserLeagues(season: string = '2025'): Promise<YahooLeague[]> {
    const data = await this.makeRequest(`/users;use_login=1/games;game_codes=nfl/leagues`);
    const leagues = data.fantasy_content.users[0].user[1].games[0].game[1].leagues;
    
    return leagues.map((league: any) => league.league[0]);
  }

  async getTeam(teamKey: string): Promise<YahooTeam> {
    const data = await this.makeRequest(`/team/${teamKey};out=roster,matchups`);
    const team = data.fantasy_content.team[0];
    
    return {
      team_key: team[0].team_key,
      team_id: team[0].team_id,
      name: team[0].name,
      url: team[0].url,
      manager_nickname: team[0].managers[0].manager.nickname,
      number_of_moves: team[0].number_of_moves,
      number_of_trades: team[0].number_of_trades,
      roster: this.parseRoster(team[1].roster),
      matchup: this.parseMatchup(team[2].matchups),
    };
  }

  async getLeagueStandings(leagueKey: string): Promise<any> {
    const data = await this.makeRequest(`/league/${leagueKey}/standings`);
    return data.fantasy_content.league[1].standings[0].teams;
  }

  async getMatchups(leagueKey: string, week: number): Promise<YahooMatchup[]> {
    const data = await this.makeRequest(`/league/${leagueKey}/scoreboard;week=${week}`);
    return this.parseMatchups(data.fantasy_content.league[1].scoreboard);
  }

  async getPlayers(playerKeys: string[]): Promise<YahooPlayer[]> {
    const keys = playerKeys.join(',');
    const data = await this.makeRequest(`/players;player_keys=${keys};out=stats`);
    return this.parsePlayers(data.fantasy_content.players);
  }

  // Helper methods
  private parseRoster(rosterData: any): YahooPlayer[] {
    const players = rosterData['0'].players;
    return players.map((p: any) => {
      const player = p.player[0];
      return {
        player_key: player.player_key,
        player_id: player.player_id,
        name: player.name,
        editorial_team_abbr: player.editorial_team_abbr,
        display_position: player.display_position,
        position_type: player.position_type,
        primary_position: player.primary_position,
        uniform_number: player.uniform_number,
        player_points: player.player_points,
        status: player.status,
        injury_note: player.injury_note,
      };
    });
  }

  private parseMatchup(matchupData: any): YahooMatchup | undefined {
    if (!matchupData || !matchupData['0']) return undefined;
    
    const matchup = matchupData['0'].matchup;
    return {
      week: matchup.week,
      team_points: parseFloat(matchup.teams['0'].team[1].team_points.total),
      opponent_points: parseFloat(matchup.teams['1'].team[1].team_points.total),
      opponent_name: matchup.teams['1'].team[0][2].name,
      is_playoffs: matchup.is_playoffs === '1',
      is_consolation: matchup.is_consolation === '1',
      winner_team_key: matchup.winner_team_key,
    };
  }

  private parseMatchups(scoreboardData: any): YahooMatchup[] {
    const matchups = scoreboardData['0'].matchups;
    return matchups.map((m: any) => this.parseMatchup({ '0': m })).filter(Boolean);
  }

  private parsePlayers(playersData: any): YahooPlayer[] {
    return playersData.map((p: any) => {
      const player = p.player[0];
      return {
        player_key: player.player_key,
        player_id: player.player_id,
        name: player.name,
        editorial_team_abbr: player.editorial_team_abbr,
        display_position: player.display_position,
        position_type: player.position_type,
        primary_position: player.primary_position,
        uniform_number: player.uniform_number,
        player_points: player.player_points || { total: 0, week: 0 },
        status: player.status || 'active',
        injury_note: player.injury_note,
      };
    });
  }

  // Import all teams for a user
  async importUserTeams(accessToken: string): Promise<any[]> {
    this.accessToken = accessToken;
    
    const user = await this.getCurrentUser();
    const leagues = await this.getUserLeagues();
    const teams = [];

    for (const league of leagues) {
      // Get user's team in this league
      const leagueTeams = await this.makeRequest(`/league/${league.league_key}/teams`);
      const userTeam = leagueTeams.fantasy_content.league[1].teams.find(
        (t: any) => t.team[0].managers[0].manager.guid === user.guid
      );

      if (userTeam) {
        const team = await this.getTeam(userTeam.team[0].team_key);
        teams.push({
          platform: 'Yahoo',
          league,
          team,
          user,
        });
      }
    }

    return teams;
  }
}

// Export singleton instance
export const yahooAPI = new YahooFantasyAPI();