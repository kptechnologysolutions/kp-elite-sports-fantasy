'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Home, Users, Trophy, TrendingUp, BarChart3, 
  Settings, LogOut, Menu, X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import useSleeperStore from '@/lib/store/useSleeperStore';
import { useRouter } from 'next/navigation';

const navItems = [
  { name: 'Dashboard', href: '/dashboard/sleeper', icon: Home },
  { name: 'Teams', href: '/teams', icon: Users },
  { name: 'Roster', href: '/roster/sleeper', icon: Users },
  { name: 'Stats Center', href: '/stats/sleeper', icon: BarChart3 },
  { name: 'Waivers', href: '/waivers/sleeper', icon: TrendingUp },
  { name: 'Trades', href: '/trades/sleeper', icon: TrendingUp },
];

export function SleeperNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, currentLeague, logout } = useSleeperStore();
  
  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  
  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard/sleeper" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">FF</span>
              </div>
              <span className="font-semibold">Fantasy Football AI</span>
            </Link>
            
            <div className="flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    pathname === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {currentLeague && (
              <div className="text-sm">
                <span className="text-muted-foreground">League:</span>{' '}
                <span className="font-medium">{currentLeague.name}</span>
              </div>
            )}
            {user && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {user.display_name || user.username}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>
      
      {/* Mobile Navigation */}
      <nav className="md:hidden border-b bg-background">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/dashboard/sleeper" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FF</span>
            </div>
          </Link>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        
        {mobileMenuOpen && (
          <div className="px-4 pb-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
            
            <div className="pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}