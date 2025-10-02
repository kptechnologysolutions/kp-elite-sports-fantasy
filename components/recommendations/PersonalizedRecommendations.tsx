'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import useSleeperStore from '@/lib/store/useSleeperStore';
import { 
  teamPersonalizedService,
  PersonalizedStartSitRecommendation,
  PersonalizedWaiverTarget,
  RosterAnalysis
} from '@/lib/services/teamPersonalizedService';
import { 
  advancedTeamStrategy,
  ContextualRecommendation,
  ContextualWaiverTarget,
  TeamSituationContext,
  WeeklyStrategy
} from '@/lib/services/advancedTeamStrategy';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign, 
  Target,
  Users,
  BarChart3,
  Clock,
  Activity,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Helper function for position emojis
const getPositionEmoji = (position: string) => {
  const emojiMap: Record<string, string> = {
    'QB': '🎯',
    'RB': '🏃',
    'WR': '👐',
    'TE': '🎪',
    'K': '🦵',
    'DEF': '🛡️',
    'FLEX': '⚡',
    'DL': '🔨',
    'LB': '⚔️',
    'DB': '👁️'
  };
  return emojiMap[position] || '🏈';
};

export function PersonalizedRecommendations() {
  const { 
    myRoster, 
    players, 
    currentLeague, 
    currentMatchups, 
    seasonMatchups,
    currentWeek,
    rosters,
    leagueUsers
  } = useSleeperStore();

  // Generate advanced personalized analysis
  const analysis = useMemo(() => {
    if (!myRoster || !currentLeague || !players || !rosters.length) return null;

    // Get recent matchups for analysis
    const recentMatchups = Array.from(seasonMatchups.values())
      .flat()
      .filter(m => m.roster_id === myRoster.roster_id)
      .slice(-4); // Last 4 weeks

    // Basic roster analysis
    const rosterAnalysis = teamPersonalizedService.analyzeRosterComposition(
      myRoster,
      players,
      currentLeague,
      recentMatchups
    );

    // Advanced team situation analysis
    const teamSituation = advancedTeamStrategy.analyzeTeamSituation(
      myRoster,
      rosters,
      currentLeague,
      currentWeek,
      seasonMatchups
    );

    // Generate weekly strategy
    const myMatchup = currentMatchups.find(m => m.roster_id === myRoster.roster_id);
    const opponentMatchup = myMatchup ? 
      currentMatchups.find(m => 
        m.matchup_id === myMatchup.matchup_id && 
        m.roster_id !== myMatchup.roster_id
      ) : null;
    
    let weeklyStrategy: WeeklyStrategy | null = null;
    if (myMatchup && opponentMatchup) {
      const opponentRoster = rosters.find(r => r.roster_id === opponentMatchup.roster_id);
      if (opponentRoster) {
        weeklyStrategy = advancedTeamStrategy.generateWeeklyStrategy(
          myMatchup,
          opponentMatchup,
          teamSituation,
          myRoster,
          opponentRoster
        );
      }
    }

    // Basic start/sit recommendations
    const baseStartSitRecs = teamPersonalizedService.generateStartSitRecommendations(
      myRoster,
      players,
      currentLeague,
      currentWeek,
      rosterAnalysis
    );

    // Enhanced start/sit with strategic context
    const contextualStartSit = weeklyStrategy ? 
      advancedTeamStrategy.enhanceStartSitWithContext(
        baseStartSitRecs,
        weeklyStrategy,
        teamSituation,
        myRoster,
        players
      ) : baseStartSitRecs;

    // Waiver targets
    const availablePlayers = Array.from(players.values())
      .filter(p => !myRoster.players.includes(p.player_id))
      .filter(p => ['QB', 'RB', 'WR', 'TE'].includes(p.position))
      .slice(0, 50);

    const baseWaiverTargets = teamPersonalizedService.generateWaiverTargets(
      availablePlayers,
      myRoster,
      players,
      rosterAnalysis,
      currentLeague
    );

    // Enhanced waiver targets with strategic context
    const contextualWaivers = advancedTeamStrategy.enhanceWaiverTargetsWithContext(
      baseWaiverTargets,
      teamSituation,
      weeklyStrategy || { gameScript: 'balanced', reasoning: [], recommendedRiskLevel: 'moderate', targetScore: 100, opponentAnalysis: { projectedScore: 100, strengths: [], weaknesses: [], expectedGameflow: 'competitive' } },
      currentLeague
    );

    return {
      roster: rosterAnalysis,
      teamSituation,
      weeklyStrategy,
      startSit: contextualStartSit,
      waivers: contextualWaivers.slice(0, 10)
    };
  }, [myRoster, players, currentLeague, currentMatchups, seasonMatchups, currentWeek, rosters]);

  if (!analysis) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Connect your team to get personalized recommendations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* SENIOR UI REDESIGN: Strategic Alert Bar First - HIGH CONTRAST */}
      {analysis.weeklyStrategy && (
        <Alert className={`border-2 shadow-lg ${
          analysis.teamSituation.recordSituation === 'desperate' ? 'border-red-500 bg-gradient-to-r from-red-600 to-red-700 text-white' :
          analysis.teamSituation.recordSituation === 'fighting' ? 'border-orange-500 bg-gradient-to-r from-orange-600 to-orange-700 text-white' :
          analysis.weeklyStrategy.gameScript === 'safe_floor' ? 'border-green-500 bg-gradient-to-r from-green-600 to-emerald-700 text-white' :
          analysis.weeklyStrategy.gameScript === 'high_ceiling' ? 'border-purple-500 bg-gradient-to-r from-purple-600 to-purple-700 text-white' :
          'border-blue-500 bg-gradient-to-r from-blue-600 to-blue-700 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-white" />
              <div>
                <div className="font-bold text-xl text-white">
                  {analysis.weeklyStrategy.gameScript === 'safe_floor' ? '🛡️ SAFE FLOOR' :
                   analysis.weeklyStrategy.gameScript === 'high_ceiling' ? '🚀 HIGH CEILING' :
                   analysis.weeklyStrategy.gameScript === 'hail_mary' ? '🎲 HAIL MARY' :
                   '⚖️ BALANCED'} STRATEGY
                </div>
                <div className="text-sm text-white/90 font-medium">
                  {analysis.weeklyStrategy.reasoning[0]}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-white">
                #{analysis.teamSituation.leaguePosition.standing}
              </div>
              <div className="text-sm text-white/90 font-medium">League Rank</div>
            </div>
          </div>
          
          {/* Playoff Status */}
          {analysis.teamSituation.playoffImplications.currentPlayoffChance < 50 && (
            <div className="mt-3 p-2 bg-white/20 rounded-lg">
              <div className="text-white font-bold text-sm">
                📊 Playoff Odds: {analysis.teamSituation.playoffImplications.currentPlayoffChance.toFixed(0)}%
                {analysis.teamSituation.playoffImplications.mustWinWeeks.length > 0 && 
                  ` - Must win ${analysis.teamSituation.playoffImplications.mustWinWeeks.length} games!`
                }
              </div>
            </div>
          )}
        </Alert>
      )}

      {/* SENIOR UI REDESIGN: Quick Action Cards */}
      <QuickActionSummary 
        startSit={analysis.startSit}
        waivers={analysis.waivers}
        teamSituation={analysis.teamSituation}
      />

      {/* SENIOR UI REDESIGN: Detailed Tabs Below */}
      <Tabs defaultValue="lineup" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lineup">Lineup Decisions</TabsTrigger>
          <TabsTrigger value="waivers">Waiver Targets</TabsTrigger>
          <TabsTrigger value="analysis">Team Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="lineup" className="space-y-4">
          <StartSitRecommendations recommendations={analysis.startSit} />
        </TabsContent>

        <TabsContent value="waivers" className="space-y-4">
          <WaiverWireTargets targets={analysis.waivers} />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <RosterOverview analysis={analysis.roster} />
          {analysis.weeklyStrategy && (
            <WeeklyStrategyOverview 
              strategy={analysis.weeklyStrategy} 
              teamSituation={analysis.teamSituation} 
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// SENIOR UI REDESIGN: Quick Action Summary Component
function QuickActionSummary({ 
  startSit, 
  waivers,
  teamSituation 
}: { 
  startSit: ContextualRecommendation[] | PersonalizedStartSitRecommendation[];
  waivers: ContextualWaiverTarget[] | PersonalizedWaiverTarget[];
  teamSituation: TeamSituationContext;
}) {
  const [expandedCard, setExpandedCard] = useState<'starts' | 'decisions' | 'waivers' | null>(null);
  const mustStarts = startSit.filter(r => r.recommendation === 'must_start');
  const decisions = startSit.filter(r => ['strong_start', 'flex_play', 'sit'].includes(r.recommendation));
  const topWaivers = waivers.slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Must Starts Card - ULTIMATE UI with Hover & Animations */}
      <Card 
        className="border-2 border-emerald-400 bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-2xl hover:shadow-emerald-500/50 transform hover:-translate-y-2 transition-all duration-300 cursor-pointer group"
        onClick={() => setExpandedCard(expandedCard === 'starts' ? null : 'starts')}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl flex items-center gap-3 font-black tracking-tight">
            <div className="relative">
              <CheckCircle className="h-7 w-7 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping"></div>
            </div>
            🏈 DEFINITE STARTS ({mustStarts.length})
            <div className="ml-auto">
              {expandedCard === 'starts' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mustStarts.slice(0, 3).map((rec, idx) => (
            <div key={rec.player.player_id} className="flex items-center justify-between bg-white/20 hover:bg-white/30 rounded-lg p-3 transition-all duration-200 hover:scale-105">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{getPositionEmoji(rec.player.position)}</div>
                <div>
                  <span className="font-black text-white text-xl tracking-wide leading-tight">{rec.player.full_name}</span>
                  <div className="text-emerald-100 text-sm font-medium opacity-80">{rec.player.team}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-white text-emerald-700 font-bold text-sm px-3 py-1 animate-bounce">
                  {rec.player.position}
                </Badge>
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
              </div>
            </div>
          ))}
          {mustStarts.length > 3 && !expandedCard && (
            <div className="text-emerald-100 font-bold text-center bg-white/10 rounded-lg p-2">
              ⭐ +{mustStarts.length - 3} more stars to start
            </div>
          )}
          
          {/* Expanded Details */}
          {expandedCard === 'starts' && mustStarts.length > 3 && (
            <div className="space-y-2 border-t border-white/20 pt-3 animate-in slide-in-from-top-2 duration-300">
              <div className="text-emerald-100 font-bold text-sm mb-2">⭐ All Must-Start Players:</div>
              {mustStarts.slice(3).map((rec, idx) => (
                <div key={rec.player.player_id} className="flex items-center justify-between bg-white/10 rounded-lg p-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="text-lg">{getPositionEmoji(rec.player.position)}</div>
                    <span className="font-bold">{rec.player.full_name}</span>
                  </div>
                  <div className="text-emerald-200 text-xs">{rec.confidence}% confident</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decisions Needed Card - ULTIMATE UI with Hover & Animations */}
      <Card 
        className="border-2 border-amber-400 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl hover:shadow-amber-500/50 transform hover:-translate-y-2 transition-all duration-300 cursor-pointer group"
        onClick={() => setExpandedCard(expandedCard === 'decisions' ? null : 'decisions')}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl flex items-center gap-3 font-black tracking-tight">
            <div className="relative">
              <Clock className="h-7 w-7 animate-spin" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full animate-ping"></div>
            </div>
            ⚠️ DECISIONS NEEDED ({decisions.length})
            <div className="ml-auto">
              {expandedCard === 'decisions' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {decisions.slice(0, 3).map((rec, idx) => (
            <div key={rec.player.player_id} className="flex items-center justify-between bg-white/20 hover:bg-white/30 rounded-lg p-3 transition-all duration-200 hover:scale-105">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{getPositionEmoji(rec.player.position)}</div>
                <div>
                  <span className="font-black text-white text-xl tracking-wide leading-tight">{rec.player.full_name}</span>
                  <div className="text-emerald-100 text-sm font-medium opacity-80">{rec.player.team}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  className={`font-bold text-sm px-3 py-1 ${
                    rec.recommendation === 'strong_start' ? 'bg-green-500 text-white animate-pulse' :
                    rec.recommendation === 'flex_play' ? 'bg-yellow-500 text-black animate-bounce' :
                    'bg-gray-500 text-white'
                  }`}
                >
                  {rec.recommendation === 'strong_start' ? '🚀 START' :
                   rec.recommendation === 'flex_play' ? '🤔 FLEX' : '🚫 SIT'}
                </Badge>
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  rec.recommendation === 'strong_start' ? 'bg-green-300' :
                  rec.recommendation === 'flex_play' ? 'bg-yellow-300' : 'bg-gray-300'
                }`}></div>
              </div>
            </div>
          ))}
          {decisions.length > 3 && (
            <div className="text-amber-100 font-bold text-center bg-white/10 rounded-lg p-2">
              🤔 +{decisions.length - 3} more decisions to make
            </div>
          )}
        </CardContent>
      </Card>

      {/* Priority Waivers Card - ULTIMATE UI with Hover & Animations */}
      <Card className="border-2 border-blue-400 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl hover:shadow-blue-500/50 transform hover:-translate-y-2 transition-all duration-300 cursor-pointer group">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl flex items-center gap-3 font-black tracking-tight">
            <div className="relative">
              <Target className="h-7 w-7 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-300 rounded-full animate-ping"></div>
            </div>
            🎯 PRIORITY PICKUPS ({topWaivers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topWaivers.map((target, idx) => (
            <div key={target.player.player_id} className="flex items-center justify-between bg-white/20 hover:bg-white/30 rounded-lg p-3 transition-all duration-200 hover:scale-105">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{getPositionEmoji(target.player.position)}</div>
                <span className="font-black text-white text-lg tracking-wide">{target.player.full_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  className={`font-bold text-sm px-3 py-1 ${
                    target.priority === 'critical_need' ? 'bg-red-500 text-white animate-pulse' :
                    target.priority === 'upgrade' ? 'bg-orange-500 text-white animate-bounce' :
                    'bg-blue-200 text-blue-800'
                  }`}
                >
                  💰 {target.bidRecommendation.faabPercent}%
                </Badge>
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  target.priority === 'critical_need' ? 'bg-red-300' :
                  target.priority === 'upgrade' ? 'bg-orange-300' : 'bg-blue-300'
                }`}></div>
              </div>
            </div>
          ))}
          {topWaivers.length === 0 && (
            <div className="text-blue-100 font-bold text-center bg-white/10 rounded-lg p-3">
              ✨ Your roster is solid - no urgent pickups needed!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RosterOverview({ analysis }: { analysis: RosterAnalysis }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Your Roster Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {analysis.strongestPositions.length}
            </div>
            <div className="text-sm text-gray-600">Strong Positions</div>
            <div className="text-xs text-gray-500">
              {analysis.strongestPositions.join(', ')}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {analysis.weakestPositions.length}
            </div>
            <div className="text-sm text-gray-600">Weak Positions</div>
            <div className="text-xs text-gray-500">
              {analysis.weakestPositions.join(', ')}
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {analysis.averageAge.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Avg Age</div>
            <div className="text-xs text-gray-500">
              {analysis.experienceLevel}
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {analysis.rosterConstruction}
            </div>
            <div className="text-sm text-gray-600">Construction</div>
          </div>
        </div>

        {analysis.weakestPositions.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Focus Areas:</strong> Your weakest positions are {analysis.weakestPositions.join(' and ')}. 
              Consider targeting these positions on waivers or in trades.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function StartSitRecommendations({ 
  recommendations 
}: { 
  recommendations: ContextualRecommendation[] | PersonalizedStartSitRecommendation[]
}) {
  const getRecommendationColor = (rec: PersonalizedStartSitRecommendation['recommendation']) => {
    switch (rec) {
      case 'must_start': return 'bg-green-100 text-green-800 border-green-200';
      case 'strong_start': return 'bg-green-50 text-green-700 border-green-100';
      case 'flex_play': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'sit': return 'bg-gray-50 text-gray-700 border-gray-100';
      case 'avoid': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const getRecommendationIcon = (rec: PersonalizedStartSitRecommendation['recommendation']) => {
    switch (rec) {
      case 'must_start': return <CheckCircle className="h-4 w-4" />;
      case 'strong_start': return <TrendingUp className="h-4 w-4" />;
      case 'flex_play': return <Target className="h-4 w-4" />;
      case 'sit': return <TrendingDown className="h-4 w-4" />;
      case 'avoid': return <AlertTriangle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-3">
      {recommendations.map((rec) => (
        <Card key={rec.player.player_id} className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="font-medium">
                    {rec.player.full_name}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {rec.player.position} - {rec.player.team}
                  </Badge>
                  <Badge 
                    className={`text-xs border ${getRecommendationColor(rec.recommendation)}`}
                    variant="outline"
                  >
                    <span className="flex items-center gap-1">
                      {getRecommendationIcon(rec.recommendation)}
                      {rec.recommendation.replace('_', ' ').toUpperCase()}
                    </span>
                  </Badge>
                </div>

                <div className="space-y-1 text-sm text-gray-600">
                  {rec.reasoning.map((reason, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      {reason}
                    </div>
                  ))}
                </div>

                <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                  <div>
                    Confidence: {rec.confidence}%
                  </div>
                  <div>
                    Depth: {rec.positionContext.yourDepthAtPosition} at {rec.player.position}
                  </div>
                  {rec.positionContext.isYourBestOption && (
                    <Badge variant="outline" className="text-xs">
                      Your Best Option
                    </Badge>
                  )}
                </div>

                {/* Show contextual factors if available */}
                {'situationalFactors' in rec && rec.situationalFactors && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs font-medium text-gray-700 mb-1">Strategic Context:</div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-600">
                        Weekly Strategy: <span className="font-medium">{rec.situationalFactors.weeklyStrategy.replace('_', ' ')}</span>
                      </div>
                      {rec.situationalFactors.leagueContext.map((context, idx) => (
                        <div key={idx} className="text-xs text-blue-600 flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {context}
                        </div>
                      ))}
                      {rec.situationalFactors.alternativeIfInjured && (
                        <div className="text-xs text-gray-600">
                          Backup: {rec.situationalFactors.alternativeIfInjured.full_name}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function WaiverWireTargets({ targets }: { targets: ContextualWaiverTarget[] | PersonalizedWaiverTarget[] }) {
  const getPriorityColor = (priority: PersonalizedWaiverTarget['priority']) => {
    switch (priority) {
      case 'critical_need': return 'bg-red-100 text-red-800 border-red-200';
      case 'upgrade': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'depth': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'lottery_ticket': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: PersonalizedWaiverTarget['priority']) => {
    switch (priority) {
      case 'critical_need': return <AlertTriangle className="h-4 w-4" />;
      case 'upgrade': return <TrendingUp className="h-4 w-4" />;
      case 'depth': return <Users className="h-4 w-4" />;
      case 'lottery_ticket': return <Target className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-3">
      {targets.map((target) => (
        <Card key={target.player.player_id} className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="font-medium">
                    {target.player.full_name}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {target.player.position} - {target.player.team}
                  </Badge>
                  <Badge 
                    className={`text-xs border ${getPriorityColor(target.priority)}`}
                    variant="outline"
                  >
                    <span className="flex items-center gap-1">
                      {getPriorityIcon(target.priority)}
                      {target.priority.replace('_', ' ').toUpperCase()}
                    </span>
                  </Badge>
                </div>

                <div className="space-y-1 text-sm text-gray-600 mb-3">
                  {target.reasoning.map((reason, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      {reason}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    FAAB: {target.bidRecommendation.faabPercent}%
                  </div>
                  <div>
                    Impact: {target.expectedImpact.replace('_', ' ')}
                  </div>
                  <div>
                    Need: {target.fillsNeed.needLevel}
                  </div>
                  {target.replacesWho && (
                    <div className="text-gray-500">
                      Replaces: {target.replacesWho.full_name}
                    </div>
                  )}
                </div>

                {/* Show strategic value if available */}
                {'strategicValue' in target && target.strategicValue && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs font-medium text-blue-700 mb-1">Strategic Analysis:</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        Immediate: <span className="font-medium">{target.strategicValue.immediateNeed}/10</span>
                      </div>
                      <div>
                        Future: <span className="font-medium">{target.strategicValue.futureValue}/10</span>
                      </div>
                      <div>
                        Competition: <span className="font-medium">{target.strategicValue.competitionLevel}</span>
                      </div>
                      <div>
                        Timing: <span className="font-medium">{target.strategicValue.timingSuggestion.replace('_', ' ')}</span>
                      </div>
                    </div>
                    {target.strategicValue.opportunityCost !== 'Low' && (
                      <div className="text-xs text-orange-600 mt-1">
                        Cost: {target.strategicValue.opportunityCost}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {targets.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <Target className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No high-priority waiver targets found.</p>
            <p className="text-sm">Your roster looks solid for this week!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function WeeklyStrategyOverview({ 
  strategy, 
  teamSituation 
}: { 
  strategy: WeeklyStrategy; 
  teamSituation: TeamSituationContext; 
}) {
  const getStrategyColor = (gameScript: WeeklyStrategy['gameScript']) => {
    switch (gameScript) {
      case 'safe_floor': return 'bg-green-100 text-green-800 border-green-200';
      case 'balanced': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'high_ceiling': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'hail_mary': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStrategyIcon = (gameScript: WeeklyStrategy['gameScript']) => {
    switch (gameScript) {
      case 'safe_floor': return <CheckCircle className="h-4 w-4" />;
      case 'balanced': return <BarChart3 className="h-4 w-4" />;
      case 'high_ceiling': return <TrendingUp className="h-4 w-4" />;
      case 'hail_mary': return <AlertTriangle className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getRecordSituationColor = (situation: TeamSituationContext['recordSituation']) => {
    switch (situation) {
      case 'desperate': return 'text-red-600';
      case 'fighting': return 'text-orange-600';
      case 'competitive': return 'text-blue-600';
      case 'comfortable': return 'text-green-600';
      case 'locked': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          This Week's Strategy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Game Script */}
          <div className="text-center">
            <Badge 
              className={`text-sm border ${getStrategyColor(strategy.gameScript)} mb-2`}
              variant="outline"
            >
              <span className="flex items-center gap-1">
                {getStrategyIcon(strategy.gameScript)}
                {strategy.gameScript.replace('_', ' ').toUpperCase()}
              </span>
            </Badge>
            <div className="text-xs text-gray-600">Recommended Approach</div>
          </div>

          {/* Team Situation */}
          <div className="text-center">
            <div className={`text-lg font-bold ${getRecordSituationColor(teamSituation.recordSituation)}`}>
              {teamSituation.recordSituation.replace('_', ' ').toUpperCase()}
            </div>
            <div className="text-xs text-gray-600">
              Standing: #{teamSituation.leaguePosition.standing}
            </div>
            <div className="text-xs text-gray-600">
              Playoff: {teamSituation.playoffImplications.currentPlayoffChance.toFixed(0)}%
            </div>
          </div>

          {/* Target Score */}
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {strategy.targetScore.toFixed(0)}
            </div>
            <div className="text-xs text-gray-600">Target Score</div>
            <div className="text-xs text-gray-500">
              vs {strategy.opponentAnalysis.projectedScore.toFixed(0)} projected
            </div>
          </div>
        </div>

        {/* Strategic Reasoning */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Why This Strategy:</h4>
          {strategy.reasoning.map((reason, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-1 h-1 bg-blue-400 rounded-full" />
              {reason}
            </div>
          ))}
        </div>

        {/* Playoff Implications */}
        {teamSituation.playoffImplications.mustWinWeeks.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Must-Win Situation:</strong> You need to win {teamSituation.playoffImplications.mustWinWeeks.length} of your next few games to maintain playoff hopes.
            </AlertDescription>
          </Alert>
        )}

        {/* Opponent Analysis */}
        {strategy.opponentAnalysis.strengths.length > 0 && (
          <div className="text-sm">
            <span className="font-medium">Opponent Strengths:</span> {strategy.opponentAnalysis.strengths.join(', ')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}