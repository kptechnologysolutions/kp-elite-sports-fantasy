'use client';

import { Player } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Activity, 
  Brain,
  Newspaper,
  MoreVertical,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface PlayerCardProps {
  player: Player;
  onRefresh?: () => void;
  compact?: boolean;
}

const positionColors = {
  QB: 'bg-red-500',
  RB: 'bg-green-500',
  WR: 'bg-blue-500',
  TE: 'bg-orange-500',
  K: 'bg-purple-500',
  DEF: 'bg-gray-500',
};

const statusColors = {
  playing: 'bg-green-500',
  questionable: 'bg-yellow-500',
  doubtful: 'bg-orange-500',
  out: 'bg-red-500',
  ir: 'bg-gray-500',
};

export function PlayerCard({ player, onRefresh, compact = false }: PlayerCardProps) {
  const router = useRouter();

  const getStatusIcon = () => {
    if (player.status.gameStatus === 'playing') return null;
    if (player.status.gameStatus === 'questionable') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    if (player.status.gameStatus === 'doubtful') return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    if (player.status.gameStatus === 'out') return <AlertTriangle className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getTrendIcon = () => {
    if (!player.stats) return null;
    const trend = player.stats.fantasyPoints > (player.stats.projectedPoints || 0) ? 'up' : 'down';
    return trend === 'up' ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  if (compact) {
    return (
      <div 
        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
        onClick={() => router.push(`/players/${player.id}`)}
      >
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={player.avatar} alt={player.name} />
            <AvatarFallback>{player.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{player.name}</span>
              {getStatusIcon()}
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className={cn('px-2 py-0', positionColors[player.position])}>
                <span className="text-white text-xs">{player.position}</span>
              </Badge>
              <span>{player.team}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {player.stats && (
            <div className="text-right">
              <div className="font-semibold">{player.stats.fantasyPoints} pts</div>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <span>Proj: {player.stats.projectedPoints}</span>
                {getTrendIcon()}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={player.avatar} alt={player.name} />
              <AvatarFallback>{player.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold">{player.name}</h3>
                {getStatusIcon()}
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className={cn('px-2 py-0', positionColors[player.position])}>
                  <span className="text-white text-xs">{player.position}</span>
                </Badge>
                <span>{player.team}</span>
                {player.jerseyNumber && <span>#{player.jerseyNumber}</span>}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/players/${player.id}`)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Data
              </DropdownMenuItem>
              <DropdownMenuItem>
                Add to Watchlist
              </DropdownMenuItem>
              <DropdownMenuItem>
                Compare Players
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Game Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge className={cn(statusColors[player.status.gameStatus])}>
            <span className="text-white capitalize">{player.status.gameStatus}</span>
          </Badge>
        </div>

        {/* Stats */}
        {player.stats && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Fantasy Points</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{player.stats.fantasyPoints}</span>
                {getTrendIcon()}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Projected</span>
              <span>{player.stats.projectedPoints || '-'}</span>
            </div>
            
            {/* Position-specific stats */}
            {player.position === 'QB' && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pass Yds</span>
                  <span>{player.stats.passingYards || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pass TDs</span>
                  <span>{player.stats.passingTDs || 0}</span>
                </div>
              </>
            )}
            
            {(player.position === 'RB' || player.position === 'WR' || player.position === 'TE') && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Receptions</span>
                  <span>{player.stats.receptions || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rec Yds</span>
                  <span>{player.stats.receivingYards || 0}</span>
                </div>
              </>
            )}
            
            {player.position === 'RB' && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rush Yds</span>
                  <span>{player.stats.rushingYards || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rush TDs</span>
                  <span>{player.stats.rushingTDs || 0}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => router.push(`/players/${player.id}#news`)}
          >
            <Newspaper className="mr-1 h-3 w-3" />
            News
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => router.push(`/players/${player.id}#insights`)}
          >
            <Brain className="mr-1 h-3 w-3" />
            AI Insights
          </Button>
        </div>

        {/* Injury Status */}
        {player.injuryStatus && (
          <div className="rounded-lg bg-destructive/10 p-3">
            <div className="flex items-start space-x-2">
              <Activity className="h-4 w-4 text-destructive mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium">{player.injuryStatus.type}</p>
                <p className="text-xs text-muted-foreground">{player.injuryStatus.description}</p>
                {player.injuryStatus.estimatedReturn && (
                  <p className="text-xs">Est. return: {player.injuryStatus.estimatedReturn}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}