'use client';

import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export function ClearDataButton() {
  const handleClearData = () => {
    if (confirm('This will clear all imported teams. Are you sure?')) {
      localStorage.removeItem('fantasyTeams');
      localStorage.removeItem('currentTeamId');
      window.location.reload();
    }
  };

  return (
    <Button 
      variant="destructive" 
      size="sm" 
      onClick={handleClearData}
      className="gap-2"
    >
      <Trash2 className="h-4 w-4" />
      Clear All Data
    </Button>
  );
}