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
      console.log('=== LOGIN ATTEMPT START ===');
      console.log('Username:', username);
      console.log('Store state before login:', useSleeperStore.getState().user);
      console.log('Environment:', {
        isDev: process.env.NODE_ENV === 'development',
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      
      // Test Sleeper API connectivity first
      console.log('Testing Sleeper API connectivity...');
      const testResponse = await fetch('https://api.sleeper.app/v1/state/nfl');
      console.log('Sleeper API test:', {
        status: testResponse.status,
        ok: testResponse.ok
      });
      
      if (!testResponse.ok) {
        throw new Error(`Sleeper API is not accessible (${testResponse.status})`);
      }
      
      console.log('Calling login function...');
      await login(username);
      
      // Add a small delay to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if login actually worked
      const storeAfterLogin = useSleeperStore.getState();
      console.log('Store state after login:', {
        user: storeAfterLogin.user,
        leagues: storeAfterLogin.leagues?.length || 0,
        isLoading: storeAfterLogin.isLoading,
        error: storeAfterLogin.error,
        hasHydrated: storeAfterLogin._hasHydrated
      });
      
      if (storeAfterLogin.user) {
        console.log('Login successful, redirecting to dashboard...');
        router.push('/dashboard/sleeper');
      } else if (storeAfterLogin.error) {
        console.error('Login failed with store error:', storeAfterLogin.error);
        setError(storeAfterLogin.error);
      } else {
        console.error('Login appeared to succeed but no user in store');
        setError('Login failed - no user data received. Please try again.');
      }
      console.log('=== LOGIN ATTEMPT END ===');
    } catch (err: any) {
      console.error('=== LOGIN ERROR ===');
      console.error('Error details:', {
        message: err.message,
        name: err.name,
        stack: err.stack,
        cause: err.cause
      });
      
      let errorMessage = 'Failed to connect to Sleeper.';
      
      if (err.message.includes('not found') || err.message.includes('404')) {
        errorMessage = `Username "${username}" not found. Please check your Sleeper username.`;
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.message.includes('API')) {
        errorMessage = 'Sleeper API is temporarily unavailable. Please try again later.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('=== LOGIN ERROR END ===');
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