import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Remove edge runtime for Prisma compatibility

export async function GET() {
  try {
    // Returns latest roster per (team, week) joined to league/team
    const rosters = await prisma.roster.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        team: {
          include: {
            league: true
          }
        }
      }
    });

    // Shape into NormalizedRoster[]
    const payload = rosters.map((r) => ({
      leagueKey: `${r.team.league.platform}:${r.team.league.externalId}`,
      teamKey: r.team.externalId,
      week: r.week,
      players: JSON.parse(r.players as string) // Parse JSON string back to objects
    }));

    return NextResponse.json({ ok: true, rosters: payload });
  } catch (error: any) {
    return NextResponse.json({ 
      ok: false, 
      error: error?.message || 'Failed to fetch rosters' 
    }, { status: 500 });
  }
}