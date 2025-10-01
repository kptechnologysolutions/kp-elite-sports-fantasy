import { pub } from '../lib/redis';

const args = new Set(process.argv.slice(2));

async function seedIdentities() {
  // You can expand this; just a few to make resolution obvious
  const { prisma } = await import('../lib/db');
  const players = [
    { pid: 'CMC', name: 'Christian McCaffrey', pos: 'RB', nfl: 'SF', sleeperId: '4046' },
    { pid: 'Kelce', name: 'Travis Kelce', pos: 'TE', nfl: 'KC', sleeperId: '1046' },
    { pid: 'Aiyuk', name: 'Brandon Aiyuk', pos: 'WR', nfl: 'SF', sleeperId: '5859' },
    { pid: 'Josh_Allen', name: 'Josh Allen', pos: 'QB', nfl: 'BUF', sleeperId: '4017' },
    { pid: 'Tyreek_Hill', name: 'Tyreek Hill', pos: 'WR', nfl: 'MIA', sleeperId: '1479' },
    { pid: 'Derrick_Henry', name: 'Derrick Henry', pos: 'RB', nfl: 'BAL', sleeperId: '1466' },
    { pid: 'Cooper_Kupp', name: 'Cooper Kupp', pos: 'WR', nfl: 'LAR', sleeperId: '3163' },
    { pid: 'Saquon_Barkley', name: 'Saquon Barkley', pos: 'RB', nfl: 'PHI', sleeperId: '3969' }
  ];
  
  for (const player of players) {
    await prisma.playerIdentity.upsert({
      where: { pid: player.pid },
      update: player,
      create: player
    });
  }
  console.log('Seeded PlayerIdentity (sample)');
}

async function liveLoop() {
  console.log('Mock live publisher on channel live:demo');
  let tick = 0;
  // Emit a few useful tiles so the Game Day page moves:
  const samples = [
    { redzone: [{ player: 'CMC', yardLine: 7, status: 'RZ' }] },
    { winProb: [{ league: 'yahoo:123', wp: 0.63 }] },
    { inactives: [{ player: 'Some Guy', status: 'OUT' }] },
    { antiCorr: [{ warning: 'Starting RB vs Opp DST (fix?)' }] },
    { exposure: [{ player: 'CMC', leagues: 2, share: '66%' }] },
    { updates: ['SF TD! CMC rush TD'] }
  ];
  // loop + randomize
  setInterval(async () => {
    const update = samples[tick % samples.length];
    await pub('live:demo', JSON.stringify(update));
    tick++;
  }, 3000);
}

(async () => {
  if (args.has('--seed-identities')) {
    await seedIdentities();
    process.exit(0);
  }
  if (args.has('--live')) {
    await liveLoop();
  }
})();