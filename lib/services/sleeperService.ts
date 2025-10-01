// Comprehensive Sleeper API Service
const SLEEPER_BASE_URL = 'https://api.sleeper.app/v1';

export interface SleeperUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string;
}

export interface SleeperLeague {
  league_id: string;
  name: string;
  season: string;
  season_type: string;
  status: string;
  sport: string;
  settings: {
    playoff_week_start: number;
    leg: number;
    max_keepers: number;
    draft_rounds: number;
    trade_deadline: number;
    reserve_slots: number;
    bench_slots: number;
    waiver_budget: number;
    [key: string]: any;
  };
  scoring_settings: { [key: string]: number };
  roster_positions: string[];
  total_rosters: number;
}

export interface SleeperRoster {
  roster_id: number;
  owner_id: string;
  league_id: string;
  players: string[];
  starters: string[];
  reserve: string[];
  taxi: string[];
  settings: {
    wins: number;
    losses: number;
    ties: number;
    total_moves: number;
    waiver_position: number;
    waiver_budget_used: number;
    fpts: number;
    fpts_decimal?: number;
    fpts_against: number;
    fpts_against_decimal?: number;
  };
  metadata?: {
    streak?: string;
    record?: string;
  };
}

export interface SleeperMatchup {
  roster_id: number;
  matchup_id: number;
  points: number;
  custom_points: number | null;
  players: string[];
  starters: string[];
  players_points: { [playerId: string]: number };
  starters_points: number[];
}

export interface SleeperPlayer {
  player_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  position: string;
  team: string | null;
  number: number | null;
  status: string;
  injury_status: string | null;
  injury_notes: string | null;
  age: number | null;
  years_exp: number;
  college: string | null;
  fantasy_positions: string[];
  depth_chart_order: number | null;
  depth_chart_position: string | null;
}

export interface SleeperTransaction {
  transaction_id: string;
  type: string; // 'trade', 'waiver', 'free_agent'
  status: string;
  leg: number;
  adds: { [playerId: string]: number }; // playerId -> rosterId
  drops: { [playerId: string]: number };
  roster_ids: number[];
  waiver_budget: number[];
  created: number; // timestamp
}

export interface LeagueUser {
  user_id: string;
  display_name: string;
  team_name?: string;
  avatar?: string;
  metadata?: {
    team_name?: string;
  };
}

class SleeperService {
  private playersCache: Map<string, SleeperPlayer> = new Map();
  private leagueUsersCache: Map<string, Map<string, LeagueUser>> = new Map();
  
  // Get user by username
  async getUser(username: string): Promise<SleeperUser> {
    console.log(`Fetching user data for: ${username}`);
    const response = await fetch(`${SLEEPER_BASE_URL}/user/${username}`);
    if (!response.ok) {
      console.error(`Failed to fetch user ${username}:`, response.status, response.statusText);
      throw new Error(`User '${username}' not found. Please check the username spelling.`);
    }
    const userData = await response.json();
    console.log(`User found:`, userData.display_name);
    return userData;
  }
  
  // Get user's leagues for current season
  async getUserLeagues(userId: string, sport = 'nfl', season?: string): Promise<SleeperLeague[]> {
    let year = season;
    
    // If no season specified, determine current season intelligently
    if (!year) {
      try {
        const nflState = await this.getNFLState();
        year = nflState.season;
        console.log(`Using NFL API season: ${year}`);
      } catch (error) {
        // Fall back to current date logic
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth(); // 0-11
        
        // NFL season typically starts in September (month 8) and runs through February (month 1)
        // If it's March-August, we're in the offseason so use the previous year's season
        if (currentMonth >= 2 && currentMonth <= 7) { // March-August
          year = (currentDate.getFullYear() - 1).toString();
          console.log(`Offseason detected, using previous year: ${year}`);
        } else {
          year = currentDate.getFullYear().toString();
          console.log(`In season, using current year: ${year}`);
        }
      }
    }
    
    console.log(`Fetching leagues for ${userId} in ${year} season`);
    
    try {
      const response = await fetch(`${SLEEPER_BASE_URL}/user/${userId}/leagues/${sport}/${year}`);
      if (!response.ok) {
        console.error(`Failed to fetch leagues for ${year}:`, response.status, response.statusText);
        
        // Try previous year as fallback
        const fallbackYear = (parseInt(year) - 1).toString();
        if (year !== fallbackYear) {
          console.log(`${year} failed, trying ${fallbackYear}...`);
          return this.getUserLeagues(userId, sport, fallbackYear);
        }
        
        throw new Error(`Failed to fetch leagues for ${year} season`);
      }
      const leagues = await response.json();
      console.log(`Found ${leagues.length} leagues for ${year}`);
      return leagues;
    } catch (error) {
      console.error(`Error fetching leagues for ${year}:`, error);
      throw error;
    }
  }
  
  // Get all rosters in a league
  async getLeagueRosters(leagueId: string): Promise<SleeperRoster[]> {
    try {
      const response = await fetch(`${SLEEPER_BASE_URL}/league/${leagueId}/rosters`);
      if (!response.ok) {
        console.error(`Failed to fetch rosters for league ${leagueId}:`, response.status);
        throw new Error(`Failed to fetch rosters (${response.status})`);
      }
      const rosters = await response.json();
      console.log(`Fetched ${rosters.length} rosters for league ${leagueId}`);
      return rosters;
    } catch (error) {
      console.error('Error fetching league rosters:', error);
      throw error;
    }
  }
  
  // Get all users in a league (for display names)
  async getLeagueUsers(leagueId: string): Promise<Map<string, LeagueUser>> {
    // Check cache first
    if (this.leagueUsersCache.has(leagueId)) {
      return this.leagueUsersCache.get(leagueId)!;
    }
    
    const response = await fetch(`${SLEEPER_BASE_URL}/league/${leagueId}/users`);
    if (!response.ok) throw new Error('Failed to fetch league users');
    
    const users: LeagueUser[] = await response.json();
    const userMap = new Map<string, LeagueUser>();
    
    users.forEach(user => {
      userMap.set(user.user_id, {
        ...user,
        team_name: user.metadata?.team_name || user.display_name
      });
    });
    
    this.leagueUsersCache.set(leagueId, userMap);
    return userMap;
  }
  
  // Get matchups for a specific week
  async getMatchups(leagueId: string, week: number): Promise<SleeperMatchup[]> {
    try {
      const response = await fetch(`${SLEEPER_BASE_URL}/league/${leagueId}/matchups/${week}`);
      if (!response.ok) {
        console.error(`Failed to fetch matchups for league ${leagueId}, week ${week}:`, response.status);
        // Return empty array for weeks that haven't happened yet
        if (response.status === 404) {
          console.log(`Week ${week} matchups not found - likely hasn't happened yet`);
          return [];
        }
        throw new Error(`Failed to fetch matchups (${response.status})`);
      }
      const matchups = await response.json();
      console.log(`Fetched ${matchups.length} matchups for league ${leagueId}, week ${week}`);
      return matchups;
    } catch (error) {
      console.error('Error fetching matchups:', error);
      // Return empty array instead of throwing for missing weeks
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return [];
      }
      throw error;
    }
  }
  
  // Get all matchups for season (for calculating form)
  async getSeasonMatchups(leagueId: string, endWeek: number): Promise<Map<number, SleeperMatchup[]>> {
    const matchupsByWeek = new Map<number, SleeperMatchup[]>();
    
    // Fetch matchups for all weeks up to current
    const promises = [];
    for (let week = 1; week <= endWeek; week++) {
      promises.push(
        this.getMatchups(leagueId, week)
          .then(matchups => ({ week, matchups }))
          .catch(() => ({ week, matchups: [] })) // Handle weeks that haven't happened yet
      );
    }
    
    const results = await Promise.all(promises);
    results.forEach(({ week, matchups }) => {
      if (matchups.length > 0) {
        matchupsByWeek.set(week, matchups);
      }
    });
    
    return matchupsByWeek;
  }
  
  // Get current NFL state
  async getNFLState(): Promise<{ week: number; season: string; season_type: string }> {
    try {
      const response = await fetch(`${SLEEPER_BASE_URL}/state/nfl`);
      if (!response.ok) {
        console.error('Failed to fetch NFL state:', response.status);
        throw new Error(`Failed to fetch NFL state (${response.status})`);
      }
      const state = await response.json();
      
      const result = {
        week: state.week || 1,
        season: state.season || new Date().getFullYear().toString(),
        season_type: state.season_type || 'regular'
      };
      
      console.log('NFL State:', result);
      return result;
    } catch (error) {
      console.error('Error fetching NFL state:', error);
      
      // Provide intelligent fallback based on current date
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth(); // 0-11
      const currentYear = currentDate.getFullYear();
      
      // Determine current NFL week based on date (rough approximation)
      let week = 1;
      let season = currentYear.toString();
      let season_type = 'regular';
      
      if (currentMonth >= 8) { // September onwards - new season
        // Week 1 typically starts first week of September
        const startOfSeason = new Date(currentYear, 8, 1); // September 1st
        const weeksSinceStart = Math.floor((currentDate.getTime() - startOfSeason.getTime()) / (7 * 24 * 60 * 60 * 1000));
        week = Math.max(1, Math.min(18, weeksSinceStart + 1));
      } else if (currentMonth <= 1) { // January-February - current season playoffs/end
        season = (currentYear - 1).toString(); // Previous calendar year's season
        week = 18;
        season_type = currentMonth === 0 ? 'post' : 'post'; // January = playoffs
      } else { // March-August - offseason
        season = (currentYear - 1).toString(); // Previous season
        week = 18;
        season_type = 'post';
      }
      
      const fallbackResult = { week, season, season_type };
      console.log('Using fallback NFL state:', fallbackResult);
      return fallbackResult;
    }
  }
  
  // Get all NFL players (cached)
  async getAllPlayers(): Promise<Map<string, SleeperPlayer>> {
    // Return cache if available and recent
    if (this.playersCache.size > 0) {
      return this.playersCache;
    }
    
    // Try to load from localStorage first (might be partial due to quota)
    try {
      const cached = localStorage.getItem('sleeper_players_minimal');
      const cacheTime = localStorage.getItem('sleeper_players_timestamp');
      
      if (cached && cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        // Use cache if less than 24 hours old
        if (age < 24 * 60 * 60 * 1000) {
          const players = JSON.parse(cached);
          players.forEach((player: any) => {
            this.playersCache.set(player.player_id, player);
          });
          if (this.playersCache.size > 0) {
            return this.playersCache;
          }
        }
      }
    } catch (e) {
      console.log('Cache load failed, fetching fresh data');
    }
    
    // Fetch fresh data
    const response = await fetch(`${SLEEPER_BASE_URL}/players/nfl`);
    if (!response.ok) throw new Error('Failed to fetch players');
    
    const players = await response.json();
    
    // Convert to Map and create minimal dataset for storage
    const minimalPlayers: SleeperPlayer[] = [];
    
    Object.entries(players).forEach(([id, player]: [string, any]) => {
      // Only store active/relevant players to save space
      if (player.status === 'Active' || player.team) {
        const minimalPlayer: SleeperPlayer = {
          player_id: id,
          first_name: player.first_name || '',
          last_name: player.last_name || '',
          full_name: player.full_name || `${player.first_name} ${player.last_name}`,
          position: player.position || 'N/A',
          team: player.team || null,
          number: player.number || null,
          status: player.status || 'Active',
          injury_status: player.injury_status || null,
          injury_notes: player.injury_notes || null,
          age: player.age || null,
          years_exp: player.years_exp || 0,
          college: player.college || null,
          fantasy_positions: player.fantasy_positions || [player.position],
          depth_chart_order: player.depth_chart_order || null,
          depth_chart_position: player.depth_chart_position || null
        };
        
        this.playersCache.set(id, minimalPlayer);
        
        // Only store if it's a relevant fantasy player
        if (['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].includes(player.position)) {
          minimalPlayers.push(minimalPlayer);
        }
      }
    });
    
    // Try to cache minimal data (much smaller)
    try {
      localStorage.setItem('sleeper_players_minimal', JSON.stringify(minimalPlayers));
      localStorage.setItem('sleeper_players_timestamp', Date.now().toString());
    } catch (e) {
      console.warn('Could not cache player data due to quota');
      // Clear old data to make room
      try {
        localStorage.removeItem('sleeper_players_data');
        localStorage.removeItem('sleeper_players');
        localStorage.setItem('sleeper_players_minimal', JSON.stringify(minimalPlayers));
        localStorage.setItem('sleeper_players_timestamp', Date.now().toString());
      } catch (e2) {
        console.warn('Storage quota exceeded, using memory cache only');
      }
    }
    
    return this.playersCache;
  }
  
  // Get single player
  async getPlayer(playerId: string): Promise<SleeperPlayer | undefined> {
    const players = await this.getAllPlayers();
    return players.get(playerId);
  }
  
  // Get transactions for a league
  async getTransactions(leagueId: string, week: number): Promise<SleeperTransaction[]> {
    const response = await fetch(`${SLEEPER_BASE_URL}/league/${leagueId}/transactions/${week}`);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
  }
  
  // Get trending players (adds/drops)
  async getTrendingPlayers(sport = 'nfl', type: 'add' | 'drop' = 'add', limit = 25): Promise<any[]> {
    const response = await fetch(`${SLEEPER_BASE_URL}/players/${sport}/trending/${type}?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch trending players');
    return response.json();
  }
  
  // Helper: Get roster with enriched data
  async getEnrichedRoster(leagueId: string, rosterId: number): Promise<{
    roster: SleeperRoster;
    owner: LeagueUser | undefined;
    players: (SleeperPlayer | undefined)[];
  }> {
    const [rosters, users, playerMap] = await Promise.all([
      this.getLeagueRosters(leagueId),
      this.getLeagueUsers(leagueId),
      this.getAllPlayers()
    ]);
    
    const roster = rosters.find(r => r.roster_id === rosterId);
    if (!roster) throw new Error('Roster not found');
    
    const owner = roster.owner_id ? users.get(roster.owner_id) : undefined;
    const players = roster.players.map(playerId => playerMap.get(playerId));
    
    return { roster, owner, players };
  }
  
  // Helper: Calculate optimal lineup
  calculateOptimalLineup(
    players: SleeperPlayer[],
    playerPoints: { [playerId: string]: number },
    rosterPositions: string[]
  ): string[] {
    // Group players by position
    const byPosition: { [pos: string]: Array<{ player: SleeperPlayer; points: number }> } = {};
    
    players.forEach(player => {
      if (!player) return;
      const points = playerPoints[player.player_id] || 0;
      
      player.fantasy_positions?.forEach(pos => {
        if (!byPosition[pos]) byPosition[pos] = [];
        byPosition[pos].push({ player, points });
      });
    });
    
    // Sort each position by points
    Object.keys(byPosition).forEach(pos => {
      byPosition[pos].sort((a, b) => b.points - a.points);
    });
    
    const lineup: string[] = [];
    const used = new Set<string>();
    
    // Fill roster positions
    rosterPositions.forEach(pos => {
      if (pos === 'FLEX') {
        // FLEX can be RB, WR, or TE
        const flexCandidates = [
          ...(byPosition['RB'] || []),
          ...(byPosition['WR'] || []),
          ...(byPosition['TE'] || [])
        ]
          .filter(p => !used.has(p.player.player_id))
          .sort((a, b) => b.points - a.points);
        
        if (flexCandidates[0]) {
          lineup.push(flexCandidates[0].player.player_id);
          used.add(flexCandidates[0].player.player_id);
        }
      } else if (pos === 'SUPER_FLEX') {
        // SUPER_FLEX can be any offensive player
        const superFlexCandidates = [
          ...(byPosition['QB'] || []),
          ...(byPosition['RB'] || []),
          ...(byPosition['WR'] || []),
          ...(byPosition['TE'] || [])
        ]
          .filter(p => !used.has(p.player.player_id))
          .sort((a, b) => b.points - a.points);
        
        if (superFlexCandidates[0]) {
          lineup.push(superFlexCandidates[0].player.player_id);
          used.add(superFlexCandidates[0].player.player_id);
        }
      } else {
        // Regular position
        const candidates = (byPosition[pos] || [])
          .filter(p => !used.has(p.player.player_id));
        
        if (candidates[0]) {
          lineup.push(candidates[0].player.player_id);
          used.add(candidates[0].player.player_id);
        }
      }
    });
    
    return lineup;
  }
}

export const sleeperService = new SleeperService();