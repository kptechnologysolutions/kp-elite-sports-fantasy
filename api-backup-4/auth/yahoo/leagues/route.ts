import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the Yahoo access token from cookie
    const token = request.cookies.get('yahoo_token')?.value;
    
    if (!token) {
      // No token, return demo data
      return NextResponse.json({
        leagues: [
          {
            league_key: 'nfl.l.demo1',
            league_id: 'demo1',
            name: 'The Championship League',
            url: '#',
            num_teams: 12,
            current_week: 10,
            season: '2024'
          },
          {
            league_key: 'nfl.l.demo2',
            league_id: 'demo2',
            name: 'Dynasty Warriors',
            url: '#',
            num_teams: 10,
            current_week: 10,
            season: '2024'
          }
        ]
      });
    }
    
    // Fetch user's fantasy leagues from Yahoo
    const response = await fetch(
      'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/leagues?format=json',
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch leagues from Yahoo');
    }
    
    const data = await response.json();
    
    // Parse the Yahoo response (their JSON structure is complex)
    const leagues = [];
    const gamesData = data.fantasy_content?.users?.[0]?.user?.[1]?.games;
    
    if (gamesData && gamesData[0]?.game) {
      const leaguesData = gamesData[0].game[1]?.leagues;
      
      if (leaguesData) {
        for (let i = 0; i < leaguesData.count; i++) {
          const league = leaguesData[i]?.league;
          if (league) {
            leagues.push({
              league_key: league.league_key,
              league_id: league.league_id,
              name: league.name,
              url: league.url,
              num_teams: league.num_teams,
              current_week: league.current_week,
              season: league.season,
            });
          }
        }
      }
    }
    
    return NextResponse.json({ leagues });
  } catch (error) {
    console.error('Error fetching Yahoo leagues:', error);
    
    // Return demo data on error
    return NextResponse.json({
      leagues: [
        {
          league_key: 'nfl.l.demo1',
          league_id: 'demo1',
          name: 'Yahoo Demo League',
          url: '#',
          num_teams: 12,
          current_week: 10,
          season: '2024'
        }
      ]
    });
  }
}