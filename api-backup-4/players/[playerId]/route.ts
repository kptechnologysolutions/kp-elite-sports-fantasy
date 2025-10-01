import { NextRequest, NextResponse } from 'next/server';

const playerDatabase: Record<string, any> = {
  '1': {
    id: '1',
    name: 'Patrick Mahomes',
    position: 'QB',
    team: 'KC',
    jerseyNumber: 15,
    avatar: '/avatars/mahomes.jpg',
    status: { isActive: true, gameStatus: 'playing', lastUpdated: new Date() },
    stats: { 
      season: 2024, 
      week: 10, 
      fantasyPoints: 28.5, 
      projectedPoints: 26.0,
      passingYards: 321,
      passingTDs: 3,
      interceptions: 1,
      completions: 28,
      attempts: 39,
      rushingYards: 12
    },
  },
  '2': {
    id: '2',
    name: 'Christian McCaffrey',
    position: 'RB',
    team: 'SF',
    jerseyNumber: 23,
    status: { isActive: true, gameStatus: 'questionable', lastUpdated: new Date() },
    injuryStatus: {
      type: 'Ankle Sprain',
      description: 'Limited in practice Wednesday and Thursday',
      severity: 'minor',
      estimatedReturn: 'Expected to play',
      practiceStatus: 'limited'
    },
    stats: { 
      season: 2024, 
      week: 10, 
      fantasyPoints: 22.3, 
      projectedPoints: 24.0,
      rushingYards: 95,
      rushingTDs: 1,
      rushingAttempts: 18,
      receptions: 6,
      receivingYards: 42,
      targets: 8,
      receivingTDs: 0
    },
  },
  '3': {
    id: '3',
    name: 'Tyreek Hill',
    position: 'WR',
    team: 'MIA',
    jerseyNumber: 10,
    status: { isActive: true, gameStatus: 'playing', lastUpdated: new Date() },
    stats: { 
      season: 2024, 
      week: 10, 
      fantasyPoints: 18.7, 
      projectedPoints: 17.5,
      receptions: 8,
      receivingYards: 112,
      receivingTDs: 1,
      targets: 11,
      yardsAfterCatch: 45
    },
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;
  
  const player = playerDatabase[playerId] || {
    id: playerId,
    name: 'Unknown Player',
    position: 'N/A',
    team: 'N/A',
    status: { isActive: false, gameStatus: 'unknown', lastUpdated: new Date() },
    stats: null,
  };
  
  return NextResponse.json(player);
}