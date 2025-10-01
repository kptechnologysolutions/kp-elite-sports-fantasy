import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const player = searchParams.get('player');
  
  if (!player) {
    return NextResponse.json({ error: 'Player name required' }, { status: 400 });
  }

  try {
    // Search ESPN for player news
    const searchQuery = encodeURIComponent(`${player} fantasy football`);
    const espnUrl = `https://www.espn.com/search/_/q/${searchQuery}/type/article`;
    
    // For now, return structured data that would come from ESPN
    // In production, you'd scrape or use ESPN API
    const articles = [
      {
        id: Date.now().toString(),
        headline: `${player} - Week ${getCurrentWeek()} Outlook`,
        description: `Latest fantasy analysis and projections for ${player}`,
        published: new Date().toISOString(),
        links: {
          web: {
            href: espnUrl
          }
        }
      }
    ];

    // Check for specific player news patterns
    if (player.toLowerCase().includes('mccaffrey')) {
      articles.unshift({
        id: 'cmc_' + Date.now(),
        headline: 'Christian McCaffrey Returns to Practice',
        description: 'CMC was seen at practice Wednesday, indicating potential return from IR',
        published: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        links: { web: { href: '#' } }
      });
    }

    if (player.toLowerCase().includes('jefferson')) {
      articles.unshift({
        id: 'jj_' + Date.now(),
        headline: 'Justin Jefferson Leads WR Rankings',
        description: 'Jefferson continues to dominate targets and fantasy scoring',
        published: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        links: { web: { href: '#' } }
      });
    }

    if (player.toLowerCase().includes('hill')) {
      articles.unshift({
        id: 'hill_' + Date.now(),
        headline: 'Tyreek Hill Questionable for Sunday',
        description: 'Hill dealing with ankle injury, game-time decision expected',
        published: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        links: { web: { href: '#' } }
      });
    }

    return NextResponse.json({ articles });
  } catch (error) {
    console.error('ESPN API error:', error);
    return NextResponse.json({ articles: [] });
  }
}

function getCurrentWeek(): number {
  const seasonStart = new Date('2024-09-05');
  const now = new Date();
  const weeksPassed = Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return Math.min(Math.max(weeksPassed + 1, 1), 18);
}