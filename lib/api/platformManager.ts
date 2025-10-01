// Unified Platform Manager
// Coordinates all fantasy platform APIs and provides a single interface

import { sleeperAPI } from './sleeper';
import { yahooAPI } from './yahoo';
import { espnAPI } from './espn';
import { Team, Player } from '@/lib/types';

export type Platform = 'Sleeper' | 'Yahoo' | 'ESPN' | 'NFL' | 'CBS' | 'DraftKings';

export interface PlatformCredentials {
  platform: Platform;
  accessToken?: string;
  refreshToken?: string;
  username?: string;
  espnS2?: string;
  swid?: string;
}

export interface UnifiedTeam extends Team {
  platformOriginalData?: any;
  lastSyncedAt: Date;
  syncStatus: 'synced' | 'syncing' | 'error' | 'pending';
  syncError?: string;
}

export interface UnifiedPlayer extends Player {
  platformIds: {
    sleeper?: string;
    yahoo?: string;
    espn?: number;
    nfl?: string;
  };
  aggregatedStats?: {
    averageProjection: number;
    consensusRanking: number;
    injuryReports: Array<{
      source: Platform;
      status: string;
      description: string;
    }>;
  };
}

class PlatformManager {
  private credentials: Map<Platform, PlatformCredentials> = new Map();
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();

  // Initialize platform credentials
  async connectPlatform(credentials: PlatformCredentials): Promise<boolean> {
    try {
      switch (credentials.platform) {
        case 'Sleeper':
          // Sleeper doesn't need auth, just username
          if (!credentials.username) {
            throw new Error('Username required for Sleeper');
          }
          this.credentials.set('Sleeper', credentials);
          return true;

        case 'Yahoo':
          if (!credentials.accessToken) {
            throw new Error('Access token required for Yahoo');
          }
          this.credentials.set('Yahoo', credentials);
          return true;

        case 'ESPN':
          if (!credentials.espnS2 || !credentials.swid) {
            throw new Error('ESPN cookies required');
          }
          this.credentials.set('ESPN', credentials);
          return true;

        default:
          throw new Error(`Platform ${credentials.platform} not yet supported`);
      }
    } catch (error) {
      console.error(`Failed to connect ${credentials.platform}:`, error);
      return false;
    }
  }

  // Import teams from all connected platforms
  async importAllTeams(): Promise<UnifiedTeam[]> {
    const allTeams: UnifiedTeam[] = [];

    // Import from Sleeper
    const sleeperCreds = this.credentials.get('Sleeper');
    if (sleeperCreds?.username) {
      try {
        const sleeperTeams = await this.importSleeperTeams(sleeperCreds.username);
        allTeams.push(...sleeperTeams);
      } catch (error) {
        console.error('Failed to import Sleeper teams:', error);
      }
    }

    // Import from Yahoo
    const yahooCreds = this.credentials.get('Yahoo');
    if (yahooCreds?.accessToken) {
      try {
        const yahooTeams = await this.importYahooTeams(yahooCreds.accessToken);
        allTeams.push(...yahooTeams);
      } catch (error) {
        console.error('Failed to import Yahoo teams:', error);
      }
    }

    // Import from ESPN
    const espnCreds = this.credentials.get('ESPN');
    if (espnCreds?.espnS2 && espnCreds?.swid) {
      try {
        const espnTeams = await this.importESPNTeams(espnCreds.espnS2, espnCreds.swid);
        allTeams.push(...espnTeams);
      } catch (error) {
        console.error('Failed to import ESPN teams:', error);
      }
    }

    return allTeams;
  }

  // Import Sleeper teams
  private async importSleeperTeams(username: string): Promise<UnifiedTeam[]> {
    const user = await sleeperAPI.getUser(username);
    if (!user) throw new Error('Sleeper user not found');

    const leagues = await sleeperAPI.getUserLeagues(user.user_id);
    const teams: UnifiedTeam[] = [];

    for (const league of leagues) {
      const teamData = await sleeperAPI.getUserTeam(username, league.league_id);
      if (!teamData) continue;

      teams.push(this.convertSleeperToUnified(teamData));
    }

    return teams;
  }

  // Import Yahoo teams
  private async importYahooTeams(accessToken: string): Promise<UnifiedTeam[]> {
    const yahooTeams = await yahooAPI.importUserTeams(accessToken);
    return yahooTeams.map(data => this.convertYahooToUnified(data));
  }

  // Import ESPN teams
  private async importESPNTeams(espnS2: string, swid: string): Promise<UnifiedTeam[]> {
    const espnTeams = await espnAPI.importUserTeams(espnS2, swid);
    return espnTeams.map(data => this.convertESPNToUnified(data));
  }

  // Conversion methods
  private convertSleeperToUnified(data: any): UnifiedTeam {
    return {
      id: `sleeper_${data.league.id}_${data.roster.roster_id}`,
      userId: data.user.user_id,
      name: data.roster.teamName,
      platform: 'Sleeper',
      platformTeamId: data.roster.roster_id.toString(),
      leagueName: data.league.name,
      leagueId: data.league.id,
      leagueSize: data.league.size,
      scoringType: data.league.scoringType,
      record: data.roster.settings ? {
        wins: data.roster.settings.wins || 0,
        losses: data.roster.settings.losses || 0,
        ties: data.roster.settings.ties || 0,
        pointsFor: data.roster.settings.fpts || 0,
        pointsAgainst: data.roster.settings.fpts_against || 0,
        streak: '',
      } : undefined,
      rank: data.roster.rank || 1,
      players: data.roster.players || [],
      liveScore: data.matchup ? {
        teamScore: data.matchup.points || 0,
        opponentScore: data.matchup.opponentScore || 0,
        opponentName: data.matchup.opponentName || 'Opponent',
        week: data.currentWeek,
        isLive: true,
        timeRemaining: `Week ${data.currentWeek}`,
        projectedScore: 0,
        winProbability: 50,
      } : undefined,
      color: '#ff5722',
      createdAt: new Date(),
      updatedAt: new Date(),
      platformOriginalData: data,
      lastSyncedAt: new Date(),
      syncStatus: 'synced',
    };
  }

  private convertYahooToUnified(data: any): UnifiedTeam {
    const { team, league } = data;
    
    return {
      id: `yahoo_${league.league_key}`,
      userId: data.user.guid,
      name: team.name,
      platform: 'Yahoo',
      platformTeamId: team.team_key,
      leagueName: league.name,
      leagueId: league.league_key,
      leagueSize: league.num_teams,
      scoringType: league.scoring_type,
      record: {
        wins: 0,
        losses: 0,
        ties: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        streak: '',
      },
      rank: 1,
      players: this.convertYahooPlayers(team.roster),
      liveScore: team.matchup ? {
        teamScore: team.matchup.team_points,
        opponentScore: team.matchup.opponent_points,
        opponentName: team.matchup.opponent_name,
        week: team.matchup.week,
        isLive: !team.matchup.winner_team_key,
        timeRemaining: `Week ${team.matchup.week}`,
        projectedScore: 0,
        winProbability: 50,
      } : undefined,
      color: '#7b68ee',
      createdAt: new Date(),
      updatedAt: new Date(),
      platformOriginalData: data,
      lastSyncedAt: new Date(),
      syncStatus: 'synced',
    };
  }

  private convertESPNToUnified(data: any): UnifiedTeam {
    const { team, league, matchup } = data;
    
    return {
      id: `espn_${league.id}_${team.id}`,
      userId: team.owners[0] || 'unknown',
      name: `${team.location} ${team.nickname}`,
      platform: 'ESPN',
      platformTeamId: team.id.toString(),
      leagueName: league.name,
      leagueId: league.id.toString(),
      leagueSize: league.size,
      scoringType: league.settings.scoringType,
      record: {
        wins: team.record.overall.wins,
        losses: team.record.overall.losses,
        ties: team.record.overall.ties,
        pointsFor: team.points,
        pointsAgainst: team.pointsAgainst,
        streak: '',
      },
      rank: team.rankCalculatedFinal || team.playoffSeed || 1,
      players: this.convertESPNPlayers(team.roster.entries),
      liveScore: matchup ? {
        teamScore: matchup.home.teamId === team.id ? 
          matchup.home.totalPoints : matchup.away?.totalPoints || 0,
        opponentScore: matchup.home.teamId === team.id ? 
          matchup.away?.totalPoints || 0 : matchup.home.totalPoints,
        opponentName: 'Opponent',
        week: matchup.matchupPeriodId,
        isLive: matchup.winner === 'UNDECIDED',
        timeRemaining: `Week ${matchup.matchupPeriodId}`,
        projectedScore: matchup.home.teamId === team.id ? 
          matchup.home.totalProjectedPoints : matchup.away?.totalProjectedPoints || 0,
        winProbability: 50,
      } : undefined,
      color: '#ff0000',
      createdAt: new Date(),
      updatedAt: new Date(),
      platformOriginalData: data,
      lastSyncedAt: new Date(),
      syncStatus: 'synced',
    };
  }

  private convertYahooPlayers(roster: any[]): Player[] {
    return roster.map(player => ({
      id: player.player_key,
      name: player.name.full,
      position: player.display_position,
      team: player.editorial_team_abbr,
      jerseyNumber: parseInt(player.uniform_number) || 0,
      status: {
        isActive: player.status === 'active',
        gameStatus: player.injury_note ? 'questionable' : 'playing',
        lastUpdated: new Date(),
      },
      injuryStatus: player.injury_note ? {
        type: 'Injury',
        description: player.injury_note,
        severity: 'unknown',
        practiceStatus: 'unknown',
      } : undefined,
      stats: {
        season: 2025,
        week: player.player_points.week,
        fantasyPoints: player.player_points.week,
        projectedPoints: 0,
      },
    }));
  }

  private convertESPNPlayers(entries: any[]): Player[] {
    return entries.map(entry => {
      const player = entry.playerPoolEntry?.player;
      if (!player) return null;

      return {
        id: player.id.toString(),
        name: player.fullName,
        position: this.getPositionFromSlotId(entry.lineupSlotId),
        team: this.getTeamAbbreviation(player.proTeamId),
        jerseyNumber: parseInt(player.jersey) || 0,
        status: {
          isActive: entry.status === 'NORMAL',
          gameStatus: player.injuryStatus || 'playing',
          lastUpdated: new Date(),
        },
        injuryStatus: player.injured ? {
          type: player.injuryStatus,
          description: player.injuryStatus,
          severity: 'unknown',
          practiceStatus: 'unknown',
        } : undefined,
        stats: {
          season: 2025,
          week: 1,
          fantasyPoints: player.stats?.[0]?.appliedTotal || 0,
          projectedPoints: 0,
        },
      };
    }).filter(Boolean) as Player[];
  }

  private getPositionFromSlotId(slotId: number): string {
    const positions: Record<number, string> = {
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
    return positions[slotId] || 'BENCH';
  }

  private getTeamAbbreviation(proTeamId: number): string {
    const teams: Record<number, string> = {
      1: 'ATL', 2: 'BUF', 3: 'CHI', 4: 'CIN', 5: 'CLE',
      6: 'DAL', 7: 'DEN', 8: 'DET', 9: 'GB', 10: 'TEN',
      11: 'IND', 12: 'KC', 13: 'LV', 14: 'LAR', 15: 'MIA',
      16: 'MIN', 17: 'NE', 18: 'NO', 19: 'NYG', 20: 'NYJ',
      21: 'PHI', 22: 'ARI', 23: 'PIT', 24: 'LAC', 25: 'SF',
      26: 'SEA', 27: 'TB', 28: 'WSH', 29: 'CAR', 30: 'JAX',
      33: 'BAL', 34: 'HOU',
    };
    return teams[proTeamId] || 'FA';
  }

  // Start auto-sync for a team
  startAutoSync(teamId: string, intervalMs: number = 60000) {
    // Clear existing interval if any
    this.stopAutoSync(teamId);

    const interval = setInterval(async () => {
      try {
        await this.syncTeam(teamId);
      } catch (error) {
        console.error(`Auto-sync failed for team ${teamId}:`, error);
      }
    }, intervalMs);

    this.syncIntervals.set(teamId, interval);
  }

  // Stop auto-sync for a team
  stopAutoSync(teamId: string) {
    const interval = this.syncIntervals.get(teamId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(teamId);
    }
  }

  // Sync a specific team
  async syncTeam(teamId: string): Promise<UnifiedTeam | null> {
    // This would fetch latest data from the platform and update the team
    console.log(`Syncing team ${teamId}...`);
    // Implementation would go here
    return null;
  }

  // Clean up all intervals
  cleanup() {
    this.syncIntervals.forEach(interval => clearInterval(interval));
    this.syncIntervals.clear();
  }
}

// Export singleton instance
export const platformManager = new PlatformManager();