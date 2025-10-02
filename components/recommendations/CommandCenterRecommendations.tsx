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
  ChevronUp,
  Zap,
  Shield,
  TrendingUpIcon,
  Flame,
  Award,
  Eye,
  Trophy
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

export function CommandCenterRecommendations() {
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
      <div className="card-primary min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Users className="mx-auto h-16 w-16 mb-6" style={{ color: 'var(--ff-text-muted)' }} />
          <h3 className="text-h3-ff mb-2" style={{ color: 'var(--ff-text-primary)' }}>
            Connect Your Team
          </h3>
          <p style={{ color: 'var(--ff-text-secondary)' }}>
            Sign in to get personalized recommendations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* COMMAND CENTER HEADER - Strategic Alert */}
      {analysis.weeklyStrategy && (
        <CommandCenterHeader 
          strategy={analysis.weeklyStrategy}
          teamSituation={analysis.teamSituation}
        />
      )}

      {/* STRATEGIC OVERVIEW GRID */}
      <StrategicOverviewGrid 
        startSit={analysis.startSit}
        waivers={analysis.waivers}
        teamSituation={analysis.teamSituation}
        weeklyStrategy={analysis.weeklyStrategy}
      />

      {/* DETAILED ANALYSIS TABS */}
      <div className="card-primary">
        <Tabs defaultValue="lineup" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="lineup" className="text-h3-ff">
              <Zap className="h-5 w-5 mr-2" />
              Lineup Command
            </TabsTrigger>
            <TabsTrigger value="waivers" className="text-h3-ff">
              <Target className="h-5 w-5 mr-2" />
              Target Acquisition
            </TabsTrigger>
            <TabsTrigger value="analysis" className="text-h3-ff">
              <BarChart3 className="h-5 w-5 mr-2" />
              Intelligence Report
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lineup" className="space-y-6">
            <LineupCommandCenter recommendations={analysis.startSit} />
          </TabsContent>

          <TabsContent value="waivers" className="space-y-6">
            <TargetAcquisitionCenter targets={analysis.waivers} />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <IntelligenceReportCenter 
              analysis={analysis.roster} 
              strategy={analysis.weeklyStrategy}
              teamSituation={analysis.teamSituation}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Command Center Header Component
function CommandCenterHeader({ 
  strategy, 
  teamSituation 
}: { 
  strategy: WeeklyStrategy; 
  teamSituation: TeamSituationContext; 
}) {
  const getStrategyIcon = () => {
    switch (strategy.gameScript) {
      case 'safe_floor': return <Shield className="h-8 w-8" />;
      case 'high_ceiling': return <TrendingUpIcon className="h-8 w-8" />;
      case 'hail_mary': return <Flame className="h-8 w-8" />;
      default: return <BarChart3 className="h-8 w-8" />;
    }
  };

  const getStrategyColor = () => {
    switch (strategy.gameScript) {
      case 'safe_floor': return 'var(--ff-accent)';
      case 'high_ceiling': return 'var(--ff-warning)';
      case 'hail_mary': return 'var(--ff-danger)';
      default: return 'var(--ff-secondary)';
    }
  };

  return (
    <div className="card-hero p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div style={{ color: getStrategyColor() }}>
            {getStrategyIcon()}
          </div>
          <div>
            <h1 className="text-h1-ff mb-2" style={{ color: 'var(--ff-text-primary)' }}>
              {strategy.gameScript === 'safe_floor' ? '🛡️ SAFE FLOOR' :
               strategy.gameScript === 'high_ceiling' ? '🚀 HIGH CEILING' :
               strategy.gameScript === 'hail_mary' ? '🔥 HAIL MARY' :
               '⚖️ BALANCED'} STRATEGY
            </h1>
            <p className="text-lg" style={{ color: 'var(--ff-text-secondary)' }}>
              {strategy.reasoning[0]}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-hero-ff" style={{ color: 'var(--ff-primary)' }}>
            #{teamSituation.leaguePosition.standing}
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--ff-text-secondary)' }}>
            League Position
          </p>
        </div>
      </div>
      
      {/* Playoff Status */}
      {teamSituation.playoffImplications.currentPlayoffChance < 60 && (
        <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 107, 53, 0.1)' }}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5" style={{ color: 'var(--ff-warning)' }} />
            <span className="font-bold" style={{ color: 'var(--ff-text-primary)' }}>
              Playoff Odds: {teamSituation.playoffImplications.currentPlayoffChance.toFixed(0)}%
              {teamSituation.playoffImplications.mustWinWeeks.length > 0 && 
                ` - Must win ${teamSituation.playoffImplications.mustWinWeeks.length} games!`
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Strategic Overview Grid
function StrategicOverviewGrid({ 
  startSit, 
  waivers,
  teamSituation,
  weeklyStrategy
}: { 
  startSit: ContextualRecommendation[] | PersonalizedStartSitRecommendation[];
  waivers: ContextualWaiverTarget[] | PersonalizedWaiverTarget[];
  teamSituation: TeamSituationContext;
  weeklyStrategy: WeeklyStrategy | null;
}) {
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    mustStarts: false,
    decisions: false,
    targets: false
  });
  
  const mustStarts = startSit.filter(r => r.recommendation === 'must_start');
  const criticalDecisions = startSit.filter(r => ['strong_start', 'flex_play'].includes(r.recommendation));
  const highPriorityTargets = waivers.filter(w => w.priority === 'critical_need' || w.priority === 'upgrade').slice(0, 3);
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-6 xl:gap-8 auto-rows-fr">
      {/* Must Start Players */}
      <div className="card-hero p-4 md:p-6 w-full min-w-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="live-indicator">LOCKED IN</div>
          <CheckCircle className="h-6 w-6" style={{ color: 'var(--ff-accent)' }} />
        </div>
        
        <h2 className="text-h2-ff mb-2" style={{ color: 'var(--ff-text-primary)' }}>
          Must Start
        </h2>
        <p className="text-lg mb-6" style={{ color: 'var(--ff-accent)' }}>
          {mustStarts.length} locked and loaded
        </p>

        <div className="space-y-3">
          {mustStarts.slice(0, expandedSections.mustStarts ? mustStarts.length : 3).map((player) => (
            <PlayerCard key={player.player.player_id} player={player} variant="must-start" />
          ))}
          {mustStarts.length > 3 && (
            <button 
              onClick={() => toggleSection('mustStarts')}
              className="w-full text-center p-3 rounded-lg hover:opacity-80 transition-all duration-200 cursor-pointer" 
              style={{ backgroundColor: 'rgba(0, 200, 81, 0.1)' }}
            >
              <span style={{ color: 'var(--ff-accent)' }}>
                {expandedSections.mustStarts 
                  ? 'Show less' 
                  : `+${mustStarts.length - 3} more locked in`
                }
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Critical Decisions */}
      <div className="card-hero p-4 md:p-6 w-full min-w-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="live-indicator" style={{ backgroundColor: 'var(--ff-warning)' }}>
            DECISIONS
          </div>
          <Clock className="h-6 w-6" style={{ color: 'var(--ff-warning)' }} />
        </div>
        
        <h2 className="text-h2-ff mb-2" style={{ color: 'var(--ff-text-primary)' }}>
          Key Decisions
        </h2>
        <p className="text-lg mb-6" style={{ color: 'var(--ff-warning)' }}>
          {criticalDecisions.length} strategic choices
        </p>

        <div className="space-y-3">
          {criticalDecisions.slice(0, expandedSections.decisions ? criticalDecisions.length : 3).map((player) => (
            <PlayerCard key={player.player.player_id} player={player} variant="decision" />
          ))}
          {criticalDecisions.length > 3 && (
            <button 
              onClick={() => toggleSection('decisions')}
              className="w-full text-center p-3 rounded-lg hover:opacity-80 transition-all duration-200 cursor-pointer" 
              style={{ backgroundColor: 'rgba(255, 179, 0, 0.1)' }}
            >
              <span style={{ color: 'var(--ff-warning)' }}>
                {expandedSections.decisions 
                  ? 'Show less' 
                  : `+${criticalDecisions.length - 3} more decisions`
                }
              </span>
            </button>
          )}
        </div>
      </div>

      {/* High Priority Targets */}
      <div className="card-hero p-4 md:p-6 w-full min-w-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="live-indicator" style={{ backgroundColor: 'var(--ff-secondary)' }}>
            TARGETS
          </div>
          <Target className="h-6 w-6" style={{ color: 'var(--ff-secondary)' }} />
        </div>
        
        <h2 className="text-h2-ff mb-2" style={{ color: 'var(--ff-text-primary)' }}>
          Priority Targets
        </h2>
        <p className="text-lg mb-6" style={{ color: 'var(--ff-secondary)' }}>
          {highPriorityTargets.length} acquisition opportunities
        </p>

        <div className="space-y-3">
          {highPriorityTargets.length > 0 ? (
            highPriorityTargets.map((target) => (
              <WaiverCard key={target.player.player_id} target={target} />
            ))
          ) : (
            <div className="text-center p-6 rounded-lg" style={{ backgroundColor: 'rgba(0, 75, 135, 0.1)' }}>
              <Award className="h-8 w-8 mx-auto mb-3" style={{ color: 'var(--ff-secondary)' }} />
              <span style={{ color: 'var(--ff-text-secondary)' }}>
                Roster optimized - no urgent targets
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced Player Card Component
function PlayerCard({ 
  player, 
  variant = 'default' 
}: { 
  player: PersonalizedStartSitRecommendation | ContextualRecommendation; 
  variant?: 'must-start' | 'decision' | 'default';
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'must-start':
        return {
          background: 'linear-gradient(135deg, rgba(0, 200, 81, 0.2), rgba(16, 185, 129, 0.1))',
          border: '1px solid var(--ff-accent)',
          textColor: 'var(--ff-text-primary)'
        };
      case 'decision':
        return {
          background: 'linear-gradient(135deg, rgba(255, 179, 0, 0.2), rgba(255, 140, 66, 0.1))',
          border: '1px solid var(--ff-warning)',
          textColor: 'var(--ff-text-primary)'
        };
      default:
        return {
          background: 'var(--ff-surface-elevated)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textColor: 'var(--ff-text-primary)'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div 
      className="p-4 rounded-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer min-h-[100px]"
      style={{ 
        background: styles.background,
        border: styles.border
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="text-3xl flex-shrink-0">{getPositionEmoji(player.player.position)}</div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-lg leading-tight mb-1" style={{ color: styles.textColor }}>
              {player.player.full_name}
            </div>
            <div className="text-sm" style={{ color: 'var(--ff-text-secondary)' }}>
              {player.player.position} • {player.player.team}
            </div>
          </div>
        </div>
        
        <div className="text-right flex-shrink-0">
          <div 
            className="text-sm font-bold px-4 py-2 rounded whitespace-nowrap"
            style={{ 
              backgroundColor: variant === 'must-start' ? 'var(--ff-accent)' : 
                             variant === 'decision' ? 'var(--ff-warning)' : 'var(--ff-secondary)',
              color: 'white'
            }}
          >
            {player.confidence}%
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Waiver Card Component  
function WaiverCard({ target }: { target: PersonalizedWaiverTarget | ContextualWaiverTarget }) {
  return (
    <div 
      className="p-4 rounded-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer min-h-[100px]"
      style={{ 
        background: 'linear-gradient(135deg, rgba(0, 75, 135, 0.2), rgba(36, 43, 61, 0.3))',
        border: '1px solid var(--ff-secondary)'
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="text-3xl flex-shrink-0">{getPositionEmoji(target.player.position)}</div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-lg leading-tight mb-1" style={{ color: 'var(--ff-text-primary)' }}>
              {target.player.full_name}
            </div>
            <div className="text-sm" style={{ color: 'var(--ff-text-secondary)' }}>
              {target.player.position} • {target.player.team}
            </div>
          </div>
        </div>
        
        <div className="text-right flex-shrink-0">
          <div 
            className="text-sm font-bold px-4 py-2 rounded whitespace-nowrap"
            style={{ 
              backgroundColor: 'var(--ff-secondary)',
              color: 'white'
            }}
          >
            {target.bidRecommendation.faabPercent}%
          </div>
        </div>
      </div>
    </div>
  );
}

// Lineup Command Center - Full detailed view
function LineupCommandCenter({ recommendations }: { recommendations: (ContextualRecommendation | PersonalizedStartSitRecommendation)[] }) {
  const mustStart = recommendations.filter(r => r.recommendation === 'must_start');
  const strongStart = recommendations.filter(r => r.recommendation === 'strong_start');
  const flexPlays = recommendations.filter(r => r.recommendation === 'flex_play');
  const sits = recommendations.filter(r => r.recommendation === 'sit');

  return (
    <div className="space-y-6">
      <h3 className="text-h3-ff mb-6" style={{ color: 'var(--ff-text-primary)' }}>
        Complete Lineup Analysis
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Start These Players */}
        <div className="card-primary p-6">
          <h4 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--ff-accent)' }}>
            <CheckCircle className="h-5 w-5" />
            Start These Players ({mustStart.length + strongStart.length})
          </h4>
          <div className="space-y-3">
            {[...mustStart, ...strongStart].map((player) => (
              <DetailedPlayerCard key={player.player.player_id} player={player} />
            ))}
          </div>
        </div>

        {/* Consider These Options */}
        <div className="card-primary p-6">
          <h4 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--ff-warning)' }}>
            <Clock className="h-5 w-5" />
            Consider These Options ({flexPlays.length})
          </h4>
          <div className="space-y-3">
            {flexPlays.map((player) => (
              <DetailedPlayerCard key={player.player.player_id} player={player} />
            ))}
          </div>
        </div>
      </div>

      {/* Bench Recommendations */}
      {sits.length > 0 && (
        <div className="card-primary p-6">
          <h4 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--ff-text-secondary)' }}>
            <TrendingDown className="h-5 w-5" />
            Bench This Week ({sits.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sits.map((player) => (
              <BenchPlayerCard key={player.player.player_id} player={player} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Target Acquisition Center - Full detailed view
function TargetAcquisitionCenter({ targets }: { targets: (ContextualWaiverTarget | PersonalizedWaiverTarget)[] }) {
  const criticalNeeds = targets.filter(t => t.priority === 'critical_need');
  const upgrades = targets.filter(t => t.priority === 'upgrade');
  const depth = targets.filter(t => t.priority === 'depth');
  const lotteryTickets = targets.filter(t => t.priority === 'lottery_ticket');

  return (
    <div className="space-y-6">
      <h3 className="text-h3-ff mb-6" style={{ color: 'var(--ff-text-primary)' }}>
        Waiver Wire Intelligence
      </h3>
      
      {criticalNeeds.length > 0 && (
        <div className="card-primary p-6">
          <h4 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--ff-danger)' }}>
            <AlertTriangle className="h-5 w-5" />
            Critical Needs ({criticalNeeds.length})
          </h4>
          <div className="space-y-3">
            {criticalNeeds.map((target) => (
              <DetailedWaiverCard key={target.player.player_id} target={target} />
            ))}
          </div>
        </div>
      )}

      {upgrades.length > 0 && (
        <div className="card-primary p-6">
          <h4 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--ff-warning)' }}>
            <TrendingUp className="h-5 w-5" />
            Upgrade Opportunities ({upgrades.length})
          </h4>
          <div className="space-y-3">
            {upgrades.map((target) => (
              <DetailedWaiverCard key={target.player.player_id} target={target} />
            ))}
          </div>
        </div>
      )}

      {(depth.length > 0 || lotteryTickets.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {depth.length > 0 && (
            <div className="card-primary p-6">
              <h4 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--ff-secondary)' }}>
                <Users className="h-5 w-5" />
                Depth Adds ({depth.length})
              </h4>
              <div className="space-y-3">
                {depth.map((target) => (
                  <DetailedWaiverCard key={target.player.player_id} target={target} />
                ))}
              </div>
            </div>
          )}

          {lotteryTickets.length > 0 && (
            <div className="card-primary p-6">
              <h4 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--ff-accent)' }}>
                <Target className="h-5 w-5" />
                Lottery Tickets ({lotteryTickets.length})
              </h4>
              <div className="space-y-3">
                {lotteryTickets.map((target) => (
                  <DetailedWaiverCard key={target.player.player_id} target={target} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {targets.length === 0 && (
        <div className="card-primary p-8 text-center">
          <Award className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--ff-accent)' }} />
          <h4 className="text-xl font-bold mb-2" style={{ color: 'var(--ff-text-primary)' }}>
            Roster Optimized
          </h4>
          <p style={{ color: 'var(--ff-text-secondary)' }}>
            No high-priority waiver targets identified. Your roster is in good shape!
          </p>
        </div>
      )}
    </div>
  );
}

// Intelligence Report Center - Full detailed view
function IntelligenceReportCenter({ 
  analysis, 
  strategy, 
  teamSituation 
}: { 
  analysis: RosterAnalysis; 
  strategy: WeeklyStrategy | null; 
  teamSituation: TeamSituationContext; 
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-h3-ff mb-6" style={{ color: 'var(--ff-text-primary)' }}>
        Strategic Intelligence Report
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roster Composition */}
        <div className="card-primary p-6">
          <h4 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--ff-accent)' }}>
            <BarChart3 className="h-5 w-5" />
            Roster Composition
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--ff-accent)' }}>
                  {analysis.strongestPositions.length}
                </div>
                <div className="text-sm" style={{ color: 'var(--ff-text-secondary)' }}>
                  Strong Positions
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--ff-text-muted)' }}>
                  {analysis.strongestPositions.join(', ') || 'None'}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--ff-danger)' }}>
                  {analysis.weakestPositions.length}
                </div>
                <div className="text-sm" style={{ color: 'var(--ff-text-secondary)' }}>
                  Weak Positions
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--ff-text-muted)' }}>
                  {analysis.weakestPositions.join(', ') || 'None'}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--ff-warning)' }}>
                  {analysis.averageAge.toFixed(1)}
                </div>
                <div className="text-sm" style={{ color: 'var(--ff-text-secondary)' }}>
                  Average Age
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--ff-text-muted)' }}>
                  {analysis.experienceLevel}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--ff-secondary)' }}>
                  {analysis.rosterConstruction}
                </div>
                <div className="text-sm" style={{ color: 'var(--ff-text-secondary)' }}>
                  Construction
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Situation */}
        <div className="card-primary p-6">
          <h4 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--ff-secondary)' }}>
            <Trophy className="h-5 w-5" />
            Team Situation
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--ff-primary)' }}>
                  #{teamSituation.leaguePosition.standing}
                </div>
                <div className="text-sm" style={{ color: 'var(--ff-text-secondary)' }}>
                  League Standing
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--ff-accent)' }}>
                  {teamSituation.playoffImplications.currentPlayoffChance.toFixed(0)}%
                </div>
                <div className="text-sm" style={{ color: 'var(--ff-text-secondary)' }}>
                  Playoff Chance
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold mb-2" style={{ 
                color: teamSituation.recordSituation === 'desperate' ? 'var(--ff-danger)' :
                       teamSituation.recordSituation === 'fighting' ? 'var(--ff-warning)' :
                       teamSituation.recordSituation === 'comfortable' ? 'var(--ff-accent)' : 'var(--ff-secondary)'
              }}>
                {teamSituation.recordSituation.replace('_', ' ').toUpperCase()}
              </div>
              <div className="text-sm" style={{ color: 'var(--ff-text-secondary)' }}>
                Current Status
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Strategy */}
      {strategy && (
        <div className="card-primary p-6">
          <h4 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--ff-warning)' }}>
            <Target className="h-5 w-5" />
            This Week's Strategy
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color: 'var(--ff-primary)' }}>
                  {strategy.gameScript.replace('_', ' ').toUpperCase()}
                </div>
                <div className="text-sm" style={{ color: 'var(--ff-text-secondary)' }}>
                  Game Script
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color: 'var(--ff-warning)' }}>
                  {strategy.recommendedRiskLevel.toUpperCase()}
                </div>
                <div className="text-sm" style={{ color: 'var(--ff-text-secondary)' }}>
                  Risk Level
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color: 'var(--ff-accent)' }}>
                  {strategy.targetScore.toFixed(0)}
                </div>
                <div className="text-sm" style={{ color: 'var(--ff-text-secondary)' }}>
                  Target Score
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-bold mb-2" style={{ color: 'var(--ff-text-primary)' }}>
                Strategic Reasoning:
              </h5>
              <ul className="space-y-1">
                {strategy.reasoning.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: 'var(--ff-text-secondary)' }}>
                    <div className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0"></div>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Detailed Player Card Component
function DetailedPlayerCard({ player }: { player: PersonalizedStartSitRecommendation | ContextualRecommendation }) {
  const getRecommendationColor = () => {
    switch (player.recommendation) {
      case 'must_start': return 'var(--ff-accent)';
      case 'strong_start': return 'var(--ff-accent)';
      case 'flex_play': return 'var(--ff-warning)';
      case 'sit': return 'var(--ff-text-muted)';
      default: return 'var(--ff-text-secondary)';
    }
  };

  return (
    <div 
      className="p-4 rounded-lg border transition-all duration-300 hover:scale-[1.01]"
      style={{ 
        backgroundColor: 'var(--ff-surface-elevated)',
        borderColor: 'rgba(255, 255, 255, 0.1)'
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="text-2xl">{getPositionEmoji(player.player.position)}</div>
          <div className="flex-1">
            <div className="font-bold mb-1" style={{ color: 'var(--ff-text-primary)' }}>
              {player.player.full_name}
            </div>
            <div className="text-sm mb-2" style={{ color: 'var(--ff-text-secondary)' }}>
              {player.player.position} • {player.player.team}
            </div>
            <div className="text-xs space-y-1">
              {player.reasoning.slice(0, 2).map((reason, idx) => (
                <div key={idx} className="flex items-start gap-1" style={{ color: 'var(--ff-text-muted)' }}>
                  <div className="w-1 h-1 bg-current rounded-full mt-1.5 flex-shrink-0"></div>
                  {reason}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="text-right flex-shrink-0">
          <div 
            className="text-xs font-bold px-2 py-1 rounded mb-1"
            style={{ 
              backgroundColor: getRecommendationColor(),
              color: 'white'
            }}
          >
            {player.recommendation.replace('_', ' ').toUpperCase()}
          </div>
          <div className="text-xs" style={{ color: 'var(--ff-text-muted)' }}>
            {player.confidence}% confidence
          </div>
        </div>
      </div>
    </div>
  );
}

// Bench Player Card Component
function BenchPlayerCard({ player }: { player: PersonalizedStartSitRecommendation | ContextualRecommendation }) {
  return (
    <div 
      className="p-3 rounded-lg border"
      style={{ 
        backgroundColor: 'var(--ff-surface)',
        borderColor: 'rgba(255, 255, 255, 0.05)'
      }}
    >
      <div className="flex items-center gap-2">
        <div className="text-lg">{getPositionEmoji(player.player.position)}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate" style={{ color: 'var(--ff-text-secondary)' }}>
            {player.player.full_name}
          </div>
          <div className="text-xs" style={{ color: 'var(--ff-text-muted)' }}>
            {player.player.position} • {player.player.team}
          </div>
        </div>
      </div>
    </div>
  );
}

// Detailed Waiver Card Component
function DetailedWaiverCard({ target }: { target: PersonalizedWaiverTarget | ContextualWaiverTarget }) {
  const getPriorityColor = () => {
    switch (target.priority) {
      case 'critical_need': return 'var(--ff-danger)';
      case 'upgrade': return 'var(--ff-warning)';
      case 'depth': return 'var(--ff-secondary)';
      case 'lottery_ticket': return 'var(--ff-accent)';
      default: return 'var(--ff-text-secondary)';
    }
  };

  return (
    <div 
      className="p-4 rounded-lg border transition-all duration-300 hover:scale-[1.01]"
      style={{ 
        backgroundColor: 'var(--ff-surface-elevated)',
        borderColor: 'rgba(255, 255, 255, 0.1)'
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="text-2xl">{getPositionEmoji(target.player.position)}</div>
          <div className="flex-1">
            <div className="font-bold mb-1" style={{ color: 'var(--ff-text-primary)' }}>
              {target.player.full_name}
            </div>
            <div className="text-sm mb-2" style={{ color: 'var(--ff-text-secondary)' }}>
              {target.player.position} • {target.player.team}
            </div>
            <div className="text-xs space-y-1">
              {target.reasoning.slice(0, 2).map((reason, idx) => (
                <div key={idx} className="flex items-start gap-1" style={{ color: 'var(--ff-text-muted)' }}>
                  <div className="w-1 h-1 bg-current rounded-full mt-1.5 flex-shrink-0"></div>
                  {reason}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="text-right flex-shrink-0">
          <div 
            className="text-xs font-bold px-2 py-1 rounded mb-1"
            style={{ 
              backgroundColor: getPriorityColor(),
              color: 'white'
            }}
          >
            {target.priority.replace('_', ' ').toUpperCase()}
          </div>
          <div className="text-xs mb-1" style={{ color: 'var(--ff-text-primary)' }}>
            FAAB: {target.bidRecommendation.faabPercent}%
          </div>
          <div className="text-xs" style={{ color: 'var(--ff-text-muted)' }}>
            {target.expectedImpact.replace('_', ' ')}
          </div>
        </div>
      </div>
    </div>
  );
}