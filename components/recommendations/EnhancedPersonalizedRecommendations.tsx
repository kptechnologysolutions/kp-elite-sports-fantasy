'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import useSleeperStore from '@/lib/store/useSleeperStore';
import { 
  enhancedInsightsService,
  EnhancedPlayerInsights,
  EnhancedWaiverInsights
} from '@/lib/services/enhancedInsightsService';
import { useUserTracking } from '@/lib/services/userTrackingService';
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
  Eye,
  Zap,
  Shield,
  Flame,
  Snowflake,
  Brain,
  Star
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

export function EnhancedPersonalizedRecommendations() {
  const { 
    myRoster, 
    players, 
    currentLeague, 
    currentWeek,
    user
  } = useSleeperStore();

  const { trackFeatureUsage, trackAction } = useUserTracking();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('must-starts');

  // Track usage when component mounts
  React.useEffect(() => {
    if (user) {
      trackFeatureUsage(user.user_id, 'enhanced_recommendations', 1);
    }
  }, [user, trackFeatureUsage]);

  // Generate enhanced insights
  const insights = useMemo(() => {
    if (!myRoster || !currentLeague || !players) return null;

    const mustStarts = enhancedInsightsService.generateMustStartInsights(
      myRoster,
      players,
      currentLeague,
      currentWeek
    );

    const keyDecisions = enhancedInsightsService.generateKeyDecisionInsights(
      myRoster,
      players,
      currentLeague,
      currentWeek
    );

    // Get available players for waivers (mock for now)
    const availablePlayers = Array.from(players.values())
      .filter(p => !myRoster.players.includes(p.player_id))
      .slice(0, 30);

    const waiverTargets = enhancedInsightsService.generateEnhancedWaiverTargets(
      availablePlayers,
      myRoster,
      players,
      currentLeague,
      currentWeek
    );

    return {
      mustStarts,
      keyDecisions,
      waiverTargets
    };
  }, [myRoster, players, currentLeague, currentWeek]);

  if (!insights) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Connect your team to get enhanced personalized insights</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleCardExpand = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
    if (user) {
      trackAction(user.user_id, 'expand_insight_card', { cardId });
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (user) {
      trackAction(user.user_id, 'change_insights_tab', { tab });
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <EnhancedSummaryCard
          title="🏆 MUST STARTS"
          count={insights.mustStarts.length}
          players={insights.mustStarts.slice(0, 3)}
          color="emerald"
          expandedId="must-starts"
          isExpanded={expandedCard === "must-starts"}
          onExpand={() => handleCardExpand("must-starts")}
        />
        
        <EnhancedSummaryCard
          title="🤔 KEY DECISIONS"
          count={insights.keyDecisions.length}
          players={insights.keyDecisions.slice(0, 3)}
          color="amber"
          expandedId="decisions"
          isExpanded={expandedCard === "decisions"}
          onExpand={() => handleCardExpand("decisions")}
        />
        
        <EnhancedSummaryCard
          title="🎯 WAIVER TARGETS"
          count={insights.waiverTargets.length}
          players={insights.waiverTargets.slice(0, 3).map(w => ({
            player: w.player,
            recommendation: 'strong_start',
            confidence: w.bidRecommendation.faabPercent,
            reasoning: [w.bidRecommendation.reasoning]
          } as EnhancedPlayerInsights))}
          color="blue"
          expandedId="waivers"
          isExpanded={expandedCard === "waivers"}
          onExpand={() => handleCardExpand("waivers")}
        />
      </div>

      {/* Detailed Insights Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="must-starts" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Must Starts ({insights.mustStarts.length})
          </TabsTrigger>
          <TabsTrigger value="decisions" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Key Decisions ({insights.keyDecisions.length})
          </TabsTrigger>
          <TabsTrigger value="waivers" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Waiver Wire ({insights.waiverTargets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="must-starts" className="space-y-4">
          <DetailedPlayerInsights insights={insights.mustStarts} type="must-start" />
        </TabsContent>

        <TabsContent value="decisions" className="space-y-4">
          <DetailedPlayerInsights insights={insights.keyDecisions} type="decision" />
        </TabsContent>

        <TabsContent value="waivers" className="space-y-4">
          <DetailedWaiverInsights insights={insights.waiverTargets} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Enhanced Summary Card Component
function EnhancedSummaryCard({ 
  title, 
  count, 
  players, 
  color, 
  expandedId, 
  isExpanded, 
  onExpand 
}: {
  title: string;
  count: number;
  players: EnhancedPlayerInsights[];
  color: 'emerald' | 'amber' | 'blue';
  expandedId: string;
  isExpanded: boolean;
  onExpand: () => void;
}) {
  const colorClasses = {
    emerald: {
      bg: 'from-emerald-500 to-green-600',
      border: 'border-emerald-400',
      text: 'text-emerald-100'
    },
    amber: {
      bg: 'from-amber-500 to-orange-600',
      border: 'border-amber-400',
      text: 'text-amber-100'
    },
    blue: {
      bg: 'from-blue-500 to-indigo-600',
      border: 'border-blue-400',
      text: 'text-blue-100'
    }
  };

  const styles = colorClasses[color];

  return (
    <Card 
      className={`border-2 ${styles.border} bg-gradient-to-br ${styles.bg} text-white shadow-2xl hover:shadow-${color}-500/50 transform hover:-translate-y-2 transition-all duration-300 cursor-pointer group`}
      onClick={onExpand}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-3 font-black tracking-tight">
          {title}
          <div className="ml-auto">
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {players.slice(0, isExpanded ? undefined : 3).map((insight, idx) => (
          <PlayerSummaryRow key={insight.player.player_id} insight={insight} />
        ))}
        
        {!isExpanded && count > 3 && (
          <div className={`${styles.text} font-bold text-center bg-white/10 rounded-lg p-2`}>
            ⭐ +{count - 3} more to review
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Player Summary Row Component
function PlayerSummaryRow({ insight }: { insight: EnhancedPlayerInsights }) {
  return (
    <div className="flex items-center justify-between bg-white/20 hover:bg-white/30 rounded-lg p-3 transition-all duration-200 hover:scale-105">
      <div className="flex items-center gap-3">
        <div className="text-2xl">{getPositionEmoji(insight.player.position)}</div>
        <div>
          <span className="font-black text-white text-lg tracking-wide leading-tight">
            {insight.player.full_name}
          </span>
          <div className="text-white/80 text-sm font-medium">
            {insight.player.team} {insight.keyFactors?.matchupGrade && ` • ${insight.keyFactors.matchupGrade} Matchup`}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge className="bg-white/90 text-black font-bold text-sm px-3 py-1">
          {insight.confidence}%
        </Badge>
        <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
}

// Detailed Player Insights Component
function DetailedPlayerInsights({ 
  insights, 
  type 
}: { 
  insights: EnhancedPlayerInsights[];
  type: 'must-start' | 'decision';
}) {
  return (
    <div className="space-y-4">
      {insights.map((insight) => (
        <Card key={insight.player.player_id} className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Player Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{getPositionEmoji(insight.player.position)}</div>
                  <div>
                    <h3 className="text-xl font-bold">{insight.player.full_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{insight.player.position} - {insight.player.team}</span>
                      <Badge variant="outline">{insight.matchupAnalysis.opponent}</Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">{insight.confidence}%</div>
                  <div className="text-sm text-gray-500">Confidence</div>
                </div>
              </div>

              {/* Key Factors Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <FactorCard 
                  label="Matchup" 
                  value={insight.keyFactors.matchupGrade}
                  icon={<Target className="h-4 w-4" />}
                  color={getGradeColor(insight.keyFactors.matchupGrade)}
                />
                <FactorCard 
                  label="Volume" 
                  value={insight.keyFactors.volumeExpectation}
                  icon={<BarChart3 className="h-4 w-4" />}
                  color="blue"
                />
                <FactorCard 
                  label="Form" 
                  value={insight.keyFactors.recentForm}
                  icon={getFormIcon(insight.keyFactors.recentForm)}
                  color={getFormColor(insight.keyFactors.recentForm)}
                />
                <FactorCard 
                  label="Game Script" 
                  value={insight.keyFactors.gameScript}
                  icon={<Zap className="h-4 w-4" />}
                  color="purple"
                />
                <FactorCard 
                  label="Risk" 
                  value={insight.keyFactors.injuryRisk}
                  icon={<Shield className="h-4 w-4" />}
                  color={getRiskColor(insight.keyFactors.injuryRisk)}
                />
              </div>

              {/* Primary Insight */}
              <Alert className="border-blue-200 bg-blue-50">
                <Brain className="h-4 w-4" />
                <AlertDescription>
                  <strong>{insight.whyThisPlayer.primaryReason}</strong>
                  <div className="mt-1 text-sm text-gray-600">
                    {insight.whyThisPlayer.keyStatistic}
                  </div>
                </AlertDescription>
              </Alert>

              {/* Detailed Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Supporting Factors */}
                <div>
                  <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Why Start This Player
                  </h4>
                  <ul className="space-y-1">
                    {insight.whyThisPlayer.supportingFactors.map((factor, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                        <div className="w-1 h-1 bg-green-500 rounded-full" />
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Concerns */}
                {insight.whyThisPlayer.concernsToMonitor.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-orange-700 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Monitor These Factors
                    </h4>
                    <ul className="space-y-1">
                      {insight.whyThisPlayer.concernsToMonitor.map((concern, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                          <div className="w-1 h-1 bg-orange-500 rounded-full" />
                          {concern}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Risk/Reward Profile */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Projection Range
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-red-600">{insight.riskProfile.floor.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">Floor</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{insight.riskProfile.mostLikelyOutcome.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">Most Likely</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">{insight.riskProfile.ceiling.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">Ceiling</div>
                  </div>
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span>Bust Risk: {insight.riskProfile.bustRisk}%</span>
                  <span>Boom Potential: {insight.riskProfile.boomPotential}%</span>
                </div>
              </div>

              {/* Usage Projection */}
              {insight.projectedUsage.expectedTouches || insight.projectedUsage.expectedTargets ? (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Expected Usage
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {insight.projectedUsage.expectedTouches && (
                      <div className="text-center">
                        <div className="font-bold text-blue-600">{insight.projectedUsage.expectedTouches}</div>
                        <div className="text-gray-500">Touches</div>
                      </div>
                    )}
                    {insight.projectedUsage.expectedTargets && (
                      <div className="text-center">
                        <div className="font-bold text-blue-600">{insight.projectedUsage.expectedTargets}</div>
                        <div className="text-gray-500">Targets</div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="font-bold text-blue-600">{insight.projectedUsage.expectedRedZoneOpportunities}</div>
                      <div className="text-gray-500">RZ Opps</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-blue-600">{insight.projectedUsage.snapShareProjection.toFixed(0)}%</div>
                      <div className="text-gray-500">Snap Share</div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Detailed Waiver Insights Component
function DetailedWaiverInsights({ insights }: { insights: EnhancedWaiverInsights[] }) {
  return (
    <div className="space-y-4">
      {insights.map((insight) => (
        <Card key={insight.player.player_id} className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Player Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{getPositionEmoji(insight.player.position)}</div>
                  <div>
                    <h3 className="text-xl font-bold">{insight.player.full_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{insight.player.position} - {insight.player.team}</span>
                      <Badge 
                        variant="outline" 
                        className={getPriorityColor(insight.priority)}
                      >
                        {insight.priority.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">{insight.bidRecommendation.faabPercent}%</div>
                  <div className="text-sm text-gray-500">FAAB Bid</div>
                </div>
              </div>

              {/* Why Available */}
              <Alert className="border-blue-200 bg-blue-50">
                <Target className="h-4 w-4" />
                <AlertDescription>
                  <strong>Opportunity:</strong> {insight.availabilityAnalysis.whyAvailable}
                  <div className="mt-1 text-sm text-gray-600">
                    Market Missing: {insight.availabilityAnalysis.marketMissing}
                  </div>
                </AlertDescription>
              </Alert>

              {/* Impact Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-3">
                  <h4 className="font-semibold text-green-700 mb-1">Immediate</h4>
                  <p className="text-sm text-gray-600">{insight.impactProjection.immediateValue}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <h4 className="font-semibold text-blue-700 mb-1">Short Term</h4>
                  <p className="text-sm text-gray-600">{insight.impactProjection.shortTermOutlook}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <h4 className="font-semibold text-purple-700 mb-1">Season Long</h4>
                  <p className="text-sm text-gray-600">{insight.impactProjection.seasonLongValue}</p>
                </div>
              </div>

              {/* Roster Fit Analysis */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Roster Fit Analysis
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Fills Position:</span> {insight.rosterFit.fillsPosition}
                  </div>
                  <div>
                    <span className="font-medium">Upgrades Over:</span> {insight.rosterFit.upgradesOver}
                  </div>
                  <div>
                    <span className="font-medium">Would Start:</span> {insight.rosterFit.wouldStart ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <span className="font-medium">Flex Value:</span> {insight.rosterFit.flexValue ? 'High' : 'Low'}
                  </div>
                </div>
              </div>

              {/* Bid Recommendation */}
              <div className="flex items-center justify-between bg-green-50 rounded-lg p-4">
                <div>
                  <h4 className="font-semibold text-green-700">Recommended Bid</h4>
                  <p className="text-sm text-gray-600">{insight.bidRecommendation.reasoning}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {insight.bidRecommendation.faabPercent}%
                  </div>
                  <div className="text-sm text-gray-500">of FAAB</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Factor Card Component
function FactorCard({ 
  label, 
  value, 
  icon, 
  color 
}: { 
  label: string; 
  value: string; 
  icon: React.ReactNode; 
  color: string; 
}) {
  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      'green': 'bg-green-100 text-green-800 border-green-200',
      'blue': 'bg-blue-100 text-blue-800 border-blue-200',
      'red': 'bg-red-100 text-red-800 border-red-200',
      'orange': 'bg-orange-100 text-orange-800 border-orange-200',
      'purple': 'bg-purple-100 text-purple-800 border-purple-200',
      'gray': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className={`rounded-lg p-3 border ${getColorClass(color)}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  );
}

// Helper functions
function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'green';
  if (grade.startsWith('B')) return 'blue';
  if (grade.startsWith('C')) return 'orange';
  return 'red';
}

function getFormIcon(form: string): React.ReactNode {
  if (form === 'Excellent' || form === 'Good') return <Flame className="h-4 w-4" />;
  if (form === 'Poor' || form === 'Terrible') return <Snowflake className="h-4 w-4" />;
  return <Activity className="h-4 w-4" />;
}

function getFormColor(form: string): string {
  if (form === 'Excellent' || form === 'Good') return 'green';
  if (form === 'Poor' || form === 'Terrible') return 'red';
  return 'blue';
}

function getRiskColor(risk: string): string {
  if (risk === 'None' || risk === 'Low') return 'green';
  if (risk === 'High' || risk === 'Questionable') return 'red';
  return 'orange';
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical_need': return 'bg-red-100 text-red-800 border-red-200';
    case 'significant_upgrade': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'depth_add': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'lottery_ticket': return 'bg-purple-100 text-purple-800 border-purple-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}