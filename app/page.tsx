'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSleeperStore from '@/lib/store/useSleeperStore';

export default function Home() {
  const router = useRouter();
  const { user, _hasHydrated } = useSleeperStore();
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only redirect after hydration is complete and we're on the client
    if (isClient && _hasHydrated) {
      if (user) {
        console.log('Home: User found, redirecting to dashboard');
        router.replace('/dashboard/sleeper');
      } else {
        console.log('Home: No user, redirecting to login');
        router.replace('/login');
      }
    }
  }, [router, user, _hasHydrated, isClient]);

  // Show loading state during hydration
  if (!isClient || !_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">KP</span>
          </div>
          <p className="mt-4 text-center text-muted-foreground">Loading KP Elite Sports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-2xl">KP</span>
        </div>
        <p className="mt-4 text-center text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}