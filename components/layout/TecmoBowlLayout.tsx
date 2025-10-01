'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Trophy, Users, TrendingUp, Shield, Zap, 
  Activity, Calendar, Star, Home, Settings,
  ChevronRight, Volume2, VolumeX
} from 'lucide-react';
import useSleeperStore from '@/lib/store/useSleeperStore';
import { applyTecmoTheme } from '@/lib/theme/tecmoBowl';

interface TecmoBowlLayoutProps {
  children: ReactNode;
}

export function TecmoBowlLayout({ children }: TecmoBowlLayoutProps) {
  const router = useRouter();
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [selectedOption, setSelectedOption] = useState(0);
  const { user, currentLeague, myRoster, currentWeek } = useSleeperStore();
  
  // Don't render layout until we have user data
  if (!user) {
    return <>{children}</>;
  }
  
  useEffect(() => {
    applyTecmoTheme();
  }, []);
  
  const playSound = (sound: 'select' | 'move' | 'touchdown') => {
    if (!soundEnabled) return;
    // Sound implementation would go here
  };
  
  const menuOptions = [
    { label: 'GAME START', icon: Home, path: '/dashboard/sleeper' },
    { label: 'ROSTER', icon: Users, path: '/roster/sleeper' },
    { label: 'MATCHUP', icon: Shield, path: '/dashboard/sleeper' },
    { label: 'STATS', icon: TrendingUp, path: '/stats/sleeper' },
    { label: 'TRADES', icon: Zap, path: '/trades/sleeper' },
    { label: 'WAIVERS', icon: Activity, path: '/waivers/sleeper' },
    { label: 'STANDINGS', icon: Trophy, path: '/dashboard/sleeper' },
    { label: 'OPTIONS', icon: Settings, path: '/settings' },
  ];
  
  const handleMenuSelect = (index: number) => {
    setSelectedOption(index);
    playSound('select');
    router.push(menuOptions[index].path);
  };
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        setSelectedOption(prev => (prev - 1 + menuOptions.length) % menuOptions.length);
        playSound('move');
      } else if (e.key === 'ArrowDown') {
        setSelectedOption(prev => (prev + 1) % menuOptions.length);
        playSound('move');
      } else if (e.key === 'Enter' || e.key === ' ') {
        handleMenuSelect(selectedOption);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedOption]);
  
  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Scanlines effect */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-10">
        <div className="h-full w-full bg-gradient-to-b from-transparent via-white to-transparent bg-[length:100%_4px] animate-pulse" />
      </div>
      
      {/* Top Score Bar */}
      <div className="bg-blue-900 border-b-4 border-white p-2">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Team Info */}
            <div className="flex items-center gap-2">
              <div className="text-yellow-400 text-xs">1P</div>
              <div className="bg-black px-3 py-1 border-2 border-white">
                <span className="text-yellow-400">{user?.display_name || 'PLAYER 1'}</span>
              </div>
            </div>
            
            {/* Score Display */}
            <div className="flex items-center gap-4">
              <div className="bg-black px-3 py-1 border-2 border-white">
                <span className="text-green-400">W:</span>
                <span className="text-white">{myRoster?.settings?.wins || 0}</span>
              </div>
              <div className="bg-black px-3 py-1 border-2 border-white">
                <span className="text-red-400">L:</span>
                <span className="text-white">{myRoster?.settings?.losses || 0}</span>
              </div>
            </div>
          </div>
          
          {/* Week and League */}
          <div className="flex items-center gap-4">
            <div className="bg-black px-3 py-1 border-2 border-white">
              <span className="text-yellow-400">WEEK {currentWeek}</span>
            </div>
            <div className="text-xs">
              {currentLeague?.name || 'NO LEAGUE'}
            </div>
            
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1 hover:bg-white/20 rounded"
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Layout */}
      <div className="flex">
        {/* Side Menu */}
        <div className="w-64 bg-blue-900 border-r-4 border-white min-h-[calc(100vh-60px)]">
          <div className="p-4">
            {/* Title */}
            <div className="text-center mb-6">
              <div className="text-yellow-400 text-xl font-bold mb-2">
                TECMO
              </div>
              <div className="text-white text-lg">
                FANTASY BOWL
              </div>
              <div className="text-xs text-gray-400 mt-1">
                2024 SEASON
              </div>
            </div>
            
            {/* Menu Options */}
            <div className="space-y-1">
              {menuOptions.map((option, index) => {
                const Icon = option.icon;
                const isSelected = index === selectedOption;
                
                return (
                  <button
                    key={option.label}
                    onClick={() => handleMenuSelect(index)}
                    className={cn(
                      "w-full text-left px-3 py-2 flex items-center gap-3 transition-none",
                      isSelected && "bg-white text-blue-900",
                      !isSelected && "text-white hover:bg-blue-800"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm tracking-wider">{option.label}</span>
                    {isSelected && (
                      <ChevronRight className="h-4 w-4 ml-auto animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Controls Help */}
            <div className="mt-8 p-3 bg-black/30 text-xs space-y-1">
              <div className="text-gray-400">CONTROLS:</div>
              <div>↑↓ - Navigate</div>
              <div>ENTER - Select</div>
              <div>ESC - Back</div>
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 bg-gradient-to-b from-blue-900 to-black">
          {/* Field Pattern Background */}
          <div 
            className="min-h-[calc(100vh-60px)] relative"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 40px,
                  rgba(255,255,255,0.1) 40px,
                  rgba(255,255,255,0.1) 42px
                ),
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 40px,
                  rgba(255,255,255,0.05) 40px,
                  rgba(255,255,255,0.05) 42px
                )
              `,
            }}
          >
            {/* Content with retro styling */}
            <div className="relative z-10 p-6">
              {children}
            </div>
            
            {/* Field Yard Lines */}
            <div className="absolute inset-0 pointer-events-none">
              {[10, 20, 30, 40, 50, 40, 30, 20, 10].map((yard, i) => (
                <div
                  key={i}
                  className="absolute text-white/20 text-6xl font-bold"
                  style={{
                    left: '50%',
                    top: `${(i + 1) * 10}%`,
                    transform: 'translate(-50%, -50%) rotate(90deg)',
                  }}
                >
                  {yard}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t-2 border-white p-1 z-40">
        <div className="container mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="text-yellow-400">STATUS:</span>
            <span className="text-green-400 animate-pulse">ONLINE</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">FPS: 60</span>
            <span className="text-gray-400">PING: 12ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Retro Button Component
export function TecmoButton({ 
  children, 
  onClick, 
  variant = 'default',
  className = '' 
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'danger';
  className?: string;
}) {
  const variants = {
    default: 'bg-gray-600 hover:bg-gray-500',
    primary: 'bg-blue-600 hover:bg-blue-500',
    danger: 'bg-red-600 hover:bg-red-500',
  };
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 text-white font-bold uppercase tracking-wider",
        "border-2 border-white",
        "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
        "active:shadow-none active:translate-x-1 active:translate-y-1",
        "transition-none",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

// Pixel Card Component
export function TecmoCard({ 
  title, 
  children,
  className = ''
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      "bg-blue-900 border-4 border-white p-4",
      "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
      className
    )}>
      {title && (
        <div className="text-yellow-400 font-bold text-sm mb-3 uppercase tracking-wider">
          {title}
        </div>
      )}
      <div className="text-white">
        {children}
      </div>
    </div>
  );
}