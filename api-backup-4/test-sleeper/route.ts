// API route to test Sleeper integration
import { NextResponse } from 'next/server';
import { enhancedSleeperAPI } from '@/lib/api/sleeper-enhanced';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username') || 'halpickus';
  
  try {
    // Get all user teams
    const teams = await enhancedSleeperAPI.getAllUserTeams(username);
    
    // Format response for easy viewing
    const formattedTeams = teams.map(team => ({
      league: {
        id: team.league.id,
        name: team.league.name,
        size: team.league.size,
        scoringType: team.league.scoringType,
      },
      team: {
        name: team.team.name,
        owner: team.team.owner,
      },
      record: `${team.record.wins}-${team.record.losses}${team.record.ties ? `-${team.record.ties}` : ''}`,
      seasonPoints: team.record.pointsFor.toFixed(2),
      currentWeek: team.currentWeek,
      matchup: team.matchup ? {
        week: team.matchup.week,
        teamScore: team.matchup.teamScore.toFixed(2),
        opponentName: team.matchup.opponentName,
        opponentScore: team.matchup.opponentScore.toFixed(2),
        result: team.matchup.teamScore > team.matchup.opponentScore ? 'WINNING' : 'LOSING',
      } : null,
      topPlayers: team.players
        .filter((p: any) => p.stats?.fantasyPoints > 0)
        .sort((a: any, b: any) => b.stats.fantasyPoints - a.stats.fantasyPoints)
        .slice(0, 5)
        .map((p: any) => ({
          name: p.name,
          position: p.position,
          team: p.team,
          points: p.stats.fantasyPoints.toFixed(2),
          isStarter: p.status.isActive
        })),
      playerCount: team.players.length,
    }));
    
    return NextResponse.json({
      success: true,
      username,
      teamCount: teams.length,
      teams: formattedTeams,
    });
  } catch (error: any) {
    console.error('Test API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch teams'
    }, { status: 500 });
  }
}