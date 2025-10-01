import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlayoffCalculator } from '@/components/analytics/PlayoffCalculator';
import useSleeperStore from '@/lib/store/useSleeperStore';

// Mock the store
vi.mock('@/lib/store/useSleeperStore');
const mockUseSleeperStore = vi.mocked(useSleeperStore);

// Mock the playoff calculator service
vi.mock('@/lib/services/playoffCalculator', () => ({
  playoffCalculatorService: {
    calculatePlayoffProbabilities: vi.fn().mockResolvedValue({
      probabilities: [
        {
          teamId: 1,
          teamName: 'Test Team 1',
          currentRecord: '8-2',
          playoffProbability: 85.5,
          championshipProbability: 25.2,
          projectedWins: 10.5,
          projectedLosses: 3.5,
          strengthOfSchedule: 0.6,
          clinchScenarios: ['Win 2 of next 4 games'],
          eliminationScenarios: []
        },
        {
          teamId: 2,
          teamName: 'Test Team 2',
          currentRecord: '6-4',
          playoffProbability: 65.2,
          championshipProbability: 15.8,
          projectedWins: 8.5,
          projectedLosses: 5.5,
          strengthOfSchedule: 0.55,
          clinchScenarios: ['Win 3 of next 4 games'],
          eliminationScenarios: []
        }
      ],
      totalSimulations: 10000,
      avgPlayoffSpots: 6
    })
  }
}));

const mockStoreState = {
  currentLeague: {
    league_id: 'test-league',
    name: 'Test League',
    settings: {
      playoff_teams: 6,
      playoff_week_start: 15
    }
  },
  rosters: [
    {
      roster_id: 1,
      owner_id: 'user1',
      settings: {
        wins: 8,
        losses: 2,
        fpts: 1200,
        fpts_against: 1000
      }
    },
    {
      roster_id: 2,
      owner_id: 'user2',
      settings: {
        wins: 6,
        losses: 4,
        fpts: 1100,
        fpts_against: 1050
      }
    }
  ],
  leagueUsers: new Map([
    ['user1', { display_name: 'User 1', team_name: 'Test Team 1' }],
    ['user2', { display_name: 'User 2', team_name: 'Test Team 2' }]
  ]),
  myRoster: {
    roster_id: 1,
    owner_id: 'user1'
  },
  currentWeek: 11
};

describe('PlayoffCalculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSleeperStore.mockReturnValue(mockStoreState as any);
  });

  it('renders without crashing', () => {
    render(<PlayoffCalculator />);
    expect(screen.getByText('Playoff Calculator')).toBeInTheDocument();
  });

  it('shows message when no league is selected', () => {
    mockUseSleeperStore.mockReturnValue({
      ...mockStoreState,
      currentLeague: null
    } as any);

    render(<PlayoffCalculator />);
    expect(screen.getByText('Please select a league to view playoff probabilities')).toBeInTheDocument();
  });

  it('displays calculate button initially', () => {
    render(<PlayoffCalculator />);
    expect(screen.getByRole('button', { name: /calculate/i })).toBeInTheDocument();
  });

  it('shows loading state when calculating', async () => {
    render(<PlayoffCalculator />);
    
    const calculateButton = screen.getByRole('button', { name: /calculate/i });
    fireEvent.click(calculateButton);

    expect(screen.getByText(/calculating/i)).toBeInTheDocument();
  });

  it('displays results after calculation', async () => {
    render(<PlayoffCalculator />);
    
    const calculateButton = screen.getByRole('button', { name: /calculate/i });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByText('Test Team 1')).toBeInTheDocument();
      expect(screen.getByText('85.5%')).toBeInTheDocument();
    });
  });

  it('switches between tabs correctly', async () => {
    render(<PlayoffCalculator />);
    
    // Calculate first
    const calculateButton = screen.getByRole('button', { name: /calculate/i });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByText('Test Team 1')).toBeInTheDocument();
    });

    // Switch to scenarios tab
    const scenariosTab = screen.getByRole('tab', { name: /scenarios/i });
    fireEvent.click(scenariosTab);

    await waitFor(() => {
      expect(screen.getByText('Clinch Scenarios')).toBeInTheDocument();
      expect(screen.getByText('Win 2 of next 4 games')).toBeInTheDocument();
    });
  });

  it('highlights user team', async () => {
    render(<PlayoffCalculator />);
    
    const calculateButton = screen.getByRole('button', { name: /calculate/i });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      const userTeamElement = screen.getByText('You');
      expect(userTeamElement).toBeInTheDocument();
    });
  });

  it('sorts teams by playoff probability', async () => {
    render(<PlayoffCalculator />);
    
    const calculateButton = screen.getByRole('button', { name: /calculate/i });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      const teamElements = screen.getAllByText(/Test Team/);
      expect(teamElements[0]).toHaveTextContent('Test Team 1');
      expect(teamElements[1]).toHaveTextContent('Test Team 2');
    });
  });

  it('displays probability badges correctly', async () => {
    render(<PlayoffCalculator />);
    
    const calculateButton = screen.getByRole('button', { name: /calculate/i });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByText('Likely')).toBeInTheDocument(); // 85.5% should be "Likely"
    });
  });

  it('shows simulation count', async () => {
    render(<PlayoffCalculator />);
    
    const calculateButton = screen.getByRole('button', { name: /calculate/i });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByText(/10,000 simulations/)).toBeInTheDocument();
    });
  });

  it('handles error states', async () => {
    const { playoffCalculatorService } = await import('@/lib/services/playoffCalculator');
    vi.mocked(playoffCalculatorService.calculatePlayoffProbabilities).mockRejectedValueOnce(
      new Error('Calculation failed')
    );

    render(<PlayoffCalculator />);
    
    const calculateButton = screen.getByRole('button', { name: /calculate/i });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByText('Calculation failed')).toBeInTheDocument();
    });
  });
});