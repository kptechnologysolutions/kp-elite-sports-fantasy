// Optimized Sleeper API Service with caching, batching, and performance improvements
import { SleeperUser, SleeperLeague, SleeperRoster, SleeperPlayer, SleeperMatchup, LeagueUser } from './sleeperService';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface RequestBatch {
  requests: Array<() => Promise<any>>;
  timeout: NodeJS.Timeout;
}

interface ApiMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  errorCount: number;
  batchedRequests: number;
}

class OptimizedSleeperService {
  private cache = new Map<string, CacheEntry<any>>();
  private requestQueue = new Map<string, RequestBatch>();
  private metrics: ApiMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    errorCount: 0,
    batchedRequests: 0
  };
  
  // Cache durations in milliseconds
  private readonly CACHE_DURATIONS = {
    user: 30 * 60 * 1000,        // 30 minutes
    leagues: 10 * 60 * 1000,     // 10 minutes
    rosters: 5 * 60 * 1000,      // 5 minutes
    matchups: 2 * 60 * 1000,     // 2 minutes
    players: 60 * 60 * 1000,     // 1 hour
    nflState: 30 * 1000,         // 30 seconds
    leagueUsers: 10 * 60 * 1000  // 10 minutes
  };
  
  private readonly BASE_URL = 'https://api.sleeper.app/v1';
  private readonly BATCH_DELAY = 50; // ms
  private readonly MAX_CONCURRENT_REQUESTS = 10;
  private activeRequests = 0;
  private requestPromises: Array<Promise<any>> = [];
  
  /**
   * Get cached data or fetch from API
   */
  private async getCachedOrFetch<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    cacheDuration: number
  ): Promise<T> {
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() < cached.expiry) {
      this.metrics.cacheHits++;
      return cached.data;
    }
    
    this.metrics.cacheMisses++;
    
    try {
      const startTime = Date.now();
      const data = await this.throttledRequest(fetchFn);
      const responseTime = Date.now() - startTime;
      
      // Update metrics
      this.metrics.totalRequests++;
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) / 
        this.metrics.totalRequests;
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + cacheDuration
      });
      
      return data;
    } catch (error) {
      this.metrics.errorCount++;
      throw error;
    }
  }
  
  /**
   * Throttle requests to prevent rate limiting
   */
  private async throttledRequest<T>(fetchFn: () => Promise<T>): Promise<T> {
    // Wait if we have too many concurrent requests
    while (this.activeRequests >= this.MAX_CONCURRENT_REQUESTS) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    this.activeRequests++;
    
    try {
      const promise = fetchFn();
      this.requestPromises.push(promise);
      
      // Clean up completed requests
      promise.finally(() => {
        this.activeRequests--;
        this.requestPromises = this.requestPromises.filter(p => p !== promise);
      });
      
      return await promise;
    } catch (error) {
      this.activeRequests--;
      throw error;
    }
  }
  
  /**
   * Generic fetch with error handling and retries
   */
  private async fetchWithRetry(url: string, retries = 3): Promise<any> {
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          if (response.status === 429) {
            // Rate limited - wait and retry
            const retryAfter = response.headers.get('retry-after');
            const delay = retryAfter ? parseInt(retryAfter) * 1000 : 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          if (response.status >= 500 && i < retries) {
            // Server error - retry with exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            continue;
          }
          
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        if (i === retries) throw error;
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
  
  /**
   * Batch multiple requests together
   */
  private async batchRequest<T>(
    batchKey: string,
    request: () => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let batch = this.requestQueue.get(batchKey);
      
      if (!batch) {
        batch = {
          requests: [],
          timeout: setTimeout(async () => {
            const currentBatch = this.requestQueue.get(batchKey);
            if (currentBatch) {
              this.requestQueue.delete(batchKey);
              this.metrics.batchedRequests += currentBatch.requests.length;
              
              // Execute all requests in the batch
              try {
                const results = await Promise.all(
                  currentBatch.requests.map(req => req())
                );
                // Results are handled by individual promises
              } catch (error) {
                // Individual requests handle their own errors
              }
            }
          }, this.BATCH_DELAY)
        };
        
        this.requestQueue.set(batchKey, batch);
      }
      
      batch.requests.push(async () => {
        try {
          const result = await request();
          resolve(result);
          return result;
        } catch (error) {
          reject(error);
          throw error;
        }
      });
    });
  }
  
  /**
   * Get user by username
   */
  async getUser(username: string): Promise<SleeperUser> {
    const cacheKey = `user:${username}`;
    return this.getCachedOrFetch(
      cacheKey,
      () => this.fetchWithRetry(`${this.BASE_URL}/user/${username}`),
      this.CACHE_DURATIONS.user
    );
  }
  
  /**
   * Get user's leagues for a season
   */
  async getUserLeagues(userId: string, season: string = '2025'): Promise<SleeperLeague[]> {
    const cacheKey = `leagues:${userId}:${season}`;
    return this.getCachedOrFetch(
      cacheKey,
      () => this.fetchWithRetry(`${this.BASE_URL}/user/${userId}/leagues/nfl/${season}`),
      this.CACHE_DURATIONS.leagues
    );
  }
  
  /**
   * Get league rosters with batching
   */
  async getLeagueRosters(leagueId: string): Promise<SleeperRoster[]> {
    const cacheKey = `rosters:${leagueId}`;
    return this.getCachedOrFetch(
      cacheKey,
      () => this.batchRequest(
        'rosters',
        () => this.fetchWithRetry(`${this.BASE_URL}/league/${leagueId}/rosters`)
      ),
      this.CACHE_DURATIONS.rosters
    );
  }
  
  /**
   * Get league users with batching
   */
  async getLeagueUsers(leagueId: string): Promise<Map<string, LeagueUser>> {
    const cacheKey = `users:${leagueId}`;
    
    const usersArray = await this.getCachedOrFetch(
      cacheKey,
      () => this.batchRequest(
        'users',
        () => this.fetchWithRetry(`${this.BASE_URL}/league/${leagueId}/users`)
      ),
      this.CACHE_DURATIONS.leagueUsers
    );
    
    // Convert to Map for faster lookups
    const usersMap = new Map<string, LeagueUser>();
    usersArray.forEach((user: any) => {
      usersMap.set(user.user_id, {
        user_id: user.user_id,
        username: user.username,
        display_name: user.display_name,
        team_name: user.metadata?.team_name || null,
        avatar: user.avatar
      });
    });
    
    return usersMap;
  }
  
  /**
   * Get matchups for a specific week
   */
  async getMatchups(leagueId: string, week: number): Promise<SleeperMatchup[]> {
    const cacheKey = `matchups:${leagueId}:${week}`;
    return this.getCachedOrFetch(
      cacheKey,
      () => this.batchRequest(
        `matchups:${week}`,
        () => this.fetchWithRetry(`${this.BASE_URL}/league/${leagueId}/matchups/${week}`)
      ),
      this.CACHE_DURATIONS.matchups
    );
  }
  
  /**
   * Get multiple weeks of matchups efficiently
   */
  async getSeasonMatchups(leagueId: string, currentWeek: number): Promise<Map<number, SleeperMatchup[]>> {
    const matchupsMap = new Map<number, SleeperMatchup[]>();
    
    // Batch requests for multiple weeks
    const requests = [];
    for (let week = 1; week <= currentWeek; week++) {
      requests.push(
        this.getMatchups(leagueId, week).then(matchups => {
          matchupsMap.set(week, matchups);
        })
      );
    }
    
    await Promise.all(requests);
    return matchupsMap;
  }
  
  /**
   * Get all NFL players with optimized caching
   */
  async getAllPlayers(): Promise<Map<string, SleeperPlayer>> {
    const cacheKey = 'players:all';
    
    const playersObj = await this.getCachedOrFetch(
      cacheKey,
      () => this.fetchWithRetry(`${this.BASE_URL}/players/nfl`),
      this.CACHE_DURATIONS.players
    );
    
    // Convert to Map for O(1) lookups
    const playersMap = new Map<string, SleeperPlayer>();
    Object.entries(playersObj).forEach(([id, player]: [string, any]) => {
      playersMap.set(id, {
        player_id: id,
        first_name: player.first_name || '',
        last_name: player.last_name || '',
        full_name: player.full_name || `${player.first_name} ${player.last_name}`,
        position: player.position,
        team: player.team,
        number: player.number,
        status: player.status || 'Active',
        injury_status: player.injury_status,
        injury_notes: player.injury_notes,
        age: player.age,
        years_exp: player.years_exp || 0,
        college: player.college,
        fantasy_positions: player.fantasy_positions || [player.position],
        depth_chart_order: player.depth_chart_order,
        depth_chart_position: player.depth_chart_position
      });
    });
    
    return playersMap;
  }
  
  /**
   * Get NFL state with frequent updates
   */
  async getNFLState(): Promise<any> {
    const cacheKey = 'nfl:state';
    return this.getCachedOrFetch(
      cacheKey,
      () => this.fetchWithRetry(`${this.BASE_URL}/state/nfl`),
      this.CACHE_DURATIONS.nflState
    );
  }
  
  /**
   * Prefetch commonly needed data
   */
  async prefetchLeagueData(leagueId: string): Promise<void> {
    // Start multiple requests in parallel
    const prefetchPromises = [
      this.getLeagueRosters(leagueId),
      this.getLeagueUsers(leagueId),
      this.getNFLState().then(state => 
        this.getMatchups(leagueId, state.week)
      )
    ];
    
    // Don't wait for all to complete, just start them
    Promise.all(prefetchPromises).catch(error => {
      console.warn('Prefetch error:', error);
    });
  }
  
  /**
   * Get performance metrics
   */
  getMetrics(): ApiMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Clear cache
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      // Clear specific cache entries
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }
  
  /**
   * Optimize cache by removing expired entries
   */
  optimizeCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Preload critical data for faster initial load
   */
  async preloadCriticalData(userId: string): Promise<void> {
    try {
      // Start loading players in background
      this.getAllPlayers();
      
      // Get user and leagues
      const [user, leagues] = await Promise.all([
        this.getUser(userId),
        this.getUserLeagues(userId)
      ]);
      
      // Prefetch data for all leagues
      const prefetchPromises = leagues.map(league => 
        this.prefetchLeagueData(league.league_id)
      );
      
      // Don't wait for prefetch to complete
      Promise.all(prefetchPromises).catch(console.warn);
      
    } catch (error) {
      console.error('Error preloading data:', error);
    }
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    entries: Array<{ key: string; age: number; expiry: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      expiry: entry.expiry - now
    }));
    
    const totalRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    const hitRate = totalRequests > 0 ? this.metrics.cacheHits / totalRequests : 0;
    
    return {
      size: this.cache.size,
      hitRate,
      entries: entries.sort((a, b) => b.age - a.age)
    };
  }
}

export const optimizedSleeperService = new OptimizedSleeperService();