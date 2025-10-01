'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useTeamStore } from '@/lib/store/teamStore';
import { 
  Trash2,
  Edit,
  Plus,
  Users,
  AlertTriangle,
  Settings,
  RefreshCw,
  Shield,
  Download,
  Upload,
  Link2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const platformColors = {
  Yahoo: 'bg-purple-500',
  ESPN: 'bg-red-500',
  Sleeper: 'bg-orange-500',
  NFL: 'bg-blue-500'
};

export default function ManageTeamsPage() {
  const router = useRouter();
  const { teams, removeTeam, clearAllTeams, setCurrentTeam } = useTeamStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);

  const handleDeleteTeam = (teamId: string) => {
    setTeamToDelete(teamId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (teamToDelete) {
      removeTeam(teamToDelete);
      setTeamToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleClearAll = () => {
    clearAllTeams();
    setClearAllDialogOpen(false);
    router.push('/teams/import');
  };

  const handleEditTeam = (teamId: string) => {
    setCurrentTeam(teamId);
    router.push(`/dashboard?view=roster`);
  };

  const handleRefreshTeam = async (teamId: string) => {
    // This would trigger a re-import from the platform
    console.log('Refreshing team:', teamId);
    // In production, this would call the platform API to refresh data
  };

  return (
    <main className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Settings className="h-8 w-8 text-primary" />
              Manage Teams
            </h1>
            <p className="text-muted-foreground mt-1">
              Add, remove, or update your fantasy teams
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push('/teams/import')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Team
            </Button>
            <Dialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clear All Teams?</DialogTitle>
                  <DialogDescription>
                    This will remove all {teams.length} teams from your account. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setClearAllDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleClearAll}>
                    Clear All Teams
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {teams.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Teams Added</h3>
            <p className="text-muted-foreground mb-4">
              Import your teams from Yahoo, ESPN, or Sleeper to get started
            </p>
            <Button onClick={() => router.push('/teams/import')}>
              <Upload className="mr-2 h-4 w-4" />
              Import Your First Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Teams List */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Card key={team.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {team.name}
                        {team.id === teams[0]?.id && (
                          <Badge variant="default" className="text-xs">Active</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {team.leagueName || `${team.platform} League`}
                      </CardDescription>
                    </div>
                    <Badge className={cn(platformColors[team.platform], 'text-white')}>
                      {team.platform}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Team Info */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Record:</span>
                      <p className="font-medium">
                        {team.record?.wins || 0}-{team.record?.losses || 0}
                        {team.record?.ties ? `-${team.record.ties}` : ''}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Standing:</span>
                      <p className="font-medium">
                        {team.standing || 'N/A'} / {team.leagueSize || 12}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Players:</span>
                      <p className="font-medium">{team.players?.length || 0}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">League ID:</span>
                      <p className="font-medium text-xs">{team.id.slice(0, 8)}...</p>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="text-xs text-muted-foreground">
                    Last updated: {new Date().toLocaleDateString()}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleRefreshTeam(team.id)}
                    >
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Refresh
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEditTeam(team.id)}
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Dialog open={deleteDialogOpen && teamToDelete === team.id} onOpenChange={(open) => {
                      setDeleteDialogOpen(open);
                      if (!open) setTeamToDelete(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteTeam(team.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Team?</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete "{team.name}"? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button variant="destructive" onClick={confirmDelete}>
                            Delete Team
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Import More Teams */}
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">
                  Import teams from other platforms
                </p>
                <Button variant="outline" onClick={() => router.push('/teams/import')}>
                  <Link2 className="mr-2 h-4 w-4" />
                  Connect Another Platform
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Platform Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Connections</CardTitle>
              <CardDescription>Manage your fantasy platform integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['Yahoo', 'ESPN', 'Sleeper', 'NFL'].map((platform) => {
                  const connectedTeams = teams.filter(t => t.platform === platform);
                  const isConnected = connectedTeams.length > 0;
                  
                  return (
                    <div key={platform} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center text-white",
                          platformColors[platform]
                        )}>
                          <Shield className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{platform}</p>
                          <p className="text-sm text-muted-foreground">
                            {isConnected ? `${connectedTeams.length} team(s) connected` : 'Not connected'}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant={isConnected ? "outline" : "default"}
                        onClick={() => router.push(`/teams/import?platform=${platform.toLowerCase()}`)}
                      >
                        {isConnected ? 'Add More' : 'Connect'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Data Privacy:</strong> Your team data is stored locally and synced with your chosen platforms. 
              We never share your fantasy data with third parties.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </main>
  );
}