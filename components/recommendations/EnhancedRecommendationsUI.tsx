'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
// Removed Collapsible import - using simple state instead
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
  ChevronDown,
  ChevronRight,
  Zap,
  Shield,
  Clock,
  Info,
  ThumbsUp,
  ThumbsDown,
  Eye,
  EyeOff
} from 'lucide-react';

export function EnhancedRecommendationsUI() {
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

  // Generate analysis (same as before)
  const analysis = useMemo(() => {
    if (!myRoster || !currentLeague || !players || !rosters.length) return null;

    const recentMatchups = Array.from(seasonMatchups.values())
      .flat()
      .filter(m => m.roster_id === myRoster.roster_id)
      .slice(-4);

    const rosterAnalysis = teamPersonalizedService.analyzeRosterComposition(
      myRoster,
      players,
      currentLeague,
      recentMatchups
    );

    const teamSituation = advancedTeamStrategy.analyzeTeamSituation(
      myRoster,
      rosters,
      currentLeague,
      currentWeek,
      seasonMatchups
    );

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

    const baseStartSitRecs = teamPersonalizedService.generateStartSitRecommendations(
      myRoster,
      players,
      currentLeague,
      currentWeek,
      rosterAnalysis
    );

    const contextualStartSit = weeklyStrategy ? 
      advancedTeamStrategy.enhanceStartSitWithContext(
        baseStartSitRecs,
        weeklyStrategy,
        teamSituation,
        myRoster,
        players
      ) : baseStartSitRecs;

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
      waivers: contextualWaivers.slice(0, 8)
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
    <div className="space-y-4">
      {/* Strategic Alert Bar - Most Important Info First */}
      <StrategicAlertBar 
        strategy={analysis.weeklyStrategy} 
        teamSituation={analysis.teamSituation} 
      />

      {/* Quick Decision Center */}
      <QuickDecisionCenter recommendations={analysis.startSit} />

      {/* Priority Waiver Targets */}
      <PriorityWaiverTargets targets={analysis.waivers} />

      {/* Expandable Details */}
      <ExpandableDetails 
        roster={analysis.roster}
        teamSituation={analysis.teamSituation}
        strategy={analysis.weeklyStrategy}
      />
    </div>
  );
}

// Strategic Alert Bar - Hero section with most critical info
function StrategicAlertBar({ 
  strategy, 
  teamSituation 
}: { 
  strategy: WeeklyStrategy | null; 
  teamSituation: TeamSituationContext; 
}) {
  if (!strategy) return null;

  const getAlertStyle = (gameScript: WeeklyStrategy['gameScript']) => {
    switch (gameScript) {
      case 'hail_mary': return 'border-red-500 bg-red-50 text-red-900';
      case 'high_ceiling': return 'border-orange-500 bg-orange-50 text-orange-900';
      case 'safe_floor': return 'border-green-500 bg-green-50 text-green-900';
      default: return 'border-blue-500 bg-blue-50 text-blue-900';
    }
  };

  const getIcon = (gameScript: WeeklyStrategy['gameScript']) => {
    switch (gameScript) {
      case 'hail_mary': return <Zap className="h-5 w-5" />;
      case 'high_ceiling': return <TrendingUp className="h-5 w-5" />;
      case 'safe_floor': return <Shield className="h-5 w-5" />;
      default: return <BarChart3 className="h-5 w-5" />;
    }
  };

  return (
    <Alert className={`border-2 ${getAlertStyle(strategy.gameScript)}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getIcon(strategy.gameScript)}
          <div>
            <div className="font-bold text-lg">
              {strategy.gameScript.replace('_', ' ').toUpperCase()} WEEK
            </div>
            <div className="text-sm opacity-90">
              {strategy.reasoning[0]}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold">
            {strategy.targetScore.toFixed(0)}
          </div>
          <div className="text-xs opacity-75">Target Score</div>
        </div>
      </div>
      
      {teamSituation.playoffImplications.mustWinWeeks.length > 0 && (
        <div className="mt-2 p-2 bg-red-100 rounded text-red-800 text-sm font-medium">
          🚨 MUST-WIN GAME - Playoff hopes depend on this week
        </div>
      )}
    </Alert>
  );
}

// Quick Decision Center - Start/Sit decisions prominently displayed
function QuickDecisionCenter({ 
  recommendations 
}: { 
  recommendations: ContextualRecommendation[] | PersonalizedStartSitRecommendation[]
}) {
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // Group by decision type for better visual hierarchy
  const mustStarts = recommendations.filter(r => r.recommendation === 'must_start');
  const decisions = recommendations.filter(r => 
    ['strong_start', 'flex_play', 'sit'].includes(r.recommendation)
  );
  const avoids = recommendations.filter(r => r.recommendation === 'avoid');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Quick Lineup Decisions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Must Starts - Green section */}
        {mustStarts.length > 0 && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-800 mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Definite Starts ({mustStarts.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {mustStarts.map(rec => (
                <PlayerDecisionCard 
                  key={rec.player.player_id} 
                  recommendation={rec}
                  variant="start"
                  showDetails={showDetails === rec.player.player_id}
                  onToggleDetails={() => setShowDetails(
                    showDetails === rec.player.player_id ? null : rec.player.player_id
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* Decision Needed - Yellow section */}
        {decisions.length > 0 && (
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Decisions Needed ({decisions.length})
            </h3>
            <div className="space-y-2">
              {decisions.map(rec => (
                <PlayerDecisionCard 
                  key={rec.player.player_id} 
                  recommendation={rec}
                  variant="decision"
                  showDetails={showDetails === rec.player.player_id}
                  onToggleDetails={() => setShowDetails(
                    showDetails === rec.player.player_id ? null : rec.player.player_id
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* Avoid - Red section */}
        {avoids.length > 0 && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <h3 className="font-medium text-red-800 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Avoid Starting ({avoids.length})
            </h3>
            <div className="space-y-1">
              {avoids.map(rec => (
                <div key={rec.player.player_id} className="flex items-center justify-between p-2 bg-white rounded">
                  <span className="font-medium">{rec.player.full_name}</span>
                  <Badge variant="destructive" className="text-xs">
                    {rec.reasoning[0]}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Individual player decision card
function PlayerDecisionCard({
  recommendation,
  variant,
  showDetails,
  onToggleDetails
}: {
  recommendation: ContextualRecommendation | PersonalizedStartSitRecommendation;
  variant: 'start' | 'decision';
  showDetails: boolean;
  onToggleDetails: () => void;
}) {
  const getActionColor = () => {
    switch (recommendation.recommendation) {
      case 'must_start': return 'text-green-700 bg-green-100';
      case 'strong_start': return 'text-green-600 bg-green-50';
      case 'flex_play': return 'text-yellow-600 bg-yellow-50';
      case 'sit': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white border rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">
              {recommendation.player.full_name}
            </span>
            <Badge variant="outline" className="text-xs">
              {recommendation.player.position}
            </Badge>
          </div>
          
          <div className={`text-xs px-2 py-1 rounded ${getActionColor()}`}>
            {recommendation.recommendation.replace('_', ' ').toUpperCase()}
            <span className="ml-2 opacity-75">
              {recommendation.confidence}% confident
            </span>
          </div>
          
          <div className="text-xs text-gray-600 mt-1">
            {recommendation.reasoning[0]}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleDetails}
          className="ml-2"
        >
          {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-xs">
          {recommendation.reasoning.slice(1).map((reason, idx) => (
            <div key={idx} className="flex items-center gap-2 text-gray-600">
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              {reason}
            </div>
          ))}
          
          {'situationalFactors' in recommendation && recommendation.situationalFactors && (
            <div className="bg-blue-50 p-2 rounded text-blue-700">
              <strong>Strategy:</strong> {recommendation.situationalFactors.weeklyStrategy.replace('_', ' ')}
              {recommendation.situationalFactors.leagueContext.map((context, idx) => (
                <div key={idx} className="mt-1">• {context}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Priority Waiver Targets - Top 3-4 with clear action buttons
function PriorityWaiverTargets({ 
  targets 
}: { 
  targets: ContextualWaiverTarget[] | PersonalizedWaiverTarget[]
}) {
  const topTargets = targets.slice(0, 4);

  if (topTargets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Waiver Wire
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-6">
            <Target className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No priority targets found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Priority Waiver Targets
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {topTargets.map(target => (
            <WaiverTargetCard key={target.player.player_id} target={target} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function WaiverTargetCard({ 
  target 
}: { 
  target: ContextualWaiverTarget | PersonalizedWaiverTarget
}) {
  const getPriorityStyle = () => {
    switch (target.priority) {
      case 'critical_need': return 'border-red-500 bg-red-50';
      case 'upgrade': return 'border-orange-500 bg-orange-50';
      case 'depth': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className={`border-2 rounded-lg p-3 ${getPriorityStyle()}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-medium">{target.player.full_name}</div>
          <div className="text-sm text-gray-600">
            {target.player.position} - {target.player.team}
          </div>
        </div>
        <Badge className="text-xs">
          {target.priority.replace('_', ' ')}
        </Badge>
      </div>
      
      <div className="text-sm text-gray-700 mb-2">
        {target.reasoning[0]}
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          {target.bidRecommendation.faabPercent}% FAAB
        </div>
        <div className="text-gray-500">
          {target.expectedImpact.replace('_', ' ')}
        </div>
      </div>
    </div>
  );
}

// Expandable Details - Progressive disclosure for power users
function ExpandableDetails({
  roster,
  teamSituation,
  strategy
}: {
  roster: RosterAnalysis;
  teamSituation: TeamSituationContext;
  strategy: WeeklyStrategy | null;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div>
      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Info className="h-4 w-4 mr-2" />
        {isExpanded ? 'Hide' : 'Show'} Detailed Analysis
        {isExpanded ? <ChevronDown className="h-4 w-4 ml-2" /> : <ChevronRight className="h-4 w-4 ml-2" />}
      </Button>
      
      {isExpanded && (
        <div className="space-y-4 mt-4">
        {/* Roster Strengths/Weaknesses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Roster Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-green-700 mb-1">Strengths</h4>
                {roster.strongestPositions.map(pos => (
                  <div key={pos} className="text-green-600">{pos}</div>
                ))}
              </div>
              <div>
                <h4 className="font-medium text-red-700 mb-1">Weaknesses</h4>
                {roster.weakestPositions.map(pos => (
                  <div key={pos} className="text-red-600">{pos}</div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Situation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Season Outlook</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div>
              <strong>Playoff Probability:</strong> {teamSituation.playoffImplications.currentPlayoffChance.toFixed(0)}%
            </div>
            <div>
              <strong>Current Standing:</strong> #{teamSituation.leaguePosition.standing}
            </div>
            <div>
              <strong>Roster Phase:</strong> {teamSituation.rosterMaturity.phase.replace('_', ' ')}
            </div>
          </CardContent>
        </Card>
        </div>
      )}
    </div>
  );
}