import { NextRequest, NextResponse } from 'next/server';
import { parseRosterCsv } from '@/lib/adapters/csv';
import { resolvePlayers } from '@/lib/identity';
import { prisma } from '@/lib/db';

// Remove edge runtime for Prisma compatibility

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // { platform: 'espn'|'yahoo'|'cbs'|'nfl', csv: string, leagueName?: string }
    const platform = body.platform || 'espn';
    const rosters = parseRosterCsv(body.csv, platform);
    const week = Number(new URL(req.url).searchParams.get('week') || 1);

    for (const r of rosters) {
      const norm = await resolvePlayers(r.players);
      // minimal persistence example: one team per roster
      const user = await prisma.user.upsert({
        where: { email: 'demo@user.local' },
        update: {},
        create: { email: 'demo@user.local' }
      });
      const league = await prisma.league.upsert({
        where: { externalId_userId: { externalId: r.leagueId, userId: user.id } },
        create: {
          userId: user.id,
          platform,
          externalId: r.leagueId,
          name: body.leagueName || `${platform.toUpperCase()} ${r.leagueId}`,
          scoring: JSON.stringify({})
        },
        update: {}
      });
      const team = await prisma.team.upsert({
        where: { externalId_leagueId: { externalId: r.teamId, leagueId: league.id } },
        create: { leagueId: league.id, externalId: r.teamId, name: r.teamId },
        update: {}
      });
      await prisma.roster.create({
        data: { teamId: team.id, week, players: JSON.stringify(norm) }
      });
    }
    return NextResponse.json({ ok: true, imported: rosters.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 400 });
  }
}