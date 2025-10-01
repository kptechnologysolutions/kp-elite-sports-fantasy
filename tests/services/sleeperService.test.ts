import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sleeperService } from '@/lib/services/sleeperService';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SleeperService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUser', () => {
    it('should fetch user data successfully', async () => {
      const mockUser = {
        user_id: '123456789',
        username: 'testuser',
        display_name: 'Test User',
        avatar: null
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      const result = await sleeperService.getUser('testuser');
      
      expect(result).toEqual(mockUser);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sleeper.app/v1/user/testuser'
      );
    });

    it('should throw error for invalid user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(sleeperService.getUser('invaliduser')).rejects.toThrow();
    });
  });

  describe('getUserLeagues', () => {
    it('should fetch user leagues successfully', async () => {
      const mockLeagues = [
        {
          league_id: 'league1',
          name: 'Test League',
          season: '2025',
          total_rosters: 12
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLeagues
      });

      const result = await sleeperService.getUserLeagues('123456789');
      
      expect(result).toEqual(mockLeagues);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sleeper.app/v1/user/123456789/leagues/nfl/2025'
      );
    });
  });

  describe('getLeagueRosters', () => {
    it('should fetch league rosters successfully', async () => {
      const mockRosters = [
        {
          roster_id: 1,
          owner_id: '123456789',
          players: ['4046', '6813'],
          starters: ['4046'],
          settings: {
            wins: 5,
            losses: 2,
            fpts: 850.5
          }
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRosters
      });

      const result = await sleeperService.getLeagueRosters('league1');
      
      expect(result).toEqual(mockRosters);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sleeper.app/v1/league/league1/rosters'
      );
    });
  });

  describe('calculateOptimalLineup', () => {
    it('should calculate optimal lineup correctly', () => {
      const mockPlayers = [
        {
          player_id: '4046',
          position: 'QB',
          full_name: 'Josh Allen',
          first_name: 'Josh',
          last_name: 'Allen',
          team: 'BUF',
          status: 'Active',
          injury_status: null,
          injury_notes: null,
          age: 28,
          years_exp: 6,
          college: 'Wyoming',
          fantasy_positions: ['QB'],
          depth_chart_order: null,
          depth_chart_position: null,
          number: null
        },
        {
          player_id: '6813',
          position: 'WR',
          full_name: 'Cooper Kupp',
          first_name: 'Cooper',
          last_name: 'Kupp',
          team: 'LAR',
          status: 'Active',
          injury_status: null,
          injury_notes: null,
          age: 30,
          years_exp: 7,
          college: 'Eastern Washington',
          fantasy_positions: ['WR'],
          depth_chart_order: null,
          depth_chart_position: null,
          number: null
        }
      ];

      const playerPoints = {
        '4046': 25.5,
        '6813': 18.2
      };

      const rosterPositions = ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'K', 'DEF'];

      const result = sleeperService.calculateOptimalLineup(
        mockPlayers,
        playerPoints,
        rosterPositions
      );

      expect(result).toContain('4046'); // QB should be in lineup
      expect(result).toContain('6813'); // WR should be in lineup
    });

    it('should handle empty player list', () => {
      const result = sleeperService.calculateOptimalLineup([], {}, ['QB', 'RB']);
      expect(result).toEqual([]);
    });
  });

  describe('getNFLState', () => {
    it('should fetch NFL state successfully', async () => {
      const mockState = {
        week: 5,
        season: '2025',
        season_type: 'regular',
        leg: 5,
        display_week: 4
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockState
      });

      const result = await sleeperService.getNFLState();
      
      expect(result).toEqual(mockState);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sleeper.app/v1/state/nfl'
      );
    });
  });

  describe('getMatchups', () => {
    it('should fetch matchups successfully', async () => {
      const mockMatchups = [
        {
          roster_id: 1,
          matchup_id: 1,
          points: 125.5,
          players: ['4046', '6813'],
          starters: ['4046'],
          players_points: {
            '4046': 25.5,
            '6813': 18.2
          },
          starters_points: [25.5],
          custom_points: null
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMatchups
      });

      const result = await sleeperService.getMatchups('league1', 5);
      
      expect(result).toEqual(mockMatchups);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sleeper.app/v1/league/league1/matchups/5'
      );
    });
  });
});