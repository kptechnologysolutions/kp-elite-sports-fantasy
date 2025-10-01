// Test script to check Sleeper API directly
const SLEEPER_BASE_URL = 'https://api.sleeper.app/v1';

async function testSleeperAPI(username) {
  console.log(`\n=== Testing Sleeper API for username: ${username} ===\n`);
  
  // Get NFL State
  const nflStateRes = await fetch(`${SLEEPER_BASE_URL}/state/nfl`);
  const nflState = await nflStateRes.json();
  console.log('NFL State:', {
    week: nflState.week,
    leg: nflState.leg,
    display_week: nflState.display_week,
    season: nflState.season,
    season_type: nflState.season_type
  });
  
  const currentWeek = nflState.leg || nflState.week || 1;
  console.log(`Current Week: ${currentWeek}\n`);
  
  // Get User
  const userRes = await fetch(`${SLEEPER_BASE_URL}/user/${username}`);
  const user = await userRes.json();
  
  if (!user || !user.user_id) {
    console.log('User not found');
    return;
  }
  
  console.log('User found:', user.username, user.display_name);
  
  // Get Leagues - Use 2025 season!
  const leaguesRes = await fetch(`${SLEEPER_BASE_URL}/user/${user.user_id}/leagues/nfl/2025`);
  const leagues = await leaguesRes.json();
  console.log(`Found ${leagues.length} leagues for 2025 season\n`);
  
  // Show all leagues
  leagues.forEach((league, i) => {
    console.log(`League ${i + 1}: ${league.name} (ID: ${league.league_id})`);
  });
  
  if (leagues.length > 0) {
    // Process each league
    for (let i = 0; i < leagues.length; i++) {
      const league = leagues[i];
      console.log(`\n=== League: ${league.name} ===`);
      
      // Get Rosters
      const rostersRes = await fetch(`${SLEEPER_BASE_URL}/league/${league.league_id}/rosters`);
      const rosters = await rostersRes.json();
      
      // Find user's roster
      const userRoster = rosters.find(r => r.owner_id === user.user_id);
      
      if (userRoster) {
        console.log('User Roster Settings:', {
          wins: userRoster.settings?.wins,
          losses: userRoster.settings?.losses,
          fpts: userRoster.settings?.fpts, // Season total
          fpts_decimal: userRoster.settings?.fpts_decimal,
          rank: userRoster.settings?.rank
        });
        
        // Get league users to find opponent names
        const usersRes = await fetch(`${SLEEPER_BASE_URL}/league/${league.league_id}/users`);
        const leagueUsers = await usersRes.json();
        
        // Get current week matchup
        const matchupsRes = await fetch(`${SLEEPER_BASE_URL}/league/${league.league_id}/matchups/${currentWeek}`);
        const matchups = await matchupsRes.json();
        
        const userMatchup = matchups.find(m => m.roster_id === userRoster.roster_id);
        
        if (userMatchup) {
          console.log('\nCurrent Week Matchup (Week ' + currentWeek + '):', {
            points: userMatchup.points, // This is WEEK score
            custom_points: userMatchup.custom_points,
            matchup_id: userMatchup.matchup_id,
            roster_id: userMatchup.roster_id
          });
          
          // Find opponent
          const opponentMatchup = matchups.find(m => 
            m.matchup_id === userMatchup.matchup_id && 
            m.roster_id !== userRoster.roster_id
          );
          
          if (opponentMatchup) {
            // Find opponent roster and user
            const opponentRoster = rosters.find(r => r.roster_id === opponentMatchup.roster_id);
            const opponentUser = leagueUsers.find(u => u.user_id === opponentRoster?.owner_id);
            
            console.log('\nOpponent:', {
              name: opponentUser?.display_name || opponentUser?.username || 'Unknown',
              username: opponentUser?.username,
              score: opponentMatchup.points
            });
          }
          
          console.log('\n=== SCORE SUMMARY ===');
          console.log(`Your Week ${currentWeek} Score: ${userMatchup.points || 0}`);
          console.log(`Opponent Week ${currentWeek} Score: ${opponentMatchup?.points || 0}`);
        }
      }
    }
  }
}

// Run the test - replace with actual username
const username = process.argv[2] || 'halpickus';
testSleeperAPI(username).catch(console.error);