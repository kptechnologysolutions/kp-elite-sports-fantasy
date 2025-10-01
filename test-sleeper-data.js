// Test script to debug Sleeper API data
// Node 18+ has built-in fetch

const username = 'halpickus';
const NFL_SEASON = '2025';

async function testSleeperData() {
  console.log('=== TESTING SLEEPER API DATA ===\n');
  
  try {
    // 1. Get user
    const userRes = await fetch(`https://api.sleeper.app/v1/user/${username}`);
    const user = await userRes.json();
    console.log('User:', {
      username: user.username,
      user_id: user.user_id,
      display_name: user.display_name
    });
    console.log('');

    // 2. Get NFL state
    const stateRes = await fetch('https://api.sleeper.app/v1/state/nfl');
    const nflState = await stateRes.json();
    console.log('NFL State:', {
      season: nflState.season,
      season_type: nflState.season_type,
      week: nflState.week,
      leg: nflState.leg,
      display_week: nflState.display_week
    });
    console.log('');

    // 3. Get user leagues for 2025
    const leaguesRes = await fetch(`https://api.sleeper.app/v1/user/${user.user_id}/leagues/nfl/${NFL_SEASON}`);
    const leagues = await leaguesRes.json();
    console.log(`Found ${leagues.length} leagues for ${NFL_SEASON} season\n`);

    // 4. For each league, get detailed info
    for (const league of leagues) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`LEAGUE: ${league.name}`);
      console.log(`${'='.repeat(50)}`);
      console.log('League ID:', league.league_id);
      console.log('Total Teams:', league.total_rosters);
      console.log('Scoring:', league.scoring_settings?.rec ? 'PPR' : 'Standard');
      console.log('Status:', league.status);
      console.log('');

      // Get rosters
      const rostersRes = await fetch(`https://api.sleeper.app/v1/league/${league.league_id}/rosters`);
      const rosters = await rostersRes.json();
      
      // Find user's roster
      const myRoster = rosters.find(r => r.owner_id === user.user_id || r.co_owners?.includes(user.user_id));
      
      if (myRoster) {
        console.log('MY TEAM INFO:');
        console.log('Roster ID:', myRoster.roster_id);
        
        // Get users to find team name
        const usersRes = await fetch(`https://api.sleeper.app/v1/league/${league.league_id}/users`);
        const users = await usersRes.json();
        const myUser = users.find(u => u.user_id === user.user_id);
        
        console.log('Team Name:', myUser?.metadata?.team_name || myUser?.display_name || 'No custom name');
        console.log('Record:', `${myRoster.settings.wins}-${myRoster.settings.losses}-${myRoster.settings.ties}`);
        console.log('Points For (Season):', myRoster.settings.fpts);
        console.log('Points Against:', myRoster.settings.fpts_against);
        console.log('Max Points For:', myRoster.settings.fpts_decimal);
        console.log('');

        // Get current matchup
        const currentWeek = nflState.leg || nflState.week;
        const matchupsRes = await fetch(`https://api.sleeper.app/v1/league/${league.league_id}/matchups/${currentWeek}`);
        const matchups = await matchupsRes.json();
        
        const myMatchup = matchups.find(m => m.roster_id === myRoster.roster_id);
        if (myMatchup) {
          console.log('CURRENT WEEK', currentWeek, 'MATCHUP:');
          console.log('My Score:', myMatchup.points);
          console.log('Matchup ID:', myMatchup.matchup_id);
          
          // Find opponent
          const opponentMatchup = matchups.find(m => 
            m.matchup_id === myMatchup.matchup_id && m.roster_id !== myRoster.roster_id
          );
          
          if (opponentMatchup) {
            const oppRoster = rosters.find(r => r.roster_id === opponentMatchup.roster_id);
            const oppUser = users.find(u => u.user_id === oppRoster.owner_id);
            console.log('Opponent:', oppUser?.metadata?.team_name || oppUser?.display_name || 'Unknown');
            console.log('Opponent Score:', opponentMatchup.points);
          }
          
          // Show player scores
          console.log('\nTOP SCORING STARTERS:');
          if (myMatchup.starters_points) {
            const starterPoints = myMatchup.starters.map((playerId, index) => ({
              playerId,
              points: myMatchup.starters_points[index] || 0
            })).filter(p => p.points > 0)
              .sort((a, b) => b.points - a.points)
              .slice(0, 5);
            
            for (const player of starterPoints) {
              console.log(`  Player ${player.playerId}: ${player.points} pts`);
            }
          } else {
            console.log('  No detailed player scores available');
          }
        } else {
          console.log('No matchup found for week', currentWeek);
        }
        
        // Show roster composition
        console.log('\nROSTER COMPOSITION:');
        console.log('Total Players:', myRoster.players?.length || 0);
        console.log('Starters:', myRoster.starters?.length || 0);
        if (myRoster.starters?.length > 0) {
          console.log('Sample starter IDs:', myRoster.starters.slice(0, 3).join(', '));
        }
      } else {
        console.log('Could not find your roster in this league');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testSleeperData();