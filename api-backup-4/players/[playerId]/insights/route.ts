import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;
  
  // Mock AI insights
  const mockInsights = [
    {
      id: '1',
      playerId,
      type: 'performance',
      title: 'Trending Upward',
      content: 'Based on recent performance metrics and opponent analysis, this player has a 78% chance of exceeding projected points this week. Key factors include weak opposing defense and favorable weather conditions.',
      confidence: 0.78,
      generatedAt: new Date(),
      recommendations: [
        'Start with confidence',
        'Consider as captain in DFS',
        'Monitor practice reports Friday',
      ],
    },
    {
      id: '2',
      playerId,
      type: 'matchup',
      title: 'Favorable Matchup Detected',
      content: 'Opponent allows 28.5 fantasy points per game to this position, ranking 27th in the league. Historical data shows similar players average 22.3 points in this matchup.',
      confidence: 0.85,
      generatedAt: new Date(),
      recommendations: [
        'Strong start candidate',
        'Target share likely to increase',
        'Red zone opportunities expected',
      ],
    },
    {
      id: '3',
      playerId,
      type: 'trend',
      title: 'Usage Pattern Analysis',
      content: 'Target share has increased 15% over the last 3 games. Snap count trending upward with 85% participation last week. Coaching staff showing increased trust.',
      confidence: 0.72,
      generatedAt: new Date(),
      recommendations: [
        'Monitor continued usage',
        'Buy-low trade candidate',
        'Season-long value increasing',
      ],
    },
  ];
  
  return NextResponse.json(mockInsights);
}