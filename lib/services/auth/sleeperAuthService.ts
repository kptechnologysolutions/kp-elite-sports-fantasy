import { FantasyTeam, Player } from '@/lib/types/team';

interface SleeperUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string;
}

interface SleeperLeague {
  league_id: string;
  name: string;
  season: string;
  season_type: string;
  total_rosters: number;
  roster_positions: string[];
  scoring_settings: {
    rec?: number;
    pass_td?: number;
    rush_td?: number;
    rec_td?: number;
  };
  settings: {
    num_teams: number;
    playoff_teams: number;
    daily_waivers: number;
  };
}

interface SleeperRoster {
  roster_id: number;
  owner_id: string;
  league_id: string;
  starters: string[];
  players: string[];
  settings: {
    wins: number;
    losses: number;
    ties: number;
    fpts: number;
    fpts_against: number;
  };
  metadata: {
    team_name?: string;
  };
}

interface SleeperPlayer {
  player_id: string;
  first_name: string;
  last_name: string;
  position: string;
  team: string;
  status: string;
  injury_status?: string;
  fantasy_positions: string[];
}

class SleeperAuthService {
  private baseUrl = 'https://api.sleeper.app/v1';
  private playersCache: Map<string, SleeperPlayer> = new Map();

  /**
   * Sleeper API doesn't require authentication for most endpoints
   * Username is sufficient to fetch user data
   */
  constructor() {
    this.loadPlayersDatabase();
  }

  /**
   * Load Sleeper players database (cached locally)
   */
  private async loadPlayersDatabase() {
    try {
      const response = await fetch(`${this.baseUrl}/players/nfl`);
      if (response.ok) {
        const players = await response.json();
        Object.entries(players).forEach(([id, player]: [string, any]) => {
          this.playersCache.set(id, player);
        });
      }
    } catch (error) {
      console.error('Failed to load Sleeper players database:', error);
    }
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<SleeperUser | null> {
    try {
      const response = await fetch(`${this.baseUrl}/user/${username}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Username "${username}" not found on Sleeper`);
        }
        throw new Error(`Failed to fetch user: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching Sleeper user:', error);
      throw error;
    }
  }

  /**
   * Get all leagues for a user
   */
  async getUserLeagues(userId: string, season?: string): Promise<SleeperLeague[]> {
    const year = season || new Date().getFullYear().toString();
    
    try {
      const response = await fetch(`${this.baseUrl}/user/${userId}/leagues/nfl/${year}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch leagues: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching Sleeper leagues:', error);
      throw error;
    }
  }

  /**
   * Get league details
   */
  async getLeague(leagueId: string): Promise<SleeperLeague | null> {
    try {
      const response = await fetch(`${this.baseUrl}/league/${leagueId}`);
      
      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching Sleeper league:', error);
      return null;
    }
  }

  /**
   * Get all rosters in a league
   */
  async getLeagueRosters(leagueId: string): Promise<SleeperRoster[]> {
    try {
      const response = await fetch(`${this.baseUrl}/league/${leagueId}/rosters`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch rosters: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching Sleeper rosters:', error);
      throw error;
    }
  }

  /**
   * Get users in a league
   */
  async getLeagueUsers(leagueId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/league/${leagueId}/users`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch league users: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching Sleeper league users:', error);
      throw error;
    }
  }

  /**
   * Find user's roster in a league
   */
  async getUserRoster(leagueId: string, userId: string): Promise<SleeperRoster | null> {
    try {
      const [rosters, users] = await Promise.all([
        this.getLeagueRosters(leagueId),
        this.getLeagueUsers(leagueId)
      ]);

      // Find the user in the league
      const leagueUser = users.find(u => u.user_id === userId);
      if (!leagueUser) {
        return null;
      }

      // Find the roster owned by this user
      const roster = rosters.find(r => r.owner_id === leagueUser.user_id);
      return roster || null;
    } catch (error) {
      console.error('Error finding user roster:', error);
      return null;
    }
  }

  /**
   * Get player details
   */
  getPlayer(playerId: string): SleeperPlayer | undefined {
    return this.playersCache.get(playerId);
  }

  /**
   * Convert Sleeper roster to our Player format
   */
  private convertRosterToPlayers(playerIds: string[]): Player[] {
    return playerIds
      .map(playerId => {
        const player = this.getPlayer(playerId);
        if (!player) return null;

        return {
          id: playerId,
          name: `${player.first_name} ${player.last_name}`,
          position: player.position,
          team: player.team || 'FA',
          status: {
            isActive: player.status === 'Active',
            isStarter: false, // Will be set based on starters array
            gameStatus: player.injury_status
          },
          stats: {
            projectedPoints: 0,
            actualPoints: 0,
            seasonTotal: 0
          }
        };
      })
      .filter((p): p is Player => p !== null);
  }

  /**
   * Determine scoring type from league settings
   */
  private determineScoringType(scoringSettings: any): 'PPR' | 'Half-PPR' | 'Standard' {
    const recPoints = scoringSettings?.rec || 0;
    
    if (recPoints === 1) return 'PPR';
    if (recPoints === 0.5) return 'Half-PPR';
    return 'Standard';
  }

  /**
   * Import Sleeper team to our system
   */
  async importTeam(username: string, leagueId?: string): Promise<FantasyTeam[]> {
    try {
      // Get user data
      const user = await this.getUserByUsername(username);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user's leagues
      const leagues = await this.getUserLeagues(user.user_id);
      if (leagues.length === 0) {
        throw new Error('No leagues found for this user');
      }

      // If specific league requested, filter to that league
      const leaguesToImport = leagueId 
        ? leagues.filter(l => l.league_id === leagueId)
        : leagues;

      // Import each league
      const teams: FantasyTeam[] = [];
      
      for (const league of leaguesToImport) {
        const roster = await this.getUserRoster(league.league_id, user.user_id);
        
        if (roster) {
          const players = this.convertRosterToPlayers(roster.players || []);
          
          // Mark starters
          roster.starters?.forEach(starterId => {
            const player = players.find(p => p.id === starterId);
            if (player) {
              player.status.isStarter = true;
            }
          });

          const team: FantasyTeam = {
            id: `sleeper_${league.league_id}_${Date.now()}`,
            name: roster.metadata?.team_name || `${user.display_name}'s Team`,
            platform: 'sleeper',
            leagueId: league.league_id,
            leagueName: league.name,
            leagueSize: league.total_rosters,
            scoringType: this.determineScoringType(league.scoring_settings),
            players,
            record: {
              wins: roster.settings?.wins || 0,
              losses: roster.settings?.losses || 0,
              ties: roster.settings?.ties || 0,
              pointsFor: roster.settings?.fpts || 0,
              pointsAgainst: roster.settings?.fpts_against || 0
            },
            sleeperData: {
              userId: user.user_id,
              username: user.username,
              rosterId: roster.roster_id,
              season: league.season
            }
          };

          teams.push(team);
        }
      }

      if (teams.length === 0) {
        throw new Error('No teams found for this user');
      }

      return teams;
    } catch (error) {
      console.error('Error importing Sleeper team:', error);
      throw error;
    }
  }

  /**
   * Validate Sleeper username
   */
  async validateUsername(username: string): Promise<boolean> {
    try {
      const user = await this.getUserByUsername(username);
      return !!user;
    } catch {
      return false;
    }
  }

  /**
   * Get instructions for Sleeper import
   */
  getImportInstructions(): string {
    return `
To import Sleeper leagues:

1. Enter your Sleeper username (not email)
2. We'll automatically find all your leagues
3. Select which leagues to import

Sleeper's API is public, so no authentication is needed!
Just make sure you're using your correct Sleeper username.

You can find your username in the Sleeper app under:
Settings → Account → Username
    `;
  }
}

export const sleeperAuthService = new SleeperAuthService();