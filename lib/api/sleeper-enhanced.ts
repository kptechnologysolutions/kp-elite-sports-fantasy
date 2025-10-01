// Enhanced Sleeper API with complete player data
import { Player } from '@/lib/types';

const SLEEPER_BASE_URL = 'https://api.sleeper.app/v1';
// 2025 NFL Season starts Sept 4, 2025. Today is Sept 28, so we're in Week 4
const NFL_SEASON = '2025';
const getCurrentNFLWeek = () => {
  // NFL 2025 season started September 4, 2025
  const seasonStart = new Date('2025-09-04');
  const now = new Date();
  const daysSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
  const weekNumber = Math.min(18, Math.max(1, Math.floor(daysSinceStart / 7) + 1));
  return weekNumber;
};

export class EnhancedSleeperAPI {
  private playersCache: Record<string, any> = {};
  private nflState: any = null;

  async getNFLState() {
    if (!this.nflState) {
      const res = await fetch(`${SLEEPER_BASE_URL}/state/nfl`);
      this.nflState = await res.json();
    }
    return this.nflState;
  }

  async getAllPlayers() {
    if (Object.keys(this.playersCache).length === 0) {
      const res = await fetch(`${SLEEPER_BASE_URL}/players/nfl`);
      this.playersCache = await res.json();
    }
    return this.playersCache;
  }

  async getUser(username: string) {
    const res = await fetch(`${SLEEPER_BASE_URL}/user/${username}`);
    if (!res.ok) return null;
    return res.json();
  }

  async getUserLeagues(userId: string) {
    const res = await fetch(`${SLEEPER_BASE_URL}/user/${userId}/leagues/nfl/${NFL_SEASON}`);
    return res.json();
  }

  async getCompleteTeamData(username: string, leagueId: string): Promise<any> {
    try {
      // Get all necessary data in parallel
      const [user, league, rosters, users, nflState, players] = await Promise.all([
        this.getUser(username),
        fetch(`${SLEEPER_BASE_URL}/league/${leagueId}`).then(r => r.json()),
        fetch(`${SLEEPER_BASE_URL}/league/${leagueId}/rosters`).then(r => r.json()),
        fetch(`${SLEEPER_BASE_URL}/league/${leagueId}/users`).then(r => r.json()),
        this.getNFLState(),
        this.getAllPlayers(),
      ]);

      if (!user) throw new Error('User not found');

      // Find user's roster
      const myRoster = rosters.find((r: any) => 
        r.owner_id === user.user_id || r.co_owners?.includes(user.user_id)
      );
      
      if (!myRoster) throw new Error('Roster not found');

      // Get user's team info
      const myUser = users.find((u: any) => u.user_id === user.user_id);
      const teamName = myUser?.metadata?.team_name || myUser?.display_name || username;

      // Get current week matchups - use our calculated week
      const currentWeek = getCurrentNFLWeek();
      const matchupsRes = await fetch(`${SLEEPER_BASE_URL}/league/${leagueId}/matchups/${currentWeek}`);
      const matchups = await matchupsRes.json();
      
      const myMatchup = matchups.find((m: any) => m.roster_id === myRoster.roster_id);
      
      let matchupData = null;
      if (myMatchup) {
        // Find opponent
        const oppMatchup = matchups.find((m: any) => 
          m.matchup_id === myMatchup.matchup_id && m.roster_id !== myRoster.roster_id
        );
        
        if (oppMatchup) {
          const oppRoster = rosters.find((r: any) => r.roster_id === oppMatchup.roster_id);
          const oppUser = users.find((u: any) => u.user_id === oppRoster?.owner_id);
          const oppName = oppUser?.metadata?.team_name || oppUser?.display_name || 'Unknown';
          
          matchupData = {
            week: currentWeek,
            teamScore: myMatchup.points || 0,
            opponentScore: oppMatchup.points || 0,
            opponentName: oppName,
            matchupId: myMatchup.matchup_id,
            starters: myMatchup.starters || [],
            startersPoints: myMatchup.starters_points || [],
          };
        }
      }

      // Build complete player data
      const rosterPlayers: Player[] = [];
      
      if (myRoster.players && Array.isArray(myRoster.players)) {
        for (const playerId of myRoster.players) {
          const playerData = players[playerId];
          const isStarter = myMatchup?.starters?.includes(playerId);
          const starterIndex = isStarter ? myMatchup.starters.indexOf(playerId) : -1;
          const weekPoints = starterIndex >= 0 && myMatchup?.starters_points?.[starterIndex] 
            ? myMatchup.starters_points[starterIndex] : 0;
          
          const player: Player = {
            id: playerId,
            name: playerData ? `${playerData.first_name} ${playerData.last_name}` : `Player ${playerId}`,
            position: playerData?.position || 'Unknown',
            team: playerData?.team || 'FA',
            jerseyNumber: parseInt(playerData?.number) || 0,
            status: {
              isActive: isStarter || false,
              gameStatus: playerData?.injury_status || 'healthy',
              lastUpdated: new Date(),
            },
            stats: {
              season: parseInt(NFL_SEASON),
              week: currentWeek,
              fantasyPoints: weekPoints,
              projectedPoints: 0,
            },
          };

          if (playerData?.injury_status) {
            player.injuryStatus = {
              type: playerData.injury_status,
              description: playerData.injury_notes || playerData.injury_status,
              severity: 'unknown',
              practiceStatus: playerData.practice_participation || 'unknown',
            };
          }

          rosterPlayers.push(player);
        }
      }

      return {
        league: {
          id: league.league_id,
          name: league.name,
          size: league.total_rosters,
          scoringType: league.scoring_settings?.rec ? 'PPR' : 'Standard',
          season: league.season,
          status: league.status,
        },
        team: {
          id: myRoster.roster_id,
          name: teamName,
          owner: myUser?.display_name || username,
        },
        roster: myRoster,
        record: {
          wins: myRoster.settings?.wins || 0,
          losses: myRoster.settings?.losses || 0,
          ties: myRoster.settings?.ties || 0,
          pointsFor: myRoster.settings?.fpts || 0, // Season total
          pointsAgainst: myRoster.settings?.fpts_against || 0,
          rank: myRoster.settings?.rank || 0,
        },
        matchup: matchupData,
        players: rosterPlayers,
        currentWeek,
        metadata: {
          lastUpdate: new Date(),
          source: 'sleeper',
          userId: user.user_id,
        },
      };
    } catch (error) {
      console.error('Error fetching complete team data:', error);
      throw error;
    }
  }

  async getAllUserTeams(username: string): Promise<any[]> {
    try {
      const user = await this.getUser(username);
      if (!user) throw new Error('User not found');

      const leagues = await this.getUserLeagues(user.user_id);
      const allTeams = [];

      for (const league of leagues) {
        try {
          const teamData = await this.getCompleteTeamData(username, league.league_id);
          allTeams.push(teamData);
        } catch (error) {
          console.error(`Failed to import league ${league.name}:`, error);
        }
      }

      return allTeams;
    } catch (error) {
      console.error('Error fetching all teams:', error);
      throw error;
    }
  }
}

export const enhancedSleeperAPI = new EnhancedSleeperAPI();