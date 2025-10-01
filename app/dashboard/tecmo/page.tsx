'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TecmoBowlLayout, TecmoCard, TecmoButton } from '@/components/layout/TecmoBowlLayout';
import { Button } from '@/components/ui/button';
import { 
  Trophy, TrendingUp, Users, Shield, Zap, 
  Activity, Star, Flame, Snowflake, ChevronUp,
  ChevronDown, AlertTriangle, Target
} from 'lucide-react';
import useSleeperStore from '@/lib/store/useSleeperStore';
import { cn } from '@/lib/utils';

export default function TecmoBowlDashboard() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'GAME' | 'ROSTER' | 'STATS'>('GAME');
  
  const {
    user,
    currentLeague,
    myRoster,
    rosters,
    leagueUsers,
    currentMatchups,
    currentWeek,
    players,
    getPlayer,
    isLoading
  } = useSleeperStore();
  
  // Use demo data if no user logged in
  const isDemoMode = !user;
  
  // Get my current matchup
  const myMatchup = currentMatchups.find(m => m.roster_id === myRoster?.roster_id);
  const opponentMatchup = currentMatchups.find(m => 
    m.matchup_id === myMatchup?.matchup_id && 
    m.roster_id !== myMatchup?.roster_id
  );
  const opponentRoster = rosters.find(r => r.roster_id === opponentMatchup?.roster_id);
  const opponentUser = opponentRoster?.owner_id ? leagueUsers.get(opponentRoster.owner_id) : null;
  
  // Calculate standings
  const standings = [...rosters].sort((a, b) => {
    const aWins = a.settings?.wins || 0;
    const bWins = b.settings?.wins || 0;
    if (aWins !== bWins) return bWins - aWins;
    return (b.settings?.fpts || 0) - (a.settings?.fpts || 0);
  });
  
  const myRank = standings.findIndex(r => r.roster_id === myRoster?.roster_id) + 1;
  
  // Get top performers from my roster
  const getTopPerformers = () => {
    if (!myRoster || !myMatchup) return [];
    
    return myRoster.starters
      .map(playerId => {
        const player = getPlayer(playerId);
        const points = myMatchup.players_points?.[playerId] || 0;
        return { player, points, playerId };
      })
      .filter(p => p.player)
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);
  };
  
  const topPerformers = getTopPerformers();
  
  // Create demo data for demo mode
  const demoData = {
    user: { display_name: 'PLAYER 1' },
    currentWeek: 10,
    currentLeague: { name: 'DEMO LEAGUE' },
    myRoster: {
      settings: { wins: 7, losses: 3, fpts: 1234.5, fpts_against: 1156.2, total_moves: 15 },
      starters: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
      players: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15']
    },
    myMatchup: { points: 112.5, roster_id: 1, players_points: { '1': 18.5, '2': 22.3, '3': 15.2 } },
    opponentMatchup: { points: 98.3 },
    opponentUser: { display_name: 'CPU RIVAL' },
    myRank: 3
  };
  
  // Render with inline Tecmo styling
  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: 'monospace' }}>
      {/* Top Score Bar */}
      <div className="bg-blue-900 border-b-4 border-white p-2">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-yellow-400 text-lg font-bold">TECMO FANTASY BOWL</div>
            <div className="bg-black px-3 py-1 border-2 border-white">
              <span className="text-green-400">W:{(isDemoMode ? demoData.myRoster : myRoster)?.settings?.wins || 0}</span>
              <span className="text-white mx-2">-</span>
              <span className="text-red-400">L:{(isDemoMode ? demoData.myRoster : myRoster)?.settings?.losses || 0}</span>
            </div>
          </div>
          <Button
            onClick={() => router.push('/dashboard/sleeper')}
            className="bg-gray-800 hover:bg-gray-700 text-white border-2 border-white"
          >
            {isDemoMode ? 'LOGIN' : 'BACK TO NORMAL'}
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="p-6">
        {/* Game Header */}
        <div className="text-center mb-6">
        <div className="text-yellow-400 text-3xl font-bold tracking-wider animate-pulse">
          WEEK {isDemoMode ? demoData.currentWeek : currentWeek || 1}
        </div>
        <div className="text-white text-lg mt-2">
          {isDemoMode ? demoData.currentLeague.name : currentLeague?.name || 'LEAGUE'}
        </div>
      </div>
      
      {/* Tab Selection */}
      <div className="flex justify-center gap-2 mb-6">
        {(['GAME', 'ROSTER', 'STATS'] as const).map(tab => (
          <TecmoButton
            key={tab}
            variant={selectedTab === tab ? 'primary' : 'default'}
            onClick={() => setSelectedTab(tab)}
          >
            {tab}
          </TecmoButton>
        ))}
      </div>
      
      {/* Main Content based on selected tab */}
      {selectedTab === 'GAME' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Matchup */}
          <TecmoCard title="CURRENT MATCHUP">
            <div className="space-y-4">
              {/* Score Display */}
              <div className="bg-black p-4 border-2 border-white">
                <div className="grid grid-cols-3 gap-4 items-center">
                  {/* My Team */}
                  <div className="text-center">
                    <div className="text-yellow-400 text-xs mb-1">HOME</div>
                    <div className="text-white font-bold">
                      {isDemoMode ? demoData.user.display_name : user?.display_name || 'PLAYER 1'}
                    </div>
                    <div className="text-3xl font-bold text-green-400 mt-2">
                      {isDemoMode ? demoData.myMatchup.points.toFixed(1) : myMatchup?.points.toFixed(1) || '0.0'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {isDemoMode ? `${demoData.myRoster.settings.wins}-${demoData.myRoster.settings.losses}` : `${myRoster?.settings?.wins || 0}-${myRoster?.settings?.losses || 0}`}
                    </div>
                  </div>
                  
                  {/* VS */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400 animate-pulse">
                      VS
                    </div>
                  </div>
                  
                  {/* Opponent */}
                  <div className="text-center">
                    <div className="text-yellow-400 text-xs mb-1">AWAY</div>
                    <div className="text-white font-bold">
                      {isDemoMode ? demoData.opponentUser.display_name : opponentUser?.display_name || 'BYE'}
                    </div>
                    <div className="text-3xl font-bold text-red-400 mt-2">
                      {isDemoMode ? demoData.opponentMatchup.points.toFixed(1) : opponentMatchup?.points.toFixed(1) || '0.0'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {opponentRoster?.settings?.wins || 0}-{opponentRoster?.settings?.losses || 0}
                    </div>
                  </div>
                </div>
                
                {/* Win Probability Bar */}
                <div className="mt-4">
                  <div className="h-4 bg-gray-800 border border-white relative overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all"
                      style={{
                        width: isDemoMode 
                          ? `${(demoData.myMatchup.points / (demoData.myMatchup.points + demoData.opponentMatchup.points)) * 100}%`
                          : `${myMatchup && opponentMatchup 
                            ? (myMatchup.points / (myMatchup.points + opponentMatchup.points)) * 100 
                            : 50}%`
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                      WIN PROBABILITY
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Top Performers */}
              <div className="space-y-2">
                <div className="text-yellow-400 text-xs font-bold">TOP PERFORMERS</div>
                {topPerformers.map(({ player, points }, i) => (
                  <div 
                    key={player?.player_id}
                    className="flex items-center justify-between bg-black/50 px-2 py-1 border border-gray-600"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400 text-xs">{i + 1}.</span>
                      <span className="text-white text-sm">
                        {player?.first_name} {player?.last_name}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {player?.position}
                      </span>
                    </div>
                    <div className={cn(
                      "font-bold",
                      points >= 20 && "text-green-400",
                      points >= 10 && points < 20 && "text-yellow-400",
                      points < 10 && "text-red-400"
                    )}>
                      {points.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TecmoCard>
          
          {/* League Standings */}
          <TecmoCard title="LEAGUE STANDINGS">
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {standings.slice(0, 10).map((roster, i) => {
                const owner = roster.owner_id ? leagueUsers.get(roster.owner_id) : null;
                const isMe = roster.roster_id === myRoster?.roster_id;
                
                return (
                  <div 
                    key={roster.roster_id}
                    className={cn(
                      "flex items-center justify-between px-2 py-1 text-sm",
                      isMe && "bg-yellow-400/20 border border-yellow-400",
                      !isMe && "bg-black/30 border border-gray-700"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "font-bold",
                        i === 0 && "text-yellow-400",
                        i === 1 && "text-gray-300",
                        i === 2 && "text-orange-400",
                        i >= 3 && "text-white"
                      )}>
                        {i + 1}
                      </span>
                      <span className={cn(
                        isMe ? "text-yellow-400 font-bold" : "text-white"
                      )}>
                        {owner?.display_name || 'Unknown'}
                        {isMe && ' (YOU)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-green-400">
                        {roster.settings?.wins || 0}
                      </span>
                      <span className="text-gray-400">-</span>
                      <span className="text-red-400">
                        {roster.settings?.losses || 0}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {(roster.settings?.fpts || 0).toFixed(0)} PTS
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Playoff Status */}
            <div className="mt-4 p-2 bg-black border border-white">
              <div className="text-center">
                {(isDemoMode ? demoData.myRank : myRank) <= 6 ? (
                  <div>
                    <div className="text-green-400 font-bold animate-pulse">
                      PLAYOFF POSITION
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Currently #{isDemoMode ? demoData.myRank : myRank} of {isDemoMode ? 12 : rosters.length}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-red-400 font-bold">
                      OUTSIDE PLAYOFFS
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {6 - (isDemoMode ? demoData.myRank : myRank)} spots behind
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TecmoCard>
        </div>
      )}
      
      {selectedTab === 'ROSTER' && (
        <TecmoCard title="MY ROSTER">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Starters */}
            <div>
              <div className="text-yellow-400 font-bold mb-2">STARTING LINEUP</div>
              <div className="space-y-1">
                {myRoster?.starters.map((playerId, i) => {
                  const player = getPlayer(playerId);
                  const points = myMatchup?.players_points?.[playerId] || 0;
                  
                  return (
                    <div 
                      key={playerId}
                      className="flex items-center justify-between bg-black/50 px-2 py-1 border border-gray-600"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs w-6">
                          {['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'K', 'DEF'][i] || 'FLEX'}
                        </span>
                        <span className="text-white text-sm">
                          {player ? `${player.first_name} ${player.last_name}` : 'EMPTY'}
                        </span>
                      </div>
                      <div className={cn(
                        "font-bold text-sm",
                        points >= 15 && "text-green-400",
                        points >= 8 && points < 15 && "text-yellow-400",
                        points < 8 && "text-red-400"
                      )}>
                        {points.toFixed(1)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Bench */}
            <div>
              <div className="text-yellow-400 font-bold mb-2">BENCH</div>
              <div className="space-y-1">
                {myRoster?.players
                  .filter(p => !myRoster.starters.includes(p))
                  .map(playerId => {
                    const player = getPlayer(playerId);
                    const points = myMatchup?.players_points?.[playerId] || 0;
                    
                    return (
                      <div 
                        key={playerId}
                        className="flex items-center justify-between bg-black/50 px-2 py-1 border border-gray-600 opacity-75"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-xs w-6">
                            {player?.position || 'NA'}
                          </span>
                          <span className="text-gray-300 text-sm">
                            {player ? `${player.first_name} ${player.last_name}` : 'EMPTY'}
                          </span>
                        </div>
                        <div className="text-gray-500 text-sm">
                          {points.toFixed(1)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </TecmoCard>
      )}
      
      {selectedTab === 'STATS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Season Stats */}
          <TecmoCard title="SEASON STATS">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">TOTAL POINTS:</span>
                <span className="text-white font-bold">
                  {(myRoster?.settings?.fpts || 0).toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">AVG POINTS:</span>
                <span className="text-white font-bold">
                  {((myRoster?.settings?.fpts || 0) / Math.max((myRoster?.settings?.wins || 0) + (myRoster?.settings?.losses || 0), 1)).toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">POINTS AGAINST:</span>
                <span className="text-white font-bold">
                  {(myRoster?.settings?.fpts_against || 0).toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">TRANSACTIONS:</span>
                <span className="text-white font-bold">
                  {myRoster?.settings?.total_moves || 0}
                </span>
              </div>
            </div>
          </TecmoCard>
          
          {/* Power Rankings */}
          <TecmoCard title="POWER RANKINGS">
            <div className="space-y-2">
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-yellow-400">
                  #{isDemoMode ? demoData.myRank : myRank}
                </div>
                <div className="text-xs text-gray-400">
                  YOUR RANKING
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-black/50 p-2 border border-gray-600">
                  <div className="text-gray-400">OFFENSE</div>
                  <div className="text-xl font-bold text-green-400">A+</div>
                </div>
                <div className="bg-black/50 p-2 border border-gray-600">
                  <div className="text-gray-400">CONSISTENCY</div>
                  <div className="text-xl font-bold text-yellow-400">B</div>
                </div>
                <div className="bg-black/50 p-2 border border-gray-600">
                  <div className="text-gray-400">LUCK</div>
                  <div className="text-xl font-bold text-red-400">C</div>
                </div>
                <div className="bg-black/50 p-2 border border-gray-600">
                  <div className="text-gray-400">STRENGTH</div>
                  <div className="text-xl font-bold text-blue-400">B+</div>
                </div>
              </div>
            </div>
          </TecmoCard>
        </div>
      )}
      
      {/* Bottom Action Bar */}
      <div className="mt-8 flex justify-center gap-4">
        <TecmoButton onClick={() => router.push('/roster/sleeper')}>
          SET LINEUP
        </TecmoButton>
        <TecmoButton onClick={() => router.push('/trades/sleeper')}>
          MAKE TRADE
        </TecmoButton>
        <TecmoButton onClick={() => router.push('/waivers/sleeper')}>
          WAIVERS
        </TecmoButton>
      </div>
      </div>
    </div>
  );
}