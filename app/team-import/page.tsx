'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OldTeamImportPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the new location
    router.replace('/teams/import');
  }, [router]);

  return null;
}