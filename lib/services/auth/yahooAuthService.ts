import { FantasyTeam } from '@/lib/types/team';

interface YahooTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface YahooLeague {
  league_key: string;
  name: string;
  num_teams: number;
  scoring_type: string;
  season: string;
}

interface YahooTeam {
  team_key: string;
  name: string;
  team_logos: { url: string }[];
  waiver_priority: number;
  number_of_moves: number;
  number_of_trades: number;
}

class YahooAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private baseUrl = 'https://api.login.yahoo.com';
  private apiBaseUrl = 'https://fantasysports.yahooapis.com/fantasy/v2';

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_YAHOO_CLIENT_ID || '';
    this.clientSecret = process.env.YAHOO_CLIENT_SECRET || '';
    this.redirectUri = typeof window !== 'undefined' 
      ? `${window.location.origin}/api/auth/yahoo/callback`
      : '';
  }

  /**
   * Get OAuth authorization URL for Yahoo
   */
  getAuthorizationUrl(): string {
    if (!this.clientId || this.clientId === 'your_yahoo_client_id_here') {
      throw new Error('Yahoo OAuth not configured. Please add your Yahoo Client ID to .env.local');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      language: 'en-us'
    });

    return `${this.baseUrl}/oauth2/request_auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<YahooTokenResponse> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      code,
      grant_type: 'authorization_code'
    });

    const response = await fetch(`${this.baseUrl}/oauth2/get_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code for token: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<YahooTokenResponse> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    const response = await fetch(`${this.baseUrl}/oauth2/get_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetch user's Yahoo fantasy leagues
   */
  async fetchUserLeagues(accessToken: string): Promise<YahooLeague[]> {
    const response = await fetch(`${this.apiBaseUrl}/users;use_login=1/games;game_codes=nfl/leagues?format=json`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch leagues: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Parse Yahoo's nested response structure
    const leagues: YahooLeague[] = [];
    const games = data.fantasy_content?.users?.[0]?.user?.[1]?.games;
    
    if (games) {
      Object.values(games).forEach((game: any) => {
        if (game.leagues) {
          Object.values(game.leagues).forEach((league: any) => {
            if (league.league) {
              leagues.push({
                league_key: league.league[0].league_key,
                name: league.league[0].name,
                num_teams: league.league[0].num_teams,
                scoring_type: league.league[0].scoring_type,
                season: league.league[0].season
              });
            }
          });
        }
      });
    }

    return leagues;
  }

  /**
   * Fetch team details from Yahoo
   */
  async fetchTeamDetails(accessToken: string, leagueKey: string): Promise<YahooTeam> {
    const response = await fetch(`${this.apiBaseUrl}/league/${leagueKey}/teams?format=json`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch team details: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Find user's team in the league
    const teams = data.fantasy_content?.league?.[1]?.teams;
    if (teams) {
      const userTeam = Object.values(teams).find((team: any) => 
        team.team && team.team[0].is_owned_by_current_login === 1
      );

      if (userTeam) {
        const teamData = userTeam.team[0];
        return {
          team_key: teamData.team_key,
          name: teamData.name,
          team_logos: teamData.team_logos,
          waiver_priority: teamData.waiver_priority,
          number_of_moves: teamData.number_of_moves,
          number_of_trades: teamData.number_of_trades
        };
      }
    }

    throw new Error('Could not find user team in league');
  }

  /**
   * Import Yahoo team to our system
   */
  async importTeam(accessToken: string, leagueKey: string): Promise<FantasyTeam> {
    try {
      const [leagues, teamDetails] = await Promise.all([
        this.fetchUserLeagues(accessToken),
        this.fetchTeamDetails(accessToken, leagueKey)
      ]);

      const league = leagues.find(l => l.league_key === leagueKey);
      if (!league) {
        throw new Error('League not found');
      }

      // Create FantasyTeam object
      const team: FantasyTeam = {
        id: `yahoo_${leagueKey}_${Date.now()}`,
        name: teamDetails.name,
        platform: 'yahoo',
        leagueId: leagueKey,
        leagueName: league.name,
        leagueSize: league.num_teams,
        scoringType: league.scoring_type as 'PPR' | 'Standard' | 'Half-PPR',
        players: [], // Will be populated separately
        record: {
          wins: 0,
          losses: 0,
          ties: 0,
          pointsFor: 0,
          pointsAgainst: 0
        },
        transactions: {
          moves: teamDetails.number_of_moves,
          trades: teamDetails.number_of_trades,
          waiverPriority: teamDetails.waiver_priority
        }
      };

      return team;
    } catch (error) {
      console.error('Error importing Yahoo team:', error);
      throw error;
    }
  }

  /**
   * Check if Yahoo OAuth is properly configured
   */
  isConfigured(): boolean {
    return !!(this.clientId && 
             this.clientId !== 'your_yahoo_client_id_here' &&
             this.clientSecret && 
             this.clientSecret !== 'your_yahoo_client_secret_here');
  }

  /**
   * Get configuration instructions
   */
  getConfigInstructions(): string {
    return `
To enable Yahoo Fantasy integration:

1. Register your app at https://developer.yahoo.com/apps/
2. Set the redirect URI to: ${this.redirectUri}
3. Add these to your .env.local file:
   NEXT_PUBLIC_YAHOO_CLIENT_ID=your_client_id
   YAHOO_CLIENT_SECRET=your_client_secret
4. Restart your development server

For testing, you can use mock data by selecting "Manual Import" option.
    `;
  }
}

export const yahooAuthService = new YahooAuthService();