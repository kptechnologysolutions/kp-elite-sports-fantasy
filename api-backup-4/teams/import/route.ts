import { NextRequest, NextResponse } from 'next/server';

// Mock player data for imported teams
const mockPlayers = {
  espn: [
    { id: '1', name: 'Josh Allen', position: 'QB', team: 'BUF' },
    { id: '2', name: 'Saquon Barkley', position: 'RB', team: 'NYG' },
    { id: '3', name: 'Stefon Diggs', position: 'WR', team: 'BUF' },
  ],
  yahoo: [
    { id: '4', name: 'Lamar Jackson', position: 'QB', team: 'BAL' },
    { id: '5', name: 'Austin Ekeler', position: 'RB', team: 'LAC' },
    { id: '6', name: 'CeeDee Lamb', position: 'WR', team: 'DAL' },
  ],
  sleeper: [
    { id: '7', name: 'Jalen Hurts', position: 'QB', team: 'PHI' },
    { id: '8', name: 'Derrick Henry', position: 'RB', team: 'TEN' },
    { id: '9', name: 'Davante Adams', position: 'WR', team: 'LV' },
  ],
  nfl: [
    { id: '10', name: 'Dak Prescott', position: 'QB', team: 'DAL' },
    { id: '11', name: 'Nick Chubb', position: 'RB', team: 'CLE' },
    { id: '12', name: 'A.J. Brown', position: 'WR', team: 'PHI' },
  ],
  cbs: [
    { id: '13', name: 'Justin Herbert', position: 'QB', team: 'LAC' },
    { id: '14', name: 'Jonathan Taylor', position: 'RB', team: 'IND' },
    { id: '15', name: 'Cooper Kupp', position: 'WR', team: 'LAR' },
  ],
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, credentials } = body;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get mock players based on platform
    const players = mockPlayers[platform as keyof typeof mockPlayers] || mockPlayers.espn;
    
    // Create imported team
    const importedTeam = {
      id: Date.now().toString(),
      userId: 'user1',
      name: `Imported ${platform.toUpperCase()} Team`,
      platform: platform.toUpperCase(),
      platformTeamId: credentials?.teamId || `${platform}_${Date.now()}`,
      leagueName: credentials?.leagueName || `${platform.toUpperCase()} League`,
      players: players.map(p => ({
        ...p,
        status: { 
          isActive: true, 
          gameStatus: 'playing', 
          lastUpdated: new Date() 
        },
        stats: { 
          season: 2024, 
          week: 10, 
          fantasyPoints: Math.random() * 30 + 10, 
          projectedPoints: Math.random() * 30 + 10 
        },
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return NextResponse.json(importedTeam, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to import team' },
      { status: 500 }
    );
  }
}