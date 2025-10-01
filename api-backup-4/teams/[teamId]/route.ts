import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  
  // Mock team data
  const mockTeam = {
    id: teamId,
    userId: 'user1',
    name: 'Dynasty Destroyers',
    platform: 'ESPN',
    platformTeamId: 'espn123',
    leagueName: '12 Team PPR League',
    players: [
      {
        id: '1',
        name: 'Patrick Mahomes',
        position: 'QB',
        team: 'KC',
        jerseyNumber: 15,
        status: { isActive: true, gameStatus: 'playing', lastUpdated: new Date() },
        stats: { 
          season: 2024, 
          week: 10, 
          fantasyPoints: 28.5, 
          projectedPoints: 26.0,
          passingYards: 321,
          passingTDs: 3
        },
      },
      {
        id: '2',
        name: 'Christian McCaffrey',
        position: 'RB',
        team: 'SF',
        jerseyNumber: 23,
        status: { isActive: true, gameStatus: 'questionable', lastUpdated: new Date() },
        stats: { 
          season: 2024, 
          week: 10, 
          fantasyPoints: 22.3, 
          projectedPoints: 24.0,
          rushingYards: 95,
          rushingTDs: 1,
          receptions: 6,
          receivingYards: 42
        },
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  return NextResponse.json(mockTeam);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const body = await request.json();
  
  // Return updated team (mock)
  return NextResponse.json({
    id: teamId,
    ...body,
    updatedAt: new Date(),
  });
}