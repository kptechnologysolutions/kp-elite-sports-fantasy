'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TeamImport } from '@/components/teams/TeamImport';

function TeamImportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const platform = searchParams.get('platform');

  return <TeamImport defaultPlatform={platform || undefined} />;
}

export default function TeamImportPage() {
  return (
    <main className="container mx-auto p-6">
      <Suspense fallback={<div>Loading...</div>}>
        <TeamImportContent />
      </Suspense>
    </main>
  );
}