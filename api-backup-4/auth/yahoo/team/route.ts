import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const leagueId = searchParams.get('league');
    
    // Get the Yahoo access token from cookie
    const token = request.cookies.get('yahoo_token')?.value;
    
    if (!token) {
      // Return demo data if no token
      return NextResponse.json({
        teamName: `Demo Team ${leagueId}`,
        leagueName: 'Demo League',
        leagueId: leagueId || 'demo',
        platform: 'Yahoo',
        standing: 3,
        record: {
          wins: 7,
          losses: 3,
          ties: 0
        },
        players: generateDemoPlayers()
      });
    }
    
    // Fetch team data from Yahoo API
    const response = await fetch(
      `https://fantasysports.yahooapis.com/fantasy/v2/league/nfl.l.${leagueId}/teams?format=json`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch team from Yahoo');
    }
    
    const data = await response.json();
    
    // Parse the Yahoo response and find user's team
    const teams = data.fantasy_content?.league?.[1]?.teams;
    let userTeam = null;
    
    if (teams) {
      // Find the user's team (typically marked with is_owned_by_current_login)
      for (let i = 0; i < teams.count; i++) {
        const team = teams[i]?.team;
        if (team && team.is_owned_by_current_login === 1) {
          userTeam = team;
          break;
        }
      }
    }
    
    if (!userTeam) {
      // Return first team if user's team not found
      userTeam = teams?.[0]?.team;
    }
    
    // Fetch roster for the team
    const rosterResponse = await fetch(
      `https://fantasysports.yahooapis.com/fantasy/v2/team/nfl.l.${leagueId}.t.${userTeam?.team_id}/roster?format=json`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    let players = [];
    if (rosterResponse.ok) {
      const rosterData = await rosterResponse.json();
      const roster = rosterData.fantasy_content?.team?.[1]?.roster?.[0]?.players;
      
      if (roster) {
        for (let i = 0; i < roster.count; i++) {
          const player = roster[i]?.player;
          if (player) {
            players.push({
              id: player.player_id,
              name: player.name?.full || 'Unknown Player',
              position: player.display_position || player.primary_position || 'NA',
              team: player.editorial_team_abbr || 'FA',
              points: player.player_points?.total || 0,
              projectedPoints: player.player_points?.projected || 0,
              status: player.status || 'healthy',
              isStarter: player.selected_position?.position !== 'BN'
            });
          }
        }
      }
    }
    
    return NextResponse.json({
      teamName: userTeam?.name || `Team ${leagueId}`,
      leagueName: data.fantasy_content?.league?.[0]?.name || 'Yahoo League',
      leagueId: leagueId,
      platform: 'Yahoo',
      standing: userTeam?.team_standings?.rank || 1,
      record: {
        wins: parseInt(userTeam?.team_standings?.outcome_totals?.wins || '0'),
        losses: parseInt(userTeam?.team_standings?.outcome_totals?.losses || '0'),
        ties: parseInt(userTeam?.team_standings?.outcome_totals?.ties || '0')
      },
      players: players.length > 0 ? players : generateDemoPlayers()
    });
    
  } catch (error) {
    console.error('Error fetching Yahoo team:', error);
    
    // Return demo data on error
    const leagueId = request.nextUrl.searchParams.get('league');
    return NextResponse.json({
      teamName: `Demo Team`,
      leagueName: 'Demo League',
      leagueId: leagueId || 'demo',
      platform: 'Yahoo',
      standing: 5,
      record: {
        wins: 5,
        losses: 5,
        ties: 0
      },
      players: generateDemoPlayers()
    });
  }
}

function generateDemoPlayers() {
  return [
    {
      id: '1',
      name: 'Josh Allen',
      position: 'QB',
      team: 'BUF',
      points: 245.8,
      projectedPoints: 22.5,
      status: 'healthy',
      isStarter: true
    },
    {
      id: '2',
      name: 'Christian McCaffrey',
      position: 'RB',
      team: 'SF',
      points: 198.4,
      projectedPoints: 18.2,
      status: 'healthy',
      isStarter: true
    },
    {
      id: '3',
      name: 'Tyreek Hill',
      position: 'WR',
      team: 'MIA',
      points: 176.9,
      projectedPoints: 16.8,
      status: 'healthy',
      isStarter: true
    },
    {
      id: '4',
      name: 'Travis Kelce',
      position: 'TE',
      team: 'KC',
      points: 134.2,
      projectedPoints: 12.4,
      status: 'healthy',
      isStarter: true
    },
    {
      id: '5',
      name: 'Austin Ekeler',
      position: 'RB',
      team: 'LAC',
      points: 156.3,
      projectedPoints: 14.1,
      status: 'healthy',
      isStarter: true
    },
    {
      id: '6',
      name: 'Stefon Diggs',
      position: 'WR',
      team: 'BUF',
      points: 168.7,
      projectedPoints: 15.3,
      status: 'healthy',
      isStarter: true
    }
  ];
}