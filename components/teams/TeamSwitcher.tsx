'use client';

import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ChevronDown,
  Trophy,
  Plus,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  AlertCircle,
  LayoutGrid
} from 'lucide-react';
import { Team } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface TeamSwitcherProps {
  teams: Team[];
  activeTeamId?: string;
  onTeamSwitch?: (teamId: string) => void;
  className?: string;
}

const platformColors = {
  ESPN: 'bg-red-500',
  Yahoo: 'bg-purple-500',
  Sleeper: 'bg-orange-500',
  NFL: 'bg-blue-600',
  CBS: 'bg-blue-500',
  DraftKings: 'bg-green-500',
  Custom: 'bg-gray-500',
};

const platformLogos = {
  ESPN: '🏈',
  Yahoo: '🟣',
  Sleeper: '😴',
  NFL: '🏆',
  CBS: '📺',
  DraftKings: '👑',
  Custom: '⚙️',
};

export function TeamSwitcher({ teams, activeTeamId, onTeamSwitch, className }: TeamSwitcherProps) {
  const router = useRouter();
  const [selectedTeamId, setSelectedTeamId] = useState(activeTeamId || teams[0]?.id);
  const activeTeam = teams.find(t => t.id === selectedTeamId);

  useEffect(() => {
    if (activeTeamId && activeTeamId !== selectedTeamId) {
      setSelectedTeamId(activeTeamId);
    }
  }, [activeTeamId]);

  const handleTeamSelect = (teamId: string) => {
    if (teamId === 'all') {
      router.push('/dashboard/all-teams');
      return;
    }
    
    if (teamId === 'add') {
      router.push('/teams');
      return;
    }

    setSelectedTeamId(teamId);
    if (onTeamSwitch) {
      onTeamSwitch(teamId);
    }
  };

  const getStreakIcon = (streak?: string) => {
    if (!streak) return null;
    if (streak.startsWith('W')) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (streak.startsWith('L')) return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-gray-500" />;
  };

  const getRecordColor = (team: Team) => {
    if (!team.record) return 'text-muted-foreground';
    const winRate = team.record.wins / (team.record.wins + team.record.losses);
    if (winRate >= 0.7) return 'text-green-500';
    if (winRate >= 0.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (!teams || teams.length === 0) {
    return (
      <Button
        variant="outline"
        onClick={() => router.push('/teams')}
        className={cn('justify-between', className)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Your First Team
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'min-w-[200px] justify-between bg-card hover:bg-accent',
            className
          )}
        >
          <div className="flex items-center space-x-2 text-left">
            <div className={cn('h-2 w-2 rounded-full', platformColors[activeTeam?.platform || 'Custom'])} />
            <div>
              <div className="text-sm font-medium">{activeTeam?.name}</div>
              {activeTeam?.record && (
                <div className={cn('text-xs', getRecordColor(activeTeam))}>
                  {activeTeam.record.wins}-{activeTeam.record.losses}
                  {activeTeam.record.ties > 0 && `-${activeTeam.record.ties}`}
                  {activeTeam.rank && ` • ${activeTeam.rank}${activeTeam.leagueSize ? `/${activeTeam.leagueSize}` : ''}`}
                </div>
              )}
            </div>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-[280px]" align="start">
        <DropdownMenuLabel>Your Teams</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          {teams.map((team) => (
            <DropdownMenuItem
              key={team.id}
              onClick={() => handleTeamSelect(team.id)}
              className={cn(
                'cursor-pointer',
                selectedTeamId === team.id && 'bg-accent'
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={team.logo} alt={team.name} />
                      <AvatarFallback>
                        <span className="text-lg">{platformLogos[team.platform]}</span>
                      </AvatarFallback>
                    </Avatar>
                    {team.liveScore?.isLive && (
                      <div className="absolute -top-1 -right-1">
                        <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{team.name}</span>
                      {selectedTeamId === team.id && (
                        <CheckCircle className="h-3 w-3 text-primary" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="px-1 py-0 text-xs">
                        {team.platform}
                      </Badge>
                      {team.record && (
                        <>
                          <span>{team.record.wins}-{team.record.losses}</span>
                          {getStreakIcon(team.record.streak)}
                        </>
                      )}
                      {team.liveScore?.isLive && (
                        <span className="text-primary font-medium">
                          {team.liveScore.teamScore} - {team.liveScore.opponentScore}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {team.rank && (
                  <div className="text-right">
                    <div className="text-sm font-medium">#{team.rank}</div>
                    {team.leagueSize && (
                      <div className="text-xs text-muted-foreground">
                        of {team.leagueSize}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => handleTeamSelect('all')}
          className="cursor-pointer"
        >
          <LayoutGrid className="mr-2 h-4 w-4" />
          <span>View All Teams</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => handleTeamSelect('add')}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span>Add New Team</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}