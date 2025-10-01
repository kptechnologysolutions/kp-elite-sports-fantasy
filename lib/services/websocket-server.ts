// WebSocket Server for Real-Time Updates
// Handles live data streaming and push notifications

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { sleeperAPI } from '@/lib/api/sleeper';
import { yahooAPI } from '@/lib/api/yahoo';
import { espnAPI } from '@/lib/api/espn';
import { platformManager } from '@/lib/api/platformManager';

interface ClientSubscription {
  userId: string;
  socketId: string;
  channels: Map<string, Set<string>>; // channel -> Set of IDs
  lastUpdate: Date;
}

export class WebSocketServer {
  private io: SocketIOServer | null = null;
  private clients: Map<string, ClientSubscription> = new Map();
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  private scoreCache: Map<string, any> = new Map();
  private newsCache: Map<string, any[]> = new Map();

  // Update frequencies (in ms)
  private readonly UPDATE_FREQUENCIES = {
    scores: 15000,      // 15 seconds for live scores
    players: 30000,     // 30 seconds for player updates
    news: 60000,        // 1 minute for news
    injuries: 120000,   // 2 minutes for injury updates
    trades: 300000,     // 5 minutes for trade updates
  };

  // Initialize WebSocket server
  initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
    this.startUpdateCycles();
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      const userId = socket.handshake.auth.userId;
      console.log(`Client connected: ${socket.id} (User: ${userId})`);

      // Initialize client subscription
      this.clients.set(socket.id, {
        userId,
        socketId: socket.id,
        channels: new Map(),
        lastUpdate: new Date(),
      });

      // Handle subscriptions
      socket.on('subscribe', ({ channel, teamId }: { channel: string; teamId?: string }) => {
        this.handleSubscribe(socket.id, channel, teamId);
      });

      socket.on('unsubscribe', ({ channel, teamId }: { channel: string; teamId?: string }) => {
        this.handleUnsubscribe(socket.id, channel, teamId);
      });

      // Handle update requests
      socket.on('request_update', ({ type, teamId }: { type: string; teamId?: string }) => {
        this.handleUpdateRequest(socket, type, teamId);
      });

      // Handle ping for connection keep-alive
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.clients.delete(socket.id);
      });
    });
  }

  private handleSubscribe(socketId: string, channel: string, id?: string) {
    const client = this.clients.get(socketId);
    if (!client) return;

    if (!client.channels.has(channel)) {
      client.channels.set(channel, new Set());
    }

    if (id) {
      client.channels.get(channel)!.add(id);
      console.log(`Client ${socketId} subscribed to ${channel}:${id}`);
    } else {
      console.log(`Client ${socketId} subscribed to ${channel}`);
    }

    // Send initial data for the subscription
    this.sendInitialData(socketId, channel, id);
  }

  private handleUnsubscribe(socketId: string, channel: string, id?: string) {
    const client = this.clients.get(socketId);
    if (!client) return;

    if (id && client.channels.has(channel)) {
      client.channels.get(channel)!.delete(id);
      console.log(`Client ${socketId} unsubscribed from ${channel}:${id}`);
    } else {
      client.channels.delete(channel);
      console.log(`Client ${socketId} unsubscribed from ${channel}`);
    }
  }

  private async handleUpdateRequest(socket: any, type: string, teamId?: string) {
    switch (type) {
      case 'scores':
        await this.sendScoreUpdates(socket.id, teamId);
        break;
      case 'players':
        await this.sendPlayerUpdates(socket.id, teamId);
        break;
      case 'matchups':
        await this.sendMatchupUpdates(socket.id, teamId);
        break;
      default:
        console.warn(`Unknown update type requested: ${type}`);
    }
  }

  private async sendInitialData(socketId: string, channel: string, id?: string) {
    const socket = this.io?.sockets.sockets.get(socketId);
    if (!socket) return;

    switch (channel) {
      case 'team':
      case 'score':
      case 'matchup':
        if (id) {
          await this.sendScoreUpdates(socketId, id);
          await this.sendMatchupUpdates(socketId, id);
        }
        break;
      case 'player':
        if (id) {
          await this.sendPlayerUpdates(socketId, id);
        }
        break;
      case 'league':
      case 'trade':
        if (id) {
          await this.sendLeagueUpdates(socketId, id);
        }
        break;
    }
  }

  // Update cycles for different data types
  private startUpdateCycles() {
    // Score updates (most frequent)
    this.updateIntervals.set('scores', setInterval(() => {
      this.broadcastScoreUpdates();
    }, this.UPDATE_FREQUENCIES.scores));

    // Player updates
    this.updateIntervals.set('players', setInterval(() => {
      this.broadcastPlayerUpdates();
    }, this.UPDATE_FREQUENCIES.players));

    // News updates
    this.updateIntervals.set('news', setInterval(() => {
      this.broadcastNewsUpdates();
    }, this.UPDATE_FREQUENCIES.news));

    // Injury updates
    this.updateIntervals.set('injuries', setInterval(() => {
      this.broadcastInjuryUpdates();
    }, this.UPDATE_FREQUENCIES.injuries));

    // Trade updates
    this.updateIntervals.set('trades', setInterval(() => {
      this.broadcastTradeUpdates();
    }, this.UPDATE_FREQUENCIES.trades));
  }

  // Broadcast score updates to all subscribed clients
  private async broadcastScoreUpdates() {
    const subscribedTeams = new Set<string>();
    
    // Collect all subscribed team IDs
    this.clients.forEach(client => {
      const teamSubs = client.channels.get('team');
      const scoreSubs = client.channels.get('score');
      if (teamSubs) teamSubs.forEach(id => subscribedTeams.add(id));
      if (scoreSubs) scoreSubs.forEach(id => subscribedTeams.add(id));
    });

    // Fetch and broadcast updates for each team
    for (const teamId of subscribedTeams) {
      try {
        const updates = await this.fetchTeamScoreUpdate(teamId);
        if (updates) {
          this.broadcastToSubscribers('score', teamId, {
            type: 'score',
            timestamp: new Date(),
            data: updates,
            priority: updates.scoreChanged ? 'high' : 'low',
          });
        }
      } catch (error) {
        console.error(`Error fetching score for team ${teamId}:`, error);
      }
    }
  }

  private async fetchTeamScoreUpdate(teamId: string): Promise<any> {
    // Parse team ID to determine platform
    const [platform, ...rest] = teamId.split('_');
    
    try {
      switch (platform) {
        case 'sleeper': {
          const [, leagueId, rosterId] = teamId.split('_');
          const matchup = await sleeperAPI.getCurrentMatchup(leagueId, rosterId);
          
          const currentScore = matchup?.points || 0;
          const lastScore = this.scoreCache.get(teamId)?.score || 0;
          const scoreChanged = Math.abs(currentScore - lastScore) > 0.01;
          
          const update = {
            teamId,
            score: currentScore,
            opponentScore: matchup?.opponentScore || 0,
            projectedScore: matchup?.projectedScore || 0,
            winProbability: this.calculateWinProbability(currentScore, matchup?.opponentScore || 0),
            scoreChanged,
            lastUpdate: new Date(),
          };
          
          this.scoreCache.set(teamId, update);
          return update;
        }
        
        case 'yahoo': {
          // Yahoo score fetching would go here
          return null;
        }
        
        case 'espn': {
          // ESPN score fetching would go here
          return null;
        }
        
        default:
          return null;
      }
    } catch (error) {
      console.error(`Error fetching score for ${platform} team ${teamId}:`, error);
      return null;
    }
  }

  private calculateWinProbability(teamScore: number, opponentScore: number): number {
    // Simple win probability calculation
    // In production, this would use more sophisticated modeling
    const scoreDiff = teamScore - opponentScore;
    const sigmoid = 1 / (1 + Math.exp(-scoreDiff / 10));
    return Math.round(sigmoid * 100);
  }

  // Broadcast player updates
  private async broadcastPlayerUpdates() {
    const subscribedPlayers = new Set<string>();
    
    this.clients.forEach(client => {
      const playerSubs = client.channels.get('player');
      if (playerSubs) playerSubs.forEach(id => subscribedPlayers.add(id));
    });

    for (const playerId of subscribedPlayers) {
      try {
        const update = await this.fetchPlayerUpdate(playerId);
        if (update) {
          this.broadcastToSubscribers('player', playerId, {
            type: 'player',
            timestamp: new Date(),
            data: update,
            priority: update.priority || 'low',
          });
        }
      } catch (error) {
        console.error(`Error fetching player update for ${playerId}:`, error);
      }
    }
  }

  private async fetchPlayerUpdate(playerId: string): Promise<any> {
    // In production, this would fetch real player data
    // For now, return mock updates occasionally
    const shouldUpdate = Math.random() > 0.9; // 10% chance of update
    
    if (!shouldUpdate) return null;

    const updates = [
      { type: 'touchdown', points: 6, description: 'Rushing TD' },
      { type: 'big_play', points: 2, description: '20+ yard reception' },
      { type: 'touchdown', points: 6, description: 'Receiving TD' },
    ];

    const randomUpdate = updates[Math.floor(Math.random() * updates.length)];
    
    return {
      playerId,
      playerName: 'Player Name', // Would be fetched from DB
      team: 'KC',
      update: randomUpdate,
      priority: randomUpdate.type === 'touchdown' ? 'high' : 'medium',
    };
  }

  // Broadcast news updates
  private async broadcastNewsUpdates() {
    try {
      const news = await this.fetchLatestNews();
      if (news && news.length > 0) {
        this.broadcast({
          type: 'news',
          timestamp: new Date(),
          data: news,
          priority: 'low',
        });
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  }

  private async fetchLatestNews(): Promise<any[]> {
    // In production, this would fetch from news APIs
    // Check cache first
    const cacheKey = 'latest_news';
    const cached = this.newsCache.get(cacheKey);
    if (cached && cached.length > 0) {
      return cached;
    }

    // Mock news for now
    const news = [
      {
        headline: 'Patrick Mahomes Limited in Practice',
        summary: 'Chiefs QB dealing with minor ankle issue',
        players: ['patrick_mahomes'],
        teams: ['KC'],
        impact: 'negative',
        source: 'ESPN',
        timestamp: new Date(),
      },
    ];

    this.newsCache.set(cacheKey, news);
    setTimeout(() => this.newsCache.delete(cacheKey), 60000); // Cache for 1 minute

    return news;
  }

  // Broadcast injury updates
  private async broadcastInjuryUpdates() {
    const subscribedPlayers = new Set<string>();
    
    this.clients.forEach(client => {
      const injurySubs = client.channels.get('injury');
      if (injurySubs) injurySubs.forEach(id => subscribedPlayers.add(id));
    });

    for (const playerId of subscribedPlayers) {
      try {
        const injury = await this.fetchInjuryUpdate(playerId);
        if (injury) {
          this.broadcastToSubscribers('injury', playerId, {
            type: 'injury',
            timestamp: new Date(),
            data: injury,
            priority: injury.fantasyImpact === 'severe' ? 'urgent' : 'high',
          });
        }
      } catch (error) {
        console.error(`Error fetching injury update for ${playerId}:`, error);
      }
    }
  }

  private async fetchInjuryUpdate(playerId: string): Promise<any> {
    // In production, fetch from injury report APIs
    // For now, return null (no updates)
    return null;
  }

  // Broadcast trade updates
  private async broadcastTradeUpdates() {
    const subscribedLeagues = new Set<string>();
    
    this.clients.forEach(client => {
      const tradeSubs = client.channels.get('trade');
      if (tradeSubs) tradeSubs.forEach(id => subscribedLeagues.add(id));
    });

    for (const leagueId of subscribedLeagues) {
      try {
        const trades = await this.fetchTradeUpdates(leagueId);
        if (trades && trades.length > 0) {
          this.broadcastToSubscribers('trade', leagueId, {
            type: 'trade',
            timestamp: new Date(),
            data: trades,
            priority: 'medium',
          });
        }
      } catch (error) {
        console.error(`Error fetching trades for league ${leagueId}:`, error);
      }
    }
  }

  private async fetchTradeUpdates(leagueId: string): Promise<any[]> {
    // In production, fetch from platform APIs
    return [];
  }

  // Helper methods for broadcasting
  private broadcast(update: any) {
    if (!this.io) return;
    this.io.emit('live_update', update);
  }

  private broadcastToSubscribers(channel: string, id: string, update: any) {
    this.clients.forEach((client, socketId) => {
      const subscriptions = client.channels.get(channel);
      if (subscriptions && subscriptions.has(id)) {
        const socket = this.io?.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('live_update', update);
          socket.emit(`${channel}_update`, update.data);
        }
      }
    });
  }

  private async sendScoreUpdates(socketId: string, teamId: string) {
    const socket = this.io?.sockets.sockets.get(socketId);
    if (!socket) return;

    const update = await this.fetchTeamScoreUpdate(teamId);
    if (update) {
      socket.emit('score_update', update);
    }
  }

  private async sendPlayerUpdates(socketId: string, playerId: string) {
    const socket = this.io?.sockets.sockets.get(socketId);
    if (!socket) return;

    const update = await this.fetchPlayerUpdate(playerId);
    if (update) {
      socket.emit('player_update', update);
    }
  }

  private async sendMatchupUpdates(socketId: string, teamId: string) {
    const socket = this.io?.sockets.sockets.get(socketId);
    if (!socket) return;

    // Fetch and send matchup data
    const [platform] = teamId.split('_');
    // Implementation would fetch from appropriate platform
    socket.emit('matchup_update', {
      teamId,
      matchup: null, // Would be fetched
      liveScores: {},
    });
  }

  private async sendLeagueUpdates(socketId: string, leagueId: string) {
    const socket = this.io?.sockets.sockets.get(socketId);
    if (!socket) return;

    const trades = await this.fetchTradeUpdates(leagueId);
    if (trades.length > 0) {
      socket.emit('trade_alert', {
        leagueId,
        trades,
      });
    }
  }

  // Cleanup
  shutdown() {
    this.updateIntervals.forEach(interval => clearInterval(interval));
    this.updateIntervals.clear();
    
    if (this.io) {
      this.io.close();
      this.io = null;
    }
    
    this.clients.clear();
    this.scoreCache.clear();
    this.newsCache.clear();
  }
}

// Export singleton instance
export const websocketServer = new WebSocketServer();