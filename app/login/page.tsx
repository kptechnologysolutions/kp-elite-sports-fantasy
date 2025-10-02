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

// Debugging utilities
const detectIncognito = async (): Promise<boolean> => {
  try {
    const fs = await navigator.storage?.estimate();
    return fs?.quota && fs.quota < 120000000; // Less than ~120MB suggests incognito
  } catch {
    return false;
  }
};

const getStorageQuota = async (): Promise<string> => {
  try {
    const estimate = await navigator.storage?.estimate();
    if (estimate?.quota) {
      return `${Math.round(estimate.quota / 1024 / 1024)}MB`;
    }
  } catch {}
  return 'unknown';
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, logout } = useSleeperStore();
  
  const clearAllData = () => {
    try {
      // Clear Zustand store
      logout();
      
      // Clear all localStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear any service worker caches if they exist
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => registration.unregister());
        });
      }
      
      // Clear browser cache (this will prompt user)
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      
      setError('');
      alert('All data cleared! You can now try logging in again.');
      
      // Reload the page to ensure clean state
      window.location.reload();
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Please manually clear your browser cache and try again.');
    }
  };
  
  // Clean up old storage and corrupted data on mount
  useEffect(() => {
    console.log('=== LOGIN PAGE MOUNT ===');
    
    try {
      clearOldStorage();
      
      // Clear any potentially corrupted Zustand store data
      const storeData = localStorage.getItem('sleeper-store');
      console.log('Existing store data:', storeData ? 'exists' : 'none');
      
      if (storeData) {
        try {
          const parsed = JSON.parse(storeData);
          console.log('Store data structure:', Object.keys(parsed));
        } catch (e) {
          console.log('Corrupted store data detected, clearing...');
          localStorage.removeItem('sleeper-store');
        }
      }
      
      // Monitor store hydration
      const checkHydration = () => {
        const state = useSleeperStore.getState();
        console.log('Store hydration status:', {
          hasHydrated: state._hasHydrated,
          hasUser: !!state.user,
          userName: state.user?.display_name
        });
        
        // Clear any old authentication state that might be stuck
        if (state.user && !state._hasHydrated) {
          console.log('Clearing potentially stuck user state...');
          state.logout();
        }
      };
      
      // Check immediately and after a delay
      checkHydration();
      setTimeout(checkHydration, 1000);
      
    } catch (error) {
      console.error('Error during storage cleanup:', error);
      // Force clear everything if there's an error
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error('Failed to clear storage:', e);
      }
    }
    
    console.log('=== LOGIN PAGE MOUNT COMPLETE ===');
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
      
      // Comprehensive environment debugging
      const envDebug = {
        isDev: process.env.NODE_ENV === 'development',
        userAgent: navigator.userAgent,
        url: window.location.href,
        isIncognito: await detectIncognito(),
        cookiesEnabled: navigator.cookieEnabled,
        storageQuota: await getStorageQuota(),
        localStorage: typeof localStorage !== 'undefined' ? Object.keys(localStorage) : 'unavailable',
        sessionStorage: typeof sessionStorage !== 'undefined' ? Object.keys(sessionStorage) : 'unavailable',
        indexedDB: typeof indexedDB !== 'undefined' ? 'available' : 'unavailable',
        zustandStore: localStorage.getItem('sleeper-store') ? 'exists' : 'missing'
      };
      
      console.log('Environment:', envDebug);
      
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
      
      // Try login with multiple attempts and detailed state checking
      let loginAttempts = 0;
      const maxAttempts = 3;
      let loginSuccess = false;
      
      while (loginAttempts < maxAttempts && !loginSuccess) {
        loginAttempts++;
        console.log(`Login attempt ${loginAttempts}/${maxAttempts}`);
        
        try {
          await login(username);
          
          // Progressive delays to ensure state updates
          for (let i = 0; i < 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 200));
            const currentState = useSleeperStore.getState();
            console.log(`State check ${i + 1}:`, {
              user: !!currentState.user,
              userName: currentState.user?.display_name,
              leagues: currentState.leagues?.length || 0,
              isLoading: currentState.isLoading,
              error: currentState.error,
              hasHydrated: currentState._hasHydrated
            });
            
            if (currentState.user && !currentState.isLoading) {
              loginSuccess = true;
              console.log('Login verified successful after', (i + 1) * 200, 'ms');
              break;
            }
          }
          
          if (loginSuccess) break;
          
        } catch (attemptError: any) {
          console.error(`Login attempt ${loginAttempts} failed:`, attemptError.message);
          if (loginAttempts === maxAttempts) {
            throw attemptError;
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Final state check
      const finalState = useSleeperStore.getState();
      console.log('Final store state:', {
        user: finalState.user,
        leagues: finalState.leagues?.length || 0,
        isLoading: finalState.isLoading,
        error: finalState.error,
        hasHydrated: finalState._hasHydrated,
        localStorage: localStorage.getItem('sleeper-store') ? 'persisted' : 'not-persisted'
      });
      
      if (finalState.user) {
        console.log('Login successful, redirecting to dashboard...');
        // Force a small delay before redirect to ensure everything is settled
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Use replace instead of push to avoid history issues that might cause URL appending
        router.replace('/dashboard/sleeper');
      } else if (finalState.error) {
        console.error('Login failed with store error:', finalState.error);
        setError(finalState.error);
      } else {
        console.error('Login failed - no user data after all attempts');
        setError(`Login failed after ${loginAttempts} attempts. Please try clearing cache and try again.`);
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
              className="w-full h-12 text-base font-semibold border-2 border-green-600 bg-green-600 hover:bg-green-700 hover:border-green-700 disabled:bg-green-500 disabled:border-green-500 disabled:opacity-75 text-white shadow-lg transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
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
          
          {/* Troubleshooting section */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-3">
              <strong>Login issues?</strong> If login isn't working, try clearing your browser data:
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearAllData}
              className="w-full"
            >
              Clear Browser Cache & Data
            </Button>
          </div>
          
          <div className="mt-4 text-center space-y-2">
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