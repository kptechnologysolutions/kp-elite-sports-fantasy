'use client';

import React, { useState, useEffect } from 'react';
import { Player, Team } from '@/lib/types';
import { realtimeSyncService } from '@/lib/services/realtimeSync';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Activity, TrendingUp, AlertCircle, Clock } from 'lucide-react';

interface LivePlayerStatsProps {
  team: Team;
  compact?: boolean;
}

export function LivePlayerStats({ team, compact = false }: LivePlayerStatsProps) {
  const [players, setPlayers] = useState<Player[]>(team.players || []);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = realtimeSyncService.subscribe((data) => {
      // Get updated team data from store
      if (data.results?.playersUpdated && data.results.playersUpdated > 0) {
        setIsUpdating(true);
        // Refresh players from the team
        setPlayers(team.players || []);
        setLastUpdate(data.lastSync);
        setTimeout(() => setIsUpdating(false), 500);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [team]);

  const getPositionColor = (position?: string) => {
    switch (position) {
      case 'QB': return 'bg-red-500';
      case 'RB': return 'bg-blue-500';
      case 'WR': return 'bg-green-500';
      case 'TE': return 'bg-yellow-500';
      case 'K': return 'bg-purple-500';
      case 'DEF': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (player: Player) => {
    if (player.injuryStatus && player.injuryStatus.type !== 'healthy') {
      const colors = {
        'questionable': 'bg-yellow-600',
        'doubtful': 'bg-orange-600',
        'out': 'bg-red-600',
        'ir': 'bg-red-800',
      };
      return (
        <Badge className={cn('text-xs', colors[player.injuryStatus.type] || 'bg-gray-600')}>
          {player.injuryStatus.type.toUpperCase()}
        </Badge>
      );
    }
    
    if (player.status?.gameStatus === 'in_progress') {
      return (
        <Badge className="bg-green-600 text-xs animate-pulse">
          LIVE
        </Badge>
      );
    }
    
    return null;
  };

  if (!players || players.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>No player data available</p>
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-400">Live Player Stats</h3>
          {isUpdating && (
            <span className="text-xs text-green-500 animate-pulse flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Updating...
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {players.slice(0, 6).map((player) => (
            <div key={player.id} className="flex items-center justify-between p-2 bg-gray-900 rounded-lg">
              <div className="flex items-center gap-2">
                <Badge className={cn('text-xs', getPositionColor(player.position))}>
                  {player.position}
                </Badge>
                <span className="text-xs text-white truncate max-w-[100px]">
                  {player.name}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {getStatusBadge(player)}
                <span className="text-xs font-bold text-white">
                  {player.stats?.fantasyPoints?.toFixed(1) || '0.0'}
                </span>
              </div>
            </div>
          ))}
        </div>
        {lastUpdate && (
          <p className="text-xs text-gray-500 text-right flex items-center justify-end gap-1">
            <Clock className="w-3 h-3" />
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </p>
        )}
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          Live Player Stats
        </h2>
        {isUpdating && (
          <span className="text-sm text-green-500 animate-pulse flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Updating live scores...
          </span>
        )}
      </div>

      <div className="space-y-3">
        {players.map((player) => {
          const isPerforming = player.stats?.fantasyPoints && player.stats.fantasyPoints > 15;
          
          return (
            <div
              key={player.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg transition-all',
                'bg-gray-900 hover:bg-gray-800',
                isUpdating && 'animate-pulse',
                isPerforming && 'border border-green-500/30'
              )}
            >
              <div className="flex items-center gap-3">
                <Badge className={cn('', getPositionColor(player.position))}>
                  {player.position}
                </Badge>
                <div>
                  <p className="font-medium text-white">{player.name}</p>
                  <p className="text-xs text-gray-400">
                    {player.team} • {player.status?.gameStatus || 'Not Started'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {getStatusBadge(player)}
                {isPerforming && (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                )}
                <div className="text-right">
                  <p className="text-lg font-bold text-white">
                    {player.stats?.fantasyPoints?.toFixed(1) || '0.0'}
                  </p>
                  <p className="text-xs text-gray-400">points</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {lastUpdate && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <Clock className="w-3 h-3" />
            Last updated: {new Date(lastUpdate).toLocaleString()}
          </p>
        </div>
      )}
    </Card>
  );
}