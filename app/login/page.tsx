'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Loader2, UserCircle, AlertCircle } from 'lucide-react';
import useSleeperStore from '@/lib/store/useSleeperStore';
import { clearOldStorage } from '@/lib/utils/clearStorage';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useSleeperStore();
  
  // Clean up old storage on mount
  useEffect(() => {
    clearOldStorage();
  }, []);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter your Sleeper username');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Attempting login for:', username);
      console.log('Store state before login:', useSleeperStore.getState().user);
      
      await login(username);
      
      // Check if login actually worked
      const storeAfterLogin = useSleeperStore.getState();
      console.log('Store state after login:', {
        user: storeAfterLogin.user,
        leagues: storeAfterLogin.leagues?.length || 0,
        isLoading: storeAfterLogin.isLoading,
        error: storeAfterLogin.error
      });
      
      if (storeAfterLogin.user) {
        console.log('Login successful, redirecting...');
        router.push('/dashboard/sleeper');
      } else {
        console.error('Login appeared to succeed but no user in store');
        setError('Login failed - no user data received');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to connect to Sleeper. Please check your username.');
    } finally {
      setIsLoading(false);
    }
  };
  
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-gray-900 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-green-500 rounded-xl mx-auto flex items-center justify-center shadow-lg">
            <span className="text-3xl font-bold text-white">FF</span>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold leading-tight">Welcome to Fantasy Football AI</CardTitle>
            <CardDescription className="text-base leading-relaxed px-2">
              Connect with your Sleeper account to get started
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="username" className="text-sm font-medium">Sleeper Username</Label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-12 text-base"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect with Sleeper'
              )}
            </Button>
          </form>
          
          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-muted-foreground">Don't have a Sleeper account?</p>
            <a
              href="https://sleeper.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium inline-block"
            >
              Sign up at Sleeper.app
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}