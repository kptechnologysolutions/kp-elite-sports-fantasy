// User tracking service for capturing Sleeper IDs and usage analytics
'use client';

export interface TrackedUser {
  id: string;
  sleeperUsername: string;
  sleeperUserId: string;
  firstVisit: Date;
  lastActive: Date;
  totalSessions: number;
  leagues: TrackedLeague[];
  preferences: UserPreferences;
  analytics: UserAnalytics;
}

export interface TrackedLeague {
  leagueId: string;
  leagueName: string;
  season: string;
  rosterId: string;
  teamName: string;
  joinedAt: Date;
  isActive: boolean;
}

export interface UserPreferences {
  defaultView: 'dashboard' | 'roster' | 'matchups';
  enableNotifications: boolean;
  favoriteFeatures: string[];
  tecmoMode: boolean;
  autoRefresh: boolean;
}

export interface UserAnalytics {
  featuresUsed: Map<string, number>;
  pagesVisited: Map<string, number>;
  timeSpent: Map<string, number>; // minutes per feature
  lastFeatureUsed: string;
  mostUsedFeature: string;
  sessionDuration: number; // average in minutes
}

export interface UserSession {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  pagesVisited: string[];
  featuresUsed: string[];
  actionsPerformed: UserAction[];
}

export interface UserAction {
  action: string;
  timestamp: Date;
  context: Record<string, any>;
  success: boolean;
}

class UserTrackingService {
  private users: Map<string, TrackedUser> = new Map();
  private currentSession: UserSession | null = null;
  private sessionStartTime: Date | null = null;

  // Initialize user tracking
  async initializeUser(sleeperUsername: string, sleeperUserId: string): Promise<TrackedUser> {
    console.log('📊 Initializing user tracking for:', sleeperUsername);
    
    const existingUser = this.findUserBySleeperUsername(sleeperUsername);
    
    if (existingUser) {
      // Update existing user
      existingUser.lastActive = new Date();
      existingUser.totalSessions += 1;
      this.users.set(existingUser.id, existingUser);
      
      // Start new session
      this.startSession(existingUser.id);
      
      console.log('👤 Returning user detected:', {
        username: sleeperUsername,
        totalSessions: existingUser.totalSessions,
        leagues: existingUser.leagues.length
      });
      
      return existingUser;
    }
    
    // Create new user
    const newUser: TrackedUser = {
      id: this.generateUserId(),
      sleeperUsername,
      sleeperUserId,
      firstVisit: new Date(),
      lastActive: new Date(),
      totalSessions: 1,
      leagues: [],
      preferences: {
        defaultView: 'dashboard',
        enableNotifications: true,
        favoriteFeatures: [],
        tecmoMode: false,
        autoRefresh: true
      },
      analytics: {
        featuresUsed: new Map(),
        pagesVisited: new Map(),
        timeSpent: new Map(),
        lastFeatureUsed: 'login',
        mostUsedFeature: 'login',
        sessionDuration: 0
      }
    };
    
    this.users.set(newUser.id, newUser);
    this.startSession(newUser.id);
    
    console.log('🆕 New user created:', {
      id: newUser.id,
      username: sleeperUsername,
      userId: sleeperUserId
    });
    
    // Send to backend/analytics if needed
    this.syncUserToBackend(newUser);
    
    return newUser;
  }

  // Track league addition
  async trackLeagueJoin(userId: string, league: Omit<TrackedLeague, 'joinedAt' | 'isActive'>): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;

    const existingLeague = user.leagues.find(l => l.leagueId === league.leagueId);
    if (!existingLeague) {
      const newLeague: TrackedLeague = {
        ...league,
        joinedAt: new Date(),
        isActive: true
      };
      
      user.leagues.push(newLeague);
      this.users.set(userId, user);
      
      console.log('🏈 League added for user:', {
        username: user.sleeperUsername,
        league: league.leagueName,
        totalLeagues: user.leagues.length
      });

      this.trackAction(userId, 'league_joined', { leagueId: league.leagueId, leagueName: league.leagueName });
    }
  }

  // Track page visits
  trackPageVisit(userId: string, page: string): void {
    const user = this.users.get(userId);
    if (!user) return;

    const currentCount = user.analytics.pagesVisited.get(page) || 0;
    user.analytics.pagesVisited.set(page, currentCount + 1);
    
    if (this.currentSession) {
      this.currentSession.pagesVisited.push(page);
    }

    console.log('📄 Page visit tracked:', { page, user: user.sleeperUsername });
  }

  // Track feature usage
  trackFeatureUsage(userId: string, feature: string, timeSpent?: number): void {
    const user = this.users.get(userId);
    if (!user) return;

    const currentCount = user.analytics.featuresUsed.get(feature) || 0;
    user.analytics.featuresUsed.set(feature, currentCount + 1);
    
    if (timeSpent) {
      const currentTime = user.analytics.timeSpent.get(feature) || 0;
      user.analytics.timeSpent.set(feature, currentTime + timeSpent);
    }

    user.analytics.lastFeatureUsed = feature;
    
    // Update most used feature
    let maxUsage = 0;
    let mostUsed = feature;
    user.analytics.featuresUsed.forEach((count, feat) => {
      if (count > maxUsage) {
        maxUsage = count;
        mostUsed = feat;
      }
    });
    user.analytics.mostUsedFeature = mostUsed;

    if (this.currentSession) {
      this.currentSession.featuresUsed.push(feature);
    }

    console.log('⚡ Feature usage tracked:', { 
      feature, 
      count: currentCount + 1,
      user: user.sleeperUsername 
    });
  }

  // Track specific actions
  trackAction(userId: string, action: string, context: Record<string, any> = {}, success: boolean = true): void {
    const user = this.users.get(userId);
    if (!user) return;

    const userAction: UserAction = {
      action,
      timestamp: new Date(),
      context,
      success
    };

    if (this.currentSession) {
      this.currentSession.actionsPerformed.push(userAction);
    }

    console.log('🎯 Action tracked:', { 
      action, 
      success, 
      user: user.sleeperUsername,
      context 
    });
  }

  // Start a new session
  private startSession(userId: string): void {
    this.currentSession = {
      sessionId: this.generateSessionId(),
      userId,
      startTime: new Date(),
      pagesVisited: [],
      featuresUsed: [],
      actionsPerformed: []
    };
    
    this.sessionStartTime = new Date();
    console.log('🚀 Session started for user:', userId);
  }

  // End current session
  endSession(): void {
    if (this.currentSession && this.sessionStartTime) {
      this.currentSession.endTime = new Date();
      
      const sessionDuration = (this.currentSession.endTime.getTime() - this.sessionStartTime.getTime()) / (1000 * 60); // minutes
      
      const user = this.users.get(this.currentSession.userId);
      if (user) {
        // Update average session duration
        const totalDuration = user.analytics.sessionDuration * (user.totalSessions - 1) + sessionDuration;
        user.analytics.sessionDuration = totalDuration / user.totalSessions;
        
        console.log('⏹️ Session ended:', {
          user: user.sleeperUsername,
          duration: `${sessionDuration.toFixed(1)} minutes`,
          pagesVisited: this.currentSession.pagesVisited.length,
          featuresUsed: this.currentSession.featuresUsed.length,
          actions: this.currentSession.actionsPerformed.length
        });
      }
      
      // Send session data to backend
      this.syncSessionToBackend(this.currentSession);
      
      this.currentSession = null;
      this.sessionStartTime = null;
    }
  }

  // Get user analytics
  getUserAnalytics(userId: string): UserAnalytics | null {
    const user = this.users.get(userId);
    return user?.analytics || null;
  }

  // Get all users (admin function)
  getAllUsers(): TrackedUser[] {
    return Array.from(this.users.values());
  }

  // Get user summary statistics
  getUserSummary(): {
    totalUsers: number;
    activeToday: number;
    totalLeagues: number;
    averageSessionDuration: number;
    topFeatures: Array<{ feature: string; usage: number }>;
  } {
    const users = this.getAllUsers();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeToday = users.filter(u => u.lastActive >= today).length;
    const totalLeagues = users.reduce((sum, u) => sum + u.leagues.length, 0);
    const avgSession = users.reduce((sum, u) => sum + u.analytics.sessionDuration, 0) / users.length || 0;
    
    // Aggregate feature usage
    const featureUsage = new Map<string, number>();
    users.forEach(user => {
      user.analytics.featuresUsed.forEach((count, feature) => {
        const current = featureUsage.get(feature) || 0;
        featureUsage.set(feature, current + count);
      });
    });
    
    const topFeatures = Array.from(featureUsage.entries())
      .map(([feature, usage]) => ({ feature, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10);

    return {
      totalUsers: users.length,
      activeToday,
      totalLeagues,
      averageSessionDuration: avgSession,
      topFeatures
    };
  }

  // Helper methods
  private findUserBySleeperUsername(username: string): TrackedUser | undefined {
    return Array.from(this.users.values()).find(u => u.sleeperUsername === username);
  }

  private generateUserId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Backend sync methods (implement based on your backend)
  private async syncUserToBackend(user: TrackedUser): Promise<void> {
    try {
      // In a real app, send to your analytics service
      console.log('💾 Syncing user to backend:', user.sleeperUsername);
      
      // Example API call:
      // await fetch('/api/analytics/users', {
      //   method: 'POST',
      //   body: JSON.stringify(user)
      // });
    } catch (error) {
      console.error('Failed to sync user to backend:', error);
    }
  }

  private async syncSessionToBackend(session: UserSession): Promise<void> {
    try {
      console.log('💾 Syncing session to backend:', session.sessionId);
      
      // Example API call:
      // await fetch('/api/analytics/sessions', {
      //   method: 'POST',
      //   body: JSON.stringify(session)
      // });
    } catch (error) {
      console.error('Failed to sync session to backend:', error);
    }
  }

  // Export data for admin dashboard
  exportAnalyticsData(): string {
    const summary = this.getUserSummary();
    const users = this.getAllUsers();
    
    const data = {
      summary,
      users: users.map(u => ({
        id: u.id,
        sleeperUsername: u.sleeperUsername,
        firstVisit: u.firstVisit,
        lastActive: u.lastActive,
        totalSessions: u.totalSessions,
        leagueCount: u.leagues.length,
        mostUsedFeature: u.analytics.mostUsedFeature,
        sessionDuration: u.analytics.sessionDuration
      })),
      timestamp: new Date()
    };
    
    return JSON.stringify(data, null, 2);
  }
}

// Singleton instance
export const userTrackingService = new UserTrackingService();

// React hook for easy usage
export function useUserTracking() {
  return {
    initializeUser: userTrackingService.initializeUser.bind(userTrackingService),
    trackPageVisit: userTrackingService.trackPageVisit.bind(userTrackingService),
    trackFeatureUsage: userTrackingService.trackFeatureUsage.bind(userTrackingService),
    trackAction: userTrackingService.trackAction.bind(userTrackingService),
    trackLeagueJoin: userTrackingService.trackLeagueJoin.bind(userTrackingService),
    endSession: userTrackingService.endSession.bind(userTrackingService),
    getUserAnalytics: userTrackingService.getUserAnalytics.bind(userTrackingService),
    getUserSummary: userTrackingService.getUserSummary.bind(userTrackingService)
  };
}