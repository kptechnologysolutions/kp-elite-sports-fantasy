import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;
  
  // Mock news data
  const mockNews = [
    {
      id: '1',
      playerId,
      title: 'Player exceeds expectations in recent game',
      content: 'The player delivered an outstanding performance, surpassing projected points by 15%.',
      source: 'ESPN',
      sourceUrl: 'https://espn.com',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      sentiment: 'positive',
      relevanceScore: 0.95,
      tags: ['performance', 'game-recap'],
    },
    {
      id: '2',
      playerId,
      title: 'Injury update: Limited in practice',
      content: 'Player was limited in Wednesday practice but is expected to play this weekend.',
      source: 'NFL.com',
      sourceUrl: 'https://nfl.com',
      publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      sentiment: 'neutral',
      relevanceScore: 0.88,
      tags: ['injury', 'practice-report'],
    },
    {
      id: '3',
      playerId,
      title: 'Matchup analysis for Week 11',
      content: 'Facing a tough defense this week, but historical data shows strong performance in similar matchups.',
      source: 'FantasyPros',
      sourceUrl: 'https://fantasypros.com',
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      sentiment: 'neutral',
      relevanceScore: 0.82,
      tags: ['matchup', 'analysis'],
    },
  ];
  
  return NextResponse.json(mockNews);
}