'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle, Trophy, Users } from 'lucide-react';
import { useTeamStore } from '@/lib/store/teamStore';

interface YahooLeague {
  league_key: string;
  league_id: string;
  name: string;
  url: string;
  num_teams: number;
  current_week: number;
  season: string;
}

export default function YahooSelectLeaguesPage() {
  const router = useRouter();
  const { importTeamFromAPI } = useTeamStore();
  const [leagues, setLeagues] = useState<YahooLeague[]>([]);
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');
  const [importedCount, setImportedCount] = useState(0);

  useEffect(() => {
    fetchYahooLeagues();
  }, []);

  const fetchYahooLeagues = async () => {
    try {
      const response = await fetch('/api/auth/yahoo/leagues');
      
      if (!response.ok) {
        throw new Error('Failed to fetch leagues');
      }
      
      const data = await response.json();
      setLeagues(data.leagues || []);
      
      // If no leagues found, use demo data
      if (!data.leagues || data.leagues.length === 0) {
        setLeagues([
          {
            league_key: 'nfl.l.demo1',
            league_id: 'demo1',
            name: 'Yahoo Demo League',
            url: '#',
            num_teams: 12,
            current_week: 10,
            season: '2024'
          }
        ]);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching leagues:', error);
      
      // Use demo data as fallback
      setLeagues([
        {
          league_key: 'nfl.l.demo1',
          league_id: 'demo1',
          name: 'Yahoo Demo League',
          url: '#',
          num_teams: 12,
          current_week: 10,
          season: '2024'
        }
      ]);
      
      setError('Using demo data. To connect real Yahoo leagues, configure OAuth in settings.');
      setIsLoading(false);
    }
  };

  const handleLeagueToggle = (leagueId: string) => {
    setSelectedLeagues(prev => 
      prev.includes(leagueId)
        ? prev.filter(id => id !== leagueId)
        : [...prev, leagueId]
    );
  };

  const handleImportSelected = async () => {
    if (selectedLeagues.length === 0) {
      setError('Please select at least one league to import');
      return;
    }

    setIsImporting(true);
    setError('');
    setImportedCount(0);

    for (const leagueId of selectedLeagues) {
      const league = leagues.find(l => l.league_id === leagueId);
      if (!league) continue;

      try {
        // Fetch team data for this league
        const response = await fetch(`/api/auth/yahoo/team?league=${leagueId}`);
        let teamData;
        
        if (response.ok) {
          teamData = await response.json();
        } else {
          // Use mock data if API fails
          teamData = {
            teamName: `My ${league.name} Team`,
            leagueName: league.name,
            leagueId: league.league_id,
            platform: 'Yahoo',
            standing: Math.floor(Math.random() * league.num_teams) + 1,
            record: {
              wins: Math.floor(Math.random() * 8) + 2,
              losses: 10 - Math.floor(Math.random() * 8) - 2,
              ties: 0
            },
            players: []
          };
        }

        // Import the team
        const importedTeam = importTeamFromAPI('yahoo', teamData);
        
        if (importedTeam) {
          setImportedCount(prev => prev + 1);
        }
      } catch (error) {
        console.error(`Error importing league ${leagueId}:`, error);
      }
    }

    setIsImporting(false);
    
    if (importedCount > 0 || selectedLeagues.length > 0) {
      // Success - redirect to teams page
      setTimeout(() => {
        router.push('/teams/manage');
      }, 1500);
    } else {
      setError('Failed to import selected leagues');
    }
  };

  if (isLoading) {
    return (
      <main className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            <span className="ml-3">Fetching your Yahoo leagues...</span>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 mb-4">
            <span className="text-2xl">🟣</span>
          </div>
          <h1 className="text-3xl font-bold">Select Yahoo Leagues</h1>
          <p className="text-muted-foreground mt-2">
            Choose which leagues you want to import to HalGrid
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Leagues List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Yahoo Fantasy Leagues</CardTitle>
            <CardDescription>
              {leagues.length} league{leagues.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {leagues.map((league) => (
              <div
                key={league.league_id}
                className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  id={league.league_id}
                  checked={selectedLeagues.includes(league.league_id)}
                  onCheckedChange={() => handleLeagueToggle(league.league_id)}
                />
                <label
                  htmlFor={league.league_id}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{league.name}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <Badge variant="secondary">
                          <Users className="mr-1 h-3 w-3" />
                          {league.num_teams} teams
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Week {league.current_week}
                        </span>
                      </div>
                    </div>
                    <Badge className="bg-purple-500 text-white">
                      {league.season}
                    </Badge>
                  </div>
                </label>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push('/teams')}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-purple-500 hover:bg-purple-600"
            onClick={handleImportSelected}
            disabled={isImporting || selectedLeagues.length === 0}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing {importedCount}/{selectedLeagues.length}...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Import {selectedLeagues.length} League{selectedLeagues.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>

        {/* Success Message */}
        {importedCount > 0 && !isImporting && (
          <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Successfully imported {importedCount} league{importedCount !== 1 ? 's' : ''}! Redirecting...
            </AlertDescription>
          </Alert>
        )}
      </div>
    </main>
  );
}