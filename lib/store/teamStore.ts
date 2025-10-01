// Client-side store for managing teams
import React from 'react';
import { Team, Player } from '@/lib/types';

// Mock player data for different platforms
const platformPlayers: Record<string, Player[]> = {
  espn: [
    {
      id: 'espn_1',
      name: 'Josh Allen',
      position: 'QB',
      team: 'BUF',
      jerseyNumber: 17,
      status: { isActive: true, gameStatus: 'playing', lastUpdated: new Date() },
      stats: { 
        season: 2024, 
        week: 10, 
        fantasyPoints: 31.2, 
        projectedPoints: 27.5,
        passingYards: 287,
        passingTDs: 2,
        rushingYards: 54,
        rushingTDs: 1
      },
    },
    {
      id: 'espn_2',
      name: 'Saquon Barkley',
      position: 'RB',
      team: 'PHI',
      jerseyNumber: 26,
      status: { isActive: true, gameStatus: 'playing', lastUpdated: new Date() },
      stats: { 
        season: 2024, 
        week: 10, 
        fantasyPoints: 19.8, 
        projectedPoints: 22.0,
        rushingYards: 112,
        rushingTDs: 1,
        receptions: 3,
        receivingYards: 28
      },
    },
    {
      id: 'espn_3',
      name: 'CeeDee Lamb',
      position: 'WR',
      team: 'DAL',
      jerseyNumber: 88,
      status: { isActive: true, gameStatus: 'playing', lastUpdated: new Date() },
      stats: { 
        season: 2024, 
        week: 10, 
        fantasyPoints: 21.3, 
        projectedPoints: 19.5,
        receptions: 9,
        receivingYards: 143,
        receivingTDs: 1,
        targets: 12
      },
    },
  ],
  yahoo: [
    {
      id: 'yahoo_1',
      name: 'Lamar Jackson',
      position: 'QB',
      team: 'BAL',
      jerseyNumber: 8,
      status: { isActive: true, gameStatus: 'playing', lastUpdated: new Date() },
      stats: { 
        season: 2024, 
        week: 10, 
        fantasyPoints: 28.7, 
        projectedPoints: 26.0,
        passingYards: 245,
        passingTDs: 2,
        rushingYards: 87,
        rushingTDs: 1
      },
    },
    {
      id: 'yahoo_2',
      name: 'Austin Ekeler',
      position: 'RB',
      team: 'LAC',
      jerseyNumber: 30,
      status: { isActive: true, gameStatus: 'questionable', lastUpdated: new Date() },
      injuryStatus: {
        type: 'Ankle',
        description: 'Limited in practice',
        severity: 'minor',
        practiceStatus: 'limited'
      },
      stats: { 
        season: 2024, 
        week: 10, 
        fantasyPoints: 15.2, 
        projectedPoints: 18.0,
        rushingYards: 62,
        receptions: 5,
        receivingYards: 45,
        receivingTDs: 1
      },
    },
  ],
  sleeper: [
    {
      id: 'sleeper_1',
      name: 'Jalen Hurts',
      position: 'QB',
      team: 'PHI',
      jerseyNumber: 1,
      status: { isActive: true, gameStatus: 'playing', lastUpdated: new Date() },
      stats: { 
        season: 2024, 
        week: 10, 
        fantasyPoints: 29.8, 
        projectedPoints: 28.0,
        passingYards: 278,
        passingTDs: 2,
        rushingYards: 65,
        rushingTDs: 1
      },
    },
    {
      id: 'sleeper_2',
      name: 'Derrick Henry',
      position: 'RB',
      team: 'TEN',
      jerseyNumber: 22,
      status: { isActive: true, gameStatus: 'playing', lastUpdated: new Date() },
      stats: { 
        season: 2024, 
        week: 10, 
        fantasyPoints: 18.5, 
        projectedPoints: 17.0,
        rushingYards: 125,
        rushingTDs: 1,
        receptions: 2,
        receivingYards: 15
      },
    },
    {
      id: 'sleeper_3',
      name: 'Davante Adams',
      position: 'WR',
      team: 'LV',
      jerseyNumber: 17,
      status: { isActive: true, gameStatus: 'playing', lastUpdated: new Date() },
      stats: { 
        season: 2024, 
        week: 10, 
        fantasyPoints: 23.7, 
        projectedPoints: 21.0,
        receptions: 10,
        receivingYards: 157,
        receivingTDs: 1,
        targets: 14
      },
    },
  ],
};

class TeamStore {
  private teams: Team[] = [];
  private currentTeamId: string | null = null;

  constructor() {
    // Load teams from localStorage on init
    if (typeof window !== 'undefined') {
      const storedTeams = localStorage.getItem('fantasyTeams');
      if (storedTeams) {
        this.teams = JSON.parse(storedTeams);
      }
      
      const storedCurrentTeam = localStorage.getItem('currentTeamId');
      if (storedCurrentTeam) {
        this.currentTeamId = storedCurrentTeam;
      }
    }
  }

  private saveToLocalStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fantasyTeams', JSON.stringify(this.teams));
      if (this.currentTeamId) {
        localStorage.setItem('currentTeamId', this.currentTeamId);
      }
    }
  }

  importTeamFromAPI(platform: string, data: any): Team {
    const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('ImportTeamFromAPI received data:', {
      teamName: data.teamName,
      currentWeek: data.currentWeek,
      matchup: data.matchup,
      record: data.record,
      playersCount: data.players?.length
    });
    
    // Make sure we're using the week score, not season total
    const weekScore = data.matchup?.points || 0;
    const opponentScore = data.matchup?.opponentScore || 0;
    
    console.log('Setting scores:', { weekScore, opponentScore });
    
    // Process players - ensure they have all required fields
    const processedPlayers = data.players?.map((player: any) => ({
      id: player.id,
      name: player.name,
      position: player.position,
      team: player.team,
      jerseyNumber: player.jerseyNumber || 0,
      status: player.status || {
        isActive: false,
        gameStatus: 'healthy',
        lastUpdated: new Date()
      },
      stats: player.stats || {
        season: 2025,
        week: data.currentWeek || 4,
        fantasyPoints: 0,
        projectedPoints: 0
      },
      injuryStatus: player.injuryStatus
    })) || [];
    
    const newTeam: Team = {
      id: teamId,
      userId: 'user1',
      name: data.teamName || `My ${platform} Team`,
      platform: (platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase()) as any,
      platformTeamId: data.leagueId,
      leagueName: data.leagueName,
      leagueId: data.leagueId,
      leagueSize: data.leagueSize || 12,
      scoringType: 'PPR',
      record: data.record || {
        wins: 0,
        losses: 0,
        ties: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        streak: '',
      },
      rank: data.rank || Math.floor(Math.random() * 10) + 1,
      players: processedPlayers,
      liveScore: data.matchup ? {
        teamScore: weekScore, // Use the week score variable
        opponentScore: opponentScore,
        opponentName: data.matchup.opponentName || 'Opponent',
        week: data.matchup.week || data.currentWeek || 1,
        isLive: true,
        timeRemaining: `Week ${data.matchup.week || data.currentWeek || 1}`,
        projectedScore: 0,
        winProbability: 50,
      } : undefined,
      color: '#ff5722',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Calculate win probability based on current scores
    if (newTeam.liveScore) {
      const scoreDiff = newTeam.liveScore.teamScore - newTeam.liveScore.opponentScore;
      newTeam.liveScore.winProbability = Math.max(10, Math.min(90, 50 + (scoreDiff * 2)));
    }
    
    this.teams.push(newTeam);
    this.currentTeamId = teamId;
    this.saveToLocalStorage();
    
    return newTeam;
  }

  importTeam(platform: string, leagueInfo?: { leagueId?: string; teamId?: string; leagueName?: string }) {
    const platformKey = platform.toLowerCase();
    const basePlayers = platformPlayers[platformKey] || platformPlayers.espn;
    
    // Create DEEP COPY of players with unique IDs for this team
    const uniquePlayers = basePlayers.map(player => ({
      ...player,
      id: `${player.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      stats: player.stats ? { ...player.stats } : undefined,
      status: player.status ? { ...player.status } : undefined,
      injuryStatus: player.injuryStatus ? { ...player.injuryStatus } : undefined
    }));
    
    // Generate unique team data
    const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const leagueNames = {
      espn: 'Champions League',
      yahoo: 'Dynasty Dominators',
      sleeper: 'Waiver Wire Warriors',
      nfl: 'Gridiron Legends',
      cbs: 'Prime Time Players',
      draftkings: 'DFS Masters',
    };
    
    const newTeam: Team = {
      id: teamId,
      userId: 'user1',
      name: `My ${platform.toUpperCase()} Team ${this.teams.length + 1}`,
      platform: platform as any,
      platformTeamId: leagueInfo?.teamId || `${platform}_team_${Date.now()}`,
      leagueName: leagueInfo?.leagueName || leagueNames[platformKey] || `${platform} League`,
      leagueId: leagueInfo?.leagueId || `league_${Date.now()}`,
      leagueSize: 12,
      scoringType: 'PPR',
      record: {
        wins: Math.floor(Math.random() * 8) + 2,
        losses: Math.floor(Math.random() * 6),
        ties: 0,
        pointsFor: Math.random() * 500 + 800,
        pointsAgainst: Math.random() * 500 + 750,
        streak: Math.random() > 0.5 ? `W${Math.floor(Math.random() * 3) + 1}` : `L${Math.floor(Math.random() * 2) + 1}`,
      },
      rank: Math.floor(Math.random() * 10) + 1,
      players: uniquePlayers, // Use unique players copy
      liveScore: {
        teamScore: Math.random() * 50 + 70,
        opponentScore: Math.random() * 50 + 65,
        opponentName: 'Opponent Team',
        week: 10,
        isLive: Math.random() > 0.5,
        timeRemaining: '2:35 Q3',
        projectedScore: Math.random() * 50 + 80,
        winProbability: Math.random() * 30 + 40,
      },
      color: platformKey === 'espn' ? '#ff0000' : platformKey === 'yahoo' ? '#7b68ee' : '#ff5722',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.teams.push(newTeam);
    this.currentTeamId = teamId;
    this.saveToLocalStorage();
    
    return newTeam;
  }

  getTeams(): Team[] {
    return this.teams;
  }

  getTeam(teamId: string): Team | undefined {
    return this.teams.find(t => t.id === teamId);
  }

  getCurrentTeam(): Team | undefined {
    if (!this.currentTeamId) return this.teams[0];
    return this.teams.find(t => t.id === this.currentTeamId);
  }

  getCurrentTeamId(): string | null {
    return this.currentTeamId;
  }

  setCurrentTeam(teamId: string) {
    this.currentTeamId = teamId;
    this.saveToLocalStorage();
  }

  updateTeam(teamId: string, updates: Partial<Team>): Team | undefined {
    const teamIndex = this.teams.findIndex(t => t.id === teamId);
    if (teamIndex === -1) return undefined;
    
    this.teams[teamIndex] = {
      ...this.teams[teamIndex],
      ...updates,
      updatedAt: new Date(),
    };
    
    this.saveToLocalStorage();
    return this.teams[teamIndex];
  }

  deleteTeam(teamId: string): boolean {
    const initialLength = this.teams.length;
    this.teams = this.teams.filter(t => t.id !== teamId);
    
    if (this.currentTeamId === teamId) {
      this.currentTeamId = this.teams[0]?.id || null;
    }
    
    this.saveToLocalStorage();
    return this.teams.length < initialLength;
  }

  removeTeam(id: string) {
    this.teams = this.teams.filter(team => team.id !== id);
    if (this.currentTeamId === id) {
      this.currentTeamId = this.teams.length > 0 ? this.teams[0].id : null;
    }
    this.saveToLocalStorage();
  }

  clearAllTeams() {
    this.teams = [];
    this.currentTeamId = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fantasyTeams');
      localStorage.removeItem('currentTeamId');
    }
  }
}

// Create singleton instance
const teamStore = typeof window !== 'undefined' ? new TeamStore() : null;
export default teamStore;

// React Hook for team store
export function useTeamStore() {
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [currentTeamId, setCurrentTeamId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!teamStore) {
      setLoading(false);
      return;
    }

    // Initial load
    setTeams(teamStore.getTeams());
    setCurrentTeamId(teamStore.getCurrentTeamId());
    setLoading(false);

    // Subscribe to changes (simple polling for now)
    const interval = setInterval(() => {
      if (!teamStore) return;
      
      const newTeams = teamStore.getTeams();
      const newCurrentId = teamStore.getCurrentTeamId();
      
      if (JSON.stringify(newTeams) !== JSON.stringify(teams)) {
        setTeams(newTeams);
      }
      if (newCurrentId !== currentTeamId) {
        setCurrentTeamId(newCurrentId);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    teams,
    currentTeamId,
    currentTeam: teams.find(t => t.id === currentTeamId),
    loading,
    addTeam: (team: Team) => {
      if (teamStore) teamStore.addTeam(team);
    },
    updateTeam: (id: string, updates: Partial<Team>) => {
      if (teamStore) teamStore.updateTeam(id, updates);
    },
    removeTeam: (id: string) => {
      if (teamStore) teamStore.removeTeam(id);
    },
    clearAllTeams: () => {
      if (teamStore) teamStore.clearAllTeams();
    },
    setCurrentTeam: (id: string) => {
      if (teamStore) teamStore.setCurrentTeam(id);
    },
    importTeamFromAPI: (platform: string, data: any) => {
      if (teamStore) return teamStore.importTeamFromAPI(platform, data);
      return null;
    },
    clearAll: () => {
      if (teamStore) teamStore.clearAll();
    },
  };
}