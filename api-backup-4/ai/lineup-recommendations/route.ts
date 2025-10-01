import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const teamId = searchParams.get('teamId');
  const week = searchParams.get('week');
  
  // Mock lineup recommendations
  const recommendations = {
    teamId,
    week: parseInt(week || '10'),
    recommendations: [
      {
        position: 'QB',
        player: {
          id: '1',
          name: 'Patrick Mahomes',
          position: 'QB',
          team: 'KC',
          status: { isActive: true, gameStatus: 'playing', lastUpdated: new Date() },
          stats: { season: 2024, week: 10, fantasyPoints: 28.5, projectedPoints: 26.0 },
        },
        reasoning: 'Favorable matchup against 25th ranked pass defense. Weather conditions optimal for passing.',
        confidence: 0.92,
      },
      {
        position: 'RB1',
        player: {
          id: '2',
          name: 'Christian McCaffrey',
          position: 'RB',
          team: 'SF',
          status: { isActive: true, gameStatus: 'questionable', lastUpdated: new Date() },
          stats: { season: 2024, week: 10, fantasyPoints: 22.3, projectedPoints: 24.0 },
        },
        reasoning: 'Despite questionable tag, expected to play. High volume guaranteed in SF offense.',
        confidence: 0.78,
      },
      {
        position: 'WR1',
        player: {
          id: '3',
          name: 'Tyreek Hill',
          position: 'WR',
          team: 'MIA',
          status: { isActive: true, gameStatus: 'playing', lastUpdated: new Date() },
          stats: { season: 2024, week: 10, fantasyPoints: 18.7, projectedPoints: 17.5 },
        },
        reasoning: 'Target share remains elite. Dolphins likely to play from behind, increasing pass attempts.',
        confidence: 0.85,
      },
    ],
    benchSuggestions: [
      {
        player: {
          id: '4',
          name: 'Bench Player 1',
          position: 'RB',
          team: 'NYG',
          status: { isActive: true, gameStatus: 'playing', lastUpdated: new Date() },
        },
        reasoning: 'Tough matchup against top-5 run defense. Limited upside this week.',
      },
    ],
    generatedAt: new Date(),
  };
  
  return NextResponse.json(recommendations);
}