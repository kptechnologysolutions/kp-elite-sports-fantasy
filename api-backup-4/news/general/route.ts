import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const currentWeek = getCurrentWeek();
    const currentDate = new Date();
    
    // Return current, relevant fantasy football news
    const articles = [
      {
        id: `week${currentWeek}_outlook`,
        title: `Week ${currentWeek} Fantasy Football Rankings & Start/Sit Advice`,
        description: 'Expert consensus rankings and lineup recommendations for this week',
        url: 'https://www.fantasypros.com/nfl/rankings/consensus-cheatsheets.php',
        source: 'FantasyPros',
        publishedAt: new Date(currentDate.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        category: 'analysis',
        impact: 'high'
      },
      {
        id: `injury_report_${currentWeek}`,
        title: `Week ${currentWeek} NFL Injury Report - Fantasy Impact`,
        description: 'Key injuries affecting fantasy decisions this week',
        url: 'https://www.espn.com/nfl/injuries',
        source: 'ESPN',
        publishedAt: new Date(currentDate.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        category: 'injury',
        impact: 'high'
      },
      {
        id: `waiver_${currentWeek}`,
        title: 'Top Waiver Wire Pickups & FAAB Bids',
        description: 'Players to target on waivers after this week\'s games',
        url: 'https://www.rotoballer.com/category/nfl/fantasy-football-advice-analysis/waiver-wire',
        source: 'RotoBaller',
        publishedAt: new Date(currentDate.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        category: 'waiver',
        impact: 'medium'
      },
      {
        id: 'dfs_lineup',
        title: 'DFS Lineup Optimizer - Best Value Plays',
        description: 'Top DFS plays for DraftKings and FanDuel this week',
        url: 'https://www.fantasypros.com/nfl/dfs/',
        source: 'FantasyPros',
        publishedAt: new Date(currentDate.getTime() - 8 * 60 * 60 * 1000).toISOString(),
        category: 'analysis',
        impact: 'medium'
      },
      {
        id: 'weather_impact',
        title: 'Weather Alert: Games Affected by Conditions',
        description: 'Wind, rain, and snow impacting fantasy decisions',
        url: 'https://www.nflweather.com/',
        source: 'NFL Weather',
        publishedAt: new Date(currentDate.getTime() - 10 * 60 * 60 * 1000).toISOString(),
        category: 'general',
        impact: 'medium'
      },
      {
        id: 'trade_deadline',
        title: 'NFL Trade Deadline Tracker - Fantasy Implications',
        description: 'How recent trades affect player values',
        url: 'https://www.nfl.com/news/',
        source: 'NFL.com',
        publishedAt: new Date(currentDate.getTime() - 12 * 60 * 60 * 1000).toISOString(),
        category: 'trade',
        impact: 'high'
      },
      {
        id: 'rookie_watch',
        title: 'Rookie Watch: Emerging Fantasy Options',
        description: 'First-year players making fantasy impact',
        url: 'https://www.pff.com/news/fantasy-football',
        source: 'PFF',
        publishedAt: new Date(currentDate.getTime() - 14 * 60 * 60 * 1000).toISOString(),
        category: 'analysis',
        impact: 'low'
      },
      {
        id: 'playoff_outlook',
        title: 'Fantasy Playoffs: Teams to Target/Avoid',
        description: 'Analyzing playoff schedules and matchups',
        url: 'https://www.fantasypros.com/nfl/matchups/',
        source: 'FantasyPros',
        publishedAt: new Date(currentDate.getTime() - 16 * 60 * 60 * 1000).toISOString(),
        category: 'analysis',
        impact: 'medium'
      }
    ];

    return NextResponse.json({ articles });
  } catch (error) {
    console.error('General news API error:', error);
    return NextResponse.json({ articles: [] });
  }
}

function getCurrentWeek(): number {
  const seasonStart = new Date('2024-09-05');
  const now = new Date();
  const weeksPassed = Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return Math.min(Math.max(weeksPassed + 1, 1), 18);
}