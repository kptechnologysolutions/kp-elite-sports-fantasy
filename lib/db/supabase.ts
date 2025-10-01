import { createClient } from '@supabase/supabase-js';

// These would be in .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DBUser {
  id: string;
  sleeper_username: string;
  sleeper_user_id: string;
  display_name: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DBLeague {
  id: string;
  sleeper_league_id: string;
  name: string;
  season: string;
  status: string;
  settings: any;
  scoring_settings: any;
  roster_positions: string[];
  total_rosters: number;
  created_at: Date;
  updated_at: Date;
}

export interface DBRoster {
  id: string;
  league_id: string;
  user_id: string;
  sleeper_roster_id: number;
  players: string[];
  starters: string[];
  wins: number;
  losses: number;
  ties: number;
  points_for: number;
  points_against: number;
  updated_at: Date;
}

export interface DBPlayer {
  player_id: string;
  first_name: string;
  last_name: string;
  position: string;
  team: string;
  status: string;
  injury_status?: string;
  fantasy_points_season?: number;
  projected_points_week?: number;
  stats: any;
  updated_at: Date;
}

export interface DBTransaction {
  id: string;
  league_id: string;
  type: 'trade' | 'waiver' | 'free_agent';
  roster_ids: number[];
  adds: { [key: string]: number };
  drops: { [key: string]: number };
  status: 'pending' | 'complete' | 'failed';
  created_at: Date;
}

export interface DBLineupHistory {
  id: string;
  roster_id: string;
  week: number;
  starters: string[];
  bench: string[];
  points_scored: number;
  optimal_lineup: string[];
  optimal_points: number;
  created_at: Date;
}

// Helper functions
export const dbHelpers = {
  // User functions
  async upsertUser(user: Partial<DBUser>) {
    const { data, error } = await supabase
      .from('users')
      .upsert(user, { onConflict: 'sleeper_user_id' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async getUserByUsername(username: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('sleeper_username', username)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
  
  // League functions
  async upsertLeague(league: Partial<DBLeague>) {
    const { data, error } = await supabase
      .from('leagues')
      .upsert(league, { onConflict: 'sleeper_league_id' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async getUserLeagues(userId: string) {
    const { data, error } = await supabase
      .from('rosters')
      .select(`
        *,
        league:leagues(*)
      `)
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  },
  
  // Roster functions
  async upsertRoster(roster: Partial<DBRoster>) {
    const { data, error } = await supabase
      .from('rosters')
      .upsert(roster, { onConflict: 'sleeper_roster_id,league_id' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async getLeagueRosters(leagueId: string) {
    const { data, error } = await supabase
      .from('rosters')
      .select(`
        *,
        user:users(*)
      `)
      .eq('league_id', leagueId);
    
    if (error) throw error;
    return data;
  },
  
  // Player functions
  async upsertPlayers(players: Partial<DBPlayer>[]) {
    const { data, error } = await supabase
      .from('players')
      .upsert(players, { onConflict: 'player_id' })
      .select();
    
    if (error) throw error;
    return data;
  },
  
  async getPlayersByIds(playerIds: string[]) {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .in('player_id', playerIds);
    
    if (error) throw error;
    return data;
  },
  
  // Lineup history
  async saveLineupHistory(lineup: Partial<DBLineupHistory>) {
    const { data, error } = await supabase
      .from('lineup_history')
      .insert(lineup)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async getLineupHistory(rosterId: string, weeks?: number) {
    let query = supabase
      .from('lineup_history')
      .select('*')
      .eq('roster_id', rosterId)
      .order('week', { ascending: false });
    
    if (weeks) {
      query = query.limit(weeks);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  },
  
  // Transactions
  async saveTransaction(transaction: Partial<DBTransaction>) {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async getLeagueTransactions(leagueId: string, limit = 50) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('league_id', leagueId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }
};

export default supabase;