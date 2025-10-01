// ESPN Real Data Service - Enhanced integration with actual ESPN Fantasy API
// This service provides real-time data fetching from ESPN Fantasy Football

import { Team, Player } from '@/lib/types';

const ESPN_API_BASE = 'https://fantasy.espn.com/apis/v3/games/ffl';
const ESPN_SITE_API = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

// ESPN team ID to NFL team mapping
const ESPN_TEAM_MAP: Record<number, string> = {
  1: 'ATL', 2: 'BUF', 3: 'CHI', 4: 'CIN', 5: 'CLE', 6: 'DAL', 7: 'DEN',
  8: 'DET', 9: 'GB', 10: 'TEN', 11: 'IND', 12: 'KC', 13: 'LV', 14: 'LAR',
  15: 'MIA', 16: 'MIN', 17: 'NE', 18: 'NO', 19: 'NYG', 20: 'NYJ', 21: 'PHI',
  22: 'ARI', 23: 'PIT', 24: 'LAC', 25: 'SF', 26: 'SEA', 27: 'TB', 28: 'WSH',
  29: 'CAR', 30: 'JAX', 33: 'BAL', 34: 'HOU'
};

// Position ID mapping
const POSITION_MAP: Record<number, string> = {
  1: 'QB', 2: 'RB', 3: 'WR', 4: 'TE', 5: 'K', 16: 'D/ST'
};

export class ESPNRealDataService {
  private cookies: { espnS2?: string; SWID?: string } = {};
  
  constructor() {
    // Initialize with any stored cookies
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('espn_cookies');
      if (stored) {
        this.cookies = JSON.parse(stored);
      }
    }
  }

  setCookies(espnS2: string, swid: string) {
    this.cookies = { espnS2, SWID: swid };
    if (typeof window !== 'undefined') {
      localStorage.setItem('espn_cookies', JSON.stringify(this.cookies));
    }
  }

  private async fetchWithCookies(url: string): Promise<any> {
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    // Add cookies if available (for private leagues)
    if (this.cookies.espnS2 && this.cookies.SWID) {
      headers['Cookie'] = `espn_s2=${this.cookies.espnS2}; SWID=${this.cookies.SWID}`;
    }

    try {
      const response = await fetch(url, { 
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        // Try without cookies for public data
        const publicResponse = await fetch(url, {
          headers: { 'Accept': 'application/json' }
        });
        
        if (!publicResponse.ok) {
          throw new Error(`ESPN API error: ${publicResponse.status}`);
        }
        
        return publicResponse.json();
      }

      return response.json();
    } catch (error) {
      console.error('ESPN API fetch error:', error);
      throw error;
    }
  }

  async importLeague(leagueId: string, teamId?: string): Promise<Team[]> {
    const year = new Date().getFullYear();
    const teams: Team[] = [];

    try {
      // Fetch league data with multiple views
      const url = `${ESPN_API_BASE}/seasons/${year}/segments/0/leagues/${leagueId}?` +
        'view=mTeam&view=mRoster&view=mMatchup&view=mSettings&view=mStandings&view=mStatus&view=mLiveScoring';

      const data = await this.fetchWithCookies(url);

      if (!data || !data.teams) {
        throw new Error('Unable to fetch ESPN league data');
      }

      // Get current week
      const currentWeek = data.scoringPeriodId || 1;

      // Process each team
      for (const teamData of data.teams) {
        const roster = await this.parseRoster(teamData.roster?.entries || []);
        
        // Find team's matchup
        const matchup = data.schedule?.find((m: any) => 
          m.matchupPeriodId === Math.ceil(currentWeek / 1) &&
          (m.home?.teamId === teamData.id || m.away?.teamId === teamData.id)
        );

        const isHome = matchup?.home?.teamId === teamData.id;
        const opponent = isHome ? matchup?.away : matchup?.home;

        const team: Team = {
          id: `espn-${leagueId}-${teamData.id}`,
          name: `${teamData.location} ${teamData.nickname}`.trim() || 'ESPN Team',
          platform: 'espn',
          leagueId: leagueId,
          managerId: teamData.primaryOwner || '',
          roster: roster,
          record: {
            wins: teamData.record?.overall?.wins || 0,
            losses: teamData.record?.overall?.losses || 0,
            ties: teamData.record?.overall?.ties || 0
          },
          standing: teamData.playoffSeed || teamData.rankCalculatedFinal || 0,
          points: {
            for: teamData.points || 0,
            against: teamData.pointsAgainst || 0
          },
          projectedPoints: matchup ? (isHome ? matchup.home?.totalProjectedPoints : matchup.away?.totalProjectedPoints) || 0 : 0,
          livePoints: matchup ? (isHome ? matchup.home?.totalPoints : matchup.away?.totalPoints) || 0 : 0,
          matchup: opponent ? {
            opponentId: `espn-${leagueId}-${opponent.teamId}`,
            opponentName: data.teams.find((t: any) => t.id === opponent.teamId)?.name || 'Opponent',
            opponentScore: opponent.totalPoints || 0,
            week: currentWeek
          } : undefined,
          avatar: teamData.logo || '',
          isUserTeam: teamId ? teamData.id.toString() === teamId : false,
          lastUpdated: new Date().toISOString()
        };

        teams.push(team);
      }

      // If specific team requested, filter to just that team
      if (teamId) {
        return teams.filter(t => t.isUserTeam);
      }

      return teams;

    } catch (error) {
      console.error('Error importing ESPN league:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  private async parseRoster(entries: any[]): Promise<Player[]> {
    const players: Player[] = [];

    for (const entry of entries) {
      if (!entry.playerPoolEntry?.player) continue;

      const playerData = entry.playerPoolEntry.player;
      const stats = playerData.stats?.find((s: any) => s.statSourceId === 0) || {};
      
      // Get injury status
      let injuryStatus = 'ACTIVE';
      if (playerData.injured) {
        injuryStatus = playerData.injuryStatus || 'QUESTIONABLE';
      }

      const player: Player = {
        id: `espn-${playerData.id}`,
        name: playerData.fullName,
        position: POSITION_MAP[playerData.defaultPositionId] || 'FLEX',
        team: ESPN_TEAM_MAP[playerData.proTeamId] || 'FA',
        jerseyNumber: playerData.jersey || '',
        status: {
          isActive: entry.lineupSlotId < 20, // Bench slots start at 20
          gameStatus: this.mapInjuryStatus(injuryStatus),
          injuryDesignation: injuryStatus !== 'ACTIVE' ? injuryStatus : undefined
        },
        points: stats.appliedTotal || 0,
        projectedPoints: stats.appliedProjectedTotal || 0,
        stats: {
          passingYards: stats.stats?.[3] || 0,
          passingTDs: stats.stats?.[4] || 0,
          rushingYards: stats.stats?.[24] || 0,
          rushingTDs: stats.stats?.[25] || 0,
          receptions: stats.stats?.[53] || 0,
          receivingYards: stats.stats?.[42] || 0,
          receivingTDs: stats.stats?.[43] || 0,
          fantasyPoints: stats.appliedTotal || 0
        },
        percentOwned: playerData.ownership?.percentOwned || 0,
        percentStarted: playerData.ownership?.percentStarted || 0,
        avatar: `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${playerData.id}.png&w=96&h=70`,
        lastUpdate: new Date().toISOString()
      };

      players.push(player);
    }

    return players;
  }

  private mapInjuryStatus(status: string): 'playing' | 'questionable' | 'doubtful' | 'out' | 'ir' {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
      case 'PROBABLE':
        return 'playing';
      case 'QUESTIONABLE':
        return 'questionable';
      case 'DOUBTFUL':
        return 'doubtful';
      case 'OUT':
        return 'out';
      case 'INJURY_RESERVE':
      case 'IR':
        return 'ir';
      default:
        return 'playing';
    }
  }

  // Get live scores for all NFL games
  async getLiveScores(): Promise<any[]> {
    try {
      const response = await fetch(`${ESPN_SITE_API}/scoreboard`);
      const data = await response.json();
      
      return data.events?.map((event: any) => ({
        id: event.id,
        name: event.name,
        shortName: event.shortName,
        date: event.date,
        completed: event.status.type.completed,
        inProgress: event.status.type.state === 'in',
        period: event.status.period,
        clock: event.status.displayClock,
        teams: event.competitions[0].competitors.map((team: any) => ({
          id: team.team.id,
          name: team.team.displayName,
          abbreviation: team.team.abbreviation,
          score: team.score,
          homeAway: team.homeAway,
          winner: team.winner
        }))
      })) || [];
    } catch (error) {
      console.error('Error fetching ESPN live scores:', error);
      return [];
    }
  }

  // Get player news
  async getPlayerNews(playerId: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${ESPN_SITE_API}/athletes/${playerId}/news`
      );
      const data = await response.json();
      
      return data.articles?.map((article: any) => ({
        headline: article.headline,
        description: article.description,
        published: article.published,
        link: article.links?.web?.href
      })) || [];
    } catch (error) {
      console.error('Error fetching ESPN player news:', error);
      return [];
    }
  }
}

export const espnRealDataService = new ESPNRealDataService();