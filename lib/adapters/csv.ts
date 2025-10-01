import { parse } from 'csv-parse/sync';
import type { RawRoster } from '../types';

// Expect columns: leagueId,teamId,displayName,position,team
export function parseRosterCsv(csvText: string, platform: 'espn' | 'yahoo' | 'cbs' | 'nfl'): RawRoster[] {
  const rows = parse(csvText, { columns: true, skip_empty_lines: true }) as any[];
  const byKey = new Map<string, { platform: any, leagueId: string, teamId: string, players: any[] }>();
  for (const r of rows) {
    const key = `${r.leagueId}:${r.teamId}`;
    if (!byKey.has(key)) byKey.set(key, { platform, leagueId: r.leagueId, teamId: r.teamId, players: [] });
    byKey.get(key)!.players.push({
      displayName: r.displayName,
      position: r.position,
      team: r.team
    });
  }
  return Array.from(byKey.values());
}