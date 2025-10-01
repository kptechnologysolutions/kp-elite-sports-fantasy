import type { NormalizedRoster } from './types';

export function computeExposure(rosters: NormalizedRoster[]) {
  // exposure% per pid across all rosters (weight: start=1, bench=0.4 if you track slots)
  const counts = new Map<string, { name: string; pos: string; nfl: string; count: number }>();
  let total = 0;
  for (const r of rosters) {
    for (const p of r.players) {
      total += 1;
      const prev = counts.get(p.pid) || { name: p.name, pos: p.pos, nfl: p.nfl, count: 0 };
      prev.count += 1;
      counts.set(p.pid, prev);
    }
  }
  return Array.from(counts.entries())
    .map(([pid, v]) => ({ pid, ...v, exposure: v.count / total }))
    .sort((a, b) => b.exposure - a.exposure);
}

export function categorizeRisk(volatilityStd: number) {
  if (volatilityStd >= 8) return 'high';
  if (volatilityStd >= 4) return 'medium';
  return 'low';
}