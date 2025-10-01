import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Team } from '@/lib/types';

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: () => apiClient.getTeams(),
  });
}

export function useTeam(teamId: string) {
  return useQuery({
    queryKey: ['teams', teamId],
    queryFn: () => apiClient.getTeam(teamId),
    enabled: !!teamId,
  });
}

export function useImportTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ platform, credentials }: { platform: string; credentials: any }) => 
      apiClient.importTeam(platform, credentials),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.setQueryData(['teams', data.id], data);
    },
  });
}

export function useUpdateTeam(teamId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Team>) => apiClient.updateTeam(teamId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.setQueryData(['teams', teamId], data);
    },
  });
}