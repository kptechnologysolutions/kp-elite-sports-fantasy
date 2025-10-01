import Fuse from 'fuse.js';
import { prisma } from './db';
import type { RawPlayerEntry, NormalizedPlayer } from './types';

// Try direct lookups by known IDs; else fuzzy by name+team+pos
export async function resolvePlayers(entries: RawPlayerEntry[]): Promise<NormalizedPlayer[]> {
  const ids = await prisma.playerIdentity.findMany();
  const bySleeper = new Map(ids.filter(i=>i.sleeperId).map(i => [i.sleeperId!, i]));
  const byEspn = new Map(ids.filter(i=>i.espnId).map(i => [i.espnId!, i]));
  const byYahoo = new Map(ids.filter(i=>i.yahooId).map(i => [i.yahooId!, i]));
  const byCbs = new Map(ids.filter(i=>i.cbsId).map(i => [i.cbsId!, i]));

  const fuse = new Fuse(ids, {
    keys: [
      { name: 'name', weight: 0.7 },
      { name: 'nfl', weight: 0.2 },
      { name: 'pos', weight: 0.1 }
    ],
    threshold: 0.3,
    includeScore: true
  });

  return entries.map((e) => {
    // direct map when possible
    let hit = null as any;
    const ext = (e as any).externalId || '';
    if (ext) {
      hit = bySleeper.get(ext) || byEspn.get(ext) || byYahoo.get(ext) || byCbs.get(ext) || null;
    }
    if (!hit) {
      const q = `${e.displayName}`;
      const best = fuse.search(q)[0];
      if (best && best.score! < 0.33) hit = best.item;
    }
    if (hit) {
      return { pid: hit.pid, name: hit.name, pos: hit.pos, nfl: hit.nfl };
    }
    // Fallback – create a temporary pid (you can surface manual resolve UI)
    const pid = `TMP_${e.displayName}_${e.team}_${e.position}`.replace(/\s+/g,'_');
    return { pid, name: e.displayName, pos: e.position, nfl: e.team };
  });
}