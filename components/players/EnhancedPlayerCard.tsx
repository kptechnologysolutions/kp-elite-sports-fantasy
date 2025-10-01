'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Player } from '@/lib/types';
import { TrendingUp, TrendingDown, AlertTriangle, Activity, Trophy, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedPlayerCardProps {
  player: Player;
  isStarter?: boolean;
  showDetails?: boolean;
}

const positionColors: Record<string, string> = {
  QB: 'bg-red-500',
  RB: 'bg-green-500',
  WR: 'bg-blue-500',
  TE: 'bg-orange-500',
  K: 'bg-purple-500',
  DST: 'bg-gray-500',
  DEF: 'bg-gray-500',
};

const injuryColors: Record<string, string> = {
  Questionable: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950',
  Doubtful: 'text-orange-600 bg-orange-50 dark:bg-orange-950',
  Out: 'text-red-600 bg-red-50 dark:bg-red-950',
  IR: 'text-red-600 bg-red-50 dark:bg-red-950',
};

export function EnhancedPlayerCard({ player, isStarter = false, showDetails = false }: EnhancedPlayerCardProps) {
  const positionColor = positionColors[player.position] || 'bg-gray-500';
  const fantasyPoints = player.stats?.fantasyPoints || 0;
  const projectedPoints = player.stats?.projectedPoints || 0;
  const pointDiff = fantasyPoints - projectedPoints;
  const performancePercentage = projectedPoints > 0 ? (fantasyPoints / projectedPoints) * 100 : 0;
  
  // Handle injury status - could be an object or string
  const injuryStatusText = typeof player.injuryStatus === 'object' 
    ? player.injuryStatus?.type 
    : (player.injuryStatus || player.status?.gameStatus);
  
  const injuryDescription = typeof player.injuryStatus === 'object'
    ? player.injuryStatus?.description
    : null;
    
  const injuryClass = injuryStatusText && injuryStatusText !== 'healthy' && injuryStatusText !== 'playing' 
    ? injuryColors[injuryStatusText] || 'text-gray-600 bg-gray-50'
    : '';

  return (
    <Card className={cn(
      "hover:shadow-lg transition-all duration-300 cursor-pointer",
      isStarter && "ring-2 ring-primary",
      player.status?.isActive && "bg-gradient-to-r from-primary/5 to-transparent"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge 
                className={cn(positionColor, "text-white")}
                variant="default"
              >
                {player.position}
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">
                {player.team || 'FA'}
              </span>
              {player.jerseyNumber && (
                <span className="text-xs text-muted-foreground">
                  #{player.jerseyNumber}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-sm leading-tight">
              {player.name}
            </h3>
            {injuryStatusText && injuryStatusText !== 'healthy' && injuryStatusText !== 'playing' && (
              <div className={cn("flex items-center gap-1 mt-1", injuryClass)}>
                <AlertTriangle className="h-3 w-3" />
                <span className="text-xs font-medium">
                  {injuryStatusText}
                  {injuryDescription && ` - ${injuryDescription}`}
                </span>
              </div>
            )}
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold">
              {fantasyPoints.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">
              pts
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Performance Indicator */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Performance</span>
            <span className={cn(
              "font-medium",
              pointDiff > 0 ? "text-green-600" : pointDiff < 0 ? "text-red-600" : "text-gray-600"
            )}>
              {pointDiff > 0 ? '+' : ''}{pointDiff.toFixed(1)} vs proj
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                performancePercentage >= 100 ? "bg-green-500" : 
                performancePercentage >= 75 ? "bg-yellow-500" : "bg-red-500"
              )}
              style={{ width: `${Math.min(performancePercentage, 150)}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        {showDetails && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {player.stats?.passingYards && (
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3 text-muted-foreground" />
                <span>{player.stats.passingYards} Pass Yds</span>
              </div>
            )}
            {player.stats?.rushingYards && (
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-muted-foreground" />
                <span>{player.stats.rushingYards} Rush Yds</span>
              </div>
            )}
            {player.stats?.receivingYards && (
              <div className="flex items-center gap-1">
                <Trophy className="h-3 w-3 text-muted-foreground" />
                <span>{player.stats.receivingYards} Rec Yds</span>
              </div>
            )}
            {(player.stats?.passingTDs || player.stats?.rushingTDs || player.stats?.receivingTDs) && (
              <div className="flex items-center gap-1">
                <Trophy className="h-3 w-3 text-muted-foreground" />
                <span>
                  {(player.stats.passingTDs || 0) + 
                   (player.stats.rushingTDs || 0) + 
                   (player.stats.receivingTDs || 0)} TDs
                </span>
              </div>
            )}
          </div>
        )}

        {/* Status Badges */}
        <div className="flex gap-1 mt-3">
          {isStarter && (
            <Badge variant="default" className="text-xs">
              Starter
            </Badge>
          )}
          {player.status?.isActive && (
            <Badge variant="secondary" className="text-xs">
              Active
            </Badge>
          )}
          {fantasyPoints > projectedPoints && projectedPoints > 0 && (
            <Badge variant="outline" className="text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              Overperforming
            </Badge>
          )}
          {fantasyPoints < projectedPoints && projectedPoints > 0 && (
            <Badge variant="outline" className="text-xs text-red-600">
              <TrendingDown className="h-3 w-3 mr-1" />
              Underperforming
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}