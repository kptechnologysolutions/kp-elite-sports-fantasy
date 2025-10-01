// Test enhanced Sleeper API
async function testEnhancedAPI() {
  const SLEEPER_BASE_URL = 'https://api.sleeper.app/v1';
  const username = 'halpickus';
  
  console.log('Testing Enhanced Sleeper API for', username);
  console.log('='.repeat(50));
  
  // Get all user teams
  const userRes = await fetch(`${SLEEPER_BASE_URL}/user/${username}`);
  const user = await userRes.json();
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  console.log('User:', user.display_name, '(ID:', user.user_id, ')');
  
  // Get leagues
  const leaguesRes = await fetch(`${SLEEPER_BASE_URL}/user/${user.user_id}/leagues/nfl/2025`);
  const leagues = await leaguesRes.json();
  
  console.log('Found', leagues.length, 'leagues\n');
  
  // For each league, show detailed data
  for (const league of leagues) {
    console.log('\nLEAGUE:', league.name);
    console.log('ID:', league.league_id);
    
    // Get rosters
    const rostersRes = await fetch(`${SLEEPER_BASE_URL}/league/${league.league_id}/rosters`);
    const rosters = await rostersRes.json();
    
    // Find user's roster
    const myRoster = rosters.find(r => r.owner_id === user.user_id);
    if (!myRoster) continue;
    
    // Get users for team names
    const usersRes = await fetch(`${SLEEPER_BASE_URL}/league/${league.league_id}/users`);
    const users = await usersRes.json();
    const myUser = users.find(u => u.user_id === user.user_id);
    
    console.log('Team Name:', myUser?.metadata?.team_name || myUser?.display_name);
    console.log('Roster ID:', myRoster.roster_id);
    console.log('Record:', myRoster.settings.wins + '-' + myRoster.settings.losses);
    console.log('Points For (Season):', myRoster.settings.fpts);
    
    // Get current matchup
    const stateRes = await fetch(`${SLEEPER_BASE_URL}/state/nfl`);
    const nflState = await stateRes.json();
    const week = nflState.leg || nflState.week;
    
    const matchupsRes = await fetch(`${SLEEPER_BASE_URL}/league/${league.league_id}/matchups/${week}`);
    const matchups = await matchupsRes.json();
    const myMatchup = matchups.find(m => m.roster_id === myRoster.roster_id);
    
    if (myMatchup) {
      console.log('Week', week, 'Score:', myMatchup.points);
      
      // Get opponent
      const oppMatchup = matchups.find(m => 
        m.matchup_id === myMatchup.matchup_id && m.roster_id !== myRoster.roster_id
      );
      
      if (oppMatchup) {
        const oppRoster = rosters.find(r => r.roster_id === oppMatchup.roster_id);
        const oppUser = users.find(u => u.user_id === oppRoster?.owner_id);
        console.log('Opponent:', oppUser?.metadata?.team_name || oppUser?.display_name);
        console.log('Opponent Score:', oppMatchup.points);
      }
      
      // Show some player scores
      if (myMatchup.starters_points) {
        console.log('\nTop Starters:');
        const topScorers = myMatchup.starters
          .map((id, i) => ({ id, points: myMatchup.starters_points[i] || 0 }))
          .filter(p => p.points > 0)
          .sort((a, b) => b.points - a.points)
          .slice(0, 3);
        
        for (const player of topScorers) {
          // In real implementation, we'd look up player names
          console.log('  Player', player.id + ':', player.points, 'pts');
        }
      }
    }
    
    console.log('-'.repeat(50));
  }
}

testEnhancedAPI().catch(console.error);