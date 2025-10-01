'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  sleeperService, 
  SleeperUser, 
  SleeperLeague, 
  SleeperRoster, 
  SleeperPlayer,
  SleeperMatchup,
  LeagueUser
} from '@/lib/services/sleeperService';

interface SleeperStore {
  // User data
  user: SleeperUser | null;
  setUser: (user: SleeperUser | null) => void;
  
  // Leagues
  leagues: SleeperLeague[];
  currentLeague: SleeperLeague | null;
  setCurrentLeague: (league: SleeperLeague | null) => void;
  
  // Rosters & Users
  rosters: SleeperRoster[];
  leagueUsers: Map<string, LeagueUser>;
  myRoster: SleeperRoster | null;
  
  // Players
  players: Map<string, SleeperPlayer>;
  getPlayer: (playerId: string) => SleeperPlayer | undefined;
  
  // Matchups
  currentMatchups: SleeperMatchup[];
  currentWeek: number;
  seasonMatchups: Map<number, SleeperMatchup[]>;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
  
  // Actions
  login: (username: string) => Promise<void>;
  fetchLeagues: () => Promise<void>;
  selectLeague: (leagueId: string) => Promise<void>;
  fetchMatchups: (week?: number) => Promise<void>;
  fetchPlayers: () => Promise<void>;
  refreshData: () => Promise<void>;
  logout: () => void;
  optimizeLineup: () => string[];
}

const useSleeperStore = create<SleeperStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      leagues: [],
      currentLeague: null,
      rosters: [],
      leagueUsers: new Map(),
      myRoster: null,
      players: new Map(),
      currentMatchups: [],
      currentWeek: 1,
      seasonMatchups: new Map(),
      isLoading: false,
      error: null,
      
      // Hydration state
      _hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),
      
      // User actions
      setUser: (user) => set({ user }),
      
      // League actions
      setCurrentLeague: (league) => set({ currentLeague: league }),
      
      // Player actions
      getPlayer: (playerId) => get().players.get(playerId),
      
      // Login and fetch initial data
      login: async (username) => {
        console.log('Store: Starting login process for', username);
        
        // Clear all existing data first
        set({
          user: null,
          leagues: [],
          currentLeague: null,
          rosters: [],
          leagueUsers: new Map(),
          myRoster: null,
          players: new Map(),
          currentMatchups: [],
          currentWeek: 1,
          seasonMatchups: new Map(),
          isLoading: true,
          error: null
        });
        
        try {
          console.log('Store: Getting user for', username);
          // Get user
          const user = await sleeperService.getUser(username);
          console.log('Store: User found:', user.display_name, 'ID:', user.user_id);
          
          // Set user immediately and check if it persisted
          set({ user });
          const checkUser = get().user;
          console.log('Store: User set in state:', !!checkUser, checkUser?.display_name);
          
          // Get leagues
          console.log('Store: Getting leagues...');
          const leagues = await sleeperService.getUserLeagues(user.user_id);
          console.log('Store: Found leagues:', leagues.length);
          set({ leagues });
          
          // Auto-select first league if only one
          if (leagues.length === 1) {
            console.log('Store: Auto-selecting single league:', leagues[0].name);
            await get().selectLeague(leagues[0].league_id);
          } else if (leagues.length > 1) {
            console.log('Store: Multiple leagues found, user needs to select');
          } else {
            console.log('Store: No leagues found for user');
          }
          
          // Fetch players in background
          console.log('Store: Fetching players in background...');
          get().fetchPlayers();
          
          console.log('Store: Login process completed successfully');
        } catch (error: any) {
          console.error('Store: Login error:', error);
          set({ error: error.message, user: null });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Fetch user's leagues
      fetchLeagues: async () => {
        const { user } = get();
        if (!user) return;
        
        try {
          const leagues = await sleeperService.getUserLeagues(user.user_id);
          set({ leagues });
        } catch (error: any) {
          set({ error: error.message });
        }
      },
      
      // Select and load league data
      selectLeague: async (leagueId) => {
        const { user, leagues } = get();
        if (!user) return;
        
        console.log('Store: Selecting league:', leagueId);
        set({ isLoading: true, error: null });
        
        try {
          // Find league
          const league = leagues.find(l => l.league_id === leagueId);
          if (!league) throw new Error('League not found');
          
          console.log('Store: Found league:', league.name);
          set({ currentLeague: league });
          
          // Get NFL state for current week
          console.log('Store: Getting NFL state...');
          const nflState = await sleeperService.getNFLState();
          set({ currentWeek: nflState.week });
          
          // Fetch all league data in parallel
          console.log('Store: Fetching league data...');
          const [rosters, leagueUsers, matchups, seasonMatchups] = await Promise.all([
            sleeperService.getLeagueRosters(leagueId),
            sleeperService.getLeagueUsers(leagueId),
            sleeperService.getMatchups(leagueId, nflState.week),
            sleeperService.getSeasonMatchups(leagueId, nflState.week)
          ]);
          
          // Find user's roster
          const myRoster = rosters.find(r => r.owner_id === user.user_id) || null;
          console.log('Store: Found user roster:', myRoster ? 'Yes' : 'No');
          
          set({ 
            rosters,
            leagueUsers,
            myRoster,
            currentMatchups: matchups,
            seasonMatchups
          });
          console.log('Store: League selection complete');
        } catch (error: any) {
          console.error('Store: League selection error:', error);
          set({ error: error.message });
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Fetch matchups for specific week
      fetchMatchups: async (week) => {
        const { currentLeague, currentWeek } = get();
        if (!currentLeague) return;
        
        const targetWeek = week || currentWeek;
        
        try {
          const matchups = await sleeperService.getMatchups(currentLeague.league_id, targetWeek);
          set({ currentMatchups: matchups, currentWeek: targetWeek });
        } catch (error: any) {
          set({ error: error.message });
        }
      },
      
      // Fetch all NFL players
      fetchPlayers: async () => {
        try {
          const playerMap = await sleeperService.getAllPlayers();
          set({ players: playerMap });
        } catch (error: any) {
          console.error('Failed to fetch players:', error);
          // Don't set error since this is background
        }
      },
      
      // Refresh all data
      refreshData: async () => {
        const { currentLeague, currentWeek } = get();
        if (!currentLeague) return;
        
        set({ isLoading: true });
        
        try {
          await Promise.all([
            get().selectLeague(currentLeague.league_id),
            get().fetchPlayers()
          ]);
        } catch (error: any) {
          set({ error: error.message });
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Optimize lineup based on projections/points
      optimizeLineup: () => {
        const { myRoster, currentLeague, players, currentMatchups } = get();
        if (!myRoster || !currentLeague) return [];
        
        // Get current matchup for player points
        const myMatchup = currentMatchups.find(m => m.roster_id === myRoster.roster_id);
        const playerPoints = myMatchup?.players_points || {};
        
        // Convert players array to the format expected by the service
        const rosterPlayers = myRoster.players
          .map(playerId => players.get(playerId))
          .filter(Boolean) as SleeperPlayer[];
        
        // Use the service's optimization function
        return sleeperService.calculateOptimalLineup(
          rosterPlayers,
          playerPoints,
          currentLeague.roster_positions
        );
      },
      
      // Logout and clear data
      logout: () => {
        set({
          user: null,
          leagues: [],
          currentLeague: null,
          rosters: [],
          leagueUsers: new Map(),
          myRoster: null,
          currentMatchups: [],
          currentWeek: 1,
          isLoading: false,
          error: null
        });
      }
    }),
    {
      name: 'sleeper-store',
      version: 2, // Increment this to force clear old incompatible data
      partialize: (state) => ({
        user: state.user,
        currentLeague: state.currentLeague,
        currentWeek: state.currentWeek,
        _version: 2 // Store version with data
      }),
      onRehydrateStorage: () => (state) => {
        try {
          console.log('Store rehydrated with state:', !!state?.user);
          
          // Check for version mismatch and clear if needed (client-side only)
          if (typeof window !== 'undefined') {
            const storedData = localStorage.getItem('sleeper-store');
            if (storedData) {
              try {
                const parsed = JSON.parse(storedData);
                if (!parsed.state?._version || parsed.state._version < 2) {
                  console.log('Old store version detected, clearing...');
                  localStorage.removeItem('sleeper-store');
                  // Reset to clean state
                  if (state) {
                    state.user = null;
                    state.currentLeague = null;
                    state.currentWeek = 1;
                  }
                }
              } catch (e) {
                console.log('Corrupted store data, clearing...');
                localStorage.removeItem('sleeper-store');
              }
            }
          }
          
          state?.setHasHydrated(true);
        } catch (error) {
          console.error('Error during store rehydration:', error);
          // Clear potentially corrupted data
          if (typeof window !== 'undefined') {
            localStorage.removeItem('sleeper-store');
          }
          state?.setHasHydrated(true);
        }
      },
      // Add safe storage that works with SSR
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null;
          try {
            return localStorage.getItem(name);
          } catch (error) {
            console.warn('Failed to read from localStorage:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return;
          try {
            localStorage.setItem(name, value);
          } catch (error) {
            console.warn('Failed to write to localStorage:', error);
          }
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return;
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.warn('Failed to remove from localStorage:', error);
          }
        },
      },
    }
  )
);

export default useSleeperStore;