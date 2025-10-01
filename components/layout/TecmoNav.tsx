'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  Trophy, Users, TrendingUp, Shield, Zap, Activity, 
  Star, Home, Settings, Gamepad2, Volume2, VolumeX,
  Flame, Target, Swords, Crown, Sparkles, BarChart3, Brain
} from 'lucide-react';
import useSleeperStore from '@/lib/store/useSleeperStore';
import { cn } from '@/lib/utils';
import { useTecmoBowl } from '@/components/providers/tecmo-provider';

export function TecmoNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { user, currentLeague, myRoster, currentWeek } = useSleeperStore();
  const { soundEnabled, setSoundEnabled, playSound } = useTecmoBowl();
  
  const navItems = [
    { 
      label: 'GAME START', 
      path: '/dashboard/sleeper', 
      icon: Home,
      color: 'text-green-400',
      animation: 'animate-pulse'
    },
    { 
      label: 'GAME DAY', 
      path: '/gameday', 
      icon: Gamepad2,
      color: 'text-purple-400',
      animation: 'hover:animate-ping'
    },
    { 
      label: 'PORTFOLIO', 
      path: '/portfolio', 
      icon: BarChart3,
      color: 'text-pink-400',
      animation: 'hover:animate-bounce'
    },
    { 
      label: 'AI COACH', 
      path: '/coach', 
      icon: Brain,
      color: 'text-indigo-400',
      animation: 'hover:animate-pulse'
    },
    { 
      label: 'MY ROSTER', 
      path: '/roster/sleeper', 
      icon: Users,
      color: 'text-blue-400',
      animation: 'hover:animate-bounce'
    },
    { 
      label: 'MATCHUPS', 
      path: '/dashboard/sleeper', 
      icon: Swords,
      color: 'text-red-400',
      animation: 'hover:animate-spin'
    },
    { 
      label: 'STANDINGS', 
      path: '/dashboard/sleeper', 
      icon: Trophy,
      color: 'text-yellow-400',
      animation: 'hover:animate-pulse'
    },
    { 
      label: 'TRADES', 
      path: '/trades/sleeper', 
      icon: Zap,
      color: 'text-purple-400',
      animation: 'hover:animate-ping'
    },
    { 
      label: 'WAIVERS', 
      path: '/waivers/sleeper', 
      icon: Activity,
      color: 'text-cyan-400',
      animation: 'hover:animate-bounce'
    },
    { 
      label: 'STATS', 
      path: '/stats/sleeper', 
      icon: TrendingUp,
      color: 'text-orange-400',
      animation: 'hover:animate-pulse'
    },
    { 
      label: 'OPTIONS', 
      path: '/settings', 
      icon: Settings,
      color: 'text-gray-400',
      animation: 'hover:animate-spin'
    },
  ];
  
  const handleNavClick = (path: string, label: string) => {
    playSound('select');
    router.push(path);
  };
  
  return (
    <nav className="tecmo-nav bg-gradient-to-b from-blue-900 to-black border-b-4 border-yellow-400 shadow-[0_4px_0_#000]">
      <div className="container mx-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between py-2 px-4 border-b-2 border-blue-800">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-8 w-8 text-yellow-400 animate-spin" style={{ animationDuration: '4s' }} />
              <div>
                <div className="text-yellow-400 font-bold text-sm" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                  TECMO
                </div>
                <div className="text-orange-400 text-xs" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                  FANTASY
                </div>
              </div>
            </div>
            
            {/* User Info */}
            {user && (
              <div className="flex items-center gap-4">
                <div className="bg-black/50 px-3 py-1 border-2 border-yellow-400 rounded">
                  <span className="text-yellow-400 text-xs">PLAYER:</span>
                  <span className="text-white ml-2 font-bold">{user.display_name}</span>
                </div>
                
                {myRoster && (
                  <div className="bg-black/50 px-3 py-1 border-2 border-green-400 rounded">
                    <span className="text-green-400">W:{myRoster.settings?.wins || 0}</span>
                    <span className="text-white mx-1">-</span>
                    <span className="text-red-400">L:{myRoster.settings?.losses || 0}</span>
                  </div>
                )}
                
                <div className="bg-black/50 px-3 py-1 border-2 border-blue-400 rounded">
                  <span className="text-blue-400">WEEK {currentWeek || 1}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Right Side Info */}
          <div className="flex items-center gap-4">
            {/* League Name */}
            {currentLeague && (
              <div className="text-cyan-400 text-sm animate-pulse">
                {currentLeague.name}
              </div>
            )}
            
            {/* Sound Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                playSound('coin');
              }}
              className="p-2 bg-black/50 border-2 border-yellow-400 rounded hover:bg-yellow-400/20 transition-none"
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-yellow-400" />
              ) : (
                <VolumeX className="h-4 w-4 text-gray-400" />
              )}
            </button>
            
            {/* Power Meter */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">POWER:</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-3 h-3 border border-yellow-400",
                      myRoster && (myRoster.settings?.wins || 0) >= i * 2
                        ? "bg-yellow-400 animate-pulse"
                        : "bg-gray-700"
                    )}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Menu */}
        <div className="flex items-center gap-0 py-1 px-4 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            const isHovered = hoveredItem === item.label;
            
            return (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.path, item.label)}
                onMouseEnter={() => {
                  setHoveredItem(item.label);
                  playSound('move');
                }}
                onMouseLeave={() => setHoveredItem(null)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 transition-none relative",
                  "border-r-2 border-blue-800",
                  "hover:bg-yellow-400/20",
                  isActive && "bg-yellow-400/30 border-b-4 border-yellow-400"
                )}
              >
                <Icon 
                  className={cn(
                    "h-5 w-5",
                    item.color,
                    isHovered && item.animation
                  )} 
                />
                <span 
                  className={cn(
                    "text-xs font-bold tracking-wider",
                    isActive ? "text-yellow-400" : "text-white",
                    isHovered && "text-yellow-400"
                  )}
                  style={{ fontFamily: "'VT323', monospace" }}
                >
                  {item.label}
                </span>
                
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-yellow-400 animate-bounce" />
                  </div>
                )}
                
                {/* Hover Effect */}
                {isHovered && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent animate-shimmer" />
                )}
              </button>
            );
          })}
          
          {/* Special Tecmo Mode Button */}
          <button
            onClick={() => {
              playSound('touchdown');
              router.push('/dashboard/tecmo');
            }}
            className={cn(
              "ml-auto flex items-center gap-2 px-4 py-2",
              "bg-gradient-to-r from-purple-600 to-pink-600",
              "border-2 border-yellow-400 rounded",
              "hover:from-purple-500 hover:to-pink-500",
              "animate-pulse shadow-[0_0_20px_rgba(255,215,0,0.5)]"
            )}
            onMouseEnter={() => playSound('powerup')}
          >
            <Sparkles className="h-5 w-5 text-yellow-400 animate-spin" />
            <span 
              className="text-xs font-bold text-yellow-400"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              TECMO MODE
            </span>
          </button>
        </div>
        
        {/* Score Ticker */}
        <div className="bg-black/50 border-t-2 border-blue-800 overflow-hidden">
          <div className="flex animate-scroll-left" style={{ animationDuration: '20s' }}>
            <div className="flex gap-8 px-4 py-1 whitespace-nowrap">
              <span className="text-yellow-400 text-xs">
                <Star className="inline h-3 w-3" /> TOP SCORER: J.JEFFERSON - 32.5 PTS
              </span>
              <span className="text-green-400 text-xs">
                <TrendingUp className="inline h-3 w-3" /> HOT PLAYER: D.HENRY +15.2 AVG
              </span>
              <span className="text-red-400 text-xs">
                <Flame className="inline h-3 w-3" /> BEST TRADE: KUPP FOR CHASE
              </span>
              <span className="text-cyan-400 text-xs">
                <Trophy className="inline h-3 w-3" /> LEAGUE LEADER: TEAM ALPHA 10-0
              </span>
              <span className="text-purple-400 text-xs">
                <Crown className="inline h-3 w-3" /> CHAMPION: 2023 - BEAST MODE
              </span>
            </div>
            {/* Duplicate for seamless loop */}
            <div className="flex gap-8 px-4 py-1 whitespace-nowrap">
              <span className="text-yellow-400 text-xs">
                <Star className="inline h-3 w-3" /> TOP SCORER: J.JEFFERSON - 32.5 PTS
              </span>
              <span className="text-green-400 text-xs">
                <TrendingUp className="inline h-3 w-3" /> HOT PLAYER: D.HENRY +15.2 AVG
              </span>
              <span className="text-red-400 text-xs">
                <Flame className="inline h-3 w-3" /> BEST TRADE: KUPP FOR CHASE
              </span>
              <span className="text-cyan-400 text-xs">
                <Trophy className="inline h-3 w-3" /> LEAGUE LEADER: TEAM ALPHA 10-0
              </span>
              <span className="text-purple-400 text-xs">
                <Crown className="inline h-3 w-3" /> CHAMPION: 2023 - BEAST MODE
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        
        .animate-scroll-left {
          animation: scroll-left linear infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 0.5s ease-out;
        }
      `}</style>
    </nav>
  );
}