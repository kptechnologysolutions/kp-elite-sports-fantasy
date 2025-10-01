import { NextRequest, NextResponse } from 'next/server';

// Mock teams data
const mockTeams = [
  {
    id: '1',
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
        status: { isActive: true, gameStatus: 'playing', lastUpdated: new Date() },
        stats: { season: 2024, week: 10, fantasyPoints: 28.5, projectedPoints: 26.0 },
      },
      {
        id: '2',
        name: 'Christian McCaffrey',
        position: 'RB',
        team: 'SF',
        status: { isActive: true, gameStatus: 'questionable', lastUpdated: new Date() },
        stats: { season: 2024, week: 10, fantasyPoints: 22.3, projectedPoints: 24.0 },
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export async function GET(request: NextRequest) {
  // Return mock teams
  return NextResponse.json(mockTeams);
}

export async function POST(request: NextRequest) {
  // Handle team creation
  const body = await request.json();
  
  const newTeam = {
    id: Date.now().toString(),
    userId: 'user1',
    name: body.name || 'New Team',
    platform: body.platform,
    platformTeamId: body.platformTeamId,
    leagueName: body.leagueName,
    players: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  return NextResponse.json(newTeam, { status: 201 });
}