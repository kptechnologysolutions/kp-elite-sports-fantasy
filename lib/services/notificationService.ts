// Notification service for real-time alerts
import { Player, Team } from '@/lib/types';

export interface Notification {
  id: string;
  type: 'injury' | 'trade' | 'waiver' | 'score' | 'news' | 'lineup' | 'system';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: {
    playerId?: string;
    playerName?: string;
    teamId?: string;
    teamName?: string;
    points?: number;
    week?: number;
  };
}

export interface NotificationPreferences {
  injuries: boolean;
  trades: boolean;
  waiverWire: boolean;
  scoring: boolean;
  news: boolean;
  lineupAlerts: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

class NotificationService {
  private notifications: Notification[] = [];
  private subscribers: Set<(notifications: Notification[]) => void> = new Set();
  private preferences: NotificationPreferences = {
    injuries: true,
    trades: true,
    waiverWire: true,
    scoring: true,
    news: true,
    lineupAlerts: true,
    pushNotifications: true,
    emailNotifications: false,
    smsNotifications: false,
  };
  private soundEnabled: boolean = true;
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Initialize Web Audio API for notification sounds
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.log('Web Audio API not supported');
      }
      
      // Load saved preferences
      const savedPrefs = localStorage.getItem('notificationPreferences');
      if (savedPrefs) {
        this.preferences = JSON.parse(savedPrefs);
      }
      
      // Load saved notifications
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        this.notifications = JSON.parse(savedNotifications).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
      }
      
      // Request browser notification permission
      this.requestNotificationPermission();
    }
  }

  // Play a simple beep sound using Web Audio API
  private playNotificationSound() {
    if (!this.audioContext || !this.soundEnabled) return;
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('Could not play notification sound');
    }
  }

  // Request browser notification permission
  private async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  // Subscribe to notification updates
  subscribe(callback: (notifications: Notification[]) => void) {
    this.subscribers.add(callback);
    // Send current notifications immediately
    callback(this.notifications);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Notify all subscribers
  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.notifications));
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('notifications', JSON.stringify(this.notifications));
    }
  }

  // Add a new notification
  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    // Check if this type of notification is enabled
    if (!this.shouldShowNotification(notification.type)) {
      return;
    }

    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    // Add to list (newest first)
    this.notifications.unshift(newNotification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    // Play sound if enabled for high priority notifications
    if (this.soundEnabled && notification.priority === 'high') {
      this.playNotificationSound();
    }

    // Show browser notification
    this.showBrowserNotification(newNotification);

    // Notify subscribers
    this.notifySubscribers();
  }

  // Check if notification type should be shown
  private shouldShowNotification(type: Notification['type']): boolean {
    switch (type) {
      case 'injury': return this.preferences.injuries;
      case 'trade': return this.preferences.trades;
      case 'waiver': return this.preferences.waiverWire;
      case 'score': return this.preferences.scoring;
      case 'news': return this.preferences.news;
      case 'lineup': return this.preferences.lineupAlerts;
      case 'system': return true;
      default: return true;
    }
  }

  // Show browser notification
  private showBrowserNotification(notification: Notification) {
    if (!this.preferences.pushNotifications) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const options: NotificationOptions = {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.id,
      requireInteraction: notification.priority === 'high',
      silent: !this.soundEnabled,
      data: notification,
    };

    const browserNotification = new Notification(notification.title, options);
    
    // Handle click
    browserNotification.onclick = () => {
      window.focus();
      if (notification.actionUrl) {
        window.location.href = notification.actionUrl;
      }
      this.markAsRead(notification.id);
      browserNotification.close();
    };
  }

  // Mark notification as read
  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifySubscribers();
    }
  }

  // Mark all as read
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.notifySubscribers();
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.notifySubscribers();
  }

  // Delete specific notification
  deleteNotification(notificationId: string) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.notifySubscribers();
  }

  // Get unread count
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  // Get all notifications
  getNotifications(): Notification[] {
    return this.notifications;
  }

  // Update preferences
  updatePreferences(preferences: Partial<NotificationPreferences>) {
    this.preferences = { ...this.preferences, ...preferences };
    if (typeof window !== 'undefined') {
      localStorage.setItem('notificationPreferences', JSON.stringify(this.preferences));
    }
  }

  // Get preferences
  getPreferences(): NotificationPreferences {
    return this.preferences;
  }

  // Toggle sound
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
  }

  // Generate contextual notifications based on game events
  generateGameNotifications(team: Team) {
    // Check for injury updates
    team.players?.forEach(player => {
      if (player.injuryStatus && player.injuryStatus.type !== 'healthy') {
        this.addNotification({
          type: 'injury',
          priority: 'high',
          title: 'Injury Update',
          message: `${player.name} is ${player.injuryStatus.type} - ${player.injuryStatus.description}`,
          actionUrl: `/players/${player.id}`,
          actionLabel: 'View Player',
          metadata: {
            playerId: player.id,
            playerName: player.name,
            teamId: team.id,
            teamName: team.name,
          }
        });
      }
    });

    // Check for high-scoring players
    team.players?.forEach(player => {
      const points = player.stats?.fantasyPoints || 0;
      if (points > 25) {
        this.addNotification({
          type: 'score',
          priority: 'medium',
          title: 'Player Alert',
          message: `${player.name} scored ${points.toFixed(1)} points!`,
          actionUrl: `/players/${player.id}`,
          actionLabel: 'View Stats',
          metadata: {
            playerId: player.id,
            playerName: player.name,
            points: points,
            week: player.stats?.week,
          }
        });
      }
    });

    // Check for lineup issues
    const inactivePlayers = team.players?.filter(p => 
      p.status?.isActive && p.status?.gameStatus === 'out'
    );
    
    if (inactivePlayers && inactivePlayers.length > 0) {
      this.addNotification({
        type: 'lineup',
        priority: 'high',
        title: 'Lineup Alert',
        message: `${inactivePlayers.length} starter(s) are OUT! Update your lineup immediately.`,
        actionUrl: '/teams',
        actionLabel: 'Update Lineup',
        metadata: {
          teamId: team.id,
          teamName: team.name,
        }
      });
    }
  }

  // Sample notifications for demo
  addSampleNotifications() {
    const samples: Omit<Notification, 'id' | 'timestamp' | 'read'>[] = [
      {
        type: 'injury',
        priority: 'high',
        title: 'Injury Alert',
        message: 'Christian McCaffrey questionable for Sunday - limited in practice',
        actionUrl: '/players/2',
        actionLabel: 'View Details',
      },
      {
        type: 'waiver',
        priority: 'medium',
        title: 'Waiver Wire Alert',
        message: 'Jaylen Warren trending up - 78% rostered, projected for 14.5 pts',
        actionUrl: '/waiver-wire',
        actionLabel: 'View Waiver Wire',
      },
      {
        type: 'score',
        priority: 'low',
        title: 'Score Update',
        message: 'Your team scored 112.5 points in Week 10',
        actionUrl: '/teams',
        actionLabel: 'View Matchup',
      },
      {
        type: 'trade',
        priority: 'high',
        title: 'Trade Offer',
        message: 'New trade offer received: Josh Allen for Tyreek Hill',
        actionUrl: '/trades',
        actionLabel: 'Review Trade',
      },
      {
        type: 'news',
        priority: 'medium',
        title: 'Breaking News',
        message: 'Derrick Henry traded to Ravens - immediate RB1 value',
        actionUrl: '/news',
        actionLabel: 'Read More',
      },
    ];

    samples.forEach((notification, index) => {
      setTimeout(() => {
        this.addNotification(notification);
      }, index * 1000);
    });
  }
}

// Create singleton instance
export const notificationService = new NotificationService();