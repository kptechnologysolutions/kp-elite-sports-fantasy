'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Zap,
  Bell,
  RefreshCw,
  Play,
  Pause
} from 'lucide-react';
import { 
  liveScoringService,
  PlayerScoreUpdate,
  MatchupScoreUpdate,
  NewsUpdate
} from '@/lib/services/liveScoring';
import useSleeperStore from '@/lib/store/useSleeperStore';
import { cn } from '@/lib/utils';

interface LiveUpdate {
  id: string;
  type: 'score' | 'news' | 'matchup';
  timestamp: number;
  data: any;
  isNew: boolean;
}

export function LiveScoring() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [updates, setUpdates] = useState<LiveUpdate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  
  const {
    user,
    currentLeague,
    currentWeek,
    myRoster
  } = useSleeperStore();
  
  // Initialize live scoring connection
  useEffect(() => {
    if (user && currentLeague) {
      connectToLiveScoring();
    }
    
    return () => {
      liveScoringService.disconnect();
    };
  }, [user, currentLeague]);
  
  const connectToLiveScoring = async () => {
    if (!user || !currentLeague) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      // Attempt WebSocket connection
      try {
        await liveScoringService.connect(user.user_id, [currentLeague.league_id]);
        setIsConnected(true);
        setupEventListeners();
      } catch (wsError) {
        console.warn('WebSocket unavailable, starting mock updates');
        // Fall back to mock updates for development
        liveScoringService.startMockUpdates(currentLeague.league_id, currentWeek);
        setIsConnected(true);
        setupEventListeners();
      }
      
    } catch (error: any) {
      setError(error.message || 'Failed to connect to live scoring');
    } finally {
      setIsConnecting(false);
    }
  };
  
  const setupEventListeners = () => {
    // Player score updates
    liveScoringService.on('player_score_update', handlePlayerScoreUpdate);
    
    // Matchup updates
    liveScoringService.on('matchup_score_update', handleMatchupUpdate);
    
    // News updates
    liveScoringService.on('player_news', handleNewsUpdate);
    
    // Connection status
    liveScoringService.on('disconnect', () => setIsConnected(false));
    liveScoringService.on('connect', () => setIsConnected(true));
  };
  
  const handlePlayerScoreUpdate = useCallback((data: PlayerScoreUpdate) => {
    if (isPaused) return;
    
    const update: LiveUpdate = {
      id: `score-${data.playerId}-${Date.now()}`,
      type: 'score',
      timestamp: Date.now(),
      data,
      isNew: true
    };
    
    setUpdates(prev => {
      const newUpdates = [update, ...prev.slice(0, 49)]; // Keep last 50 updates
      // Mark older updates as not new
      return newUpdates.map((u, index) => ({ ...u, isNew: index === 0 }));
    });
    
    setLastUpdateTime(Date.now());
  }, [isPaused]);
  
  const handleMatchupUpdate = useCallback((data: MatchupScoreUpdate) => {
    if (isPaused) return;
    
    const update: LiveUpdate = {
      id: `matchup-${data.matchupId}-${Date.now()}`,
      type: 'matchup',
      timestamp: Date.now(),
      data,
      isNew: true
    };
    
    setUpdates(prev => [update, ...prev.slice(0, 49)]);
    setLastUpdateTime(Date.now());
  }, [isPaused]);
  
  const handleNewsUpdate = useCallback((data: NewsUpdate) => {
    if (isPaused) return;
    
    const update: LiveUpdate = {
      id: `news-${data.playerId}-${Date.now()}`,
      type: 'news',
      timestamp: Date.now(),
      data,
      isNew: true
    };
    
    setUpdates(prev => [update, ...prev.slice(0, 49)]);
    setLastUpdateTime(Date.now());
  }, [isPaused]);
  
  const getTimeSinceLastUpdate = () => {
    if (lastUpdateTime === 0) return 'Never';
    const seconds = Math.floor((Date.now() - lastUpdateTime) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };
  
  const clearUpdates = () => {
    setUpdates([]);
    setLastUpdateTime(0);
  };
  
  const togglePause = () => {
    setIsPaused(!isPaused);
  };
  
  const reconnect = () => {
    connectToLiveScoring();
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-600" />
              )}
              Live Scoring
              {isConnected && (
                <Badge variant="outline" className="ml-2">
                  <Activity className="h-3 w-3 mr-1 animate-pulse" />
                  Live
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Real-time score updates and player news
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePause}
              disabled={!isConnected}
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={clearUpdates}
            >
              Clear
            </Button>
            
            {!isConnected && (
              <Button
                variant="outline"
                size="sm"
                onClick={reconnect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  'Reconnect'
                )}
              </Button>
            )}
          </div>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Last update: {getTimeSinceLastUpdate()}
          </span>
          
          <span className="flex items-center gap-1">
            <Bell className="h-4 w-4" />
            {updates.length} updates
          </span>
          
          {isPaused && (
            <Badge variant="outline" className="text-orange-600">
              Paused
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!isConnected && !isConnecting && (
          <Alert className="mb-4">
            <AlertDescription>
              Live scoring is disconnected. Using mock data for development.
            </AlertDescription>
          </Alert>
        )}
        
        {isConnecting && (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 mx-auto animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Connecting to live scoring...</p>
          </div>
        )}
        
        {updates.length === 0 && isConnected && !isConnecting ? (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Waiting for live updates...
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Updates will appear here during game time
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {updates.map((update) => (
              <div
                key={update.id}
                className={cn(
                  "p-3 rounded-lg border transition-all duration-500",
                  update.isNew && "bg-blue-50 border-blue-200 animate-pulse"
                )}
              >
                {update.type === 'score' && (
                  <PlayerScoreCard update={update.data} />
                )}
                
                {update.type === 'matchup' && (
                  <MatchupUpdateCard update={update.data} />
                )}
                
                {update.type === 'news' && (
                  <NewsUpdateCard update={update.data} />
                )}
                
                <div className="text-xs text-muted-foreground mt-2">
                  {new Date(update.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlayerScoreCard({ update }: { update: PlayerScoreUpdate }) {
  const pointsChange = update.points - update.previousPoints;
  const isIncrease = pointsChange > 0;
  
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium">{update.playerName}</div>
        <div className="text-sm text-muted-foreground">
          {update.position} • {update.team}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="font-bold">{update.points.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground">
            {update.gameStatus === 'live' ? 'Live' : 'Final'}
          </div>
        </div>
        
        {pointsChange !== 0 && (
          <div className={cn(
            "flex items-center gap-1 text-sm",
            isIncrease ? "text-green-600" : "text-red-600"
          )}>
            {isIncrease ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {Math.abs(pointsChange).toFixed(1)}
          </div>
        )}
      </div>
    </div>
  );
}

function MatchupUpdateCard({ update }: { update: MatchupScoreUpdate }) {
  const team1 = update.teams[0];
  const team2 = update.teams[1];
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>Matchup {update.matchupId}</span>
        <Badge variant="outline">
          {update.gamesInProgress} live games
        </Badge>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">Team {team1.rosterId}</div>
          <div className="text-sm text-muted-foreground">
            {team1.score.toFixed(1)} pts
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-sm text-muted-foreground">vs</div>
          <Progress 
            value={(team1.score / (team1.score + team2.score)) * 100} 
            className="w-16 h-2"
          />
        </div>
        
        <div className="text-right">
          <div className="font-medium">Team {team2.rosterId}</div>
          <div className="text-sm text-muted-foreground">
            {team2.score.toFixed(1)} pts
          </div>
        </div>
      </div>
    </div>
  );
}

function NewsUpdateCard({ update }: { update: NewsUpdate }) {
  const getImpactColor = (impact: NewsUpdate['impact']) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };
  
  return (
    <div>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium">{update.title}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {update.description}
          </div>
        </div>
        
        <div className="flex flex-col gap-1 ml-3">
          <Badge 
            variant="outline" 
            className={cn("text-xs", getImpactColor(update.impact))}
          >
            {update.impact} impact
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {update.type}
          </Badge>
        </div>
      </div>
    </div>
  );
}