'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Home, Users, Trophy, TrendingUp, Settings, LogOut,
  Menu, X, Bell, LayoutDashboard, BarChart3, Brain, Activity, Gamepad2, Crown, Palette
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useSleeperStore from '@/lib/store/useSleeperStore';
import { themeManager, availableThemes } from '@/lib/theme/themeSystem';

const navItems = [
  { 
    name: 'Dashboard', 
    href: '/dashboard/sleeper', 
    icon: Home,
    description: 'Your main fantasy dashboard'
  },
  { 
    name: 'Game Day', 
    href: '/gameday', 
    icon: Gamepad2,
    description: 'Live game updates & alerts'
  },
  { 
    name: 'Coach', 
    href: '/coach', 
    icon: Brain,
    description: 'AI lineup optimization'
  },
  { 
    name: 'Portfolio', 
    href: '/portfolio', 
    icon: BarChart3,
    description: 'Cross-league exposure analysis'
  },
  { 
    name: 'Dynasty', 
    href: '/dynasty', 
    icon: Crown,
    description: 'Long-term team building & keepers'
  },
  { 
    name: 'Roster', 
    href: '/roster/sleeper', 
    icon: LayoutDashboard,
    description: 'Manage lineup & players'
  },
  { 
    name: 'Trades', 
    href: '/trades/sleeper', 
    icon: TrendingUp,
    description: 'Trade analyzer & suggestions'
  },
  { 
    name: 'Waivers', 
    href: '/waivers/sleeper', 
    icon: Activity,
    description: 'Waiver wire assistant'
  },
  { 
    name: 'Stats', 
    href: '/stats/sleeper', 
    icon: Trophy,
    description: 'Player statistics & trends'
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: Settings,
    description: 'App preferences & customization'
  },
];

export function ModernNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(themeManager.getCurrentTheme());
  const { user, currentLeague, logout } = useSleeperStore();
  
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Load theme on mount
  useEffect(() => {
    themeManager.loadThemePreference();
    setCurrentTheme(themeManager.getCurrentTheme());
  }, []);

  const handleThemeChange = (themeId: string) => {
    themeManager.setTheme(themeId);
    setCurrentTheme(themeManager.getCurrentTheme());
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center gap-6">
          {/* Logo */}
          <Link href="/dashboard/sleeper" className="flex items-center space-x-3 flex-shrink-0 min-w-0">
            <div className="relative">
              <div className="w-14 h-14 logo-gradient rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl tracking-wider">KP</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div className="hidden lg:block min-w-0">
              <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
                KP Elite Sports
              </span>
              <div className="text-xs text-muted-foreground -mt-1 whitespace-nowrap">Fantasy Analytics</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 flex-1 justify-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-all duration-200",
                    "hover:bg-muted/80",
                    isActive 
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn(
                    "w-3 h-3 transition-transform",
                    isActive && "scale-110"
                  )} />
                  <span className="hidden xl:inline">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* League Badge */}
            {currentLeague && (
              <Badge variant="outline" className="hidden sm:flex bg-background/50">
                {currentLeague.name}
              </Badge>
            )}

            {/* Theme Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-muted/80">
                  <Palette className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 z-50 mt-2 bg-gradient-to-br from-background via-background/95 to-background/90 backdrop-blur-xl border border-border/50 shadow-2xl">
                <DropdownMenuLabel className="px-4 py-3 bg-gradient-to-r from-primary/10 to-purple-500/10 border-b border-border/30">
                  <span className="font-semibold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Themes</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableThemes.map((theme) => (
                  <DropdownMenuItem 
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id)}
                    className="m-1 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-purple-500/10 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div 
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <span className="font-medium">{theme.name}</span>
                      {currentTheme.id === theme.id && (
                        <div className="ml-auto">✓</div>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative hover:bg-muted/80">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {user.display_name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 z-50 mt-2 bg-gradient-to-br from-background via-background/95 to-background/90 backdrop-blur-xl border border-border/50 shadow-2xl">
                  <DropdownMenuLabel className="px-4 py-3 bg-gradient-to-r from-primary/10 to-purple-500/10 border-b border-border/30">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">{user.display_name}</p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/settings')} className="m-1 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-purple-500/10 transition-all duration-200">
                    <Settings className="mr-2 h-4 w-4 text-primary" />
                    <span className="font-medium">Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem onClick={handleLogout} className="m-1 rounded-lg text-red-600 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-red-600/10 transition-all duration-200">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span className="font-medium">Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-background/95 backdrop-blur-md">
          <nav className="container mx-auto px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                    isActive 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "hover:bg-muted/80"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </Link>
              );
            })}
            
            {user && (
              <>
                <div className="border-t pt-4 mt-4">
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </Button>
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}