'use client';

import { io, Socket } from 'socket.io-client';

export interface LiveScoreUpdate {
  type: 'score_update' | 'player_news' | 'matchup_update' | 'week_finalized';
  timestamp: number;
  data: any;
}

export interface PlayerScoreUpdate {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  points: number;
  previousPoints: number;
  gameStatus: 'pre' | 'live' | 'final';
  lastUpdate: string;
}

export interface MatchupScoreUpdate {
  matchupId: number;
  leagueId: string;
  week: number;
  teams: {
    rosterId: number;
    score: number;
    projectedScore: number;
    isWinning: boolean;
  }[];
  timeRemaining: string;
  gamesInProgress: number;
  gamesCompleted: number;
}

export interface NewsUpdate {
  playerId: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  type: 'injury' | 'trade' | 'lineup' | 'performance';
  timestamp: number;
}

class LiveScoringService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private callbacks: Map<string, Set<Function>> = new Map();
  
  /**
   * Initialize WebSocket connection
   */
  connect(userId: string, leagueIds: string[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Initialize socket connection
        this.socket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001', {
          auth: {
            userId,
            leagueIds
          },
          transports: ['websocket', 'polling'],
          timeout: 20000,
          forceNew: true
        });
        
        this.setupEventHandlers();
        
        this.socket.on('connect', () => {
          console.log('Live scoring connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        });
        
        this.socket.on('connect_error', (error) => {
          console.error('Live scoring connection error:', error);
          reject(error);
        });
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Set up WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;
    
    this.socket.on('disconnect', () => {
      console.log('Live scoring disconnected');
      this.isConnected = false;
      this.attemptReconnect();
    });
    
    // Score updates
    this.socket.on('player_score_update', (data: PlayerScoreUpdate) => {
      this.emit('player_score_update', data);
    });
    
    this.socket.on('matchup_score_update', (data: MatchupScoreUpdate) => {
      this.emit('matchup_score_update', data);
    });
    
    // News updates
    this.socket.on('player_news', (data: NewsUpdate) => {
      this.emit('player_news', data);
    });
    
    // Week events
    this.socket.on('week_started', (data: { week: number; season: string }) => {
      this.emit('week_started', data);
    });
    
    this.socket.on('week_finalized', (data: { week: number; season: string }) => {
      this.emit('week_finalized', data);
    });
    
    // Game events
    this.socket.on('game_started', (data: { gameId: string; teams: string[] }) => {
      this.emit('game_started', data);
    });
    
    this.socket.on('game_finished', (data: { gameId: string; finalScore: any }) => {
      this.emit('game_finished', data);
    });
    
    // League-specific events
    this.socket.on('trade_completed', (data: any) => {
      this.emit('trade_completed', data);
    });
    
    this.socket.on('waiver_processed', (data: any) => {
      this.emit('waiver_processed', data);
    });
  }
  
  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    setTimeout(() => {
      console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      if (this.socket) {
        this.socket.connect();
      }
    }, delay);
  }
  
  /**
   * Subscribe to specific league updates
   */
  subscribeToLeague(leagueId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe_league', { leagueId });
    }
  }
  
  /**
   * Unsubscribe from league updates
   */
  unsubscribeFromLeague(leagueId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe_league', { leagueId });
    }
  }
  
  /**
   * Subscribe to specific player updates
   */
  subscribeToPlayer(playerId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe_player', { playerId });
    }
  }
  
  /**
   * Request current live scores
   */
  requestLiveScores(leagueId: string, week: number): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('get_live_scores', { leagueId, week });
    }
  }
  
  /**
   * Subscribe to event
   */
  on(eventType: string, callback: Function): void {
    if (!this.callbacks.has(eventType)) {
      this.callbacks.set(eventType, new Set());
    }
    this.callbacks.get(eventType)!.add(callback);
  }
  
  /**
   * Unsubscribe from event
   */
  off(eventType: string, callback: Function): void {
    const callbacks = this.callbacks.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }
  
  /**
   * Emit event to subscribers
   */
  private emit(eventType: string, data: any): void {
    const callbacks = this.callbacks.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in live scoring callback:', error);
        }
      });
    }
  }
  
  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
    this.callbacks.clear();
  }
  
  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
  
  /**
   * Mock live score updates for development
   */
  startMockUpdates(leagueId: string, week: number): void {
    if (process.env.NODE_ENV !== 'development') return;
    
    console.log('Starting mock live score updates');
    
    // Mock player score update every 30 seconds
    setInterval(() => {
      const mockPlayers = [
        { id: '4046', name: 'Josh Allen', position: 'QB', team: 'BUF' },
        { id: '6794', name: 'Austin Ekeler', position: 'RB', team: 'WSH' },
        { id: '6813', name: 'Cooper Kupp', position: 'WR', team: 'LAR' },
        { id: '6806', name: 'Travis Kelce', position: 'TE', team: 'KC' }
      ];
      
      const randomPlayer = mockPlayers[Math.floor(Math.random() * mockPlayers.length)];
      const currentPoints = Math.random() * 30;
      const previousPoints = Math.max(0, currentPoints - Math.random() * 5);
      
      this.emit('player_score_update', {
        playerId: randomPlayer.id,
        playerName: randomPlayer.name,
        position: randomPlayer.position,
        team: randomPlayer.team,
        points: Math.round(currentPoints * 100) / 100,
        previousPoints: Math.round(previousPoints * 100) / 100,
        gameStatus: 'live',
        lastUpdate: new Date().toISOString()
      });
    }, 30000);
    
    // Mock matchup update every 60 seconds
    setInterval(() => {
      this.emit('matchup_score_update', {
        matchupId: 1,
        leagueId,
        week,
        teams: [
          {
            rosterId: 1,
            score: Math.random() * 150,
            projectedScore: 120 + Math.random() * 40,
            isWinning: true
          },
          {
            rosterId: 2,
            score: Math.random() * 140,
            projectedScore: 115 + Math.random() * 40,
            isWinning: false
          }
        ],
        timeRemaining: '2:34',
        gamesInProgress: 3,
        gamesCompleted: 10
      });
    }, 60000);
    
    // Mock news update every 2 minutes
    setInterval(() => {
      const mockPlayers = [
        { id: '1', name: 'Josh Allen' },
        { id: '2', name: 'Christian McCaffrey' },
        { id: '3', name: 'Cooper Kupp' },
        { id: '4', name: 'Stefon Diggs' },
        { id: '5', name: 'Travis Kelce' }
      ];
      
      const mockNews = [
        'Player questionable for Sunday',
        'Touchdown scored!',
        'Injury during warmups',
        'Game-winning performance',
        'Benched for remainder of game'
      ];
      
      const randomPlayer = mockPlayers[Math.floor(Math.random() * mockPlayers.length)];
      const randomNews = mockNews[Math.floor(Math.random() * mockNews.length)];
      
      this.emit('player_news', {
        playerId: randomPlayer.id,
        title: `${randomPlayer.name}: ${randomNews}`,
        description: `Latest update on ${randomPlayer.name}`,
        impact: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        type: Math.random() > 0.5 ? 'injury' : 'performance',
        timestamp: Date.now()
      });
    }, 120000);
  }
}

export const liveScoringService = new LiveScoringService();