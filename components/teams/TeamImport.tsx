'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Upload, Link2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useImportTeam } from '@/lib/hooks/useTeams';

const platforms = [
  { id: 'espn', name: 'ESPN', logo: '🏈', color: 'bg-red-500' },
  { id: 'yahoo', name: 'Yahoo', logo: '🟣', color: 'bg-purple-500' },
  { id: 'sleeper', name: 'Sleeper', logo: '😴', color: 'bg-orange-500' },
  { id: 'nfl', name: 'NFL.com', logo: '🏆', color: 'bg-blue-600' },
  { id: 'cbs', name: 'CBS Sports', logo: '📺', color: 'bg-blue-500' },
];

interface TeamImportProps {
  defaultPlatform?: string;
}

export function TeamImport({ defaultPlatform }: TeamImportProps = {}) {
  const searchParams = useSearchParams();
  const [selectedPlatform, setSelectedPlatform] = useState(defaultPlatform || '');
  const [importMethod, setImportMethod] = useState<'oauth' | 'manual'>('oauth');
  const [manualData, setManualData] = useState({ leagueId: '', teamId: '' });
  const [sleeperUsername, setSleeperUsername] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [availableLeagues, setAvailableLeagues] = useState<any[]>([]);
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([]);
  const [showYahooDemo, setShowYahooDemo] = useState(false);
  const importTeam = useImportTeam();

  useEffect(() => {
    // Check if returning from OAuth flow
    if (searchParams.get('import') === 'success' && searchParams.get('platform')) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

  const handlePlatformSelect = (platformId: string) => {
    setSelectedPlatform(platformId);
  };

  const handleCheckSleeperUsername = async () => {
    if (!sleeperUsername) {
      setImportError('Please enter your Sleeper username');
      return;
    }

    setIsImporting(true);
    setImportError('');
    
    try {
      const { sleeperAPI } = await import('@/lib/api/sleeper');
      
      // Get user info
      const user = await sleeperAPI.getUser(sleeperUsername);
      if (!user) {
        setImportError(`Username "${sleeperUsername}" not found on Sleeper`);
        setIsImporting(false);
        return;
      }

      // Get user's leagues
      const leagues = await sleeperAPI.getUserLeagues(user.user_id);
      if (leagues.length === 0) {
        setImportError('No leagues found for this user');
        setIsImporting(false);
        return;
      }

      // Show available leagues
      setAvailableLeagues(leagues);
      setSelectedLeagues(leagues.map(l => l.league_id)); // Select all by default
      setIsImporting(false);
    } catch (error) {
      console.error('Error checking Sleeper username:', error);
      setImportError('Failed to connect to Sleeper. Please try again.');
      setIsImporting(false);
    }
  };

  const handleImportSleeperTeams = async () => {
    if (selectedLeagues.length === 0) {
      setImportError('Please select at least one league to import');
      return;
    }

    setIsImporting(true);
    setImportError('');

    try {
      const { enhancedSleeperAPI } = await import('@/lib/api/sleeper-enhanced');
      const teamStore = (await import('@/lib/store/teamStore')).default;
      
      let importedCount = 0;

      for (const leagueId of selectedLeagues) {
        const league = availableLeagues.find(l => l.league_id === leagueId);
        if (!league) continue;

        // Use the enhanced API to get complete team data
        const teamData = await enhancedSleeperAPI.getCompleteTeamData(sleeperUsername, leagueId);
        if (!teamData) continue;

        console.log('Enhanced Team Data:', {
          league: teamData.league.name,
          teamName: teamData.team.name,
          week: teamData.currentWeek,
          weekScore: teamData.matchup?.teamScore,
          opponent: teamData.matchup?.opponentName,
          players: teamData.players?.length
        });

        // Import to our store with COMPLETE data including player names
        const newTeam = teamStore.importTeamFromAPI('sleeper', {
          leagueId: teamData.league.id,
          leagueName: teamData.league.name,
          teamName: teamData.team.name,
          players: teamData.players || [], // Now includes full player objects with names
          record: {
            wins: teamData.record.wins,
            losses: teamData.record.losses,
            ties: teamData.record.ties,
            pointsFor: teamData.record.pointsFor, // Season total
            pointsAgainst: teamData.record.pointsAgainst,
            streak: `${teamData.record.wins > teamData.record.losses ? 'W' : 'L'}1`
          },
          matchup: teamData.matchup ? {
            points: teamData.matchup.teamScore, // Week score
            opponentScore: teamData.matchup.opponentScore,
            opponentName: teamData.matchup.opponentName,
            week: teamData.matchup.week,
            starters: teamData.matchup.starters,
            startersPoints: teamData.matchup.startersPoints
          } : undefined,
          leagueSize: teamData.league.size,
          rank: teamData.record.rank || 1,
          currentWeek: teamData.currentWeek
        });

        if (newTeam) {
          importedCount++;
        }
      }

      if (importedCount > 0) {
        setShowSuccess(true);
        setImportError('');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setImportError('No teams could be imported');
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImportError('Failed to import teams. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImport = async () => {
    if (!selectedPlatform) return;

    // Special handling for Sleeper
    if (selectedPlatform === 'sleeper' && importMethod === 'oauth') {
      if (availableLeagues.length > 0) {
        // Import selected leagues
        await handleImportSleeperTeams();
      } else {
        // Check username first
        await handleCheckSleeperUsername();
      }
      return;
    }

    setIsImporting(true);
    setImportError('');

    try {
      const teamStore = (await import('@/lib/store/teamStore')).default;
      
      // Handle ESPN import with real data
      if (selectedPlatform === 'espn') {
        if (importMethod === 'manual' && manualData.leagueId) {
          const { espnRealDataService } = await import('@/lib/services/espnRealDataService');
          
          // If we have cookies, set them
          if (manualData.teamId) {
            // teamId field can be used for espnS2 cookie
            const swid = localStorage.getItem('espn_swid') || '';
            if (manualData.teamId && swid) {
              espnRealDataService.setCookies(manualData.teamId, swid);
            }
          }
          
          const teams = await espnRealDataService.importLeague(manualData.leagueId);
          
          if (teams.length > 0) {
            for (const team of teams) {
              teamStore.addTeam(team);
            }
            setShowSuccess(true);
            setTimeout(() => window.location.reload(), 2000);
          } else {
            setImportError('No teams found or unable to access league. Make sure the league is public or provide authentication.');
          }
        } else {
          setImportError('Please enter your ESPN League ID');
        }
        setIsImporting(false);
        return;
      }
      
      // Handle Yahoo import with OAuth
      if (selectedPlatform === 'yahoo') {
        if (importMethod === 'oauth') {
          // Always initiate OAuth flow for Yahoo
          const clientId = process.env.NEXT_PUBLIC_YAHOO_CLIENT_ID;
          
          // For demo purposes, if OAuth isn't configured, show demo option
          if (!clientId || clientId === 'your_yahoo_client_id_here') {
            setShowYahooDemo(true);
            setImportError('');
            setIsImporting(false);
            return;
          } else {
            // Initiate real Yahoo OAuth flow
            const redirectUri = `${window.location.origin}/api/auth/yahoo/callback`;
            const scope = 'fspt-r'; // Fantasy Sports read permission
            const authUrl = `https://api.login.yahoo.com/oauth2/request_auth?` +
              `client_id=${clientId}&` +
              `redirect_uri=${encodeURIComponent(redirectUri)}&` +
              `response_type=code&` +
              `scope=${scope}&` +
              `language=en-us`;
            
            // Save current state
            localStorage.setItem('yahoo_import_initiated', 'true');
            
            // Redirect to Yahoo for authorization
            window.location.href = authUrl;
          }
        } else if (importMethod === 'manual' && manualData.leagueId) {
          // Manual import with league ID
          const mockYahooTeam = teamStore.importTeam('yahoo', {
            leagueId: manualData.leagueId,
            teamId: manualData.teamId || `yahoo_team_${Date.now()}`,
            leagueName: manualData.leagueId === 'demo' ? 'Yahoo Demo League' : `Yahoo League ${manualData.leagueId}`,
          });
          
          if (mockYahooTeam) {
            setShowSuccess(true);
            setImportError('');
            setTimeout(() => window.location.reload(), 2000);
          } else {
            setImportError('Failed to import Yahoo team.');
          }
        } else {
          setImportError('Please select an import method');
        }
        setIsImporting(false);
        return;
      }

      // For other platforms, use enhanced mock import with better data
      const newTeam = teamStore.importTeam(selectedPlatform, {
        leagueId: `${selectedPlatform}_league_${Date.now()}`,
        teamId: `${selectedPlatform}_team_${Date.now()}`,
        leagueName: `${platforms.find(p => p.id === selectedPlatform)?.name} League`,
      });
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Import failed:', error);
      setImportError('Failed to import team. Please check your credentials and try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportWithRealData = async () => {
    if (!selectedPlatform) return;

    // Special handling for Sleeper
    if (selectedPlatform === 'sleeper' && importMethod === 'oauth') {
      if (availableLeagues.length > 0) {
        // Import selected leagues
        await handleImportSleeperTeams();
      } else {
        // Check username first
        await handleCheckSleeperUsername();
      }
      return;
    }

    if (importMethod === 'oauth') {
      // For other platforms with OAuth support
      await handleImport();
    } else {
      // Manual import with IDs
      try {
        const teamStore = (await import('@/lib/store/teamStore')).default;
        const newTeam = teamStore.importTeam(selectedPlatform, {
          leagueId: manualData.leagueId,
          teamId: manualData.teamId,
          leagueName: `${platforms.find(p => p.id === selectedPlatform)?.name} League`,
        });
        
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error('Manual import failed:', error);
      }
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Process CSV file
      const reader = new FileReader();
      reader.onload = (event) => {
        // Parse CSV and import team
        console.log('CSV content:', event.target?.result);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      {showSuccess && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="flex items-center space-x-2 pt-6">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <p className="text-green-700 dark:text-green-300">
              Team successfully imported from {searchParams.get('platform')?.toUpperCase()}!
            </p>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Import Your Fantasy Team</CardTitle>
          <CardDescription>
            Connect your existing fantasy football team from any major platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handlePlatformSelect(platform.id)}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  selectedPlatform === platform.id
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/50'
                }`}
              >
                <div className="text-3xl mb-2">{platform.logo}</div>
                <div className="text-sm font-medium">{platform.name}</div>
                {selectedPlatform === platform.id && (
                  <CheckCircle className="absolute top-2 right-2 h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>

          {selectedPlatform && (
            <Tabs value={importMethod} onValueChange={(v) => setImportMethod(v as 'oauth' | 'manual')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="oauth">
                  <Link2 className="mr-2 h-4 w-4" />
                  Quick Connect
                </TabsTrigger>
                <TabsTrigger value="manual">
                  <Upload className="mr-2 h-4 w-4" />
                  Manual Import
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="oauth" className="space-y-4">
                {selectedPlatform === 'sleeper' ? (
                  <div className="space-y-4">
                    {availableLeagues.length === 0 ? (
                      <>
                        <div>
                          <Label htmlFor="sleeper-username">Sleeper Username</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              id="sleeper-username"
                              placeholder="Enter your Sleeper username"
                              value={sleeperUsername}
                              onChange={(e) => setSleeperUsername(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCheckSleeperUsername();
                              }}
                            />
                            <Button 
                              onClick={handleCheckSleeperUsername} 
                              disabled={isImporting || !sleeperUsername}
                            >
                              {isImporting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Find Leagues'
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Enter your Sleeper username (not email) to find your leagues
                          </p>
                        </div>
                        
                        {importError && (
                          <div className="p-3 rounded-lg border border-red-500 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm">
                            {importError}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <Label>Select Leagues to Import</Label>
                          <p className="text-sm text-muted-foreground mb-3">
                            Found {availableLeagues.length} league{availableLeagues.length !== 1 ? 's' : ''} for @{sleeperUsername}
                          </p>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {availableLeagues.map((league) => (
                              <div 
                                key={league.league_id}
                                className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  id={league.league_id}
                                  checked={selectedLeagues.includes(league.league_id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedLeagues([...selectedLeagues, league.league_id]);
                                    } else {
                                      setSelectedLeagues(selectedLeagues.filter(id => id !== league.league_id));
                                    }
                                  }}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                                <label 
                                  htmlFor={league.league_id}
                                  className="flex-1 cursor-pointer"
                                >
                                  <div className="font-medium">{league.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {league.total_rosters} teams • {league.season} {league.season_type}
                                  </div>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            onClick={handleImportSleeperTeams}
                            disabled={isImporting || selectedLeagues.length === 0}
                            className="flex-1"
                          >
                            {isImporting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Importing...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                Import {selectedLeagues.length} League{selectedLeagues.length !== 1 ? 's' : ''}
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setAvailableLeagues([]);
                              setSelectedLeagues([]);
                              setImportError('');
                            }}
                          >
                            Change User
                          </Button>
                        </div>

                        {importError && (
                          <div className="p-3 rounded-lg border border-red-500 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm">
                            {importError}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    {selectedPlatform === 'yahoo' ? (
                      showYahooDemo ? (
                        // Show demo option when OAuth is not configured
                        <div className="space-y-4">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 mb-4">
                            <span className="text-3xl">🟣</span>
                          </div>
                          <div className="max-w-md mx-auto space-y-4">
                            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
                              <h3 className="font-semibold mb-2">Yahoo OAuth Not Configured</h3>
                              <p className="text-sm text-muted-foreground mb-3">
                                To connect real Yahoo leagues, you need to set up OAuth credentials.
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open('/teams/import/yahoo/setup', '_blank')}
                                className="w-full mb-2"
                              >
                                View Setup Instructions
                              </Button>
                            </div>
                            
                            <div className="relative">
                              <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                              </div>
                              <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or</span>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <p className="text-sm text-muted-foreground">
                                Try HalGrid with demo data to explore all features
                              </p>
                              <Button
                                onClick={() => {
                                  import('@/lib/store/teamStore').then(({ default: teamStore }) => {
                                    const mockYahooTeam = teamStore.importTeam('yahoo', {
                                      leagueId: `yahoo_demo_${Date.now()}`,
                                      teamId: `yahoo_team_${Date.now()}`,
                                      leagueName: 'Yahoo Demo League',
                                    });
                                    
                                    if (mockYahooTeam) {
                                      setShowSuccess(true);
                                      setShowYahooDemo(false);
                                      setTimeout(() => window.location.href = '/dashboard', 1500);
                                    }
                                  });
                                }}
                                className="w-full bg-purple-500 hover:bg-purple-600"
                              >
                                <Upload className="mr-2 h-4 w-4" />
                                Use Demo Yahoo Team
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 mb-4">
                            <span className="text-3xl">🟣</span>
                          </div>
                          <p className="text-muted-foreground mb-4">
                            Sign in with your Yahoo account to import your fantasy teams
                          </p>
                          <Button 
                            onClick={handleImport} 
                            disabled={importTeam.isPending}
                            className="bg-purple-500 hover:bg-purple-600"
                          >
                            {importTeam.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Redirecting to Yahoo...
                              </>
                            ) : (
                              <>
                                <Link2 className="mr-2 h-4 w-4" />
                                Sign in with Yahoo
                              </>
                            )}
                          </Button>
                          <p className="text-xs text-muted-foreground mt-4">
                            You'll be redirected to Yahoo to authorize access
                          </p>
                        </>
                      )
                    ) : (
                      <>
                        <p className="text-muted-foreground mb-4">
                          We'll securely connect to your {platforms.find(p => p.id === selectedPlatform)?.name} account
                        </p>
                        <Button onClick={handleImport} disabled={importTeam.isPending}>
                          {importTeam.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <Link2 className="mr-2 h-4 w-4" />
                              Connect to {platforms.find(p => p.id === selectedPlatform)?.name}
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="manual" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="leagueId">League ID</Label>
                    <Input
                      id="leagueId"
                      placeholder="Enter your league ID"
                      value={manualData.leagueId}
                      onChange={(e) => setManualData({ ...manualData, leagueId: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="teamId">Team ID</Label>
                    <Input
                      id="teamId"
                      placeholder="Enter your team ID"
                      value={manualData.teamId}
                      onChange={(e) => setManualData({ ...manualData, teamId: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleImport} className="w-full" disabled={importTeam.isPending}>
                    {importTeam.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      'Import Team'
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Yahoo OAuth Info Card */}
      {selectedPlatform === 'yahoo' && importMethod === 'oauth' && !showYahooDemo && (
        <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-purple-600" />
              Yahoo Authentication Process
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>When you click "Sign in with Yahoo":</p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>You'll be redirected to Yahoo's secure login page</li>
              <li>Sign in with your Yahoo account credentials</li>
              <li>Authorize HalGrid to access your fantasy data (read-only)</li>
              <li>You'll be redirected back to select which leagues to import</li>
            </ol>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Note:</strong> We only request read access to your fantasy sports data. 
                We cannot make changes to your teams or leagues.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Upload CSV</CardTitle>
          <CardDescription>
            Have your roster in a spreadsheet? Upload a CSV file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <Label htmlFor="csv-upload" className="cursor-pointer">
              <span className="text-primary underline">Click to upload</span> or drag and drop
            </Label>
            <Input
              id="csv-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCSVUpload}
            />
            <p className="text-xs text-muted-foreground mt-2">
              CSV files only. Max size: 5MB
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}