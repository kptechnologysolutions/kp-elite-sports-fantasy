import { Suspense } from 'react';
import { MatchupDetail } from '@/components/matchup/MatchupDetail';

// Generate static params for demo teams
export async function generateStaticParams() {
  return [
    { teamId: 'demo' },
    { teamId: 'team1' },
    { teamId: 'team2' }
  ];
}

export default function MatchupPage({ params }: { params: { teamId: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Loading...</div>}>
        <MatchupDetail teamId={params.teamId} />
      </Suspense>
    </div>
  );
}