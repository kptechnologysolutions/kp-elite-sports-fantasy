'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSleeperStore from '@/lib/store/useSleeperStore';

export function useRequireAuth() {
  const router = useRouter();
  const { user, _hasHydrated } = useSleeperStore();

  useEffect(() => {
    // Only check auth after the store has hydrated from localStorage
    if (_hasHydrated) {
      if (!user) {
        console.log('useRequireAuth: No user found after hydration, redirecting to login');
        router.replace('/login');
      } else {
        console.log('useRequireAuth: User found after hydration:', user.display_name);
      }
    } else {
      console.log('useRequireAuth: Waiting for store hydration...');
    }
  }, [user, router, _hasHydrated]);

  return { user, isAuthenticated: !!user };
}