'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { notificationService, Notification, NotificationPreferences } from '@/lib/services/notificationService';
import { 
  Bell, 
  BellOff,
  AlertTriangle,
  TrendingUp,
  Newspaper,
  Users,
  DollarSign,
  Settings,
  Check,
  X,
  ExternalLink,
  Trash2,
  CheckCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const typeIcons = {
  injury: <AlertTriangle className="h-4 w-4" />,
  trade: <Users className="h-4 w-4" />,
  waiver: <DollarSign className="h-4 w-4" />,
  score: <TrendingUp className="h-4 w-4" />,
  news: <Newspaper className="h-4 w-4" />,
  lineup: <AlertTriangle className="h-4 w-4" />,
  system: <Bell className="h-4 w-4" />,
};

const typeColors = {
  injury: 'text-red-500',
  trade: 'text-blue-500',
  waiver: 'text-green-500',
  score: 'text-purple-500',
  news: 'text-orange-500',
  lineup: 'text-yellow-500',
  system: 'text-gray-500',
};

const priorityColors = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
};

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationItem({ notification, onRead, onDelete }: NotificationItemProps) {
  return (
    <div
      className={cn(
        'p-4 border-l-4 transition-colors',
        notification.read ? 'bg-background border-muted' : 'bg-accent/50 border-primary',
        'hover:bg-accent cursor-pointer'
      )}
      onClick={() => !notification.read && onRead(notification.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn('mt-1', typeColors[notification.type])}>
          {typeIcons[notification.type]}
        </div>
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className={cn('font-semibold text-sm', !notification.read && 'text-foreground')}>
              {notification.title}
            </p>
            <Badge 
              variant="outline" 
              className={cn('h-1.5 w-1.5 p-0 rounded-full border-0', priorityColors[notification.priority])}
            />
          </div>
          
          <p className="text-sm text-muted-foreground">
            {notification.message}
          </p>
          
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
            </span>
            
            {notification.actionUrl && (
              <a
                href={notification.actionUrl}
                className="text-xs text-primary hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {notification.actionLabel || 'View'}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    notificationService.getPreferences()
  );
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    // Clear any existing demo notifications
    notificationService.clearAll();
    
    // Subscribe to notifications
    const unsubscribe = notificationService.subscribe(setNotifications);
    
    return unsubscribe;
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
  };

  const handleDelete = (id: string) => {
    notificationService.deleteNotification(id);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const handleClearAll = () => {
    notificationService.clearAll();
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    notificationService.updatePreferences(newPreferences);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[400px] sm:w-[540px] p-0 bg-gradient-to-br from-background via-background/95 to-background/90 backdrop-blur-xl border-l border-border/50">
        <SheetHeader className="p-6 pb-4 bg-gradient-to-r from-primary/10 to-purple-500/10 border-b border-border/30">
          <SheetTitle className="flex items-center justify-between">
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent font-bold">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-700 border-red-500/30">{unreadCount} unread</Badge>
            )}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Stay updated with your fantasy teams
          </SheetDescription>
        </SheetHeader>
        
        <Tabs defaultValue="notifications" className="flex-1">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="notifications" className="flex-1">
              Notifications
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="notifications" className="mt-0 h-[calc(100vh-200px)]">
            {/* Filter and Actions */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All ({notifications.length})
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  Unread ({unreadCount})
                </Button>
              </div>
              
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleMarkAllAsRead}
                  disabled={unreadCount === 0}
                >
                  <CheckCheck className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleClearAll}
                  disabled={notifications.length === 0}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Notifications List */}
            <ScrollArea className="h-[calc(100%-60px)]">
              {filteredNotifications.length > 0 ? (
                <div className="divide-y">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={handleMarkAsRead}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <BellOff className="h-12 w-12 mb-4" />
                  <p className="text-sm">No notifications</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="settings" className="p-6 space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Notification Types</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="injuries">Injury Updates</Label>
                  <Switch
                    id="injuries"
                    checked={preferences.injuries}
                    onCheckedChange={(checked) => handlePreferenceChange('injuries', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="trades">Trade Alerts</Label>
                  <Switch
                    id="trades"
                    checked={preferences.trades}
                    onCheckedChange={(checked) => handlePreferenceChange('trades', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="waiverWire">Waiver Wire</Label>
                  <Switch
                    id="waiverWire"
                    checked={preferences.waiverWire}
                    onCheckedChange={(checked) => handlePreferenceChange('waiverWire', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="scoring">Score Updates</Label>
                  <Switch
                    id="scoring"
                    checked={preferences.scoring}
                    onCheckedChange={(checked) => handlePreferenceChange('scoring', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="news">Breaking News</Label>
                  <Switch
                    id="news"
                    checked={preferences.news}
                    onCheckedChange={(checked) => handlePreferenceChange('news', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="lineupAlerts">Lineup Alerts</Label>
                  <Switch
                    id="lineupAlerts"
                    checked={preferences.lineupAlerts}
                    onCheckedChange={(checked) => handlePreferenceChange('lineupAlerts', checked)}
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold mb-4">Delivery Methods</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pushNotifications">Browser Notifications</Label>
                  <Switch
                    id="pushNotifications"
                    checked={preferences.pushNotifications}
                    onCheckedChange={(checked) => handlePreferenceChange('pushNotifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <Switch
                    id="emailNotifications"
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="smsNotifications">SMS Notifications</Label>
                  <Switch
                    id="smsNotifications"
                    checked={preferences.smsNotifications}
                    onCheckedChange={(checked) => handlePreferenceChange('smsNotifications', checked)}
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <Button 
                className="w-full" 
                onClick={() => {
                  notificationService.toggleSound();
                  setOpen(false);
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}