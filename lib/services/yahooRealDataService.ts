// Yahoo Real Data Service - Enhanced integration with actual Yahoo Fantasy API
// This service provides real-time data fetching from Yahoo Fantasy Football

import { Team, Player } from '@/lib/types';

// Yahoo API endpoints
const YAHOO_API_BASE = 'https://fantasysports.yahooapis.com/fantasy/v2';
const YAHOO_AUTH_URL = 'https://api.login.yahoo.com/oauth2/request_auth';
const YAHOO_TOKEN_URL = 'https://api.login.yahoo.com/oauth2/get_token';

// Position mapping
const POSITION_MAP: Record<string, string> = {
  'QB': 'QB',
  'RB': 'RB',
  'WR': 'WR',
  'TE': 'TE',
  'K': 'K',
  'DEF': 'D/ST',
  'D/ST': 'D/ST',
  'W/R/T': 'FLEX',
  'FLEX': 'FLEX'
};

export class YahooRealDataService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load stored tokens if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('yahoo_tokens');
      if (stored) {
        const tokens = JSON.parse(stored);
        this.accessToken = tokens.accessToken;
        this.refreshToken = tokens.refreshToken;
      }
    }
  }

  setTokens(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    if (refreshToken) {
      this.refreshToken = refreshToken;
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('yahoo_tokens', JSON.stringify({
        accessToken: this.accessToken,
        refreshToken: this.refreshToken
      }));
    }
  }

  private async fetchWithAuth(url: string): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Yahoo authentication required');
    }

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (response.status === 401 && this.refreshToken) {
        // Try to refresh token
        await this.refreshAccessToken();
        // Retry request
        return this.fetchWithAuth(url);
      }

      if (!response.ok) {
        throw new Error(`Yahoo API error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Yahoo API fetch error:', error);
      throw error;
    }
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_YAHOO_CLIENT_ID || '',
      client_secret: process.env.YAHOO_CLIENT_SECRET || '',
      refresh_token: this.refreshToken,
      grant_type: 'refresh_token'
    });

    const response = await fetch(YAHOO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Yahoo access token');
    }

    const data = await response.json();
    this.setTokens(data.access_token, data.refresh_token);
  }

  async importLeague(leagueKey: string, teamKey?: string): Promise<Team[]> {
    const teams: Team[] = [];

    try {
      // Fetch league data
      const leagueUrl = `${YAHOO_API_BASE}/league/${leagueKey};out=teams,standings,scoreboard,settings?format=json`;
      const leagueData = await this.fetchWithAuth(leagueUrl);
      
      if (!leagueData?.fantasy_content?.league) {
        throw new Error('Unable to fetch Yahoo league data');
      }

      const league = leagueData.fantasy_content.league[0];
      const teamsData = leagueData.fantasy_content.league[1]?.teams;

      if (!teamsData) {
        throw new Error('No teams found in Yahoo league');
      }

      // Process each team
      for (let i = 0; i < teamsData.count; i++) {
        const teamData = teamsData[i].team[0];
        
        // Fetch detailed team data including roster
        const teamDetailUrl = `${YAHOO_API_BASE}/team/${teamData.team_key};out=roster,stats,matchups?format=json`;
        const teamDetail = await this.fetchWithAuth(teamDetailUrl);
        
        const roster = await this.parseRoster(teamDetail.fantasy_content.team[1]?.roster);
        const matchup = this.parseMatchup(teamDetail.fantasy_content.team[2]?.matchups);

        const team: Team = {
          id: `yahoo-${teamData.team_key}`,
          name: teamData.name,
          platform: 'yahoo',
          leagueId: leagueKey,
          managerId: teamData.managers?.[0]?.manager?.guid || '',
          roster: roster,
          record: {
            wins: teamData.team_standings?.outcome_totals?.wins || 0,
            losses: teamData.team_standings?.outcome_totals?.losses || 0,
            ties: teamData.team_standings?.outcome_totals?.ties || 0
          },
          standing: teamData.team_standings?.rank || 0,
          points: {
            for: parseFloat(teamData.team_points?.total || '0'),
            against: parseFloat(teamData.team_standings?.points_against || '0')
          },
          projectedPoints: parseFloat(teamData.team_projected_points?.total || '0'),
          livePoints: parseFloat(teamData.team_points?.total || '0'),
          matchup: matchup,
          avatar: teamData.team_logos?.[0]?.url || '',
          isUserTeam: teamKey ? teamData.team_key === teamKey : false,
          lastUpdated: new Date().toISOString()
        };

        teams.push(team);
      }

      // If specific team requested, filter to just that team
      if (teamKey) {
        return teams.filter(t => t.id === `yahoo-${teamKey}`);
      }

      return teams;

    } catch (error) {
      console.error('Error importing Yahoo league:', error);
      return [];
    }
  }

  private async parseRoster(rosterData: any): Promise<Player[]> {
    if (!rosterData?.players) return [];

    const players: Player[] = [];
    const playerCount = rosterData.players.count || 0;

    for (let i = 0; i < playerCount; i++) {
      const playerData = rosterData.players[i].player[0];
      
      const player: Player = {
        id: `yahoo-${playerData.player_key}`,
        name: playerData.name.full,
        position: POSITION_MAP[playerData.display_position] || playerData.display_position,
        team: playerData.editorial_team_abbr || 'FA',
        jerseyNumber: playerData.uniform_number || '',
        status: {
          isActive: playerData.selected_position?.position !== 'BN',
          gameStatus: this.mapInjuryStatus(playerData.status),
          injuryDesignation: playerData.injury_note
        },
        points: parseFloat(playerData.player_points?.total || '0'),
        projectedPoints: parseFloat(playerData.player_projected_points?.total || '0'),
        stats: {
          fantasyPoints: parseFloat(playerData.player_points?.total || '0'),
          passingYards: 0,
          passingTDs: 0,
          rushingYards: 0,
          rushingTDs: 0,
          receptions: 0,
          receivingYards: 0,
          receivingTDs: 0
        },
        percentOwned: parseFloat(playerData.percent_owned || '0'),
        percentStarted: parseFloat(playerData.percent_started || '0'),
        avatar: playerData.image_url || playerData.headshot?.url || '',
        lastUpdate: new Date().toISOString()
      };

      // Parse detailed stats if available
      if (playerData.player_stats?.stats) {
        const stats = playerData.player_stats.stats;
        player.stats = {
          ...player.stats,
          passingYards: stats.find((s: any) => s.stat_id === '5')?.value || 0,
          passingTDs: stats.find((s: any) => s.stat_id === '6')?.value || 0,
          rushingYards: stats.find((s: any) => s.stat_id === '10')?.value || 0,
          rushingTDs: stats.find((s: any) => s.stat_id === '11')?.value || 0,
          receptions: stats.find((s: any) => s.stat_id === '12')?.value || 0,
          receivingYards: stats.find((s: any) => s.stat_id === '13')?.value || 0,
          receivingTDs: stats.find((s: any) => s.stat_id === '14')?.value || 0
        };
      }

      players.push(player);
    }

    return players;
  }

  private parseMatchup(matchupData: any): any {
    if (!matchupData?.matchup) return undefined;

    const matchup = matchupData.matchup;
    return {
      opponentId: `yahoo-${matchup.teams[1]?.team[0]?.team_key}`,
      opponentName: matchup.teams[1]?.team[0]?.name || 'Opponent',
      opponentScore: parseFloat(matchup.teams[1]?.team[1]?.team_points?.total || '0'),
      week: matchup.week
    };
  }

  private mapInjuryStatus(status: string): 'playing' | 'questionable' | 'doubtful' | 'out' | 'ir' {
    const statusUpper = status?.toUpperCase();
    
    if (!statusUpper || statusUpper === 'HEALTHY') return 'playing';
    if (statusUpper.includes('QUESTIONABLE')) return 'questionable';
    if (statusUpper.includes('DOUBTFUL')) return 'doubtful';
    if (statusUpper.includes('OUT')) return 'out';
    if (statusUpper.includes('IR') || statusUpper.includes('INJURED')) return 'ir';
    
    return 'playing';
  }

  // OAuth URL generation for authentication
  getAuthUrl(redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_YAHOO_CLIENT_ID || '',
      redirect_uri: redirectUri,
      response_type: 'code',
      language: 'en-us'
    });

    return `${YAHOO_AUTH_URL}?${params.toString()}`;
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<void> {
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_YAHOO_CLIENT_ID || '',
      client_secret: process.env.YAHOO_CLIENT_SECRET || '',
      redirect_uri: redirectUri,
      code: code,
      grant_type: 'authorization_code'
    });

    const response = await fetch(YAHOO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for Yahoo tokens');
    }

    const data = await response.json();
    this.setTokens(data.access_token, data.refresh_token);
  }

  // Get player news from Yahoo
  async getPlayerNews(playerKey: string): Promise<any[]> {
    try {
      const url = `${YAHOO_API_BASE}/player/${playerKey}/stats?format=json`;
      const data = await this.fetchWithAuth(url);
      
      // Yahoo doesn't have a direct news endpoint, but we can get player notes
      const player = data.fantasy_content?.player?.[0];
      
      if (player?.player_notes) {
        return [{
          headline: `Player Update: ${player.name.full}`,
          description: player.player_notes,
          published: new Date().toISOString(),
          source: 'Yahoo Fantasy'
        }];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching Yahoo player news:', error);
      return [];
    }
  }

  // Get live scores for NFL games from Yahoo
  async getLiveScores(): Promise<any[]> {
    try {
      // This would require additional Yahoo Sports API access
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error fetching Yahoo live scores:', error);
      return [];
    }
  }
}

export const yahooRealDataService = new YahooRealDataService();