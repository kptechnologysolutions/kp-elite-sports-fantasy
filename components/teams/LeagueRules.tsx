'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, Settings, Calendar, Users, Target, Award,
  DollarSign, Clock, Shield, Zap, AlertTriangle, Info
} from 'lucide-react';

interface LeagueRulesProps {
  leagueId?: string;
  platform?: string;
  leagueSize?: number;
  scoringType?: string;
}

export function LeagueRules({ leagueId, platform = 'sleeper', leagueSize = 12, scoringType = 'PPR' }: LeagueRulesProps) {
  // Default scoring rules for different formats
  const scoringRules = {
    PPR: {
      passing: { yards: 0.04, td: 4, int: -2, '2pt': 2 },
      rushing: { yards: 0.1, td: 6, '2pt': 2, fumble: -2 },
      receiving: { yards: 0.1, td: 6, reception: 1, '2pt': 2 },
      kicking: { fg0_39: 3, fg40_49: 4, fg50_plus: 5, xp: 1, miss: -1 },
      defense: { 
        sack: 1, int: 2, fumbleRec: 2, td: 6, safety: 2,
        block: 2, return: 6, pts0: 10, pts1_6: 7, pts7_13: 4,
        pts14_20: 1, pts21_27: 0, pts28_34: -1, pts35_plus: -4
      }
    },
    'Half-PPR': {
      passing: { yards: 0.04, td: 4, int: -2, '2pt': 2 },
      rushing: { yards: 0.1, td: 6, '2pt': 2, fumble: -2 },
      receiving: { yards: 0.1, td: 6, reception: 0.5, '2pt': 2 },
      kicking: { fg0_39: 3, fg40_49: 4, fg50_plus: 5, xp: 1, miss: -1 },
      defense: { 
        sack: 1, int: 2, fumbleRec: 2, td: 6, safety: 2,
        block: 2, return: 6, pts0: 10, pts1_6: 7, pts7_13: 4,
        pts14_20: 1, pts21_27: 0, pts28_34: -1, pts35_plus: -4
      }
    },
    'Standard': {
      passing: { yards: 0.04, td: 4, int: -2, '2pt': 2 },
      rushing: { yards: 0.1, td: 6, '2pt': 2, fumble: -2 },
      receiving: { yards: 0.1, td: 6, reception: 0, '2pt': 2 },
      kicking: { fg0_39: 3, fg40_49: 4, fg50_plus: 5, xp: 1, miss: -1 },
      defense: { 
        sack: 1, int: 2, fumbleRec: 2, td: 6, safety: 2,
        block: 2, return: 6, pts0: 10, pts1_6: 7, pts7_13: 4,
        pts14_20: 1, pts21_27: 0, pts28_34: -1, pts35_plus: -4
      }
    }
  };

  const currentScoring = scoringRules[scoringType as keyof typeof scoringRules] || scoringRules.PPR;

  // Roster positions
  const rosterPositions = [
    { position: 'QB', count: 1, max: 3 },
    { position: 'RB', count: 2, max: 6 },
    { position: 'WR', count: 2, max: 6 },
    { position: 'TE', count: 1, max: 3 },
    { position: 'FLEX', count: 1, max: 0 },
    { position: 'K', count: 1, max: 2 },
    { position: 'DEF', count: 1, max: 2 },
    { position: 'BENCH', count: 6, max: 0 },
    { position: 'IR', count: 2, max: 0 }
  ];

  // Season schedule
  const schedule = {
    regularSeason: 14,
    playoffs: 3,
    playoffTeams: Math.floor(leagueSize / 2),
    tradeDeadline: 'Week 10',
    waiverType: 'FAAB ($100)',
    waiverDay: 'Wednesday'
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          League Rules & Settings
        </CardTitle>
        <CardDescription>
          {platform?.toUpperCase()} League • {leagueSize} Teams • {scoringType}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="scoring" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="scoring">Scoring</TabsTrigger>
            <TabsTrigger value="roster">Roster</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="waivers">Waivers</TabsTrigger>
          </TabsList>

          {/* Scoring Tab */}
          <TabsContent value="scoring" className="space-y-4">
            <div className="grid gap-4">
              {/* Passing */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  Passing
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="p-2 bg-gray-800 rounded">
                    <span className="text-gray-400">Yards: </span>
                    <span className="font-medium">1pt/{Math.round(1/currentScoring.passing.yards)}</span>
                  </div>
                  <div className="p-2 bg-gray-800 rounded">
                    <span className="text-gray-400">TD: </span>
                    <span className="font-medium text-green-500">+{currentScoring.passing.td}</span>
                  </div>
                  <div className="p-2 bg-gray-800 rounded">
                    <span className="text-gray-400">INT: </span>
                    <span className="font-medium text-red-500">{currentScoring.passing.int}</span>
                  </div>
                  <div className="p-2 bg-gray-800 rounded">
                    <span className="text-gray-400">2PT: </span>
                    <span className="font-medium">+{currentScoring.passing['2pt']}</span>
                  </div>
                </div>
              </div>

              {/* Rushing */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-500" />
                  Rushing
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="p-2 bg-gray-800 rounded">
                    <span className="text-gray-400">Yards: </span>
                    <span className="font-medium">1pt/{Math.round(1/currentScoring.rushing.yards)}</span>
                  </div>
                  <div className="p-2 bg-gray-800 rounded">
                    <span className="text-gray-400">TD: </span>
                    <span className="font-medium text-green-500">+{currentScoring.rushing.td}</span>
                  </div>
                  <div className="p-2 bg-gray-800 rounded">
                    <span className="text-gray-400">Fumble: </span>
                    <span className="font-medium text-red-500">{currentScoring.rushing.fumble}</span>
                  </div>
                  <div className="p-2 bg-gray-800 rounded">
                    <span className="text-gray-400">2PT: </span>
                    <span className="font-medium">+{currentScoring.rushing['2pt']}</span>
                  </div>
                </div>
              </div>

              {/* Receiving */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-purple-500" />
                  Receiving
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="p-2 bg-gray-800 rounded">
                    <span className="text-gray-400">Yards: </span>
                    <span className="font-medium">1pt/{Math.round(1/currentScoring.receiving.yards)}</span>
                  </div>
                  <div className="p-2 bg-gray-800 rounded">
                    <span className="text-gray-400">TD: </span>
                    <span className="font-medium text-green-500">+{currentScoring.receiving.td}</span>
                  </div>
                  <div className="p-2 bg-gray-800 rounded">
                    <span className="text-gray-400">Reception: </span>
                    <span className="font-medium text-blue-500">
                      {currentScoring.receiving.reception === 0 ? '0' : `+${currentScoring.receiving.reception}`}
                    </span>
                  </div>
                  <div className="p-2 bg-gray-800 rounded">
                    <span className="text-gray-400">2PT: </span>
                    <span className="font-medium">+{currentScoring.receiving['2pt']}</span>
                  </div>
                </div>
              </div>

              {/* Special Scoring Note */}
              {scoringType === 'PPR' && (
                <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded">
                  <p className="text-sm flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500" />
                    <span>Full Point Per Reception (PPR) - Each catch = 1 point</span>
                  </p>
                </div>
              )}
              {scoringType === 'Half-PPR' && (
                <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded">
                  <p className="text-sm flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500" />
                    <span>Half Point Per Reception - Each catch = 0.5 points</span>
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Roster Tab */}
          <TabsContent value="roster" className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Roster Positions
              </h4>
              <div className="grid gap-2">
                {rosterPositions.map((pos) => (
                  <div key={pos.position} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                    <div className="flex items-center gap-3">
                      <Badge variant={pos.position === 'BENCH' || pos.position === 'IR' ? 'secondary' : 'default'}>
                        {pos.position}
                      </Badge>
                      <span className="text-sm">
                        {pos.position === 'FLEX' && '(RB/WR/TE)'}
                        {pos.position === 'BENCH' && 'Reserve Players'}
                        {pos.position === 'IR' && 'Injured Reserve'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">Start:</span>
                      <span className="font-medium">{pos.count}</span>
                      {pos.max > 0 && (
                        <>
                          <span className="text-gray-400 ml-2">Max:</span>
                          <span className="font-medium">{pos.max}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-gray-800 rounded">
                <p className="text-sm text-gray-400">
                  Total Roster Size: <span className="font-medium text-white">16 players</span>
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Season Schedule
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-white">{schedule.regularSeason}</div>
                    <p className="text-sm text-gray-400">Regular Season Weeks</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-white">{schedule.playoffs}</div>
                    <p className="text-sm text-gray-400">Playoff Weeks</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                  <span className="text-sm text-gray-400">Playoff Teams</span>
                  <Badge>{schedule.playoffTeams} teams</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                  <span className="text-sm text-gray-400">Trade Deadline</span>
                  <Badge variant="secondary">{schedule.tradeDeadline}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                  <span className="text-sm text-gray-400">Championship Week</span>
                  <Badge variant="default">Week 17</Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Waivers Tab */}
          <TabsContent value="waivers" className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Waiver Settings
              </h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                  <span className="text-sm text-gray-400">Waiver Type</span>
                  <Badge variant="default">{schedule.waiverType}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                  <span className="text-sm text-gray-400">Process Day</span>
                  <Badge>{schedule.waiverDay}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                  <span className="text-sm text-gray-400">Process Time</span>
                  <Badge>3:00 AM ET</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                  <span className="text-sm text-gray-400">Continuous Waivers</span>
                  <Badge variant="secondary">Yes</Badge>
                </div>
              </div>

              <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded">
                <p className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span>Players lock at game time. Free agents available until Monday.</span>
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}