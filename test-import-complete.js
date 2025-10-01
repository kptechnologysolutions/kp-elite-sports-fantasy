// Test the complete import flow
import { enhancedSleeperAPI } from './lib/api/sleeper-enhanced.js';

async function testCompleteImport() {
  console.log('Testing Enhanced Sleeper API Import...\n');
  
  try {
    const teams = await enhancedSleeperAPI.getAllUserTeams('halpickus');
    
    console.log(`Found ${teams.length} teams for halpickus\n`);
    
    teams.forEach((team, index) => {
      console.log(`\n=== TEAM ${index + 1}: ${team.team.name} ===`);
      console.log(`League: ${team.league.name}`);
      console.log(`Record: ${team.record.wins}-${team.record.losses}`);
      console.log(`Season Points: ${team.record.pointsFor.toFixed(2)}`);
      console.log(`Current Week: ${team.currentWeek}`);
      
      if (team.matchup) {
        console.log(`\nWeek ${team.matchup.week} Matchup:`);
        console.log(`  Score: ${team.matchup.teamScore.toFixed(2)}`);
        console.log(`  Opponent: ${team.matchup.opponentName}`);
        console.log(`  Opponent Score: ${team.matchup.opponentScore.toFixed(2)}`);
      }
      
      console.log(`\nRoster (${team.players.length} players):`);
      // Show top 5 scorers
      const topScorers = team.players
        .filter(p => p.stats?.fantasyPoints > 0)
        .sort((a, b) => b.stats.fantasyPoints - a.stats.fantasyPoints)
        .slice(0, 5);
      
      topScorers.forEach(player => {
        const starter = player.status?.isActive ? '⭐' : '  ';
        console.log(`  ${starter} ${player.name} (${player.position} - ${player.team}): ${player.stats.fantasyPoints.toFixed(1)} pts`);
      });
      
      // Show injured players
      const injured = team.players.filter(p => p.injuryStatus);
      if (injured.length > 0) {
        console.log(`\nInjured Players:`);
        injured.forEach(player => {
          console.log(`  ⚠️  ${player.name}: ${player.injuryStatus.type}`);
        });
      }
    });
    
    console.log('\n✅ Import test successful!');
    console.log('\nData structure is correct and ready for display in the UI.');
    
  } catch (error) {
    console.error('❌ Import test failed:', error);
  }
}

testCompleteImport();