import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolvePlayers } from '@/lib/identity';

// Remove edge runtime for Prisma compatibility

const SLP = 'https://api.sleeper.app/v1';

type SleeperRoster = {
  roster_id: number;
  owner_id: string;
  players: string[]; // array of Sleeper player IDs
  starters?: string[];
};

type SleeperPlayer = {
  player_id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  team?: string;
  position?: string;
};

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { next: { revalidate: 60 } });
  if (!r.ok) throw new Error(`Sleeper error ${r.status}`);
  return r.json();
}

export async function POST(req: NextRequest) {
  try {
    const { leagueId, userEmail = 'demo@user.local', week = 1 } = await req.json() as {
      leagueId: string; userEmail?: string; week?: number;
    };

    if (!leagueId) throw new Error('Missing leagueId');

    // Basic pulls
    const [league, users, rosters] = await Promise.all([
      fetchJson<any>(`${SLP}/league/${leagueId}`),
      fetchJson<any[]>(`${SLP}/league/${leagueId}/users`),
      fetchJson<SleeperRoster[]>(`${SLP}/league/${leagueId}/rosters`),
    ]);

    // Load Sleeper players map once (big file – but cached by Vercel; you can replace with a subset)
    // Alternative: call `/players/nfl` and filter by rostered IDs to reduce size.
    const allPlayers: Record<string, SleeperPlayer> =
      await fetchJson<Record<string, SleeperPlayer>>(`${SLP}/players/nfl`);

    // Ensure user
    const user = await prisma.user.upsert({
      where: { email: userEmail },
      update: {},
      create: { email: userEmail }
    });

    // Ensure league
    const dbLeague = await prisma.league.upsert({
      where: { externalId_userId: { externalId: leagueId, userId: user.id } },
      create: {
        userId: user.id,
        platform: 'sleeper',
        externalId: leagueId,
        name: league?.name || `Sleeper ${leagueId}`,
        scoring: JSON.stringify(league?.scoring_settings || {})
      },
      update: {}
    });

    // Map Sleeper roster → Team + Roster
    for (const r of rosters) {
      const owner = users.find(u => u.user_id === r.owner_id);
      const teamName = owner?.display_name || `Team ${r.roster_id}`;

      const team = await prisma.team.upsert({
        where: { externalId_leagueId: { externalId: String(r.roster_id), leagueId: dbLeague.id } },
        create: { leagueId: dbLeague.id, externalId: String(r.roster_id), name: teamName },
        update: { name: teamName }
      });

      // Convert Sleeper player IDs to RawPlayerEntry[]
      const rawEntries = (r.players || []).map((pid) => {
        const sp = allPlayers[pid] || ({} as SleeperPlayer);
        const displayName = sp.full_name || `${sp.first_name || ''} ${sp.last_name || ''}`.trim() || pid;
        return {
          externalId: sp.player_id,      // <— allows identity.ts to fast-path by sleeperId
          displayName,
          position: sp.position || 'NA',
          team: sp.team || 'FA'
        };
      });

      const normalized = await resolvePlayers(rawEntries);

      await prisma.roster.create({
        data: {
          teamId: team.id,
          week: Number(week),
          players: JSON.stringify(normalized)
        }
      });
    }

    return NextResponse.json({ ok: true, importedTeams: rosters.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 400 });
  }
}