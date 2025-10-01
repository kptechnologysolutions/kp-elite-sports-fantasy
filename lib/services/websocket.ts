// WebSocket Service for Real-Time Updates
// Provides live scoring, player updates, and notifications

import { io, Socket } from 'socket.io-client';
import { Team, Player, LiveScore } from '@/lib/types';
import { platformManager } from '@/lib/api/platformManager';

export interface LiveUpdate {
  type: 'score' | 'player' | 'injury' | 'news' | 'trade' | 'matchup';
  timestamp: Date;
  data: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface PlayerUpdate {
  playerId: string;
  playerName: string;
  team: string;
  update: {
    type: 'touchdown' | 'big_play' | 'injury' | 'benched' | 'ejected';
    points: number;
    description: string;
    yardage?: number;
    playType?: string;
  };
}

export interface InjuryUpdate {
  playerId: string;
  playerName: string;
  status: 'questionable' | 'doubtful' | 'out' | 'injured_reserve';
  description: string;
  returnEstimate?: string;
  fantasyImpact: 'minimal' | 'moderate' | 'severe' | 'season_ending';
}

export interface NewsUpdate {
  headline: string;
  summary: string;
  players: string[];
  teams: string[];
  impact: 'positive' | 'negative' | 'neutral';
  source: string;
  url?: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map();
  private isConnected = false;
  private pingInterval: NodeJS.Timeout | null = null;

  // Initialize WebSocket connection
  connect(userId: string, options?: { 
    autoReconnect?: boolean;
    reconnectDelay?: number;
    debug?: boolean;
  }) {
    // Skip WebSocket connection in development if no WS_URL is set
    if (!process.env.NEXT_PUBLIC_WS_URL) {
      console.log('WebSocket disabled - no NEXT_PUBLIC_WS_URL configured');
      return;
    }
    
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    
    this.socket = io(wsUrl, {
      auth: { userId },
      transports: ['websocket'],
      reconnection: options?.autoReconnect !== false,
      reconnectionDelay: options?.reconnectDelay || this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventHandlers(options?.debug);
    this.startHeartbeat();
  }

  private setupEventHandlers(debug?: boolean) {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      if (debug) console.log('WebSocket connected');
      this.emit('connection', { status: 'connected' });
      
      // Resubscribe to all previous subscriptions
      this.resubscribeAll();
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      if (debug) console.log('WebSocket disconnected:', reason);
      this.emit('connection', { status: 'disconnected', reason });
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });

    // Live updates
    this.socket.on('live_update', (update: LiveUpdate) => {
      this.handleLiveUpdate(update);
    });

    // Player-specific updates
    this.socket.on('player_update', (update: PlayerUpdate) => {
      this.emit('player_update', update);
      this.emit(`player:${update.playerId}`, update);
    });

    // Injury updates
    this.socket.on('injury_update', (update: InjuryUpdate) => {
      this.emit('injury_update', update);
      this.emit(`injury:${update.playerId}`, update);
    });

    // News updates
    this.socket.on('news_update', (update: NewsUpdate) => {
      this.emit('news_update', update);
      update.players.forEach(playerId => {
        this.emit(`news:${playerId}`, update);
      });
    });

    // Score updates
    this.socket.on('score_update', (data: {
      teamId: string;
      score: number;
      opponentScore: number;
      projectedScore: number;
      winProbability: number;
    }) => {
      this.emit('score_update', data);
      this.emit(`score:${data.teamId}`, data);
    });

    // Trade alerts
    this.socket.on('trade_alert', (data: {
      leagueId: string;
      tradeId: string;
      teams: string[];
      players: any[];
      status: 'proposed' | 'accepted' | 'rejected' | 'processed';
    }) => {
      this.emit('trade_alert', data);
      this.emit(`trade:${data.leagueId}`, data);
    });

    // Matchup updates
    this.socket.on('matchup_update', (data: {
      teamId: string;
      matchup: any;
      liveScores: Record<string, number>;
    }) => {
      this.emit('matchup_update', data);
      this.emit(`matchup:${data.teamId}`, data);
    });
  }

  private handleLiveUpdate(update: LiveUpdate) {
    // Emit to general listeners
    this.emit('live_update', update);

    // Emit type-specific events
    switch (update.type) {
      case 'score':
        this.emit('score_change', update.data);
        break;
      case 'player':
        this.emit('player_change', update.data);
        break;
      case 'injury':
        this.emit('injury_change', update.data);
        break;
      case 'news':
        this.emit('news_change', update.data);
        break;
      case 'trade':
        this.emit('trade_change', update.data);
        break;
      case 'matchup':
        this.emit('matchup_change', update.data);
        break;
    }

    // Handle priority notifications
    if (update.priority === 'urgent' || update.priority === 'high') {
      this.emit('urgent_update', update);
    }
  }

  // Subscribe to specific updates
  subscribe(channel: string, teamId?: string) {
    if (!this.socket) return;

    const subscriptionKey = teamId ? `${channel}:${teamId}` : channel;
    
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    
    if (teamId) {
      this.subscriptions.get(channel)!.add(teamId);
    }

    this.socket.emit('subscribe', { channel, teamId });
  }

  unsubscribe(channel: string, teamId?: string) {
    if (!this.socket) return;

    const subscriptionKey = teamId ? `${channel}:${teamId}` : channel;
    
    if (teamId && this.subscriptions.has(channel)) {
      this.subscriptions.get(channel)!.delete(teamId);
    } else {
      this.subscriptions.delete(channel);
    }

    this.socket.emit('unsubscribe', { channel, teamId });
  }

  // Subscribe to team updates
  subscribeToTeam(teamId: string) {
    this.subscribe('team', teamId);
    this.subscribe('score', teamId);
    this.subscribe('matchup', teamId);
  }

  unsubscribeFromTeam(teamId: string) {
    this.unsubscribe('team', teamId);
    this.unsubscribe('score', teamId);
    this.unsubscribe('matchup', teamId);
  }

  // Subscribe to player updates
  subscribeToPlayer(playerId: string) {
    this.subscribe('player', playerId);
    this.subscribe('injury', playerId);
    this.subscribe('news', playerId);
  }

  unsubscribeFromPlayer(playerId: string) {
    this.unsubscribe('player', playerId);
    this.unsubscribe('injury', playerId);
    this.unsubscribe('news', playerId);
  }

  // Subscribe to league updates
  subscribeToLeague(leagueId: string) {
    this.subscribe('league', leagueId);
    this.subscribe('trade', leagueId);
  }

  unsubscribeFromLeague(leagueId: string) {
    this.unsubscribe('league', leagueId);
    this.unsubscribe('trade', leagueId);
  }

  // Event emitter functionality
  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  private emit(event: string, data: any) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Request immediate updates
  requestUpdate(type: 'scores' | 'players' | 'matchups', teamId?: string) {
    if (!this.socket) return;
    this.socket.emit('request_update', { type, teamId });
  }

  // Send custom events
  sendEvent(event: string, data: any) {
    if (!this.socket) return;
    this.socket.emit(event, data);
  }

  // Heartbeat to maintain connection
  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        this.socket.emit('ping');
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // Resubscribe after reconnection
  private resubscribeAll() {
    this.subscriptions.forEach((teamIds, channel) => {
      if (teamIds.size > 0) {
        teamIds.forEach(teamId => {
          this.socket?.emit('subscribe', { channel, teamId });
        });
      } else {
        this.socket?.emit('subscribe', { channel });
      }
    });
  }

  // Get connection status
  get connected(): boolean {
    return this.isConnected;
  }

  // Disconnect
  disconnect() {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.listeners.clear();
    this.subscriptions.clear();
  }

  // Reconnect manually
  reconnect() {
    if (this.socket) {
      this.socket.connect();
    }
  }
}

// Singleton instance
export const websocketService = new WebSocketService();

// React Hook for WebSocket
export function useWebSocket(userId?: string) {
  const [connected, setConnected] = React.useState(false);
  const [updates, setUpdates] = React.useState<LiveUpdate[]>([]);

  React.useEffect(() => {
    if (!userId) return;

    // Connect to WebSocket
    websocketService.connect(userId, { debug: true });

    // Listen for connection changes
    const handleConnection = (data: any) => {
      setConnected(data.status === 'connected');
    };

    // Listen for live updates
    const handleUpdate = (update: LiveUpdate) => {
      setUpdates(prev => [...prev.slice(-99), update]); // Keep last 100 updates
    };

    websocketService.on('connection', handleConnection);
    websocketService.on('live_update', handleUpdate);

    return () => {
      websocketService.off('connection', handleConnection);
      websocketService.off('live_update', handleUpdate);
      websocketService.disconnect();
    };
  }, [userId]);

  return {
    connected,
    updates,
    subscribe: websocketService.subscribe.bind(websocketService),
    unsubscribe: websocketService.unsubscribe.bind(websocketService),
    subscribeToTeam: websocketService.subscribeToTeam.bind(websocketService),
    subscribeToPlayer: websocketService.subscribeToPlayer.bind(websocketService),
    subscribeToLeague: websocketService.subscribeToLeague.bind(websocketService),
    requestUpdate: websocketService.requestUpdate.bind(websocketService),
    on: websocketService.on.bind(websocketService),
    off: websocketService.off.bind(websocketService),
  };
}

import React from 'react';