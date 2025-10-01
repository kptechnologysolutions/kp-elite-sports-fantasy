'use client';

import { cn } from '@/lib/utils';
import { SleeperPlayer } from '@/lib/types/sleeper';

interface TecmoPlayerSpriteProps {
  player?: SleeperPlayer;
  position?: string;
  size?: 'sm' | 'md' | 'lg';
  isAnimated?: boolean;
  isInjured?: boolean;
  className?: string;
}

export function TecmoPlayerSprite({ 
  player, 
  position, 
  size = 'md',
  isAnimated = false,
  isInjured = false,
  className 
}: TecmoPlayerSpriteProps) {
  const pos = position || player?.position || 'QB';
  
  // 8-bit pixel art representations
  const sprites: Record<string, string> = {
    QB: '🏈',
    RB: '💨',
    WR: '⚡',
    TE: '💪',
    K: '🦵',
    DEF: '🛡️',
    LB: '🔨',
    DB: '🎯',
    DL: '⚔️'
  };
  
  const colors: Record<string, string> = {
    QB: 'bg-red-600',
    RB: 'bg-blue-600',
    WR: 'bg-green-600',
    TE: 'bg-purple-600',
    K: 'bg-yellow-600',
    DEF: 'bg-gray-600',
    LB: 'bg-orange-600',
    DB: 'bg-cyan-600',
    DL: 'bg-pink-600'
  };
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl'
  };
  
  return (
    <div className={cn("relative inline-block", className)}>
      {/* Player Sprite Container */}
      <div 
        className={cn(
          "relative flex items-center justify-center",
          sizeClasses[size],
          colors[pos],
          "border-2 border-black",
          "shadow-[2px_2px_0_#000]",
          "pixel-art",
          isAnimated && "animate-bounce",
          isInjured && "opacity-50 grayscale"
        )}
        style={{
          imageRendering: 'pixelated',
          fontSize: size === 'sm' ? '16px' : size === 'md' ? '24px' : '32px'
        }}
      >
        {/* 8-bit style character */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="filter drop-shadow-[1px_1px_0_#000]">
            {sprites[pos] || '👤'}
          </span>
        </div>
        
        {/* Position Label */}
        <div 
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-black text-white px-1"
          style={{ 
            fontSize: '8px',
            fontFamily: "'Press Start 2P', monospace"
          }}
        >
          {pos}
        </div>
        
        {/* Injury indicator */}
        {isInjured && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center animate-pulse">
            <span style={{ fontSize: '8px' }}>!</span>
          </div>
        )}
      </div>
      
      {/* Player Name */}
      {player && (
        <div 
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-white text-xs"
          style={{ 
            fontFamily: "'VT323', monospace",
            textShadow: '1px 1px 0 #000'
          }}
        >
          {player.last_name}
        </div>
      )}
      
      {/* Animated Effects */}
      {isAnimated && (
        <>
          {/* Running dust effect */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1">
            <div className="w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0s' }} />
            <div className="w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0.1s' }} />
            <div className="w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
          </div>
          
          {/* Power aura */}
          <div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-xl animate-pulse" />
        </>
      )}
    </div>
  );
}

// Team Logo Component
export function TecmoTeamLogo({ 
  teamName,
  size = 'md',
  isAnimated = false,
  className
}: {
  teamName?: string;
  size?: 'sm' | 'md' | 'lg';
  isAnimated?: boolean;
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-12 h-12 text-xs',
    md: 'w-16 h-16 text-sm',
    lg: 'w-24 h-24 text-lg'
  };
  
  // Generate a color based on team name
  const getTeamColor = (name?: string) => {
    if (!name) return 'bg-gray-600';
    const colors = [
      'bg-red-600', 'bg-blue-600', 'bg-green-600', 
      'bg-purple-600', 'bg-yellow-600', 'bg-orange-600',
      'bg-cyan-600', 'bg-pink-600'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };
  
  return (
    <div 
      className={cn(
        "relative flex items-center justify-center",
        sizeClasses[size],
        getTeamColor(teamName),
        "border-4 border-black",
        "shadow-[4px_4px_0_#000]",
        "pixel-art",
        isAnimated && "animate-spin",
        className
      )}
      style={{ 
        imageRendering: 'pixelated',
        animationDuration: isAnimated ? '3s' : undefined
      }}
    >
      {/* Team Initial */}
      <span 
        className="font-bold text-white"
        style={{ 
          fontFamily: "'Press Start 2P', monospace",
          textShadow: '2px 2px 0 #000'
        }}
      >
        {teamName?.charAt(0) || '?'}
      </span>
      
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-2 h-2 bg-yellow-400 border border-black" />
      <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 border border-black" />
      <div className="absolute bottom-0 left-0 w-2 h-2 bg-yellow-400 border border-black" />
      <div className="absolute bottom-0 right-0 w-2 h-2 bg-yellow-400 border border-black" />
    </div>
  );
}

// Football Field Component
export function TecmoField({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative w-full h-64 bg-gradient-to-b from-green-700 to-green-800 overflow-hidden">
      {/* Yard lines */}
      <div className="absolute inset-0">
        {[10, 20, 30, 40, 50, 40, 30, 20, 10].map((yard, i) => (
          <div
            key={i}
            className="absolute w-full border-t-2 border-white/50"
            style={{ top: `${(i + 1) * 10}%` }}
          >
            <span 
              className="absolute left-4 -top-3 text-white/50 font-bold"
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px' }}
            >
              {yard}
            </span>
          </div>
        ))}
      </div>
      
      {/* End zones */}
      <div className="absolute top-0 left-0 right-0 h-[10%] bg-blue-600/50 border-b-4 border-white flex items-center justify-center">
        <span 
          className="text-white font-bold"
          style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '12px' }}
        >
          END ZONE
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[10%] bg-red-600/50 border-t-4 border-white flex items-center justify-center">
        <span 
          className="text-white font-bold"
          style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '12px' }}
        >
          END ZONE
        </span>
      </div>
      
      {/* Field pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 40px)`,
        }}
      />
      
      {/* Children (players, etc) */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}