// Wire this to live Sleeper API when ready
export async function fetchSleeperLeague(leagueId: string) {
  const base = 'https://api.sleeper.app/v1';
  const [league, users, rosters] = await Promise.all([
    fetch(`${base}/league/${leagueId}`).then(r=>r.json()),
    fetch(`${base}/league/${leagueId}/users`).then(r=>r.json()),
    fetch(`${base}/league/${leagueId}/rosters`).then(r=>r.json()),
  ]);
  return { league, users, rosters };
}