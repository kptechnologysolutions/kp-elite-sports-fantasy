import { describe, it, expect } from 'vitest';
import { playoffCalculatorService } from '@/lib/services/playoffCalculator';

describe('PlayoffCalculatorService', () => {
  const mockTeams = [
    {
      teamId: 1,
      wins: 8,
      losses: 2,
      ties: 0,
      pointsFor: 1200,
      pointsAgainst: 1000,
      remainingSchedule: [2, 3, 4]
    },
    {
      teamId: 2,
      wins: 6,
      losses: 4,
      ties: 0,
      pointsFor: 1100,
      pointsAgainst: 1050,
      remainingSchedule: [1, 3, 4]
    },
    {
      teamId: 3,
      wins: 4,
      losses: 6,
      ties: 0,
      pointsFor: 1000,
      pointsAgainst: 1100,
      remainingSchedule: [1, 2, 4]
    },
    {
      teamId: 4,
      wins: 2,
      losses: 8,
      ties: 0,
      pointsFor: 900,
      pointsAgainst: 1200,
      remainingSchedule: [1, 2, 3]
    }
  ];

  const mockLeagueSettings = {
    playoffTeams: 4,
    regularSeasonWeeks: 14,
    currentWeek: 11
  };

  describe('calculatePlayoffProbabilities', () => {
    it('should calculate playoff probabilities for all teams', async () => {
      const result = await playoffCalculatorService.calculatePlayoffProbabilities(
        mockTeams,
        mockLeagueSettings
      );

      expect(result.probabilities).toHaveLength(4);
      expect(result.totalSimulations).toBeGreaterThan(0);
      expect(result.avgPlayoffSpots).toBe(4);

      // Team with best record should have highest probability
      const team1 = result.probabilities.find(p => p.teamId === 1);
      const team4 = result.probabilities.find(p => p.teamId === 4);
      
      expect(team1!.playoffProbability).toBeGreaterThan(team4!.playoffProbability);
    });

    it('should handle edge case with no remaining games', async () => {
      const teamsWithNoGames = mockTeams.map(team => ({
        ...team,
        remainingSchedule: []
      }));

      const settingsWithNoGames = {
        ...mockLeagueSettings,
        currentWeek: 14
      };

      const result = await playoffCalculatorService.calculatePlayoffProbabilities(
        teamsWithNoGames,
        settingsWithNoGames
      );

      expect(result.probabilities).toHaveLength(4);
      
      // With no games remaining, probabilities should be based on current standings
      const sortedByRecord = result.probabilities.sort((a, b) => 
        b.playoffProbability - a.playoffProbability
      );
      
      expect(sortedByRecord[0].teamId).toBe(1); // Best record
      expect(sortedByRecord[3].teamId).toBe(4); // Worst record
    });

    it('should provide realistic probability ranges', async () => {
      const result = await playoffCalculatorService.calculatePlayoffProbabilities(
        mockTeams,
        mockLeagueSettings
      );

      result.probabilities.forEach(team => {
        expect(team.playoffProbability).toBeGreaterThanOrEqual(0);
        expect(team.playoffProbability).toBeLessThanOrEqual(100);
        expect(team.championshipProbability).toBeGreaterThanOrEqual(0);
        expect(team.championshipProbability).toBeLessThanOrEqual(100);
        expect(team.championshipProbability).toBeLessThanOrEqual(team.playoffProbability);
      });
    });

    it('should calculate strength of schedule correctly', async () => {
      const result = await playoffCalculatorService.calculatePlayoffProbabilities(
        mockTeams,
        mockLeagueSettings
      );

      result.probabilities.forEach(team => {
        expect(team.strengthOfSchedule).toBeGreaterThanOrEqual(0);
        expect(team.strengthOfSchedule).toBeLessThanOrEqual(1);
      });
    });

    it('should provide clinch and elimination scenarios', async () => {
      const result = await playoffCalculatorService.calculatePlayoffProbabilities(
        mockTeams,
        mockLeagueSettings
      );

      result.probabilities.forEach(team => {
        expect(Array.isArray(team.clinchScenarios)).toBe(true);
        expect(Array.isArray(team.eliminationScenarios)).toBe(true);
      });

      // Team with best record should have easier clinch scenarios
      const team1 = result.probabilities.find(p => p.teamId === 1);
      const team4 = result.probabilities.find(p => p.teamId === 4);
      
      expect(team1!.clinchScenarios.length).toBeGreaterThanOrEqual(team4!.clinchScenarios.length);
    });

    it('should handle single team scenario', async () => {
      const singleTeam = [mockTeams[0]];
      const result = await playoffCalculatorService.calculatePlayoffProbabilities(
        singleTeam,
        { ...mockLeagueSettings, playoffTeams: 1 }
      );

      expect(result.probabilities).toHaveLength(1);
      expect(result.probabilities[0].playoffProbability).toBe(100);
      expect(result.probabilities[0].championshipProbability).toBe(100);
    });
  });
});