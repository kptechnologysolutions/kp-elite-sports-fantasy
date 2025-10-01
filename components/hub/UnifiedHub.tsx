'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, Trophy, TrendingUp, Users, Brain, Newspaper, 
  Bell, Settings, Plus, Grid, List, Maximize2, RefreshCw,
  Zap, Target, Shield, AlertTriangle, Clock, Star,
  ArrowUp, ArrowDown, ChevronRight, Gamepad2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTeamStore } from '@/lib/store/teamStore';
import { realtimeSyncService } from '@/lib/services/realtimeSync';
import { notificationService } from '@/lib/services/notificationService';

// Widget types for the modular system
type WidgetType = 'live-scores' | 'team-standings' | 'player-stats' | 'news-feed' | 
                  'ai-insights' | 'waiver-wire' | 'upcoming-games' | 'notifications';

interface Widget {
  id: string;
  type: WidgetType;
  size: 'small' | 'medium' | 'large' | 'full';
  position: { x: number; y: number };
}

// Default widget layout
const defaultWidgets: Widget[] = [
  { id: '1', type: 'live-scores', size: 'large', position: { x: 0, y: 0 } },
  { id: '2', type: 'team-standings', size: 'medium', position: { x: 2, y: 0 } },
  { id: '3', type: 'ai-insights', size: 'medium', position: { x: 0, y: 1 } },
  { id: '4', type: 'player-stats', size: 'medium', position: { x: 1, y: 1 } },
  { id: '5', type: 'news-feed', size: 'medium', position: { x: 2, y: 1 } },
];

export function UnifiedHub() {
  const { teams, currentTeam } = useTeamStore();
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'focus'>('grid');
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ isLive: false, lastSync: null as Date | null });
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Get current team data
  const activeTeam = teams.find(t => t.id === currentTeam) || teams[0];
  
  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribeSync = realtimeSyncService.subscribe((data) => {
      setSyncStatus({ isLive: data.isGameDay, lastSync: data.lastSync });
    });
    
    const unsubscribeNotifications = notificationService.subscribe((notifs) => {
      setNotifications(notifs.filter(n => !n.read).slice(0, 5));
    });
    
    return () => {
      unsubscribeSync();
      unsubscribeNotifications();
    };
  }, []);

  // Widget Components
  const LiveScoresWidget = ({ size }: { size: string }) => (
    <Card className={cn("h-full", syncStatus.isLive && "border-green-500/50")}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Live Scores
          </div>
          {syncStatus.isLive && (
            <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeTeam?.liveScore ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Team</p>
                <p className="text-2xl font-bold">{activeTeam.liveScore.teamScore.toFixed(1)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">VS</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Opponent</p>
                <p className="text-2xl font-bold">{activeTeam.liveScore.opponentScore.toFixed(1)}</p>
              </div>
            </div>
            
            {activeTeam.liveScore.winProbability && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Win Probability</p>
                <Progress value={activeTeam.liveScore.winProbability} className="h-2" />
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground">Playing</p>
                <p className="font-bold text-green-500">
                  {activeTeam.players?.filter(p => p.status?.isActive).length || 0}
                </p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground">Bench</p>
                <p className="font-bold">
                  {activeTeam.players?.filter(p => !p.status?.isActive).length || 0}
                </p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground">Projected</p>
                <p className="font-bold text-blue-500">
                  {activeTeam.liveScore.projectedScore?.toFixed(1) || '--'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No live games</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const TeamStandingsWidget = () => (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          League Standings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeTeam && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold">#{activeTeam.rank || 1}</div>
                <div>
                  <p className="font-medium">{activeTeam.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {activeTeam.record?.wins || 0}-{activeTeam.record?.losses || 0}
                  </p>
                </div>
              </div>
              <Badge variant={activeTeam.rank === 1 ? "default" : "secondary"}>
                {activeTeam.record?.pointsFor.toFixed(1)} PF
              </Badge>
            </div>
            
            {/* Mock other teams */}
            {[2, 3, 4].map(rank => (
              <div key={rank} className="flex items-center justify-between p-2">
                <div className="flex items-center gap-3">
                  <div className="text-lg text-muted-foreground">#{rank}</div>
                  <div>
                    <p className="text-sm">Team {rank}</p>
                    <p className="text-xs text-muted-foreground">
                      {10 - rank}-{rank}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {(150 - rank * 10).toFixed(1)} PF
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const AIInsightsWidget = () => (
    <Card className="h-full border-purple-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-500" />
          AI Insights
          <Badge variant="outline" className="ml-auto">GPT-4</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <ArrowUp className="w-4 h-4 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Start Justin Jefferson</p>
                <p className="text-xs text-muted-foreground">
                  Favorable matchup vs. weak secondary. 85% start confidence.
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Monitor CMC Status</p>
                <p className="text-xs text-muted-foreground">
                  Limited practice participation. Have backup ready.
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Waiver Wire Alert</p>
                <p className="text-xs text-muted-foreground">
                  Jaylen Warren trending up. Consider adding before waivers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const PlayerStatsWidget = () => (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          Top Performers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {activeTeam?.players?.slice(0, 5).map((player, idx) => (
            <div key={player.id} className="flex items-center justify-between p-2 hover:bg-muted rounded">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                <div>
                  <p className="text-sm font-medium">{player.name}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs h-5">
                      {player.position}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{player.team}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">{player.stats?.fantasyPoints || 0}</p>
                <p className="text-xs text-muted-foreground">pts</p>
              </div>
            </div>
          )) || <p className="text-sm text-muted-foreground">No players available</p>}
        </div>
      </CardContent>
    </Card>
  );

  const NewsFeedWidget = () => (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="w-4 h-4" />
          Latest News
          <Badge variant="secondary" className="ml-auto">100+ sources</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="space-y-3">
            {[
              { title: "Injury Report: Key Players Questionable", source: "ESPN", time: "2m ago", urgent: true },
              { title: "Trade Deadline Approaching Fast", source: "Yahoo", time: "15m ago", urgent: false },
              { title: "Weather Alert for Sunday Games", source: "NFL", time: "1h ago", urgent: false },
              { title: "Waiver Wire Top Picks Week 5", source: "FantasyPros", time: "2h ago", urgent: false },
            ].map((news, idx) => (
              <div key={idx} className="p-2 hover:bg-muted rounded cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-1">{news.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{news.source}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{news.time}</span>
                      {news.urgent && <Badge variant="destructive" className="h-4 text-xs">URGENT</Badge>}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  // Render widget based on type
  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'live-scores':
        return <LiveScoresWidget size={widget.size} />;
      case 'team-standings':
        return <TeamStandingsWidget />;
      case 'ai-insights':
        return <AIInsightsWidget />;
      case 'player-stats':
        return <PlayerStatsWidget />;
      case 'news-feed':
        return <NewsFeedWidget />;
      default:
        return null;
    }
  };

  // Calculate grid span based on widget size
  const getGridSpan = (size: string) => {
    switch (size) {
      case 'small': return 'col-span-1 row-span-1';
      case 'medium': return 'col-span-2 row-span-1';
      case 'large': return 'col-span-2 row-span-2';
      case 'full': return 'col-span-3 row-span-2';
      default: return 'col-span-1 row-span-1';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header with Quick Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fantasy Hub</h1>
          <p className="text-muted-foreground">
            {syncStatus.isLive ? 'Live games in progress' : 'Next games start soon'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Mode Toggles */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'focus' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('focus')}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCustomizing(!isCustomizing)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Customize
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => realtimeSyncService.startSync()}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Record</p>
                <p className="text-2xl font-bold">
                  {activeTeam?.record?.wins || 0}-{activeTeam?.record?.losses || 0}
                </p>
              </div>
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rank</p>
                <p className="text-2xl font-bold">#{activeTeam?.rank || 1}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Points For</p>
                <p className="text-2xl font-bold">{activeTeam?.record?.pointsFor.toFixed(0) || 0}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Notifications</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
              <Bell className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Widget Grid */}
      <div className={cn(
        viewMode === 'grid' && "grid grid-cols-3 gap-4",
        viewMode === 'list' && "space-y-4",
        viewMode === 'focus' && "space-y-4"
      )}>
        <AnimatePresence>
          {widgets.map((widget) => (
            <motion.div
              key={widget.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                viewMode === 'grid' && getGridSpan(widget.size),
                viewMode === 'focus' && selectedWidget === widget.id && "order-first",
                isCustomizing && "cursor-move hover:shadow-lg transition-shadow"
              )}
              onClick={() => viewMode === 'focus' && setSelectedWidget(widget.id)}
            >
              {renderWidget(widget)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Widget Button (when customizing) */}
      {isCustomizing && (
        <div className="flex justify-center">
          <Button variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Widget
          </Button>
        </div>
      )}
      
      {/* Quick Access Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2">
        <Button
          size="lg"
          className="rounded-full shadow-lg"
          onClick={() => window.location.href = '/game-room'}
        >
          <Gamepad2 className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}