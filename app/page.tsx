'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSleeperStore from '@/lib/store/useSleeperStore';

export default function Home() {
  const router = useRouter();
  const { user } = useSleeperStore();

  useEffect(() => {
    // Redirect based on login status
    if (user) {
      router.replace('/dashboard/sleeper');
    } else {
      router.replace('/login');
    }
  }, [router, user]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl">H</span>
        </div>
      </div>
    </div>
  );
}