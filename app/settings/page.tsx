'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModernNav } from '@/components/layout/ModernNav';
import { ThemeCustomizer } from '@/components/theme/ThemeCustomizer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Palette, 
  Bell, 
  Shield, 
  Database,
  AlertCircle,
  Info,
  User,
  LogOut
} from 'lucide-react';
import useSleeperStore from '@/lib/store/useSleeperStore';

export default function SettingsPage() {
  const router = useRouter();
  const {
    user,
    currentLeague,
    logout,
    error
  } = useSleeperStore();
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);
  
  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  
  if (!user) return null;
  
  return (
    <div className="min-h-screen bg-background">
      <ModernNav />
      
      {error && (
        <div className="container mx-auto px-4 pt-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
      
      <main className="container mx-auto p-4 space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground">
            Customize your Fantasy Football AI experience
          </p>
        </div>
        
        <Tabs defaultValue="theme" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="theme" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Account
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="theme" className="space-y-6">
            <ThemeCustomizer />
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Configure when and how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Notification settings are coming soon! You'll be able to customize alerts for 
                      player updates, trade opportunities, and waiver wire recommendations.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Player News</h4>
                        <p className="text-sm text-muted-foreground">
                          Get notified about injuries, trades, and lineup changes
                        </p>
                      </div>
                      <Badge variant="secondary">Coming Soon</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Trade Alerts</h4>
                        <p className="text-sm text-muted-foreground">
                          Notifications for trade opportunities and completed trades
                        </p>
                      </div>
                      <Badge variant="secondary">Coming Soon</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Waiver Wire</h4>
                        <p className="text-sm text-muted-foreground">
                          Alerts for recommended waiver wire pickups
                        </p>
                      </div>
                      <Badge variant="secondary">Coming Soon</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Lineup Reminders</h4>
                        <p className="text-sm text-muted-foreground">
                          Reminders to set your lineup before deadlines
                        </p>
                      </div>
                      <Badge variant="secondary">Coming Soon</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Management
                </CardTitle>
                <CardDescription>
                  Manage your stored data and cache settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Storage Usage</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Current local storage usage for your fantasy data
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">League Data</span>
                        <Badge variant="outline">~2.3 MB</Badge>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Clear Cache</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Clear stored player data and refresh from Sleeper API
                      </p>
                      <Button variant="outline">
                        Clear Player Cache
                      </Button>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Export Data</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Download your fantasy data for backup or analysis
                      </p>
                      <Button variant="outline">
                        Export League Data
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Your Sleeper account details and connection status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Username</h4>
                        <p className="text-sm text-muted-foreground">{user.username}</p>
                      </div>
                      <Badge variant="default">Connected</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Display Name</h4>
                        <p className="text-sm text-muted-foreground">{user.display_name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">User ID</h4>
                        <p className="text-sm text-muted-foreground font-mono">{user.user_id}</p>
                      </div>
                    </div>
                    
                    {currentLeague && (
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Current League</h4>
                          <p className="text-sm text-muted-foreground">{currentLeague.name}</p>
                        </div>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button 
                      variant="destructive" 
                      onClick={handleLogout}
                      className="w-full"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}