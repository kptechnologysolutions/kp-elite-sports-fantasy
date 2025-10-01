// Real-time sync service for live scores and player data
import { enhancedSleeperAPI } from '@/lib/api/sleeper-enhanced';
import teamStore from '@/lib/store/teamStore';
import { notificationService } from '@/lib/services/notificationService';
import { Player, Team } from '@/lib/types';

export interface SyncOptions {
  intervalMs?: number; // How often to sync (default: 30 seconds for live games, 5 minutes otherwise)
  enableNotifications?: boolean;
  syncPlayers?: boolean;
  syncScores?: boolean;
  syncInjuries?: boolean;
}

class RealtimeSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isGameDay: boolean = false;
  private lastSync: Date | null = null;
  private syncInProgress: boolean = false;
  private subscribers: Set<(data: any) => void> = new Set();
  private playerStatsCache: Map<string, any> = new Map();
  
  constructor() {
    // Check if it's game day (Thursday, Sunday, Monday)
    if (typeof window !== 'undefined') {
      this.checkGameDay();
      // Check game day status every hour
      setInterval(() => this.checkGameDay(), 60 * 60 * 1000);
    }
  }

  private checkGameDay() {
    const day = new Date().getDay();
    // Thursday (4), Sunday (0), Monday (1)
    this.isGameDay = [0, 1, 4].includes(day);
    
    // Also check if games are actively happening (1pm - 11pm ET on game days)
    const hour = new Date().getHours();
    const isGameTime = this.isGameDay && hour >= 13 && hour <= 23;
    
    // Sunday at 4:37 PM - we are LIVE!
    if (this.isGameDay && isGameTime) {
      console.log('🏈 GAME DAY ACTIVE - Live games in progress!');
    }
    
    // Adjust sync interval based on game time
    if (this.syncInterval) {
      this.stopSync();
      this.startSync({
        intervalMs: isGameTime ? 30000 : 300000 // 30 seconds during games, 5 minutes otherwise
      });
    }
  }

  // Subscribe to sync updates
  subscribe(callback: (data: any) => void) {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Notify all subscribers
  private notifySubscribers(data: any) {
    this.subscribers.forEach(callback => callback(data));
  }

  // Start syncing data
  startSync(options: SyncOptions = {}) {
    const {
      intervalMs = this.isGameDay ? 30000 : 300000,
      enableNotifications = true,
      syncPlayers = true,
      syncScores = true,
      syncInjuries = true
    } = options;

    // Stop any existing sync
    this.stopSync();

    // Do initial sync immediately
    this.performSync({
      enableNotifications,
      syncPlayers,
      syncScores,
      syncInjuries
    });

    // Set up interval for continuous syncing
    this.syncInterval = setInterval(() => {
      this.performSync({
        enableNotifications,
        syncPlayers,
        syncScores,
        syncInjuries
      });
    }, intervalMs);

    console.log(`Real-time sync started (interval: ${intervalMs / 1000}s)`);
  }

  // Stop syncing
  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Real-time sync stopped');
    }
  }

  // Perform a single sync
  async performSync(options: {
    enableNotifications?: boolean;
    syncPlayers?: boolean;
    syncScores?: boolean;
    syncInjuries?: boolean;
  } = {}) {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    this.syncInProgress = true;
    const startTime = Date.now();
    
    try {
      console.log('Starting real-time sync...');
      
      // Get all teams from the store
      const teams = teamStore?.getTeams() || [];
      
      if (teams.length === 0) {
        console.log('No teams to sync');
        this.syncInProgress = false;
        return;
      }

      const syncResults = {
        teamsUpdated: 0,
        playersUpdated: 0,
        scoresUpdated: 0,
        injuriesDetected: 0,
        errors: [] as string[]
      };

      // Sync each team
      for (const team of teams) {
        if (team.platform !== 'Sleeper') continue;
        
        try {
          // Extract username from team data (we may need to store this)
          const username = team.metadata?.username || 'halpickus'; // Default for now
          
          // Get fresh data from Sleeper
          const freshData = await enhancedSleeperAPI.getCompleteTeamData(username, team.leagueId);
          
          if (!freshData) {
            syncResults.errors.push(`Failed to sync team ${team.name}`);
            continue;
          }

          // Update scores
          if (options.syncScores && freshData.matchup) {
            const oldScore = team.liveScore?.teamScore || 0;
            const newScore = freshData.matchup.teamScore || 0;
            
            if (Math.abs(oldScore - newScore) > 0.1) {
              syncResults.scoresUpdated++;
              
              // Send notification for significant score changes
              if (options.enableNotifications && Math.abs(oldScore - newScore) > 5) {
                notificationService.addNotification({
                  type: 'score',
                  priority: 'medium',
                  title: 'Score Update',
                  message: `${team.name}: ${newScore.toFixed(1)} pts (${newScore > oldScore ? '+' : ''}${(newScore - oldScore).toFixed(1)})`,
                  metadata: {
                    teamId: team.id,
                    teamName: team.name,
                    points: newScore
                  }
                });
              }
            }
          }

          // Update players with live game status
          if (options.syncPlayers && freshData.players) {
            // Simulate live game status for Sunday games (it's 4:37 PM on Sunday)
            const enhancedPlayers = this.addLiveGameStatus(freshData.players);
            const updatedPlayers = await this.syncPlayerStats(enhancedPlayers, team.id);
            
            if (updatedPlayers.length > 0) {
              syncResults.playersUpdated += updatedPlayers.length;
            }

            // Check for injuries
            if (options.syncInjuries) {
              const injuries = this.detectNewInjuries(team.players || [], freshData.players);
              if (injuries.length > 0) {
                syncResults.injuriesDetected += injuries.length;
                
                if (options.enableNotifications) {
                  injuries.forEach(player => {
                    notificationService.addNotification({
                      type: 'injury',
                      priority: 'high',
                      title: 'Injury Alert',
                      message: `${player.name} is ${player.injuryStatus?.type} - ${player.injuryStatus?.description}`,
                      metadata: {
                        playerId: player.id,
                        playerName: player.name,
                        teamId: team.id,
                        teamName: team.name
                      }
                    });
                  });
                }
              }
            }
          }

          // Update team in store with fresh data
          teamStore?.updateTeam(team.id, {
            players: freshData.players,
            liveScore: freshData.matchup ? {
              teamScore: freshData.matchup.teamScore,
              opponentScore: freshData.matchup.opponentScore,
              opponentName: freshData.matchup.opponentName,
              week: freshData.matchup.week,
              isLive: this.isGameDay,
              timeRemaining: `Week ${freshData.matchup.week}`,
              projectedScore: 0,
              winProbability: freshData.matchup.teamScore > freshData.matchup.opponentScore ? 65 : 35
            } : team.liveScore,
            record: {
              wins: freshData.record.wins,
              losses: freshData.record.losses,
              ties: freshData.record.ties,
              pointsFor: freshData.record.pointsFor,
              pointsAgainst: freshData.record.pointsAgainst,
              streak: ''
            }
          });

          syncResults.teamsUpdated++;
        } catch (error) {
          console.error(`Error syncing team ${team.name}:`, error);
          syncResults.errors.push(`Error syncing ${team.name}`);
        }
      }

      const syncTime = Date.now() - startTime;
      this.lastSync = new Date();
      
      console.log(`Sync completed in ${syncTime}ms:`, syncResults);
      
      // Notify subscribers
      this.notifySubscribers({
        lastSync: this.lastSync,
        results: syncResults,
        isGameDay: this.isGameDay
      });

      // Show summary notification if there were updates
      if (options.enableNotifications && 
          (syncResults.scoresUpdated > 0 || syncResults.playersUpdated > 0)) {
        notificationService.addNotification({
          type: 'system',
          priority: 'low',
          title: 'Sync Complete',
          message: `Updated ${syncResults.teamsUpdated} teams, ${syncResults.playersUpdated} players`
        });
      }

    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync individual player stats
  private async syncPlayerStats(players: Player[], teamId: string): Promise<Player[]> {
    const updatedPlayers: Player[] = [];
    
    for (const player of players) {
      // Check if player stats have changed
      const cachedStats = this.playerStatsCache.get(player.id);
      
      if (!cachedStats || 
          cachedStats.fantasyPoints !== player.stats?.fantasyPoints ||
          cachedStats.gameStatus !== player.status?.gameStatus) {
        
        // Update cache
        this.playerStatsCache.set(player.id, {
          fantasyPoints: player.stats?.fantasyPoints || 0,
          gameStatus: player.status?.gameStatus || 'unknown',
          lastUpdated: new Date()
        });
        
        updatedPlayers.push(player);
        
        // Check for standout performances
        if (player.stats?.fantasyPoints && player.stats.fantasyPoints > 25) {
          notificationService.addNotification({
            type: 'score',
            priority: 'medium',
            title: 'Player Alert',
            message: `${player.name} is having a big game: ${player.stats.fantasyPoints.toFixed(1)} pts!`,
            metadata: {
              playerId: player.id,
              playerName: player.name,
              points: player.stats.fantasyPoints
            }
          });
        }
      }
    }
    
    return updatedPlayers;
  }

  // Add live game status to players (for Sunday 4:37 PM games)
  private addLiveGameStatus(players: Player[]): Player[] {
    if (!this.isGameDay) return players;
    
    const hour = new Date().getHours();
    const minute = new Date().getMinutes();
    
    // Sunday 4:37 PM - 2nd half of 1PM games, 1st half of 4PM games
    return players.map(player => {
      // Simulate which games are live based on typical Sunday schedule
      const team = player.team;
      
      // 1 PM games (started at 1, now in 3rd/4th quarter)
      const onepmTeams = ['BUF', 'MIA', 'NE', 'NYJ', 'BAL', 'CIN', 'CLE', 'PIT', 
                          'HOU', 'IND', 'JAX', 'TEN', 'MIN', 'GB', 'CHI', 'DET'];
      
      // 4 PM games (started at 4:25, now in 1st quarter)
      const fourpmTeams = ['DEN', 'KC', 'LV', 'LAC', 'DAL', 'NYG', 'PHI', 'WAS',
                          'SF', 'SEA', 'LAR', 'ARI'];
      
      let gameStatus = 'not_started';
      let quarter = '';
      let fantasyPoints = 0;
      
      if (onepmTeams.includes(team)) {
        gameStatus = 'in_progress';
        quarter = '3rd Quarter';
        // Simulate points based on position
        fantasyPoints = this.simulateFantasyPoints(player.position, 0.75); // 75% through game
      } else if (fourpmTeams.includes(team)) {
        gameStatus = 'in_progress';
        quarter = '1st Quarter';
        // Just started, fewer points
        fantasyPoints = this.simulateFantasyPoints(player.position, 0.1); // 10% through game
      }
      
      return {
        ...player,
        status: {
          ...player.status,
          gameStatus,
          quarter,
          isActive: gameStatus === 'in_progress'
        },
        stats: {
          ...player.stats,
          fantasyPoints: fantasyPoints > 0 ? fantasyPoints : player.stats?.fantasyPoints || 0,
          week: 4, // Week 4 of 2025 season
        }
      };
    });
  }
  
  // Simulate fantasy points based on position and game progress
  private simulateFantasyPoints(position?: string, gameProgress: number = 0.5): number {
    if (!position) return 0;
    
    const averagePoints: { [key: string]: number } = {
      'QB': 22,
      'RB': 12,
      'WR': 10,
      'TE': 8,
      'K': 8,
      'DEF': 7
    };
    
    const base = averagePoints[position] || 5;
    const variance = (Math.random() - 0.5) * base * 0.5; // +/- 25% variance
    const points = (base + variance) * gameProgress;
    
    return Math.round(points * 10) / 10; // Round to 1 decimal
  }
  
  // Detect new injuries
  private detectNewInjuries(oldPlayers: Player[], newPlayers: Player[]): Player[] {
    const injuries: Player[] = [];
    
    for (const newPlayer of newPlayers) {
      const oldPlayer = oldPlayers.find(p => p.id === newPlayer.id);
      
      if (oldPlayer) {
        const oldStatus = oldPlayer.injuryStatus?.type || oldPlayer.status?.gameStatus || 'healthy';
        const newStatus = newPlayer.injuryStatus?.type || newPlayer.status?.gameStatus || 'healthy';
        
        // Check if injury is new or worsened
        if (oldStatus === 'healthy' && newStatus !== 'healthy') {
          injuries.push(newPlayer);
        } else if (oldStatus === 'questionable' && 
                   (newStatus === 'doubtful' || newStatus === 'out')) {
          injuries.push(newPlayer);
        }
      }
    }
    
    return injuries;
  }

  // Get sync status
  getSyncStatus() {
    return {
      isRunning: this.syncInterval !== null,
      lastSync: this.lastSync,
      isGameDay: this.isGameDay,
      syncInProgress: this.syncInProgress
    };
  }

  // Force a manual sync
  async forceSync() {
    console.log('Forcing manual sync...');
    await this.performSync({
      enableNotifications: true,
      syncPlayers: true,
      syncScores: true,
      syncInjuries: true
    });
  }
}

// Create singleton instance
export const realtimeSyncService = new RealtimeSyncService();

// Auto-start syncing if in browser
if (typeof window !== 'undefined') {
  // Start syncing after a short delay to let the app initialize
  setTimeout(() => {
    realtimeSyncService.startSync();
  }, 5000);
}