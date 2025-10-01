'use client';
import { useState } from 'react';
import { ModernNav } from '@/components/layout/ModernNav';
import { PageHeader, ModernCard, DashboardGrid, StatCard, StatGrid } from '@/components/ui/modern';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Settings, Database, FileText, TestTube, Upload, Download, ExternalLink } from 'lucide-react';

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [sleeperLeagueId, setSleeperLeagueId] = useState('');
  const [csvData, setCsvData] = useState('leagueId,teamId,displayName,position,team\n123,TEAM_A,Christian McCaffrey,RB,SF\n123,TEAM_A,Travis Kelce,TE,KC\n999,TEAM_Z,Brandon Aiyuk,WR,SF');

  const importSleeper = async () => {
    if (!sleeperLeagueId.trim()) {
      setResult('Please enter a Sleeper League ID');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/import/sleeper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueId: sleeperLeagueId.trim(),
          userEmail: 'demo@user.local',
          week: 5
        })
      });
      
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const importCsv = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/import/csv?week=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'yahoo',
          csv: csvData,
          leagueName: 'Test League'
        })
      });
      
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testRostersApi = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rosters', { cache: 'no-store' });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ModernNav />
      <main className="container mx-auto p-6 space-y-8">
        <PageHeader 
          title="Admin & Testing Center"
          subtitle="Import data, test APIs, and manage the fantasy football platform"
          icon={<Settings className="h-6 w-6" />}
          actions={
            <Badge variant="outline" className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
              Admin Only
            </Badge>
          }
        />

        {/* Admin Stats */}
        <StatGrid cols={4}>
          <StatCard 
            title="Active Operations"
            value={loading ? 1 : 0}
            icon={<TestTube className="h-5 w-5" />}
            trend={loading ? "up" : "neutral"}
            interactive
          />
          <StatCard 
            title="API Status"
            value="Online"
            icon={<Database className="h-5 w-5" />}
            trend="up"
            interactive
          />
          <StatCard 
            title="Last Import"
            value={result ? "Success" : "Pending"}
            icon={<Upload className="h-5 w-5" />}
            trend={result ? "up" : "neutral"}
            interactive
          />
          <StatCard 
            title="System Health"
            value="100%"
            icon={<Settings className="h-5 w-5" />}
            trend="up"
            interactive
          />
        </StatGrid>

        <DashboardGrid cols={2}>
          <ModernCard 
            title="Sleeper League Import"
            description="Import a full Sleeper league with all teams and rosters"
            icon={<Database className="h-5 w-5" />}
            interactive
            glass
          >
            <div className="space-y-4 form-modern">
              <Input
                placeholder="Enter Sleeper League ID (e.g. 1046955734327554048)"
                value={sleeperLeagueId}
                onChange={(e) => setSleeperLeagueId(e.target.value)}
                className="focus-modern"
              />
              <Button 
                onClick={importSleeper} 
                disabled={loading} 
                className="w-full btn-modern"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Sleeper League
                  </>
                )}
              </Button>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  This will fetch all teams, rosters, and players from the Sleeper API with identity resolution.
                </p>
              </div>
            </div>
          </ModernCard>

          <ModernCard 
            title="CSV Data Import"
            description="Import roster data from CSV format for any platform"
            icon={<FileText className="h-5 w-5" />}
            interactive
            glass
          >
            <div className="space-y-4 form-modern">
              <Textarea
                placeholder="CSV data with headers: leagueId,teamId,displayName,position,team"
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                rows={6}
                className="focus-modern text-xs font-mono"
              />
              <Button 
                onClick={importCsv} 
                disabled={loading} 
                className="w-full btn-modern"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Import CSV Data
                  </>
                )}
              </Button>
            </div>
          </ModernCard>

          <ModernCard 
            title="API Testing"
            description="Test and validate API endpoints"
            icon={<TestTube className="h-5 w-5" />}
            interactive
          >
            <div className="space-y-3">
              <Button 
                onClick={testRostersApi} 
                disabled={loading} 
                variant="outline"
                className="w-full micro-bounce"
              >
                <Database className="h-4 w-4 mr-2" />
                Test /api/rosters
              </Button>
              <div className="text-xs text-muted-foreground">
                Fetch all stored rosters for portfolio analysis
              </div>
            </div>
          </ModernCard>

          <ModernCard 
            title="Quick Navigation"
            description="Access key features for testing"
            icon={<ExternalLink className="h-5 w-5" />}
            interactive
          >
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start micro-bounce" 
                onClick={() => window.open('/gameday', '_blank')}
              >
                <span className="text-lg mr-2">🎮</span>
                Game Day Center
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start micro-bounce" 
                onClick={() => window.open('/portfolio', '_blank')}
              >
                <span className="text-lg mr-2">📊</span>
                Portfolio Analysis
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start micro-bounce" 
                onClick={() => window.open('/coach', '_blank')}
              >
                <span className="text-lg mr-2">🧠</span>
                AI Lineup Coach
              </Button>
            </div>
          </ModernCard>
        </DashboardGrid>

        {result && (
          <ModernCard 
            title="Operation Result"
            description="API response and debugging information"
            icon={<Download className="h-5 w-5" />}
            interactive
            glass
          >
            <div className="relative">
              <pre className="bg-muted/50 p-4 rounded-lg text-xs font-mono overflow-auto max-h-96 border border-border/50">
                {result}
              </pre>
              <Button 
                variant="outline" 
                size="sm" 
                className="absolute top-2 right-2 opacity-70 hover:opacity-100"
                onClick={() => navigator.clipboard.writeText(result)}
              >
                Copy
              </Button>
            </div>
          </ModernCard>
        )}
      </main>
    </div>
  );
}