// Sleeper API Integration
// Sleeper has a public API that doesn't require authentication for reading data

const SLEEPER_BASE_URL = 'https://api.sleeper.app/v1';
const NFL_SEASON = '2025'; // Current NFL season - IMPORTANT: Update this each year!

export interface SleeperUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string;
}

export interface SleeperLeague {
  league_id: string;
  name: string;
  total_rosters: number;
  roster_positions: string[];
  scoring_settings: Record<string, number>;
  season: string;
  season_type: string;
  sport: string;
  avatar: string;
}

export interface SleeperRoster {
  roster_id: number;
  owner_id: string;
  league_id: string;
  players: string[];
  starters: string[];
  settings: {
    wins: number;
    losses: number;
    ties: number;
    fpts: number;
    fpts_against: number;
  };
}

export interface SleeperPlayer {
  player_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  team: string;
  position: string;
  number: number;
  status: string;
  injury_status?: string;
  fantasy_positions: string[];
}

export interface SleeperMatchup {
  roster_id: number;
  matchup_id: number;
  points: number;
  custom_points?: number;
  players: string[];
  starters: string[];
}

class SleeperAPI {
  // Get user by username
  async getUser(username: string): Promise<SleeperUser | null> {
    try {
      const response = await fetch(`${SLEEPER_BASE_URL}/user/${username}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching Sleeper user:', error);
      return null;
    }
  }

  // Get all leagues for a user in current season
  async getUserLeagues(userId: string, season: string = NFL_SEASON): Promise<SleeperLeague[]> {
    try {
      const response = await fetch(`${SLEEPER_BASE_URL}/user/${userId}/leagues/nfl/${season}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching user leagues:', error);
      return [];
    }
  }

  // Get rosters for a specific league
  async getLeagueRosters(leagueId: string): Promise<SleeperRoster[]> {
    try {
      const response = await fetch(`${SLEEPER_BASE_URL}/league/${leagueId}/rosters`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching league rosters:', error);
      return [];
    }
  }

  // Get users in a league
  async getLeagueUsers(leagueId: string): Promise<SleeperUser[]> {
    try {
      const response = await fetch(`${SLEEPER_BASE_URL}/league/${leagueId}/users`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching league users:', error);
      return [];
    }
  }

  // Get matchups for a specific week
  async getMatchups(leagueId: string, week: number): Promise<SleeperMatchup[]> {
    try {
      const response = await fetch(`${SLEEPER_BASE_URL}/league/${leagueId}/matchups/${week}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching matchups:', error);
      return [];
    }
  }

  // Get all NFL players
  async getAllPlayers(): Promise<Record<string, SleeperPlayer>> {
    try {
      const response = await fetch(`${SLEEPER_BASE_URL}/players/nfl`);
      if (!response.ok) return {};
      return await response.json();
    } catch (error) {
      console.error('Error fetching NFL players:', error);
      return {};
    }
  }

  // Get current NFL state (week, season, etc)
  async getNFLState(): Promise<any> {
    try {
      const response = await fetch(`${SLEEPER_BASE_URL}/state/nfl`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching NFL state:', error);
      return null;
    }
  }

  // Get trending players (adds/drops)
  async getTrendingPlayers(type: 'add' | 'drop', hours: number = 24, limit: number = 10): Promise<any[]> {
    try {
      const response = await fetch(`${SLEEPER_BASE_URL}/players/nfl/trending/${type}?lookback_hours=${hours}&limit=${limit}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching trending players:', error);
      return [];
    }
  }

  // Helper function to get user's team in a specific league
  async getUserTeam(username: string, leagueId: string) {
    // First get the user
    const user = await this.getUser(username);
    if (!user) return null;

    // Get all rosters in the league
    const rosters = await this.getLeagueRosters(leagueId);
    
    // Find the user's roster
    const userRoster = rosters.find(roster => roster.owner_id === user.user_id);
    if (!userRoster) return null;

    // Get all league users to find team names
    const leagueUsers = await this.getLeagueUsers(leagueId);
    const leagueUser = leagueUsers.find(u => u.user_id === user.user_id);
    
    // Get team metadata (includes team name)
    const leagueTeamsRes = await fetch(`${SLEEPER_BASE_URL}/league/${leagueId}/users`);
    const leagueTeams = await leagueTeamsRes.json();
    const userTeamData = leagueTeams.find((t: any) => t.user_id === user.user_id);
    const teamName = userTeamData?.metadata?.team_name || leagueUser?.display_name || user.display_name || user.username;

    // Get league details
    const leagueResponse = await fetch(`${SLEEPER_BASE_URL}/league/${leagueId}`);
    const league = await leagueResponse.json();

    // Get ACTUAL current NFL week from state
    const nflState = await this.getNFLState();
    // For regular season, use leg (which represents the current week)
    // display_week is for display purposes, leg is the actual week number
    const currentWeek = nflState?.leg || nflState?.week || 1;
    const currentSeason = nflState?.season || NFL_SEASON;
    
    console.log('NFL State:', { 
      currentWeek, 
      currentSeason, 
      leg: nflState?.leg,
      week: nflState?.week,
      display_week: nflState?.display_week,
      season_type: nflState?.season_type,
      nflState 
    });

    // Get current week matchups
    const matchups = await this.getMatchups(leagueId, currentWeek);
    const userMatchup = matchups.find(m => m.roster_id === userRoster.roster_id);
    
    // Find opponent matchup
    let opponentMatchup = null;
    let opponentRoster = null;
    let opponentUser = null;
    let opponentName = 'Opponent';
    
    if (userMatchup) {
      // Find the opponent by matching matchup_id
      opponentMatchup = matchups.find(m => 
        m.matchup_id === userMatchup.matchup_id && 
        m.roster_id !== userRoster.roster_id
      );
      
      if (opponentMatchup) {
        // Find opponent's roster and user info
        opponentRoster = rosters.find(r => r.roster_id === opponentMatchup.roster_id);
        if (opponentRoster) {
          opponentUser = leagueUsers.find(u => u.user_id === opponentRoster.owner_id);
          // Get opponent's team metadata for team name
          const opponentTeamData = leagueTeams.find((t: any) => t.user_id === opponentRoster.owner_id);
          opponentName = opponentTeamData?.metadata?.team_name || opponentUser?.display_name || opponentUser?.username || 'Opponent';
        }
      }
    }

    // Get all players to map IDs to names
    const allPlayers = await this.getAllPlayers();

    // Get player stats for current week if matchup exists
    const playerStats: Record<string, number> = {};
    if (userMatchup && userMatchup.players_points) {
      // Sleeper provides player points in the matchup data
      Object.assign(playerStats, userMatchup.players_points);
    }

    // Map player IDs to player objects with REAL stats
    const rosterPlayers = userRoster.players.map(playerId => {
      const player = allPlayers[playerId];
      if (!player) return null;
      
      // Get this player's actual points for the current week
      const weekPoints = playerStats[playerId] || 0;
      
      return {
        id: playerId,
        name: player.full_name || `${player.first_name} ${player.last_name}`,
        position: player.position,
        team: player.team,
        jerseyNumber: player.number,
        status: {
          isActive: player.status === 'Active',
          gameStatus: player.injury_status || 'playing',
          lastUpdated: new Date()
        },
        injuryStatus: player.injury_status ? {
          type: player.injury_status,
          description: player.injury_status,
          severity: 'unknown',
          practiceStatus: 'unknown'
        } : undefined,
        stats: {
          season: parseInt(currentSeason),
          week: currentWeek,
          fantasyPoints: weekPoints, // Actual points for this week
          projectedPoints: 0,
          isStarter: userMatchup?.starters?.includes(playerId) || false
        }
      };
    }).filter(Boolean);

    // Log the matchup data to debug
    console.log('User Matchup Data:', {
      week: currentWeek,
      userPoints: userMatchup?.points,
      opponentPoints: opponentMatchup?.points,
      userMatchup,
      opponentMatchup
    });

    return {
      user,
      league: {
        id: league.league_id,
        name: league.name,
        size: league.total_rosters,
        scoringType: league.scoring_settings?.rec ? 'PPR' : 'Standard',
        season: league.season
      },
      roster: {
        ...userRoster,
        teamName: teamName, // Use the team name we fetched above
        players: rosterPlayers,
        rank: userRoster.settings?.rank || 1,
        settings: userRoster.settings // Keep the original settings for debugging
      },
      matchup: {
        ...userMatchup,
        points: userMatchup?.points || 0, // This is the WEEK score, not season total
        opponentName,
        opponentScore: opponentMatchup?.points || 0,
        opponentRosterId: opponentMatchup?.roster_id,
        week: currentWeek
      },
      currentWeek,
      currentSeason
    };
  }

  // Import all teams for a user
  async importUserTeams(username: string) {
    const user = await this.getUser(username);
    if (!user) {
      throw new Error(`User "${username}" not found on Sleeper`);
    }

    const leagues = await this.getUserLeagues(user.user_id);
    const teams = [];

    for (const league of leagues) {
      const teamData = await this.getUserTeam(username, league.league_id);
      if (teamData) {
        teams.push({
          platform: 'Sleeper',
          leagueId: league.league_id,
          leagueName: league.name,
          teamName: teamData.roster.teamName,
          roster: teamData.roster,
          league: teamData.league,
          matchup: teamData.matchup
        });
      }
    }

    return teams;
  }
}

// Export singleton instance
export const sleeperAPI = new SleeperAPI();